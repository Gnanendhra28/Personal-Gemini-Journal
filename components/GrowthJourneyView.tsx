'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Compass,
  ArrowDown,
  BrainCircuit,
  Filter,
  Calendar,
  BookOpen,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { GrowthRecord } from '@/lib/types';

interface GrowthJourneyViewProps {
  growthRecords: GrowthRecord[];
  userId: string;
  onNavigateToJournal: () => void;
}

export function GrowthJourneyView({
  growthRecords,
  userId,
  onNavigateToJournal,
}: GrowthJourneyViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique months for filter
  const months = Array.from(new Set(growthRecords.map((r) => r.month || 'Recent'))).filter(Boolean);

  const filteredRecords = selectedMonth === 'all'
    ? growthRecords
    : growthRecords.filter((r) => (r.month || 'Recent') === selectedMonth);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/80 border border-emerald-500/20 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                My Growth Journey
              </h1>
              <p className="text-xs text-slate-400">
                Visualizing the transformation from raw reflection into actionable, compounding progress.
              </p>
            </div>
          </div>

          {/* Month Filter */}
          {months.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* The Continuous Progress Chain Formula */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-indigo-400">Reflection</span>
          <span className="text-slate-600">→</span>
          <span className="text-sky-400">Goal</span>
          <span className="text-slate-600">→</span>
          <span className="text-rose-400">Challenge</span>
          <span className="text-slate-600">→</span>
          <span className="text-amber-400">Action</span>
          <span className="text-slate-600">→</span>
          <span className="text-teal-400">Outcome</span>
          <span className="text-slate-600">→</span>
          <span className="text-purple-400">Learning</span>
          <span className="text-slate-600">→</span>
          <span className="text-emerald-400 font-semibold">Growth</span>
        </div>
      </div>

      {/* Growth Records Timeline */}
      {filteredRecords.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">
              Your Growth Journey Begins with One Reflection
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              As you converse in the journal, approve micro-actions, and check in on their outcomes,
              the AI will automatically map your learnings and compounding growth here.
            </p>
          </div>
          <button
            onClick={onNavigateToJournal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <span>Start a Reflection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800/80 before:hidden sm:before:block">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative sm:pl-12 space-y-3"
            >
              {/* Timeline Node Dot */}
              <div className="hidden sm:flex absolute left-3.5 top-5 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400 items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* Node Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 shadow-sm">
                {/* Card Top: Date & Goal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {record.month || 'Milestone'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(record.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.outcome === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Action Completed
                      </span>
                    )}
                    {record.outcome === 'partial' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Partially Completed
                      </span>
                    )}
                    {record.outcome === 'missed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Action Missed & Adapted
                      </span>
                    )}
                  </div>
                </div>

                {/* Step-by-Step Flow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Goal & Challenge */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-sky-400 tracking-wider">
                      🎯 Goal & Challenge
                    </span>
                    <p className="font-semibold text-slate-200">
                      {record.goal}
                    </p>
                    {record.challenge && (
                      <p className="text-[11px] text-slate-400">
                        🚧 {record.challenge}
                      </p>
                    )}
                  </div>

                  {/* Action Step */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-amber-400 tracking-wider">
                      📸 Action Step
                    </span>
                    <p className="font-medium text-slate-200">
                      {record.actionText}
                    </p>
                  </div>

                  {/* Adaptive Learning */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
                      💡 Learning & Adaptation
                    </span>
                    <p className="text-emerald-200 font-medium">
                      {record.learning}
                    </p>
                  </div>
                </div>

                {/* Growth Synthesis */}
                {record.growthSummary && (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-300">Growth Synthesis:</strong>{' '}
                      {record.growthSummary}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
