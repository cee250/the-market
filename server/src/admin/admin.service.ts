import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}
  async stats(user: AuthUser) { this.assertAdmin(user); const [users, vendors, products, orders, payments, inventory] = await Promise.all([this.db.connection('users').count('id as count').first(), this.db.connection('vendor_profiles').count('id as count').first(), this.db.connection('products').where({ status: 'PUBLISHED' }).count('id as count').first(), this.db.connection('orders').count('id as count').first(), this.db.connection('order_payments').where({ status: 'PAID' }).sum('amount as total').first(), this.db.connection('inventory_items').where({ status: 'ACTIVE' }).count('id as count').first()]); return { users: Number(users?.count || 0), vendors: Number(vendors?.count || 0), publishedProducts: Number(products?.count || 0), orders: Number(orders?.count || 0), paidMarketplaceRevenue: Number(payments?.total || 0), activeInventoryItems: Number(inventory?.count || 0) }; }
  async audit(user: AuthUser, page = 1, limit = 50) { this.assertAdmin(user); const safePage = Math.max(1, page); const safeLimit = Math.min(100, Math.max(1, limit)); const rows = await this.db.connection('audit_logs as a').leftJoin('users as u', 'u.id', 'a.actor_id').select('a.*', 'u.name as actor_name', 'u.email as actor_email').orderBy('a.created_at', 'desc').offset((safePage - 1) * safeLimit).limit(safeLimit); return { items: rows, page: safePage, limit: safeLimit }; }
  private assertAdmin(user: AuthUser) { if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can access operations data'); }
}
