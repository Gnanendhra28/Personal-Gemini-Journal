'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Database,
  ArrowRight,
  BrainCircuit,
  Compass,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkle,
} from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => Promise<unknown>;
  authLoading: boolean;
  authError: string | null;
}

export function LandingHero({ onSignIn, authLoading, authError }: LandingHeroProps) {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignInClick = async () => {
    try {
      setSigningIn(true);
      await onSignIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setSigningIn(false);
    }
  };

  const engineSteps = [
    {
      step: '1. Reflect',
      title: 'Mindful Conversation',
      description: 'Engage in private, calm multi-turn dialogue with Gemini 3.6 Flash to explore what matters.',
      icon: BrainCircuit,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      step: '2. Understand',
      title: 'Insight Extraction',
      description: 'Extract goals, challenges, and perspectives with full user control to confirm, edit, or reject.',
      icon: Sparkles,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      step: '3. Act',
      title: 'Small & Achievable',
      description: 'Turn reflection into bite-sized actions with explicit user approval. Never auto-committed.',
      icon: Compass,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      step: '4. Grow',
      title: 'Adaptive Progress',
      description: 'Gentle check-ins understand outcomes, adjust next steps, and visually map your growth over time.',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-61px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-8 z-10">
        {/* Security / Technology Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm"
        >
          <span className="text-base">🌱</span>
          <span className="font-medium text-emerald-400">Reflect. Act. Grow.</span>
          <span className="text-slate-600">•</span>
          <span>Private AI Sanctuary</span>
        </motion.div>

        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Personal Gemini Journal
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-300">
            Turn meaningful reflections into meaningful progress.
          </p>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            A private, intelligent reflection companion powered by Gemini 3.6 Flash. Beyond recording thoughts,
            our continuous growth loop helps you extract insights, approve micro-actions, learn from outcomes, and adapt over time.
          </p>
        </motion.div>

        {/* Authentication Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          <button
            id="google-signin-btn"
            onClick={handleSignInClick}
            disabled={signingIn || authLoading}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-medium text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {signingIn || authLoading ? 'Starting your sanctuary...' : 'Start Reflecting with Google'}
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Zero password storage. Strict user-isolated Firestore rules (/users/&#123;userId&#125;/*).
          </p>

          {authError && (
            <div className="w-full max-w-md p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
              <strong>Authentication Error:</strong> {authError}
            </div>
          )}
        </motion.div>

        {/* The 4-Stage Reflect → Act → Grow Engine Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 text-left"
        >
          {engineSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.bg} ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                    {s.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{s.description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Continuous Growth Philosophy Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3 text-left"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkle className="w-4 h-4 text-emerald-400" />
              The Continuous Growth Loop:
            </span>
            <span className="text-slate-500 text-[11px]">
              Suggests, never commands • User in full control
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/60 font-mono text-[11px] sm:text-xs text-slate-300 flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="text-indigo-400">Reflect</span>
            <span className="text-slate-600">→</span>
            <span className="text-sky-400">Goal & Challenge</span>
            <span className="text-slate-600">→</span>
            <span className="text-amber-400">Approved Action</span>
            <span className="text-slate-600">→</span>
            <span className="text-teal-400">Outcome Check-in</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400">Adapted Learning & Growth</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
