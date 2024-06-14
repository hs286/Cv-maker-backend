import {
  Injectable,
  CanActivate,
  ExecutionContext,
  mixin,
  Type,
} from '@nestjs/common';
import { Role } from '../enums';
import { Reflector } from '@nestjs/core';


export const RoleGuard = (...roles: Role[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
    canActivate(context: ExecutionContext): boolean {
      // const roles = this.reflector.get<Role[]>('roles', context.getHandler());
      if (!roles) {
        return true;
      }
      const userRole = context.switchToHttp().getRequest()?.user.role;
      return roles.includes(userRole);
    }
  }

  const guard = mixin(RoleGuardMixin);
  return guard;
};
