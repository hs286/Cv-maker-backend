import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// defined jwt payload
export type jwtPayload = {
  sub: string;
  email: string;
};
@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      ignoreExpiration: false,
      secretOrKey: process.env.AT_SECRET,
    });
  }
  validate(payload: jwtPayload) {
    return payload;
  }
}
