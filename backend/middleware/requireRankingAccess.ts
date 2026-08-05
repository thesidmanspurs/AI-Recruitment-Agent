import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { createError } from './errorHandler.js';
import { deriveAccess } from '../config/subscriptionPlans.js';

/**
 * Middleware — ensures the calling user has access to the CV Ranking feature.
 *
 * hasRankingAccess is true when:
 *   - planType is RANKING or PRO AND subscription is active/trialing, OR
 *   - rankingAddonActive AND rankingAddonStatus is active/trialing
 *     (Sourcing Plan user who bought the Ranking add-on)
 */
export async function requireRankingAccess(
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

    const { hasRankingAccess } = deriveAccess(user);
    if (!hasRankingAccess) {
      // Free trial allowance: allow non-subscribed users up to 5 free ranking sessions
      const sessionCount = await prisma.rankingSession.count({ where: { userId } });
      if (sessionCount < 5) {
        return next();
      }
      return next(
        createError(
          'You have used your 5 free trial Ranking sessions. Upgrade to Ranking Plan or Pro Plan from the Billing tab for unlimited rankings.',
          403,
        ),
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
