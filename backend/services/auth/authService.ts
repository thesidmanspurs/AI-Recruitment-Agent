import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { createError } from '../../middleware/errorHandler.js';
import type { RegisterRequest, LoginRequest, AuthResponse, JwtPayload } from '../../types/auth.types.js';

const SALT_ROUNDS = 12;

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw createError('An account with this email already exists.', 409);

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw createError('Invalid email or password.', 401);

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw createError('Invalid email or password.', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) throw createError('User not found.', 404);
    return user;
  },
};

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}
