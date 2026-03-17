import { SetMetadata } from '@nestjs/common';

export type UserRole =
  | 'buyer'
  | 'seller_owner'
  | 'seller_staff'
  | 'support_agent'
  | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
