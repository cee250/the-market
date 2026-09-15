import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';

interface PackageInput { name: string; description?: string; price: number; currency: string; productLimit: number; durationDays: number; isActive?: boolean }

@Injectable()
export class PackagesService {
  constructor(private readonly db: DatabaseService) {}

  async list(admin: AuthUser) {
    this.assertAdmin(admin);
    const rows = await this.db.connection('packages').orderBy('price', 'asc');
    return rows.map((row) => this.toPackage(row));
  }

  async create(admin: AuthUser, input: PackageInput) {
    this.assertAdmin(admin);
    this.validateInput(input);
    try {
      const [row] = await this.db.connection('packages').insert({ name: input.name.trim(), description: input.description?.trim() || null, price: input.price, currency: input.currency.trim().toUpperCase(), product_limit: input.productLimit, duration_days: input.durationDays, is_active: input.isActive ?? true }).returning('*');
      return this.toPackage(row);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('A package with that name already exists');
      throw error;
    }
  }

  async update(admin: AuthUser, id: string, input: Partial<PackageInput>) {
    this.assertAdmin(admin);
    if (input.price !== undefined || input.productLimit !== undefined || input.durationDays !== undefined) this.validateInput({ name: input.name ?? 'existing', price: input.price ?? 1, currency: input.currency ?? 'RWF', productLimit: input.productLimit ?? 1, durationDays: input.durationDays ?? 1 });
    const existing = await this.db.connection('packages').where({ id }).first();
    if (!existing) throw new NotFoundException('Package not found');
    const [row] = await this.db.connection('packages').where({ id }).update({ ...(input.name !== undefined ? { name: input.name.trim() } : {}), ...(input.description !== undefined ? { description: input.description.trim() } : {}), ...(input.price !== undefined ? { price: input.price } : {}), ...(input.currency !== undefined ? { currency: input.currency.trim().toUpperCase() } : {}), ...(input.productLimit !== undefined ? { product_limit: input.productLimit } : {}), ...(input.durationDays !== undefined ? { duration_days: input.durationDays } : {}), ...(input.isActive !== undefined ? { is_active: input.isActive } : {}), updated_at: this.db.connection.fn.now() }).returning('*');
    return this.toPackage(row);
  }

  async getVendorEntitlement(user: AuthUser) {
    if (user.role !== 'VENDOR') throw new ForbiddenException('Only vendors have entitlements');
    const row = await this.db.connection('vendor_entitlements as e').join('vendor_profiles as vp', 'vp.id', 'e.vendor_profile_id').join('packages as p', 'p.id', 'e.package_id').where('vp.user_id', user.id).select('e.*', 'p.name as package_name', 'p.description as package_description').first();
    if (!row) return null;
    return this.toEntitlement(row);
  }

  async assertCanPublishProduct(vendorProfileId: string, currentPublishedCount: number, increment = 1) {
    const entitlement = await this.db.connection('vendor_entitlements').where({ vendor_profile_id: vendorProfileId, status: 'ACTIVE' }).first();
    if (!entitlement) throw new ForbiddenException('No active product entitlement');
    if (currentPublishedCount + increment > entitlement.product_limit) throw new BadRequestException(`Product limit reached (${entitlement.product_limit})`);
    return entitlement;
  }

  async activateEntitlement(trx: any, vendorProfileId: string, adminId: string) {
    const payment = await trx('vendor_payments as vp').join('packages as p', 'p.id', 'vp.package_id').where({ 'vp.vendor_profile_id': vendorProfileId, 'vp.status': 'VERIFIED' }).orderBy('vp.reviewed_at', 'desc').select('vp.amount', 'vp.currency', 'p.id as package_id', 'p.product_limit', 'p.duration_days').first();
    if (!payment) throw new BadRequestException('Vendor has no verified package payment');
    await trx('vendor_entitlements').insert({ vendor_profile_id: vendorProfileId, package_id: payment.package_id, product_limit: payment.product_limit, duration_days: payment.duration_days, amount: payment.amount, currency: payment.currency, status: 'ACTIVE', granted_at: trx.fn.now(), revoked_at: null }).onConflict('vendor_profile_id').merge({ package_id: payment.package_id, product_limit: payment.product_limit, duration_days: payment.duration_days, amount: payment.amount, currency: payment.currency, status: 'ACTIVE', granted_at: trx.fn.now(), revoked_at: null, updated_at: trx.fn.now() });
    await trx('audit_logs').insert({ actor_id: adminId, action: 'VENDOR_ENTITLEMENT_GRANTED', entity: 'vendor_entitlement', entity_id: vendorProfileId, metadata: { packageId: payment.package_id, productLimit: payment.product_limit } });
  }

  async deactivateEntitlement(trx: any, vendorProfileId: string, adminId: string) {
    await trx('vendor_entitlements').where({ vendor_profile_id: vendorProfileId }).update({ status: 'INACTIVE', revoked_at: trx.fn.now(), updated_at: trx.fn.now() });
    await trx('audit_logs').insert({ actor_id: adminId, action: 'VENDOR_ENTITLEMENT_REVOKED', entity: 'vendor_entitlement', entity_id: vendorProfileId, metadata: {} });
  }

  private assertAdmin(user: AuthUser) { if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can manage packages'); }
  private validateInput(input: PackageInput) { if (!input.name?.trim() || !input.currency?.trim() || !Number.isInteger(input.price) || input.price < 0 || !Number.isInteger(input.productLimit) || input.productLimit < 1 || !Number.isInteger(input.durationDays) || input.durationDays < 1) throw new BadRequestException('Package values are invalid'); }
  private toPackage(row: any) { return { id: row.id, name: row.name, description: row.description, price: row.price, currency: row.currency, productLimit: row.product_limit, durationDays: row.duration_days, isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at }; }
  private toEntitlement(row: any) { return { id: row.id, packageId: row.package_id, packageName: row.package_name, description: row.package_description, productLimit: row.product_limit, durationDays: row.duration_days, amount: row.amount, currency: row.currency, status: row.status, grantedAt: row.granted_at, revokedAt: row.revoked_at }; }
}
