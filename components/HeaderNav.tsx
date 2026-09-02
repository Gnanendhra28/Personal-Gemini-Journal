'use client';

import React from 'react';
import { User } from 'firebase/auth';
import {
  Sparkles,
  Shield,
  LogOut,
  PlusCircle,
  BookOpen,
  User as UserIcon,
  Compass,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react';

export type ActiveTab = 'journal' | 'actions' | 'growth' | 'history';

interface HeaderNavProps {
  user: User | null;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  entriesCount: number;
  activeActionsCount: number;
  growthCount: number;
  onOpenSecurityInfo?: () => void;
}

export function HeaderNav({
  user,
  activeTab,
  onSelectTab,
  onNewEntry,
  onSignOut,
  entriesCount,
  activeActionsCount,
  growthCount,
  onOpenSecurityInfo,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <span className="text-base sm:text-lg">🌱</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                Personal Gemini Journal
              </h1>
              <span className="hidden md:inline-flex text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Reflect • Act • Grow
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Private AI companion powered by Gemini 3.6 Flash & Cloud Firestore
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs (for logged-in users) */}
        {user && (
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-journal"
              onClick={() => onSelectTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'journal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Journal</span>
            </button>

            <button
              id="nav-tab-actions"
              onClick={() => onSelectTab('actions')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'actions'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Actions</span>
              {activeActionsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {activeActionsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-growth"
              onClick={() => onSelectTab('growth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'growth'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Growth</span>
              <span className="xs:hidden">Journey</span>
              {growthCount > 0 && (
                <span className="ml-0.5 text-[10px] text-emerald-300 font-semibold">
                  ({growthCount})
                </span>
              )}
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
          </nav>
        )}

        {/* Right: Actions & User Menu */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Reflection Button */}
            <button
              id="new-entry-header-btn"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Reflection</span>
            </button>

            {/* Security Rules Modal Trigger */}
            {onOpenSecurityInfo && (
              <button
                id="security-info-btn"
                onClick={onOpenSecurityInfo}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors"
                title="View Security & Threat Model Information"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Security</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xs font-medium">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                  {user.displayName || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                  {user.email || 'Authenticated'}
                </p>
              </div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sanctuary Protected
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
