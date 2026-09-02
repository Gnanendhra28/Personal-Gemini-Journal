'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { UserAction, ActionOutcome, FollowUpAnalysisPayload } from '@/lib/types';

interface FollowUpModalProps {
  action: UserAction;
  userId: string;
  onClose: () => void;
  onFollowUpComplete: (result: {
    actionId: string;
    outcome: ActionOutcome;
    outcomeReason: string;
    learning: string;
    adaptedActionText?: string;
    growthSummary: string;
  }) => Promise<void>;
}

export function FollowUpModal({
  action,
  userId,
  onClose,
  onFollowUpComplete,
}: FollowUpModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<ActionOutcome>('completed');
  const [userNotes, setUserNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FollowUpAnalysisPayload | null>(null);
  const [acceptAdapted, setAcceptAdapted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const res = await fetch('/api/gemini/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionText: action.actionText,
          outcome: selectedOutcome,
          userNotes,
          goal: 'Personal Growth & Intentional Living',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process follow-up');
      }

      const result: FollowUpAnalysisPayload = await res.json();
      setAnalysisResult(result);
    } catch (err: unknown) {
      console.error('Follow-up error:', err);
      setError(err instanceof Error ? err.message : 'Error evaluating outcome');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmGrowth = async () => {
    if (!analysisResult) return;
    try {
      setSaving(true);
      await onFollowUpComplete({
        actionId: action.id,
        outcome: selectedOutcome,
        outcomeReason: analysisResult.outcomeReason || userNotes,
        learning: analysisResult.learning,
        adaptedActionText: acceptAdapted ? analysisResult.adaptedAction : undefined,
        growthSummary: analysisResult.growthSummary,
      });
      onClose();
    } catch (err: unknown) {
      console.error('Save growth error:', err);
      setError('Failed to save growth record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <h2 className="text-base font-semibold text-slate-100">
              Let&apos;s Check In
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Action Prompt */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
              Your Planned Action
            </span>
            <p className="text-sm font-semibold text-slate-100">
              {action.actionText}
            </p>
            {action.timeframe && (
              <span className="text-xs text-slate-400">
                Timeframe: {action.timeframe}
              </span>
            )}
          </div>

          {!analysisResult ? (
            /* Step 1: Outcome Selection & Notes */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  How did it go?
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('completed')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedOutcome === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Completed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('partial')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedOutcome === 'partial'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <span>Partially</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('missed')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedOutcome === 'missed'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Didn&apos;t happen</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  What felt easy or what got in the way? (Optional reflection)
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="e.g., Weekend got super busy, but managed to do 10 minutes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Learnings with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Understand Outcome & Extract Learning</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Step 2: AI Synthesized Learning & Adaptation */
            <div className="space-y-4">
              {/* Learning Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Key Learning & Adaptation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysisResult.learning}
                </p>
                {analysisResult.growthSummary && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-850">
                    &ldquo;{analysisResult.growthSummary}&rdquo;
                  </p>
                )}
              </div>

              {/* Adapted Action Proposal */}
              {analysisResult.adaptedAction && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Adapted Next Step
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptAdapted}
                        onChange={(e) => setAcceptAdapted(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Commit to this adapted action</span>
                    </label>
                  </div>
                  <p className="text-xs font-medium text-amber-200">
                    {analysisResult.adaptedAction}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGrowth}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Growth Record...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Save to Growth Journey</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
