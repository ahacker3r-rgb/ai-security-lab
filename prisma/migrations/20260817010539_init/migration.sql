-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "ip" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "OtpCode_email_idx" ON "OtpCode"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE INDEX "LabAttempt_userId_idx" ON "LabAttempt"("userId");

-- CreateIndex
CREATE INDEX "LabAttempt_labId_idx" ON "LabAttempt"("labId");

-- CreateIndex
CREATE UNIQUE INDEX "LabAttempt_userId_labId_key" ON "LabAttempt"("userId", "labId");

-- CreateIndex
CREATE INDEX "LabCompletion_userId_idx" ON "LabCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabCompletion_userId_labId_key" ON "LabCompletion"("userId", "labId");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabAttempt" ADD CONSTRAINT "LabAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabAttempt" ADD CONSTRAINT "LabAttempt_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCompletion" ADD CONSTRAINT "LabCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCompletion" ADD CONSTRAINT "LabCompletion_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;
