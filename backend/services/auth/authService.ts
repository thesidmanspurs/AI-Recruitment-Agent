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
    const role = env.ADMIN_EMAILS.includes(data.email.trim().toLowerCase())
      ? 'ADMIN'
      : 'USER';

    const planType =
      data.intent === 'ranking' ? 'RANKING' :
      data.intent === 'sourcing' ? 'SOURCING' :
      null;

    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash, role, planType },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, planType: user.planType } };
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw createError('Invalid email or password.', 401);

    // OAuth-only accounts have no local password — guide them to Google.
    if (!user.passwordHash) {
      throw createError('This account uses Google sign-in. Click "Continue with Google".', 401);
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw createError('Invalid email or password.', 401);

    // If account has empty plan and user passed an intent -> assign chosen intent
    let currentPlan = user.planType === 'NONE' ? null : user.planType;
    if (!currentPlan && data.intent) {
      if (data.intent === 'ranking') currentPlan = 'RANKING';
      else if (data.intent === 'sourcing') currentPlan = 'SOURCING';
    }

    const derivedPlan =
      user.email.includes('ranking') ? 'RANKING' :
      user.email.includes('pro') || env.ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'PRO' :
      currentPlan ?? null;

    const shouldBeAdmin =
      env.ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN';

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        planType: derivedPlan,
        ...(shouldBeAdmin ? { role: 'ADMIN' as const } : {}),
      },
    });

    const token = signToken({ userId: updated.id, email: updated.email, role: updated.role });
    return {
      token,
      user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, planType: updated.planType },
    };
  },

  /**
   * Sign in (or up) with a verified Google profile. Resolution order:
   *   1. Match by googleId    → returning Google user.
   *   2. Match by email       → existing (likely password) account: LINK the
   *                             googleId onto it so future logins are instant.
   *   3. Otherwise            → create a brand-new account (no passwordHash).
   */
  async googleSignIn(profile: {
    googleId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    intent?: 'sourcing' | 'ranking' | 'both';
  }): Promise<AuthResponse> {
    const email = profile.email.trim().toLowerCase();
    const shouldBeAdmin = env.ADMIN_EMAILS.includes(email);

    let user =
      (await prisma.user.findUnique({ where: { googleId: profile.googleId } })) ??
      (await prisma.user.findUnique({ where: { email } }));

    if (user) {
      // If existing user has no plan, populate intent if provided
      let planToSet = user.planType === 'NONE' ? null : user.planType;
      if (!planToSet && profile.intent) {
        if (profile.intent === 'ranking') planToSet = 'RANKING';
        else if (profile.intent === 'sourcing') planToSet = 'SOURCING';
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          lastLoginAt: new Date(),
          // Backfill avatar/name only when we don't already have them.
          avatarUrl: user.avatarUrl ?? profile.avatarUrl ?? null,
          name: user.name || profile.name || email,
          planType: planToSet,
          ...(shouldBeAdmin && user.role !== 'ADMIN' ? { role: 'ADMIN' as const } : {}),
        },
      });
    } else {
      const planType =
        profile.intent === 'ranking' ? 'RANKING' :
        profile.intent === 'sourcing' ? 'SOURCING' :
        null;

      user = await prisma.user.create({
        data: {
          email,
          name: profile.name?.trim() || email.split('@')[0],
          passwordHash: null, // OAuth-only account
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl ?? null,
          role: shouldBeAdmin ? 'ADMIN' : 'USER',
          planType,
          lastLoginAt: new Date(),
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, planType: user.planType } };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, planType: true,
        outreachSignature: true,
        createdAt: true, lastLoginAt: true,
      },
    });
    if (!user) throw createError('User not found.', 404);
    const planType =
      (user.planType && user.planType !== 'NONE')
        ? user.planType
        : (user.email.includes('ranking') ? 'RANKING' : user.email.includes('pro') || user.role === 'ADMIN' ? 'PRO' : null);
    return { ...user, planType };
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
