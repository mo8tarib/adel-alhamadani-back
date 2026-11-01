import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './content.service';
import type { Request } from 'express';

interface AdminRequest extends Request {
  admin?: { id: string; username: string; role: string };
}
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const authorization = req.headers.authorization;
    const token =
      typeof authorization === 'string'
        ? authorization.replace(/^Bearer\s+/i, '')
        : '';
    if (!token) throw new UnauthorizedException();
    req.admin = await this.auth.verify(token);
    return true;
  }
}
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const authorization = req.headers.authorization;
    const token =
      typeof authorization === 'string'
        ? authorization.replace(/^Bearer\s+/i, '')
        : '';
    if (!token) throw new UnauthorizedException();
    req.admin = await this.auth.verify(token);
    if (req.admin?.role !== 'owner') throw new ForbiddenException();
    return true;
  }
}
