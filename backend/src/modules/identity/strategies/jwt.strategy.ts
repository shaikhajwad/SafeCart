import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? 'change_me_in_production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
    return {
      id: user.id,
      phoneE164: user.phoneE164,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
    };
  }
}
