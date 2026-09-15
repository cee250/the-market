import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

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
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: Role;
  is_active: boolean;
  email_verified_at: Date | string | null;
}

interface TokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
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
    };
  }

  private async findByEmail(email: string): Promise<UserRow | undefined> {
    return (await this.db.connection('users').where({ email: this.normalizeEmail(email) }).first()) as
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
    return {
      ...session,
      verificationToken: this.exposeDevToken(verification.token),
    };
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
      .where({ 's.token_hash': this.hashToken(token), 'u.is_active': true })
      .where('s.expires_at', '>', this.db.connection.fn.now())
      .select('u.*')
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
