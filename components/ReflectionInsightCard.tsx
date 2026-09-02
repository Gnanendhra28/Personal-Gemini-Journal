'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  XCircle,
  Compass,
  ArrowRight,
  Loader2,
  Check,
  AlertTriangle,
  Smile,
  Target,
} from 'lucide-react';
import { ExtractedInsightsPayload, UserAction, Reflection } from '@/lib/types';

interface ReflectionInsightCardProps {
  insights: ExtractedInsightsPayload;
  entryId: string;
  userId: string;
  onConfirmAction: (params: {
    goal: string;
    challenge: string;
    actionText: string;
    timeframe: string;
    insights: string[];
    sentiment?: string;
  }) => Promise<void>;
  onDismiss: () => void;
}

export function ReflectionInsightCard({
  insights,
  entryId,
  userId,
  onConfirmAction,
  onDismiss,
}: ReflectionInsightCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [goal, setGoal] = useState(insights.goal || '');
  const [challenge, setChallenge] = useState(insights.challenge || '');
  const [actionText, setActionText] = useState(insights.suggestedAction || '');
  const [timeframe, setTimeframe] = useState(insights.timeframe || 'This week');
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!actionText.trim() && !goal.trim()) return;
    try {
      setSaving(true);
      setError(null);
      await onConfirmAction({
        goal: goal.trim(),
        challenge: challenge.trim(),
        actionText: actionText.trim(),
        timeframe: timeframe.trim(),
        insights: insights.keyInsights || [],
        sentiment: insights.sentiment,
      });
      setConfirmed(true);
    } catch (err: unknown) {
      console.error('Error confirming insight action:', err);
      setError('Failed to commit action to database. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-300">
              Insight & Micro-Action Committed!
            </span>{' '}
            Your action is active in the Action Engine. You can check in on it anytime.
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold underline shrink-0"
        >
          Dismiss
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-4"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Reflect → Act Synthesis</span>
              {insights.sentiment && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-normal">
                  Tone: {insights.sentiment}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Gemini extracted core goals & an optional, low-pressure micro-action from your reflection.
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 text-xs"
          title="Dismiss card"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Extracted Key Insights Bullets */}
      {insights.keyInsights && insights.keyInsights.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Key Insights
          </span>
          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
            {insights.keyInsights.map((insight, idx) => (
              <li key={idx} className="leading-relaxed">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Goal & Challenge Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-sky-400 tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3" />
            Extracted Goal
          </span>
          {isEditing ? (
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          ) : (
            <p className="text-xs font-medium text-slate-200">{goal || 'Self-Discovery & Well-being'}</p>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-rose-400 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Underlying Challenge
          </span>
          {isEditing ? (
            <input
              type="text"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          ) : (
            <p className="text-xs font-medium text-slate-300">{challenge || 'Maintaining consistency & balance'}</p>
          )}
        </div>
      </div>

      {/* Suggested Action Box */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Suggested Micro-Action (Optional)
          </span>
          <span className="text-[10px] text-amber-300 font-mono">
            {timeframe}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Timeframe:</span>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs font-medium text-amber-200 leading-snug">
            {actionText || 'Take 5 minutes to celebrate this insight'}
          </p>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Action Buttons: [Confirm / Commit], [Edit], [Skip / Dismiss] */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Done Editing' : 'Edit Action / Goal'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !actionText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Accept & Commit Action</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
