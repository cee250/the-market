import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';

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
  constructor(private readonly db: DatabaseService) {}

  async listVendors(admin: AuthUser) {
    this.assertAdmin(admin);
    const latestAmount = this.db.connection('vendor_payments as latest_amount').select('latest_amount.amount').whereRaw('latest_amount.vendor_profile_id = vp.id').orderBy('latest_amount.submitted_at', 'desc').limit(1);
    const latestCurrency = this.db.connection('vendor_payments as latest_currency').select('latest_currency.currency').whereRaw('latest_currency.vendor_profile_id = vp.id').orderBy('latest_currency.submitted_at', 'desc').limit(1);
    const latestStatus = this.db.connection('vendor_payments as latest_status').select('latest_status.status').whereRaw('latest_status.vendor_profile_id = vp.id').orderBy('latest_status.submitted_at', 'desc').limit(1);
    const rows = await this.db.connection('vendor_profiles as vp')
      .join('users as u', 'u.id', 'vp.user_id')
      .select('vp.id', 'vp.user_id', 'vp.business_name', 'vp.slug', 'vp.phone', 'vp.location', 'vp.status', 'vp.created_at', 'vp.updated_at', 'u.name', 'u.email', 'u.email_verified_at', latestAmount.as('latest_payment_amount'), latestCurrency.as('latest_payment_currency'), latestStatus.as('latest_payment_status'))
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
      await trx('audit_logs').insert({ actor_id: admin.id, action: `VENDOR_${action}`, entity: 'vendor_profile', entity_id: vendorId, metadata: { from: vendor.status, to: rule.to, note: note?.trim() || null } });
    });
    const updated = await this.db.connection('vendor_profiles as vp').join('users as u', 'u.id', 'vp.user_id').where('vp.id', vendorId).select('vp.*', 'u.name', 'u.email', 'u.email_verified_at').first();
    return this.toDto(updated);
  }

  private assertAdmin(user: AuthUser) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can manage vendors');
  }

  private toDto(row: any) {
    return { id: row.id, userId: row.user_id, name: row.name, email: row.email, businessName: row.business_name, slug: row.slug, phone: row.phone, location: row.location, status: row.status, emailVerified: Boolean(row.email_verified_at), createdAt: row.created_at, updatedAt: row.updated_at, latestPayment: row.latest_payment_status ? { amount: row.latest_payment_amount, currency: row.latest_payment_currency, status: row.latest_payment_status } : null };
  }
}
