import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookieJwt = req?.cookies?.['jwt'] || null;
          console.log('🔎 extractor cookie present?', Boolean(cookieJwt));
          return cookieJwt || null;
        },
        (req: Request) => {
          const authHeader = req?.headers?.authorization;
          console.log('🔎 extractor auth header present?', Boolean(authHeader));
          // use the built-in extractor to actually return the token string (if any)
          return authHeader ? ExtractJwt.fromAuthHeaderAsBearerToken()(req) : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    console.log('🎯 JWT validate executado com payload:', payload ? { sub: payload.sub, email: payload.email } : payload);
    if (!payload || !payload.sub || !payload.email) {
      console.warn('🚫 Payload inválido/ausente — lançando UnauthorizedException');
      throw new UnauthorizedException('Token inválido ou ausente');
    }
    return { id: payload.sub, email: payload.email, nome: payload.nome };
  }
}
