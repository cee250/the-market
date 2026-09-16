import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';

interface MetricRow { total_orders: string | number; completed_orders: string | number; units_sold: string | number; revenue: string | number; }
interface ProductRow { product_name: string; units_sold: string | number; revenue: string | number; }

const toNumber = (value: string | number | null | undefined): number => Number(value ?? 0);

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  private async summarize(vendorProfileId?: string): Promise<{ totalOrders: number; completedOrders: number; unitsSold: number; revenue: number; averageOrderValue: number }> {
    const query = this.db.connection('vendor_orders as vo')
      .leftJoin('orders as o', 'o.id', 'vo.order_id')
      .whereNot('vo.status', 'CANCELLED');
    if (vendorProfileId) query.where('vo.vendor_profile_id', vendorProfileId);
    const row = await query.select(
      this.db.connection.raw('COUNT(DISTINCT vo.order_id)::int as total_orders'),
      this.db.connection.raw("COUNT(DISTINCT vo.order_id) FILTER (WHERE vo.status = 'DELIVERED')::int as completed_orders"),
      this.db.connection.raw('COALESCE(SUM(oi.quantity), 0)::int as units_sold'),
      this.db.connection.raw('COALESCE(SUM(oi.subtotal), 0)::int as revenue'),
    ).leftJoin('order_items as oi', 'oi.vendor_order_id', 'vo.id').first() as MetricRow;
    const revenue = toNumber(row?.revenue);
    const totalOrders = toNumber(row?.total_orders);
    return { totalOrders, completedOrders: toNumber(row?.completed_orders), unitsSold: toNumber(row?.units_sold), revenue, averageOrderValue: totalOrders ? Math.round(revenue / totalOrders) : 0 };
  }

  private async topProducts(vendorProfileId?: string): Promise<{ name: string; unitsSold: number; revenue: number }[]> {
    const query = this.db.connection('order_items as oi')
      .join('vendor_orders as vo', 'vo.id', 'oi.vendor_order_id')
      .whereNot('vo.status', 'CANCELLED');
    if (vendorProfileId) query.where('vo.vendor_profile_id', vendorProfileId);
    const rows = await query.select('oi.product_name').sum({ units_sold: 'oi.quantity' }).sum({ revenue: 'oi.subtotal' }).groupBy('oi.product_name').orderBy('revenue', 'desc').limit(5) as ProductRow[];
    return rows.map((row) => ({ name: row.product_name, unitsSold: toNumber(row.units_sold), revenue: toNumber(row.revenue) }));
  }

  async vendor(user: AuthUser) {
    if (user.role !== 'VENDOR') throw new ForbiddenException('Only vendors can view vendor analytics');
    const vendor = await this.db.connection('vendor_profiles').where({ user_id: user.id }).first();
    if (!vendor) throw new ForbiddenException('Vendor profile not found');
    return { scope: 'vendor', ...await this.summarize(vendor.id), topProducts: await this.topProducts(vendor.id) };
  }

  async admin(user: AuthUser) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can view platform analytics');
    return { scope: 'platform', ...await this.summarize(), topProducts: await this.topProducts() };
  }
}
