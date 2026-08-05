import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { createError } from './errorHandler.js';
import { deriveAccess } from '../config/subscriptionPlans.js';

/**
 * Middleware — ensures the calling user has access to the AI Sourcing feature.
 *
 * hasSourceAccess is true when:
 *   - planType is SOURCING or PRO AND subscription is active/trialing, OR
 *   - sourcingAddonActive AND sourcingAddonStatus is active/trialing
 *     (Ranking Plan user who bought the Sourcing add-on)
 *
 * One DB lookup per request (same trade-off as authenticate). For heavy
 * traffic, add a short in-memory user-feature cache keyed by userId.
 */
export async function requireSourcingAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError('Unauthenticated.', 401));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        planType: true,
        subscriptionStatus: true,
        sourcingAddonActive: true,
        sourcingAddonStatus: true,
        rankingAddonActive: true,
        rankingAddonStatus: true,
      },
    });
    if (!user) return next(createError('User not found.', 404));

    const { hasSourceAccess } = deriveAccess(user);
    if (!hasSourceAccess) {
      return next(
        createError(
          'AI Sourcing requires an active Sourcing Plan or Pro Plan. Upgrade from the Billing tab.',
          403,
        ),
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
