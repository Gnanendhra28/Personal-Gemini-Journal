export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'chat';

export type MoodType = 'grounded' | 'energized' | 'thoughtful' | 'overwhelmed' | 'inspired' | 'reflective' | 'curious';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: ReflectionMode;
  createdAt: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: string;
  mood?: MoodType;
  tags: string[];
  summary?: string;
  initialPrompt: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: JournalMessage[];
  reflectionInsight?: ReflectionInsight;
  actionItem?: UserAction;
}

export type InsightStatus = 'suggested' | 'confirmed' | 'edited' | 'rejected';

export interface ReflectionInsight {
  id: string;
  userId: string;
  entryId?: string;
  goal: string;
  challenge: string;
  insight: string;
  decision?: string;
  opportunity?: string;
  status: InsightStatus;
  createdAt: string;
}

export type ActionStatus = 'suggested' | 'accepted' | 'edited' | 'skipped' | 'completed' | 'partial' | 'missed';
export type ActionOutcome = 'completed' | 'partial' | 'missed';

export interface UserAction {
  id: string;
  userId: string;
  reflectionId?: string;
  entryId?: string;
  actionText: string;
  timeframe?: string;
  status: ActionStatus;
  outcome?: ActionOutcome;
  outcomeReason?: string;
  learning?: string;
  adaptedActionId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GrowthRecord {
  id: string;
  userId: string;
  reflectionId?: string;
  entryId?: string;
  actionId?: string;
  goal: string;
  challenge: string;
  actionText: string;
  outcome: ActionOutcome | string;
  learning: string;
  growthSummary: string;
  createdAt: string;
  month?: string;
}

export interface UserInteraction {
  id: string;
  userId: string;
  userPrompt: string;
  aiResponse: string;
  mode: ReflectionMode;
  title: string;
  entryId?: string;
  createdAt: string;
  modelUsed?: string;
}

export interface AIResponsePayload {
  text: string;
  modelUsed: string;
  mode: ReflectionMode;
  error?: string;
}

export interface ExtractedInsightPayload {
  goal: string;
  challenge: string;
  insight: string;
  decision?: string;
  opportunity?: string;
  suggestedAction?: {
    actionText: string;
    timeframe: string;
  };
  modelUsed: string;
}

export interface ExtractedInsightsPayload {
  goal?: string;
  challenge?: string;
  keyInsights?: string[];
  insight?: string;
  decision?: string;
  opportunity?: string;
  sentiment?: string;
  suggestedAction?: string;
  timeframe?: string;
  modelUsed?: string;
}

export type Reflection = ReflectionInsight;

export interface FollowUpAnalysisPayload {
  outcome: ActionOutcome;
  outcomeReason: string;
  learning: string;
  adaptedAction?: string;
  growthSummary: string;
  modelUsed: string;
}
