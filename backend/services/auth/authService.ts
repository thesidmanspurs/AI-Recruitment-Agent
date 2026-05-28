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
    // Bootstrap admins from the ADMIN_EMAILS env allowlist — saves an
    // out-of-band DB UPDATE to seed the first admin. Comparison lowercased.
    const role = env.ADMIN_EMAILS.includes(data.email.trim().toLowerCase())
      ? 'ADMIN'
      : 'USER';
    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash, role },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw createError('Invalid email or password.', 401);

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw createError('Invalid email or password.', 401);

    // Self-heal: if email is in the ADMIN_EMAILS allowlist but the row isn't
    // ADMIN yet (e.g. user existed before the allowlist was set), promote on
    // login. Idempotent — does nothing if already ADMIN.
    const shouldBeAdmin =
      env.ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN';

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(shouldBeAdmin ? { role: 'ADMIN' as const } : {}),
      },
    });

    const token = signToken({ userId: updated.id, email: updated.email, role: updated.role });
    return {
      token,
      user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        outreachSignature: true,
        createdAt: true, lastLoginAt: true,
      },
    });
    if (!user) throw createError('User not found.', 404);
    return user;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; outreachSignature?: string | null }
  ) {
    const update: Record<string, unknown> = {};
    if (data.name) update.name = data.name;
    if (data.outreachSignature !== undefined) update.outreachSignature = data.outreachSignature;
    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true, email: true, name: true, role: true,
        outreachSignature: true,
        createdAt: true, lastLoginAt: true,
      },
    });
    return user;
  },
};

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}
