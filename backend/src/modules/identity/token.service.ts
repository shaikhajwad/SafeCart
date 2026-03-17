import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Session } from './entities/session.entity';
import { User } from './entities/user.entity';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
  ) {}

  async createTokenPair(
    user: User,
    sessionMeta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const rawRefresh = randomBytes(32).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefresh, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = this.sessionRepo.create({
      userId: user.id,
      user,
      refreshTokenHash: refreshHash,
      expiresAt,
      isActive: true,
      ipAddress: sessionMeta.ipAddress,
      userAgent: sessionMeta.userAgent,
    });
    await this.sessionRepo.save(session);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      phone: user.phoneE164,
      role: user.role,
      sessionId: session.id,
    });

    return { accessToken, refreshToken: rawRefresh, sessionId: session.id };
  }

  async rotateRefreshToken(
    sessionId: string,
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, isActive: true },
      relations: ['user'],
    });

    if (!session) return null;
    if (new Date() > session.expiresAt) return null;

    const valid = await bcrypt.compare(rawRefreshToken, session.refreshTokenHash);
    if (!valid) return null;

    const rawRefresh = randomBytes(32).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefresh, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    session.refreshTokenHash = refreshHash;
    session.expiresAt = expiresAt;
    await this.sessionRepo.save(session);

    const accessToken = this.jwtService.sign({
      sub: session.user.id,
      phone: session.user.phoneE164,
      role: session.user.role,
      sessionId: session.id,
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update(sessionId, { isActive: false });
  }
}
