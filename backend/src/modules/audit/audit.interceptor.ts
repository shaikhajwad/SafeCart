import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const { method, url } = req;

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation) return next.handle();

    return next.handle().pipe(
      tap(() => {
        this.auditService
          .log({
            actorUserId: req.user?.id,
            action: `${method} ${url}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          })
          .catch(() => {
            // Audit failure must never break the request
          });
      }),
    );
  }
}
