// FILE: apps/auth-service/src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserData } from 'src/common/interfaces/auth-user.interface';

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
  ): Promise<UserData> {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    return (await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roles,
      },
    })) as UserData;
  }

  findUserByUsername(username: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: { username },
    }) as Promise<UserData | null>;
  }

  findUserById(id: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserData | null>;
  }
}
