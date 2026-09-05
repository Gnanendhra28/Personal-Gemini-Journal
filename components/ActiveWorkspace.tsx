'use client';

import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  BookMarked,
  Lightbulb,
  FileText,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Download,
  Share2,
  Tag,
  Smile,
  Hash,
  CornerDownLeft,
  ChevronDown,
  Compass,
  TrendingUp,
} from 'lucide-react';
import {
  JournalEntry,
  JournalMessage,
  ReflectionMode,
  MoodType,
  ExtractedInsightsPayload,
} from '@/lib/types';
import { ReflectionInsightCard } from '@/components/ReflectionInsightCard';

interface ActiveWorkspaceProps {
  userId: string;
  entry: JournalEntry | null;
  messages: JournalMessage[];
  onSendMessage: (params: {
    prompt: string;
    mode: ReflectionMode;
    mood: MoodType;
    category: string;
    title: string;
  }) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  onBrainstormIdeas: () => Promise<void>;
  onExtractInsights?: () => Promise<void>;
  extractedInsights?: ExtractedInsightsPayload | null;
  onConfirmInsightAction?: (params: {
    goal: string;
    challenge: string;
    actionText: string;
    timeframe: string;
    insights: string[];
    sentiment?: string;
  }) => Promise<void>;
  onDismissInsights?: () => void;
  onUpdateMetadata: (updates: {
    title?: string;
    mood?: MoodType;
    category?: string;
  }) => Promise<void>;
  loading: boolean;
  insightsLoading?: boolean;
  error: string | null;
  onClearError: () => void;
  persistenceStatus: 'saved' | 'saving' | 'error' | 'idle';
}

const MODES: Array<{
  id: ReflectionMode;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: 'reflection',
    label: 'Deep Reflection',
    icon: BookMarked,
    description: 'Empathetic validation, cognitive patterns & introspective questions',
  },
  {
    id: 'summary',
    label: 'Structured Summary',
    icon: FileText,
    description: 'Executive overview of themes, emotional patterns & key takeaways',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm Ideas',
    icon: Lightbulb,
    description: 'Creative angles, practical experiments & fresh perspectives',
  },
  {
    id: 'chat',
    label: 'Follow-up Dialogue',
    icon: MessageSquare,
    description: 'Interactive conversation continuing this journal thread',
  },
];

