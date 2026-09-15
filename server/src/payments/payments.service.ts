import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../auth/auth.service';

interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  product_limit: number;
  duration_days: number;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

  async listPackages() {
    const rows = (await this.db.connection('packages').where({ is_active: true }).orderBy('price', 'asc')) as PackageRow[];
    return rows.map((row) => ({ id: row.id, name: row.name, description: row.description, price: row.price, currency: row.currency, productLimit: row.product_limit, durationDays: row.duration_days }));
  }

  async createPayment(user: AuthUser, input: { packageId: string; paymentMethod: string; reference?: string; notes?: string }, ipAddress?: string, userAgent?: string) {
    if (user.role !== 'VENDOR') throw new ForbiddenException('Only vendors can submit vendor payments');
    const vendor = await this.db.connection('vendor_profiles').where({ user_id: user.id }).first();
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    if (!['PENDING_PAYMENT', 'REJECTED'].includes(String(vendor.status))) throw new BadRequestException('This vendor account is not awaiting payment');
    const packageRow = (await this.db.connection('packages').where({ id: input.packageId, is_active: true }).first()) as PackageRow | undefined;
    if (!packageRow) throw new BadRequestException('Selected package is not available');
    if (!input.paymentMethod?.trim()) throw new BadRequestException('Payment method is required');

    const [payment] = await this.db.tx(async (trx) => {
      const [created] = await trx('vendor_payments').insert({ vendor_profile_id: vendor.id, package_id: packageRow.id, amount: packageRow.price, currency: packageRow.currency, payment_method: input.paymentMethod.trim(), reference: input.reference?.trim() || null, notes: input.notes?.trim() || null }).returning('*');
      await trx('audit_logs').insert({ actor_id: user.id, action: 'VENDOR_PAYMENT_SUBMITTED', entity: 'vendor_payment', entity_id: created.id, metadata: { packageId: packageRow.id, amount: packageRow.price, currency: packageRow.currency, paymentMethod: input.paymentMethod.trim(), ipAddress, userAgent } });
      return [created];
    });
    return this.toPaymentDto(payment);
  }

  async listForVendor(user: AuthUser) {
    const rows = await this.db.connection('vendor_payments as p')
      .join('vendor_profiles as vp', 'vp.id', 'p.vendor_profile_id')
      .join('packages as pkg', 'pkg.id', 'p.package_id')
      .where('vp.user_id', user.id)
      .select('p.*', 'vp.business_name', 'pkg.name as package_name')
      .orderBy('p.submitted_at', 'desc');
    return rows.map((row) => this.toPaymentDto(row));
  }

  async listForAdmin() {
    const rows = await this.db.connection('vendor_payments as p')
      .join('vendor_profiles as vp', 'vp.id', 'p.vendor_profile_id')
      .join('users as u', 'u.id', 'vp.user_id')
      .join('packages as pkg', 'pkg.id', 'p.package_id')
      .leftJoin('users as reviewer', 'reviewer.id', 'p.reviewed_by')
      .select('p.*', 'vp.business_name', 'vp.status as vendor_status', 'u.name as vendor_name', 'u.email as vendor_email', 'pkg.name as package_name', 'reviewer.name as reviewer_name')
      .orderBy([{ column: 'p.status', order: 'asc' }, { column: 'p.submitted_at', order: 'desc' }]);
    return rows.map((row) => this.toPaymentDto(row));
  }

  async reviewPayment(admin: AuthUser, paymentId: string, decision: 'VERIFIED' | 'REJECTED', reviewNote?: string) {
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can review vendor payments');
    const payment = await this.db.connection('vendor_payments').where({ id: paymentId }).first();
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status !== 'PENDING_REVIEW') throw new BadRequestException('This payment has already been reviewed');
    const nextVendorStatus = decision === 'VERIFIED' ? 'PENDING_APPROVAL' : 'PENDING_PAYMENT';
    await this.db.tx(async (trx) => {
      await trx('vendor_payments').where({ id: paymentId }).update({ status: decision, reviewed_at: trx.fn.now(), reviewed_by: admin.id, review_note: reviewNote?.trim() || null });
      await trx('vendor_profiles').where({ id: payment.vendor_profile_id }).update({ status: nextVendorStatus, updated_at: trx.fn.now() });
      await trx('audit_logs').insert({ actor_id: admin.id, action: `VENDOR_PAYMENT_${decision}`, entity: 'vendor_payment', entity_id: paymentId, metadata: { vendorProfileId: payment.vendor_profile_id, reviewNote: reviewNote?.trim() || null } });
    });
    const updated = await this.db.connection('vendor_payments as p').join('vendor_profiles as vp', 'vp.id', 'p.vendor_profile_id').join('users as u', 'u.id', 'vp.user_id').join('packages as pkg', 'pkg.id', 'p.package_id').where('p.id', paymentId).select('p.*', 'vp.business_name', 'vp.status as vendor_status', 'u.name as vendor_name', 'u.email as vendor_email', 'pkg.name as package_name').first();
    return this.toPaymentDto(updated);
  }

  async createOrderPayment(user: AuthUser, orderId: string, provider: string) {
    const order = await this.db.connection('orders').where({ id: orderId, user_id: user.id }).first();
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING_PAYMENT') throw new BadRequestException('Order is not awaiting payment');
    const [payment] = await this.db.connection('order_payments').insert({ order_id: order.id, amount: order.total, currency: order.currency, provider: provider.trim(), status: 'PENDING' }).returning('*');
    return payment;
  }

  async verifyOrderPayment(admin: AuthUser, paymentId: string, status: 'PAID' | 'FAILED', providerReference?: string, failureReason?: string) {
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can verify marketplace payments');
    const payment = await this.db.connection('order_payments').where({ id: paymentId }).first();
    if (!payment) throw new NotFoundException('Order payment not found');
    if (payment.status !== 'PENDING') throw new BadRequestException('Order payment has already been resolved');
    await this.db.tx(async (trx) => {
      await trx('order_payments').where({ id: paymentId }).update({ status, provider_reference: providerReference?.trim() || null, failure_reason: failureReason?.trim() || null, verified_by: admin.id, verified_at: trx.fn.now(), updated_at: trx.fn.now() });
      await trx('orders').where({ id: payment.order_id }).update({ status: status === 'PAID' ? 'PAID' : 'CANCELLED', updated_at: trx.fn.now() });
    });
    return this.db.connection('order_payments').where({ id: paymentId }).first();
  }

  private toPaymentDto(row: any) {
    return { id: row.id, vendorName: row.vendor_name, vendorEmail: row.vendor_email, businessName: row.business_name, vendorStatus: row.vendor_status, packageName: row.package_name, packageId: row.package_id, amount: row.amount, currency: row.currency, paymentMethod: row.payment_method, reference: row.reference, notes: row.notes, status: row.status, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, reviewerName: row.reviewer_name, reviewNote: row.review_note };
  }
}
