-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "weeklyHours" INTEGER,
    "learningStyle" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "selfRatedLevel" INTEGER NOT NULL,
    "observedLevel" INTEGER,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "finalEstimate" DOUBLE PRECISION NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastAssessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reliability" DOUBLE PRECISION NOT NULL,
    "recencyWeight" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDependency" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "dependsOnSkillName" TEXT NOT NULL,

    CONSTRAINT "SkillDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTemplate" (
    "id" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "requiredSkills" JSONB NOT NULL,

    CONSTRAINT "GoalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "url" TEXT,
    "skillsTaught" JSONB NOT NULL,
    "prerequisiteSkills" JSONB NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "durationHours" DOUBLE PRECISION,
    "format" TEXT,
    "embedding" vector(768),

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnostic" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "difficulty" INTEGER NOT NULL,

    CONSTRAINT "Diagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "estimatedWeeksToGoal" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathItem" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "score" DOUBLE PRECISION,
    "scoreBreakdown" JSONB,

    CONSTRAINT "LearningPathItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerSkill_userId_skillName_key" ON "LearnerSkill"("userId", "skillName");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDependency_skillName_dependsOnSkillName_key" ON "SkillDependency"("skillName", "dependsOnSkillName");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTemplate_goalName_key" ON "GoalTemplate"("goalName");

-- CreateIndex
CREATE UNIQUE INDEX "Diagnostic_skillName_key" ON "Diagnostic"("skillName");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_userId_version_key" ON "LearningPath"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathItem_pathId_resourceId_key" ON "LearningPathItem"("pathId", "resourceId");

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerSkill" ADD CONSTRAINT "LearnerSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathItem" ADD CONSTRAINT "LearningPathItem_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathItem" ADD CONSTRAINT "LearningPathItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEvent" ADD CONSTRAINT "ProgressEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEvent" ADD CONSTRAINT "ProgressEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