const MOODS: Array<{ id: MoodType; label: string; emoji: string }> = [
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🤔' },
  { id: 'grounded', label: 'Grounded', emoji: '🌱' },
  { id: 'inspired', label: 'Inspired', emoji: '✨' },
  { id: 'energized', label: 'Energized', emoji: '⚡' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌧️' },
  { id: 'reflective', label: 'Reflective', emoji: '🪞' },
  { id: 'curious', label: 'Curious', emoji: '🧭' },
];

const PROMPT_STARTERS = [
  'Today I noticed a recurring pattern in how I handle conflict...',
  'I feel torn between two paths and need to unpack the underlying values...',
  'A major win happened today, and I want to reflect on what made it succeed...',
  'I am feeling low on energy and want to examine what is draining my focus...',
];

export function ActiveWorkspace({
  userId,
  entry,
  messages,
  onSendMessage,
  onGenerateSummary,
  onBrainstormIdeas,
  onExtractInsights,
  extractedInsights,
  onConfirmInsightAction,
  onDismissInsights,
  onUpdateMetadata,
  loading,
  insightsLoading = false,
  error,
  onClearError,
  persistenceStatus,
}: ActiveWorkspaceProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflection');
  const [selectedMood, setSelectedMood] = useState<MoodType>(entry?.mood || 'thoughtful');
  const [title, setTitle] = useState(entry?.title || 'New Reflection');
  const [category, setCategory] = useState(entry?.category || 'General Reflection');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!inputPrompt.trim() || loading) return;

    const currentPrompt = inputPrompt;
    // Do not clear inputPrompt until onSendMessage successfully finishes or let component handle safe buffer
    try {
      await onSendMessage({
        prompt: currentPrompt,
        mode: selectedMode,
        mood: selectedMood,
        category,
        title,
      });
      setInputPrompt('');
    } catch (err) {
      console.error('Send error caught in workspace:', err);
      // Input buffer is preserved for retry
    }
  };

  const handleExportMarkdown = () => {
    if (!entry && messages.length === 0) return;
    let md = `# ${title}\n\n`;
    md += `*Date: ${new Date().toLocaleDateString()} | Mood: ${selectedMood} | Category: ${category}*\n\n`;
    if (entry?.summary) {
      md += `## Executive Summary\n${entry.summary}\n\n---\n\n`;
    }
    md += `## Reflection Dialogue\n\n`;
    messages.forEach((msg) => {
      const roleLabel = msg.role === 'user' ? '👤 User Reflection' : '✨ Gemini Reflection (3.8 Flash)';
      md += `### ${roleLabel}\n*${new Date(msg.createdAt).toLocaleTimeString()}*\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_reflection.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveTitleChange = async () => {
    setIsEditingTitle(false);
    if (title.trim() && entry) {
      await onUpdateMetadata({ title: title.trim() });
    }
  };

  const handleMoodChange = async (newMood: MoodType) => {
    setSelectedMood(newMood);
    if (entry) {
      await onUpdateMetadata({ mood: newMood });
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Workspace Header */}
      <div className="border-b border-slate-800 bg-slate-950/75 backdrop-blur-sm px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitleChange}
              onKeyDown={(e) => e.key === 'Enter' && saveTitleChange()}
              autoFocus
              className="px-2 py-1 rounded bg-slate-900 border border-indigo-500 text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none max-w-[200px] sm:max-w-xs"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 text-left min-w-0"
              title="Click to rename reflection"
            >
              <h2 className="text-xs sm:text-sm md:text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate max-w-[150px] sm:max-w-[240px] md:max-w-md">
                {title || 'Untitled Reflection'}
              </h2>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-400 flex-shrink-0">
                (edit)
              </span>
            </button>
          )}

          {/* Category Chip */}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex-shrink-0">
            <Tag className="w-2.5 h-2.5 text-slate-400" />
            <span className="truncate max-w-[100px]">{category}</span>
          </span>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-x-auto scrollbar-none py-0.5">
          {/* Mood Selector dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs flex-shrink-0">
            <span className="text-[11px] text-slate-400 pl-1 pr-0.5 hidden xs:flex items-center gap-1">
              <Smile className="w-3 h-3 text-slate-400" />
              Mood:
            </span>
            <select
              value={selectedMood}
              onChange={(e) => handleMoodChange(e.target.value as MoodType)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          {messages.length > 0 && (
            <button
              id="export-reflection-btn"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors flex-shrink-0"
              title="Export entry to Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Quick AI Shortcuts */}
          {messages.length > 0 && (
            <>
              {onExtractInsights && (
                <button
                  id="extract-insights-btn"
                  onClick={onExtractInsights}
                  disabled={loading || insightsLoading}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm flex-shrink-0"
                  title="Extract Goals & Suggested Micro-Action (Reflect → Act Engine)"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Extract Action</span>
                </button>
              )}

              <button
                id="quick-summary-btn"
                onClick={onGenerateSummary}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                title="Generate Structured Summary"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Summarize</span>
              </button>

              <button
                id="quick-brainstorm-btn"
                onClick={onBrainstormIdeas}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                title="Brainstorm 5 Action Ideas"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Brainstorm</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Persistence & Firestore Isolation Notice Bar */}
      <div className="px-4 lg:px-6 py-1.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Storage scope: <code className="font-mono text-slate-300">/users/{userId.substring(0, 8)}.../entries</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {persistenceStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Persisting to Firestore...
            </span>
          )}
          {persistenceStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" />
              Saved to Firestore
            </span>
          )}
          {persistenceStatus === 'error' && (
            <span className="flex items-center gap-1 text-rose-400">
              <AlertCircle className="w-3 h-3" />
              Save Pending (Retry Available)
            </span>
          )}
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="mx-4 lg:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
            <button
              onClick={onClearError}
              className="text-slate-400 hover:text-slate-200 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-3 sm:px-6 py-5 space-y-5">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-10 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <BookMarked className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-slate-200">
                What thoughts are on your mind right now?
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Write freely about your day, challenges, decisions, or aspirations. Gemini 3.8 Flash
                will respond with deep reflections, structured synthesis, or fresh ideas.
              </p>
            </div>

            {/* Prompt Starter Pills */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Inspiration Starters
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {PROMPT_STARTERS.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(starter);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 transition-all text-left group"
                  >
                    <span className="text-indigo-400 mr-1.5 font-bold">›</span>
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Optional Summary Box if present on entry */}
            {entry?.summary && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Executive Reflection Summary
                  </span>
                  <button
                    onClick={() => handleCopy(entry.summary || '', 'summary-box')}
                    className="p-1 rounded hover:bg-indigo-500/10 text-indigo-400 text-xs transition-colors"
                    title="Copy Summary"
                  >
                    {copiedId === 'summary-box' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <div className="markdown-body">
                    <Markdown>{entry.summary}</Markdown>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Turns */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Info / Model Pill */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">
                      {isUser ? 'You' : 'Gemini 3.8 Flash'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.mode && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 uppercase">
                        {msg.mode}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative group max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-br from-indigo-900/50 to-indigo-950/70 border border-indigo-500/30 text-slate-100 shadow-sm'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Content Rendering */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body space-y-3 prose prose-invert prose-xs max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Loading State */}
            {loading && (
              <div className="flex flex-col items-start space-y-1.5">
                <div className="flex items-center gap-2 px-1 text-[11px] text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini is reflecting on your thoughts...</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                  <span>Synthesizing perspectives & patterns...</span>
                </div>
              </div>
            )}

            {/* Insights Extraction Loading State */}
            {insightsLoading && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3 shadow-md">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Reflect → Act Engine: Extracting goals, challenges & optional micro-action...</span>
              </div>
            )}

            {/* Reflection Insight & Action Suggestion Card */}
            {extractedInsights && onConfirmInsightAction && onDismissInsights && (
              <ReflectionInsightCard
                insights={extractedInsights}
                entryId={entry?.id || 'temp'}
                userId={userId}
                onConfirmAction={onConfirmInsightAction}
                onDismiss={onDismissInsights}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Composer Area */}
      <div className="border-t border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Mode Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth pb-1 scrollbar-none touch-pan-x">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                  title={mode.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Textarea Composer */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all p-2 sm:p-3">
            <textarea
              id="reflection-input"
              ref={textareaRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? 'Write your journal entry or reflection here... (Cmd+Enter to submit)'
                  : 'Add a follow-up reflection, ask a question, or explore another angle...'
              }
              rows={3}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none resize-none"
            />

            {/* Bottom bar inside composer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>{inputPrompt.length} chars</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Press Cmd+Enter to send</span>
              </div>

              <button
                id="send-reflection-btn"
                onClick={handleSubmit}
                disabled={!inputPrompt.trim() || loading}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                <span>{messages.length === 0 ? 'Start Reflection' : 'Send'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
