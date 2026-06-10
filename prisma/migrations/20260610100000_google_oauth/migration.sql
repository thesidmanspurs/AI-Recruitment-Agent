-- Google OAuth support.

-- Password becomes optional (OAuth-only accounts have no local password).
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Google account linkage.
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- One Google account maps to exactly one user.
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
