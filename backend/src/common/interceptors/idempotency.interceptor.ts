import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Redis } from 'ioredis';

const IDEMPOTENCY_TTL = 86400; // 24 hours

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; method: string }>();
    const idempotencyKey = req.headers['idempotency-key'];

    // Only apply to mutating methods
    if (!idempotencyKey || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next.handle();
    }

    const redisKey = `idempotency:${idempotencyKey}`;
    const cached = await this.redis.get(redisKey);

    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      return of(parsed);
    }

    return next.handle().pipe(
      tap(async (responseBody: unknown) => {
        await this.redis.set(
          redisKey,
          JSON.stringify(responseBody),
          'EX',
          IDEMPOTENCY_TTL,
        );
      }),
    );
  }
}
