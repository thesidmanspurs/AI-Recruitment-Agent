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
      // Free trial allowance: allow non-subscribed users exactly 1 free ranking session
      if (req.method === 'POST' && (req.path === '/' || req.path === '')) {
        const sessionCount = await prisma.rankingSession.count({ where: { userId } });
        if (sessionCount >= 1) {
          return next(
            createError(
              'You have used your 1 free trial Ranking session. Upgrade to Ranking Plan or Pro Plan from the Billing tab for unlimited rankings.',
              403,
            ),
          );
        }
      }
      return next();
    }
    next();
  } catch (err) {
    next(err);
  }
}
