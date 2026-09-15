import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async activateForVendor(trx: any, vendorProfileId: string, adminId: string) {
    const payment = await trx('vendor_payments as vp').join('packages as p', 'p.id', 'vp.package_id').where({ 'vp.vendor_profile_id': vendorProfileId, 'vp.status': 'VERIFIED' }).orderBy('vp.reviewed_at', 'desc').select('vp.id as payment_id', 'vp.amount', 'vp.currency', 'p.id as package_id', 'p.duration_days').first();
    if (!payment) throw new ForbiddenException('Vendor has no verified package payment');
    const current = await trx('subscriptions').where({ vendor_profile_id: vendorProfileId }).first();
    const start = new Date();
    const end = new Date(start.getTime() + Number(payment.duration_days) * 24 * 60 * 60 * 1000);
    const [subscription] = current
      ? await trx('subscriptions').where({ vendor_profile_id: vendorProfileId }).update({ package_id: payment.package_id, payment_id: payment.payment_id, amount: payment.amount, currency: payment.currency, start_date: start, end_date: end, status: 'ACTIVE', updated_at: trx.fn.now() }).returning('*')
      : await trx('subscriptions').insert({ vendor_profile_id: vendorProfileId, package_id: payment.package_id, payment_id: payment.payment_id, amount: payment.amount, currency: payment.currency, start_date: start, end_date: end, status: 'ACTIVE' }).returning('*');
    await trx('subscription_renewals').insert({ subscription_id: subscription.id, vendor_profile_id: vendorProfileId, package_id: payment.package_id, payment_id: payment.payment_id, amount: payment.amount, currency: payment.currency, start_date: start, end_date: end, approved_by: adminId });
    await trx('audit_logs').insert({ actor_id: adminId, action: 'SUBSCRIPTION_ACTIVATED', entity: 'subscription', entity_id: subscription.id, metadata: { vendorProfileId, paymentId: payment.payment_id, packageId: payment.package_id, startDate: start.toISOString(), endDate: end.toISOString() } });
  }

  async getForVendor(user: AuthUser) {
    if (user.role !== 'VENDOR') throw new ForbiddenException('Only vendors have subscriptions');
    const vendor = await this.db.connection('vendor_profiles').where({ user_id: user.id }).first();
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    await this.syncExpiry(vendor.id);
    const subscription = await this.db.connection('subscriptions as s').join('packages as p', 'p.id', 's.package_id').where('s.vendor_profile_id', vendor.id).select('s.*', 'p.name as package_name', 'p.product_limit', 'p.duration_days').first();
    if (!subscription) return { subscription: null, renewals: [] };
    const renewals = await this.db.connection('subscription_renewals').where({ vendor_profile_id: vendor.id }).orderBy('approved_at', 'desc');
    return { subscription: this.toDto(subscription), renewals: renewals.map((row) => this.toRenewalDto(row)) };
  }

  async listForAdmin(admin: AuthUser) {
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can view subscriptions');
    const rows = await this.db.connection('subscriptions as s').join('vendor_profiles as vp', 'vp.id', 's.vendor_profile_id').join('users as u', 'u.id', 'vp.user_id').join('packages as p', 'p.id', 's.package_id').select('s.*', 'vp.business_name', 'vp.status as vendor_status', 'u.name as vendor_name', 'u.email as vendor_email', 'p.name as package_name').orderBy('s.end_date', 'asc');
    return rows.map((row) => ({ ...this.toDto(row), vendorName: row.vendor_name, vendorEmail: row.vendor_email, businessName: row.business_name, vendorStatus: row.vendor_status }));
  }

  async syncExpiry(vendorProfileId: string) {
    const subscription = await this.db.connection('subscriptions').where({ vendor_profile_id: vendorProfileId }).first();
    if (!subscription) return;
    const now = Date.now(); const end = new Date(subscription.end_date).getTime(); const soon = end - now <= 7 * 24 * 60 * 60 * 1000;
    const nextStatus = end <= now ? 'EXPIRED' : soon ? 'EXPIRING_SOON' : 'ACTIVE';
    if (subscription.status !== nextStatus) {
      await this.db.tx(async (trx) => {
        await trx('subscriptions').where({ id: subscription.id }).update({ status: nextStatus, updated_at: trx.fn.now() });
        if (nextStatus === 'EXPIRED') await trx('vendor_profiles').where({ id: vendorProfileId }).whereIn('status', ['ACTIVE', 'EXPIRING_SOON']).update({ status: 'EXPIRED', updated_at: trx.fn.now() });
        await trx('audit_logs').insert({ action: `SUBSCRIPTION_${nextStatus}`, entity: 'subscription', entity_id: subscription.id, metadata: { vendorProfileId, endDate: subscription.end_date } });
      });
    }
  }

  private toDto(row: any) {
    const end = new Date(row.end_date).getTime(); const remainingMs = Math.max(0, end - Date.now());
    return { id: row.id, packageId: row.package_id, packageName: row.package_name, productLimit: row.product_limit, durationDays: row.duration_days, amount: row.amount, currency: row.currency, startDate: row.start_date, endDate: row.end_date, status: row.status, remainingSeconds: Math.floor(remainingMs / 1000), remainingDays: Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) };
  }
  private toRenewalDto(row: any) { return { id: row.id, packageId: row.package_id, paymentId: row.payment_id, amount: row.amount, currency: row.currency, startDate: row.start_date, endDate: row.end_date, approvedAt: row.approved_at, approvedBy: row.approved_by }; }
}
