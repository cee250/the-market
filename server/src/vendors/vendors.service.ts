import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { PackagesService } from '../packages/packages.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type VendorStatus = 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'DEACTIVATED';
type VendorAction = 'ACTIVATE' | 'SUSPEND' | 'DEACTIVATE' | 'REACTIVATE';

const transitions: Record<VendorAction, { from: VendorStatus[]; to: VendorStatus }> = {
  ACTIVATE: { from: ['PENDING_APPROVAL'], to: 'ACTIVE' },
  SUSPEND: { from: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PENDING_APPROVAL'], to: 'SUSPENDED' },
  DEACTIVATE: { from: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED'], to: 'DEACTIVATED' },
  REACTIVATE: { from: ['SUSPENDED', 'DEACTIVATED'], to: 'ACTIVE' },
};

@Injectable()
export class VendorsService {
  constructor(private readonly db: DatabaseService, private readonly packages: PackagesService, private readonly subscriptions: SubscriptionsService) {}

  async listVendors(admin: AuthUser) {
    this.assertAdmin(admin);
    const latestAmount = this.db.connection('vendor_payments as latest_amount').select('latest_amount.amount').whereRaw('latest_amount.vendor_profile_id = vp.id').orderBy('latest_amount.submitted_at', 'desc').limit(1);
    const latestCurrency = this.db.connection('vendor_payments as latest_currency').select('latest_currency.currency').whereRaw('latest_currency.vendor_profile_id = vp.id').orderBy('latest_currency.submitted_at', 'desc').limit(1);
    const latestStatus = this.db.connection('vendor_payments as latest_status').select('latest_status.status').whereRaw('latest_status.vendor_profile_id = vp.id').orderBy('latest_status.submitted_at', 'desc').limit(1);
    const totalProducts = this.db.connection('products as product_count').count('*').whereRaw('product_count.vendor_profile_id = vp.id');
    const publishedProducts = this.db.connection('products as published_count').count('*').whereRaw("published_count.vendor_profile_id = vp.id AND published_count.status = 'PUBLISHED'");
    const income = this.db.connection('vendor_orders as income_orders').sum('income_orders.subtotal').join('orders as income_parent', 'income_parent.id', 'income_orders.order_id').whereRaw('income_orders.vendor_profile_id = vp.id').whereNot('income_parent.status', 'CANCELLED');
    const subscriptionStart = this.db.connection('subscriptions as current_subscription').select('current_subscription.start_date').whereRaw('current_subscription.vendor_profile_id = vp.id').limit(1);
    const subscriptionEnd = this.db.connection('subscriptions as current_subscription_end').select('current_subscription_end.end_date').whereRaw('current_subscription_end.vendor_profile_id = vp.id').limit(1);
    const rows = await this.db.connection('vendor_profiles as vp')
      .join('users as u', 'u.id', 'vp.user_id')
      .select('vp.id', 'vp.user_id', 'vp.business_name', 'vp.slug', 'vp.phone', 'vp.location', 'vp.status', 'vp.created_at', 'vp.updated_at', 'u.name', 'u.email', 'u.email_verified_at', latestAmount.as('latest_payment_amount'), latestCurrency.as('latest_payment_currency'), latestStatus.as('latest_payment_status'), totalProducts.as('total_products'), publishedProducts.as('published_products'), income.as('income'), subscriptionStart.as('subscription_start_date'), subscriptionEnd.as('subscription_end_date'))
      .orderBy('vp.created_at', 'desc');
    return rows.map((row) => this.toDto(row));
  }

  async transition(admin: AuthUser, vendorId: string, action: VendorAction, note?: string) {
    this.assertAdmin(admin);
    const vendor = await this.db.connection('vendor_profiles').where({ id: vendorId }).first();
    if (!vendor) throw new NotFoundException('Vendor not found');
    const rule = transitions[action];
    if (!rule) throw new BadRequestException('Unsupported vendor action');
    if (!rule.from.includes(vendor.status as VendorStatus)) throw new BadRequestException(`Cannot ${action.toLowerCase()} a vendor in ${vendor.status} status`);

    await this.db.tx(async (trx) => {
      await trx('vendor_profiles').where({ id: vendorId }).update({ status: rule.to, updated_at: trx.fn.now() });
      if (rule.to === 'ACTIVE') await trx('users').where({ id: vendor.user_id }).update({ is_active: true });
      if (rule.to === 'ACTIVE') await this.packages.activateEntitlement(trx, vendorId, admin.id);
      if (rule.to === 'ACTIVE') await this.subscriptions.activateForVendor(trx, vendorId, admin.id);
      if (rule.to === 'DEACTIVATED') await this.packages.deactivateEntitlement(trx, vendorId, admin.id);
      await trx('audit_logs').insert({ actor_id: admin.id, action: `VENDOR_${action}`, entity: 'vendor_profile', entity_id: vendorId, metadata: { from: vendor.status, to: rule.to, note: note?.trim() || null } });
    });
    const updated = await this.db.connection('vendor_profiles as vp').join('users as u', 'u.id', 'vp.user_id').leftJoin('subscriptions as s', 's.vendor_profile_id', 'vp.id').where('vp.id', vendorId).select('vp.*', 'u.name', 'u.email', 'u.email_verified_at', 's.start_date as subscription_start_date', 's.end_date as subscription_end_date').first();
    return this.toDto(updated);
  }

  async remove(admin: AuthUser, vendorId: string) {
    this.assertAdmin(admin);
    const vendor = await this.db.connection('vendor_profiles').where({ id: vendorId }).first();
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (await this.db.connection('vendor_orders').where({ vendor_profile_id: vendorId }).first()) throw new BadRequestException('This vendor has order history and cannot be deleted. Deactivate it instead.');
    await this.db.tx(async (trx) => {
      await trx('vendor_payments').where({ vendor_profile_id: vendorId }).del();
      await trx('vendor_entitlements').where({ vendor_profile_id: vendorId }).del();
      await trx('subscriptions').where({ vendor_profile_id: vendorId }).del();
      await trx('vendor_profiles').where({ id: vendorId }).del();
      await trx('users').where({ id: vendor.user_id }).del();
      await trx('audit_logs').insert({ actor_id: admin.id, action: 'VENDOR_DELETE', entity: 'vendor_profile', entity_id: vendorId, metadata: {} });
    });
    return { deleted: true, id: vendorId };
  }

  private assertAdmin(user: AuthUser) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can manage vendors');
  }

  private toDto(row: any) {
    return { id: row.id, userId: row.user_id, name: row.name, email: row.email, businessName: row.business_name, slug: row.slug, phone: row.phone, location: row.location, status: row.status, emailVerified: Boolean(row.email_verified_at), createdAt: row.created_at, updatedAt: row.updated_at, subscriptionStartDate: row.subscription_start_date ?? null, subscriptionEndDate: row.subscription_end_date ?? null, latestPayment: row.latest_payment_status ? { amount: row.latest_payment_amount, currency: row.latest_payment_currency, status: row.latest_payment_status } : null };
  }
}
