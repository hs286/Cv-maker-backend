import { User } from '../entites/user.entity';

export type SignupResponse = Pick<
  User,
  'email' | 'firstName' | 'lastName' | 'location' | 'phone'
> & { token: string };

export type LoginResponse = SignupResponse;
