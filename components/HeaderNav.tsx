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
  PanelLeft,
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
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
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
  onToggleSidebar,
  isSidebarOpen = true,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 py-2 transition-colors">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left: Sidebar Toggle & Branding */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-shrink-0">
          {user && onToggleSidebar && (
            <button
              id="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className={`p-1.5 sm:p-2 rounded-lg transition-all border ${
                isSidebarOpen
                  ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/25'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isSidebarOpen ? 'Close sidebar' : 'Open history sidebar'}
              aria-label="Toggle history sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 shadow-sm flex-shrink-0">
              <span className="text-sm sm:text-base">🌱</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm md:text-base font-semibold text-slate-100 tracking-tight truncate">
                  <span className="hidden sm:inline">Personal Gemini Journal</span>
                  <span className="sm:hidden">Gemini Journal</span>
                </h1>
                <span className="hidden lg:inline-flex text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                  Reflect • Act • Grow
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden 2xl:block truncate">
                Private AI companion powered by Gemini 3.8 Flash & Cloud Firestore
              </p>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs (for logged-in users) */}
        {user && (
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none max-w-full">
            <button
              id="nav-tab-journal"
              onClick={() => onSelectTab('journal')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'journal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Journal</span>
            </button>

            <button
              id="nav-tab-actions"
              onClick={() => onSelectTab('actions')}
              className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'actions'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 flex-shrink-0" />
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
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'growth'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Growth</span>
              {growthCount > 0 && (
                <span className="ml-0.5 text-[10px] text-emerald-300 font-semibold">
                  ({growthCount})
                </span>
              )}
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">History</span>
            </button>
          </nav>
        )}

        {/* Right: Actions & User Profile */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* New Reflection Button */}
            <button
              id="new-entry-header-btn"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-[0.98]"
              title="Start New Reflection"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Reflection</span>
            </button>

            {/* Security Rules Modal Trigger */}
            {onOpenSecurityInfo && (
              <button
                id="security-info-btn"
                onClick={onOpenSecurityInfo}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors"
                title="View Security & Threat Model Information"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xs font-medium flex-shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">
                  {user.displayName ? user.displayName.split(' ')[0] : 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
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
