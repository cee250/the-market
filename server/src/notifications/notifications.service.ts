import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async list(user: AuthUser) {
    const items = await this.db.connection('notifications').where({ user_id: user.id }).orderBy('created_at', 'desc').limit(50);
    const unreadCount = await this.db.connection('notifications').where({ user_id: user.id }).whereNull('read_at').count('* as count').first();
    return { items, unreadCount: Number(unreadCount?.count ?? 0) };
  }

  async markRead(user: AuthUser, id: string) {
    await this.db.connection('notifications').where({ id, user_id: user.id }).update({ read_at: this.db.connection.fn.now() });
    return { success: true };
  }

  async markAllRead(user: AuthUser) {
    await this.db.connection('notifications').where({ user_id: user.id }).whereNull('read_at').update({ read_at: this.db.connection.fn.now() });
    return { success: true };
  }

  async create(userId: string, type: string, title: string, message: string, metadata: Record<string, unknown> = {}) {
    const [notification] = await this.db.connection('notifications').insert({ user_id: userId, type, title, message, metadata }).returning('*');
    return notification;
  }
}
