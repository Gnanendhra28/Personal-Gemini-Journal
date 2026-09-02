'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Check,
  RotateCw,
} from 'lucide-react';
import { UserAction, ActionStatus, ActionOutcome } from '@/lib/types';

interface ActionEngineViewProps {
  actions: UserAction[];
  userId: string;
  onCheckIn: (action: UserAction) => void;
  onAddNewAction: (actionText: string, timeframe: string) => Promise<void>;
  onNavigateToJournal: () => void;
}

export function ActionEngineView({
  actions,
  userId,
  onCheckIn,
  onAddNewAction,
  onNavigateToJournal,
}: ActionEngineViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('This week');
  const [adding, setAdding] = useState(false);

  const activeActions = actions.filter((a) => a.status === 'accepted' || a.status === 'edited' || a.status === 'suggested');
  const completedActions = actions.filter((a) => a.status === 'completed' || a.status === 'partial' || a.status === 'missed');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;
    try {
      setAdding(true);
      await onAddNewAction(newActionText.trim(), newTimeframe);
      setNewActionText('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error creating action:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">Action Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Turn your reflections into small, flexible, and achievable micro-actions. No pressure, just progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        </div>
      </div>

      {/* Add Custom Action Form */}
      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3"
        >
          <div className="text-xs font-semibold text-slate-200">
            Define a New Micro-Action
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="e.g., Take 3 photos during morning walk..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <select
                value={newTimeframe}
                onChange={(e) => setNewTimeframe(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This week">This week</option>
                <option value="This weekend">This weekend</option>
                <option value="Next 2 weeks">Next 2 weeks</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !newActionText.trim()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {adding ? 'Saving...' : 'Commit Action'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Active Commitments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Commitments ({activeActions.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            Small • Flexible • Achievable
          </span>
        </div>

        {activeActions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400">
              <Compass className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300">
              No active commitments right now.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start a mindful reflection in your Journal to extract insights and turn them into user-approved actions.
            </p>
            <button
              onClick={onNavigateToJournal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <span>Reflect in Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeActions.map((act) => (
              <motion.div
                key={act.id}
                layout
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {act.timeframe || 'Active'}
                    </span>
                    <span className="text-slate-500">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 leading-snug">
                    {act.actionText}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Ready to follow up?
                  </span>
                  <button
                    onClick={() => onCheckIn(act)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completed & Adapted History */}
      {completedActions.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Past Outcomes & Learnings ({completedActions.length})
          </h2>

          <div className="space-y-2.5">
            {completedActions.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {act.outcome === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    {act.outcome === 'partial' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Partially
                      </span>
                    )}
                    {act.outcome === 'missed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium">
                        <XCircle className="w-3 h-3" />
                        Didn&apos;t happen
                      </span>
                    )}
                    <span className="text-slate-300 font-medium">{act.actionText}</span>
                  </div>

                  {act.learning && (
                    <p className="text-[11px] text-slate-400 italic">
                      Learning: {act.learning}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 sm:text-right shrink-0">
                  {new Date(act.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
