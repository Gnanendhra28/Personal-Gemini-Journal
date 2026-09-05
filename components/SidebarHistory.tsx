'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  Trash2,
  Tag,
  ChevronRight,
  ChevronLeft,
  Filter,
  Plus,
  Smile,
  Zap,
  Eye,
  AlertCircle,
  Lightbulb,
  X,
  XCircle,
} from 'lucide-react';
import { JournalEntry, MoodType } from '@/lib/types';

interface SidebarHistoryProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  loading: boolean;
  onClose?: () => void;
}

const MOOD_ICONS: Record<MoodType, { label: string; color: string }> = {
  grounded: { label: 'Grounded', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  energized: { label: 'Energized', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  thoughtful: { label: 'Thoughtful', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  overwhelmed: { label: 'Overwhelmed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  inspired: { label: 'Inspired', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  reflective: { label: 'Reflective', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  curious: { label: 'Curious', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
};

export function SidebarHistory({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  loading,
  onClose,
}: SidebarHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const moodScrollRef = useRef<HTMLDivElement>(null);

  const scrollMoods = (direction: 'left' | 'right') => {
    if (moodScrollRef.current) {
      moodScrollRef.current.scrollBy({
        left: direction === 'left' ? -120 : 120,
        behavior: 'smooth',
      });
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.initialPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this reflection and all its messages?')) {
      try {
        setDeletingId(entryId);
        await onDeleteEntry(entryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-slate-950 border-r border-slate-800/80 select-none">
      {/* Sidebar Header & Search */}
      <div className="p-3 sm:p-4 border-b border-slate-800 space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
              Reflections
            </h2>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono flex-shrink-0">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              id="sidebar-new-entry-btn"
              onClick={onNewEntry}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium transition-all flex items-center gap-1 shadow-sm"
              title="Start New Reflection"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search reflections, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mood Filter Pill Scroll Track with Smooth Controls */}
        <div className="relative group/moods">
          <div
            ref={moodScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none touch-pan-x"
          >
            <button
              onClick={() => setSelectedMood('all')}
              className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all whitespace-nowrap flex-shrink-0 ${
                selectedMood === 'all'
                  ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40 font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {Object.entries(MOOD_ICONS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setSelectedMood(key)}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedMood === key
                    ? `${val.color} font-semibold shadow-sm`
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Smooth Scroll Arrow Buttons (laptop/desktop hover assist) */}
          <button
            onClick={() => scrollMoods('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900/95 border border-slate-700 text-slate-300 items-center justify-center opacity-0 group-hover/moods:opacity-100 transition-opacity hover:bg-slate-800 shadow-md z-10"
            title="Scroll moods left"
            aria-label="Scroll moods left"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollMoods('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900/95 border border-slate-700 text-slate-300 items-center justify-center opacity-0 group-hover/moods:opacity-100 transition-opacity hover:bg-slate-800 shadow-md z-10"
            title="Scroll moods right"
            aria-label="Scroll moods right"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-2.5 sm:p-3 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p>Loading your saved reflections...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <Lightbulb className="w-5 h-5" />
            </div>
            {searchQuery || selectedMood !== 'all' ? (
              <p>No reflections match your filters. Try resetting search or mood.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-400 font-medium">No journal entries yet</p>
                <p>Start writing your thoughts to begin your first AI reflection.</p>
                <button
                  onClick={onNewEntry}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start First Reflection</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntryId;
            const moodMeta = entry.mood ? MOOD_ICONS[entry.mood] : undefined;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 border-indigo-500/50 shadow-sm shadow-indigo-500/5'
                    : 'bg-slate-900/40 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Date, Turns & Mood Badge */}
                <div className="flex items-center justify-between gap-1 mb-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{formatDate(entry.createdAt)}</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {moodMeta && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full border text-[10px] ${moodMeta.color}`}
                      >
                        {moodMeta.label}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {entry.turnCount || 1}
                    </span>
                  </div>
                </div>

                {/* Entry Title */}
                <h3 className="text-xs font-medium text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                  {entry.title || 'Untitled Reflection'}
                </h3>

                {/* Preview Snippet */}
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {entry.summary ? `Summary: ${entry.summary}` : entry.initialPrompt}
                </p>

                {/* Tags and Delete Trigger */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-500 truncate max-w-[170px]">
                    <Tag className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{entry.category || 'Reflection'}</span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    disabled={deletingId === entry.id}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
