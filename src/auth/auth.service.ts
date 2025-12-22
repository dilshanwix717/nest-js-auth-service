// FILE: apps/auth-service/src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    username: string,
    email: string,
    password: string,
    roles: string[] = ['user'],
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roles,
      },
    });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
