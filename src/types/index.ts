export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | string;

export interface UserProfile {
  id: string;
  userId: string;
  goal?: string;
  weeklyHours?: number;
  learningStyle?: LearningStyle;
  notes?: string;
  updatedAt: Date;
}

export interface SkillEvidenceItem {
  id: string;
  skillName: string;
  source: 'self_report' | 'diagnostic' | 'project' | 'course_completion';
  score: number;
  reliability: number;
  recencyWeight: number;
  timestamp: Date;
}

export interface SkillAssessment {
  skillName: string;
  observedLevel: number; // 0-5
  confidence: number; // 0.0-1.0
  evidence: SkillEvidenceItem[];
}

export interface SkillModel {
  skillName: string;
  selfRatedLevel: number;
  observedLevel: number | null;
  confidenceScore: number;
  finalEstimate: number;
  targetLevel: number;
  velocity: number;
  lastAssessed: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: 'course' | 'project' | 'assessment' | 'article';
  provider?: string;
  description?: string;
  url?: string;
  skillsTaught: string[];
  prerequisiteSkills: string[];
  difficulty: number;
  durationHours?: number;
  format?: string;
  // embedding is deliberately omitted here, as it's typically handled server-side for search only
}

export interface LearningPathItem {
  id: string;
  resourceId: string;
  resource?: Resource;
  phase: number;
  position: number;
  status: 'pending' | 'started' | 'completed' | 'skipped';
  reason?: string;
  score?: number;
  scoreBreakdown?: Record<string, number>;
}

export interface LearningPath {
  id: string;
  userId: string;
  version: number;
  triggerReason: 'initial' | 'too_easy' | 'too_hard' | 'goal_change' | 'diagnostic_result';
  estimatedWeeksToGoal?: number;
  generatedAt: Date;
  items: LearningPathItem[];
}

export interface DiagnosticQuestion {
  id: string;
  text: string;
  options?: string[]; // Optional: for multiple choice
  correctAnswer?: string;
  explanation?: string;
  difficulty: number;
}

export interface Diagnostic {
  id: string;
  skillName: string;
  questions: DiagnosticQuestion[];
  difficulty: number;
}

export interface ProgressUpdate {
  userId: string;
  resourceId: string;
  eventType: 'started' | 'completed' | 'too_easy' | 'too_hard' | 'skipped' | 'diagnostic_taken';
  score?: number;
  timestamp: Date;
}

export interface GoalChangeRequest {
  userId: string;
  newGoal: string;
  newGoalTemplateId?: string;
}
