import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { MailService } from './mail.service';

const SESSION_COOKIE = 'market_session';
const SESSION_DAYS = 30;
const VERIFICATION_HOURS = 24;
const RESET_MINUTES = 30;

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  vendorStatus?: 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'DEACTIVATED';
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: Role;
  is_active: boolean;
  email_verified_at: Date | string | null;
  vendor_status?: AuthUser['vendorStatus'];
}

interface TokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createToken(ttlMs: number): TokenResult {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + ttlMs),
    };
  }

  private toUser(row: UserRow): AuthUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      emailVerified: Boolean(row.email_verified_at),
      vendorStatus: row.vendor_status,
    };
  }

  private async findByEmail(email: string): Promise<UserRow | undefined> {
    return (await this.db.connection('users as u')
      .leftJoin('vendor_profiles as vp', 'vp.user_id', 'u.id')
      .where({ 'u.email': this.normalizeEmail(email) })
      .select('u.*', 'vp.status as vendor_status')
      .first()) as
      | UserRow
      | undefined;
  }

  private async issueSession(user: UserRow, request?: Request): Promise<{ user: AuthUser; cookie: string }> {
    const session = this.createToken(SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.db.connection('sessions').insert({
      user_id: user.id,
      token_hash: session.tokenHash,
      expires_at: session.expiresAt,
      ip_address: request?.ip,
      user_agent: request?.headers['user-agent'],
    });
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    const cookie = `${SESSION_COOKIE}=${session.token}; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
    return { user: this.toUser(user), cookie };
  }

  async register(name: string, email: string, password: string, request?: Request) {
    const normalizedEmail = this.normalizeEmail(email);
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new BadRequestException('Name and a valid email are required');
    }
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = (await this.db.connection('users').insert({
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'CUSTOMER',
      is_active: true,
    }).returning('*')) as UserRow[];

    const verification = this.createToken(VERIFICATION_HOURS * 60 * 60 * 1000);
    await this.db.connection('email_verification_tokens').insert({
      user_id: user.id,
      token_hash: verification.tokenHash,
      expires_at: verification.expiresAt,
    });
    const session = await this.issueSession(user, request);
    try {
      await this.mail.sendEmailVerification(user.email, user.name, verification.token);
      await this.mail.sendRegistrationNotification({ name: user.name, email: user.email, role: user.role });
    } catch (error) {
      this.logger.error('Registration email notification failed', error instanceof Error ? error.message : String(error));
    }
    return {
      ...session,
      verificationToken: this.exposeDevToken(verification.token),
    };
  }

  async registerVendor(input: {
    name: string;
    businessName: string;
    email: string;
    phone: string;
    location: string;
    password: string;
    confirmPassword: string;
    termsVersion: string;
    packageName: string;
  }, request?: Request) {
    const normalizedEmail = this.normalizeEmail(input.email);
    if (input.name.trim().length < 2 || input.businessName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new BadRequestException('Name, business name, and a valid email are required');
    }
    if (!input.phone.trim() || !input.location.trim()) throw new BadRequestException('Phone and location are required');
    if (input.password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    if (input.password !== input.confirmPassword) throw new BadRequestException('Passwords do not match');
    if (!input.termsVersion?.trim()) throw new BadRequestException('Terms & Conditions acceptance is required');
    if (await this.findByEmail(normalizedEmail)) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const slugBase = input.businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vendor';
    const [user, verification] = await this.db.tx(async (trx) => {
      let slug = slugBase;
      for (let suffix = 2; await trx('vendor_profiles').where({ slug }).first(); suffix += 1) slug = `${slugBase}-${suffix}`;
      const [createdUser] = (await trx('users').insert({ name: input.name.trim(), email: normalizedEmail, password_hash: passwordHash, role: 'VENDOR', is_active: false }).returning('*')) as UserRow[];
      const vendorProfile = { user_id: createdUser.id, business_name: input.businessName.trim(), slug, phone: input.phone.trim(), location: input.location.trim(), status: 'PENDING_PAYMENT' as const } as Record<string, unknown>;
      if (await trx.schema.hasColumn('vendor_profiles', 'requested_package_name')) vendorProfile.requested_package_name = input.packageName.trim();
      await trx('vendor_profiles').insert(vendorProfile);
      await trx('terms_acceptances').insert({ user_id: createdUser.id, terms_version: input.termsVersion.trim(), ip_address: request?.ip, user_agent: request?.headers['user-agent'] });
      const token = this.createToken(VERIFICATION_HOURS * 60 * 60 * 1000);
      await trx('email_verification_tokens').insert({ user_id: createdUser.id, token_hash: token.tokenHash, expires_at: token.expiresAt });
      return [createdUser, token] as const;
    });
    const session = await this.issueSession({ ...user, vendor_status: 'PENDING_PAYMENT' }, request);
    try {
      await this.mail.sendEmailVerification(user.email, user.name, verification.token);
      await this.mail.sendRegistrationNotification({ name: user.name, email: user.email, role: user.role });
    } catch (error) {
      this.logger.error('Vendor registration email notification failed', error instanceof Error ? error.message : String(error));
    }
    return { ...session, verificationToken: this.exposeDevToken(verification.token) };
  }

  async login(email: string, password: string, request?: Request) {
    const user = await this.findByEmail(email);
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.is_active) throw new UnauthorizedException('This account is inactive');
    return this.issueSession(user, request);
  }

  async getUserFromCookie(cookieHeader?: string): Promise<AuthUser | null> {
    const token = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    if (!token) return null;
    const row = (await this.db.connection('sessions as s')
      .join('users as u', 'u.id', 's.user_id')
      .leftJoin('vendor_profiles as vp', 'vp.user_id', 'u.id')
      .where({ 's.token_hash': this.hashToken(token), 'u.is_active': true })
      .where('s.expires_at', '>', this.db.connection.fn.now())
      .select('u.*', 'vp.status as vendor_status')
      .first()) as UserRow | undefined;
    if (!row) return null;
    await this.db.connection('sessions').where({ token_hash: this.hashToken(token) }).update({ last_seen_at: this.db.connection.fn.now() });
    return this.toUser(row);
  }

  async logout(cookieHeader?: string): Promise<void> {
    const token = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    if (token) await this.db.connection('sessions').where({ token_hash: this.hashToken(token) }).del();
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const row = await this.db.connection('email_verification_tokens').where({ token_hash: tokenHash }).whereNull('used_at').where('expires_at', '>', this.db.connection.fn.now()).first();
    if (!row) throw new BadRequestException('Verification token is invalid or expired');
    await this.db.tx(async (trx) => {
      await trx('users').where({ id: row.user_id }).update({ email_verified_at: trx.fn.now() });
      await trx('email_verification_tokens').where({ id: row.id }).update({ used_at: trx.fn.now() });
    });
    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.findByEmail(email);
    if (user) {
      await this.db.connection('password_reset_tokens').where({ user_id: user.id }).whereNull('used_at').update({ used_at: this.db.connection.fn.now() });
      const reset = this.createToken(RESET_MINUTES * 60 * 1000);
      await this.db.connection('password_reset_tokens').insert({ user_id: user.id, token_hash: reset.tokenHash, expires_at: reset.expiresAt });
      try {
        await this.mail.sendPasswordReset(user.email, reset.token);
      } catch (error) {
        this.logger.error('Password reset email delivery failed', error instanceof Error ? error.message : String(error));
      }
      return { resetToken: this.exposeDevToken(reset.token) };
    }
    return { resetToken: undefined };
  }

  async resetPassword(token: string, password: string) {
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const row = await this.db.connection('password_reset_tokens').where({ token_hash: this.hashToken(token) }).whereNull('used_at').where('expires_at', '>', this.db.connection.fn.now()).first();
    if (!row) throw new BadRequestException('Reset token is invalid or expired');
    const passwordHash = await bcrypt.hash(password, 12);
    await this.db.tx(async (trx) => {
      await trx('users').where({ id: row.user_id }).update({ password_hash: passwordHash });
      await trx('password_reset_tokens').where({ id: row.id }).update({ used_at: trx.fn.now() });
      await trx('sessions').where({ user_id: row.user_id }).del();
    });
    return { message: 'Password reset successfully' };
  }

  private exposeDevToken(token: string): string | undefined {
    return this.config.get<string>('NODE_ENV') === 'production' ? undefined : token;
  }

  static sessionCookieName(): string {
    return SESSION_COOKIE;
  }
}
