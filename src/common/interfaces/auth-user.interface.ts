// FILE: src/common/interfaces/auth-user.interface.ts
export interface BaseUser {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export type AuthUser = BaseUser;
export type UserData = BaseUser & { createdAt: Date; updatedAt: Date };
