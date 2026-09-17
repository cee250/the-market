import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, AuthUser } from './auth.service';

export const AUTH_USER = Symbol('AUTH_USER');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { cookie?: string; 'x-session-scope'?: string }; user?: AuthUser }>();
    const scope = String(request.headers['x-session-scope'] ?? '');
    const user = await this.auth.getUserFromCookie(request.headers.cookie, scope);
    if (!user) throw new UnauthorizedException('Authentication required');
    request.user = user;
    return true;
  }
}
