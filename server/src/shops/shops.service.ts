import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { PackagesService } from '../packages/packages.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const PLATFORMS = ['whatsapp', 'facebook', 'instagram', 'tiktok', 'x', 'youtube', 'website'] as const;
type Platform = typeof PLATFORMS[number];

@Injectable()
export class ShopsService {
  constructor(private readonly db: DatabaseService, private readonly packages: PackagesService, private readonly subscriptions: SubscriptionsService) {}

  async dashboard(user: AuthUser) {
    this.assertVendor(user);
    const vendor = await this.getVendor(user.id);
    const [entitlement, subscription, payments] = await Promise.all([this.packages.getVendorEntitlement(user), this.subscriptions.getForVendor(user), this.db.connection('vendor_payments').where({ vendor_profile_id: vendor.id }).count('id as count').first()]);
    return { shop: await this.toShopDto(vendor, true), vendorStatus: vendor.status, entitlement, subscription: subscription.subscription, renewalHistory: subscription.renewals, paymentCount: Number(payments?.count ?? 0), publishedProductCount: 0 };
  }

  async getOwn(user: AuthUser) { this.assertVendor(user); return this.toShopDto(await this.getVendor(user.id), true); }

  async updateOwn(user: AuthUser, input: { businessName?: string; description?: string; phone?: string; location?: string; logoUrl?: string; socialLinks?: { platform: string; url: string }[] }) {
    this.assertVendor(user);
    const vendor = await this.getVendor(user.id);
    if (input.businessName !== undefined && input.businessName.trim().length < 2) throw new BadRequestException('Business name is too short');
    if (input.phone !== undefined && input.phone.trim().length < 3) throw new BadRequestException('Phone is invalid');
    if (input.location !== undefined && input.location.trim().length < 2) throw new BadRequestException('Location is invalid');
    const links = input.socialLinks ?? [];
    const seen = new Set<string>();
    for (const link of links) { if (!PLATFORMS.includes(link.platform as Platform) || !/^https?:\/\//i.test(link.url)) throw new BadRequestException('Social links must use a supported platform and http(s) URL'); if (seen.has(link.platform)) throw new BadRequestException('Each social platform may appear only once'); seen.add(link.platform); }
    await this.db.tx(async (trx) => {
      await trx('vendor_profiles').where({ id: vendor.id }).update({ ...(input.businessName !== undefined ? { business_name: input.businessName.trim() } : {}), ...(input.description !== undefined ? { description: input.description.trim() || null } : {}), ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}), ...(input.location !== undefined ? { location: input.location.trim() } : {}), ...(input.logoUrl !== undefined ? { logo_url: input.logoUrl.trim() || null } : {}), updated_at: trx.fn.now() });
      if (input.socialLinks) {
        await trx('vendor_social_links').where({ vendor_profile_id: vendor.id }).del();
        if (links.length) await trx('vendor_social_links').insert(links.map((link) => ({ vendor_profile_id: vendor.id, platform: link.platform, url: link.url.trim() })));
      }
      await trx('audit_logs').insert({ actor_id: user.id, action: 'VENDOR_SHOP_UPDATED', entity: 'vendor_profile', entity_id: vendor.id, metadata: { socialLinkCount: links.length } });
    });
    return this.toShopDto(await this.getVendor(user.id), true);
  }

  async publicShop(slug: string) {
    const vendor = await this.db.connection('vendor_profiles').where({ slug }).first();
    if (!vendor) throw new NotFoundException('Shop not found');
    await this.subscriptions.syncExpiry(vendor.id);
    const current = await this.db.connection('vendor_profiles').where({ id: vendor.id }).first();
    if (current.status !== 'ACTIVE') throw new NotFoundException('Shop not found');
    return this.toShopDto(current, false);
  }

  private async getVendor(userId: string) { const vendor = await this.db.connection('vendor_profiles').where({ user_id: userId }).first(); if (!vendor) throw new NotFoundException('Vendor profile not found'); return vendor; }
  private assertVendor(user: AuthUser) { if (user.role !== 'VENDOR') throw new ForbiddenException('Only vendors can manage shops'); }
  private async toShopDto(vendor: any, includePrivate: boolean) { const links = await this.db.connection('vendor_social_links').where({ vendor_profile_id: vendor.id }).orderBy('platform', 'asc'); return { id: vendor.id, businessName: vendor.business_name, slug: vendor.slug, description: vendor.description, logoUrl: vendor.logo_url, phone: vendor.phone, location: vendor.location, status: vendor.status, socialLinks: links.map((link) => ({ platform: link.platform, url: link.url })), products: [], ...(includePrivate ? { userId: vendor.user_id } : {}) }; }
}
