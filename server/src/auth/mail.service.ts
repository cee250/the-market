import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASS');
      if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASS are required for email delivery');
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST') || 'smtp.gmail.com',
        port: Number(this.config.get<string>('SMTP_PORT') || 465),
        secure: String(this.config.get<string>('SMTP_SECURE') ?? 'true') === 'true',
        auth: { user, pass },
      });
    }
    return this.transporter;
  }

  private fromAddress(): string {
    return this.config.get<string>('EMAIL_FROM') || this.config.get<string>('SMTP_USER') || 'no-reply@market.rw';
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const baseUrl = (this.config.get<string>('APP_BASE_URL') || 'https://market-rw.netlify.app').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/password-reset?token=${encodeURIComponent(token)}`;
    await this.getTransporter().sendMail({
      from: this.fromAddress(),
      to: email,
      subject: 'Reset your Market password',
      text: `We received a request to reset your Market password. Use this link within 30 minutes: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>We received a request to reset your Market password.</p><p><a href="${resetUrl}">Reset your password</a> <span>(valid for 30 minutes)</span></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  }

  async sendRegistrationNotification(user: { name: string; email: string; role: string }): Promise<void> {
    const recipient = this.config.get<string>('ADMIN_EMAIL') || this.config.get<string>('SMTP_USER');
    if (!recipient) return;
    await this.getTransporter().sendMail({
      from: this.fromAddress(),
      to: recipient,
      subject: `New Market ${user.role.toLowerCase()} registration`,
      text: `A new ${user.role.toLowerCase()} registered on Market.\nName: ${user.name}\nEmail: ${user.email}`,
      html: `<p>A new <strong>${user.role.toLowerCase()}</strong> registered on Market.</p><p><strong>Name:</strong> ${user.name}<br><strong>Email:</strong> ${user.email}</p>`,
    });
  }

  async verify(): Promise<void> {
    await this.getTransporter().verify();
    this.logger.log('SMTP transport verified');
  }
}
