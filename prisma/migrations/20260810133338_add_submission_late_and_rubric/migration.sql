-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "late" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rubric_scores" JSONB;
