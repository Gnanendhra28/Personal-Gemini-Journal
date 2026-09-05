'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { HeaderNav, ActiveTab } from '@/components/HeaderNav';
import { LandingHero } from '@/components/LandingHero';
import { SidebarHistory } from '@/components/SidebarHistory';
import { ActiveWorkspace } from '@/components/ActiveWorkspace';
import { ActionEngineView } from '@/components/ActionEngineView';
import { GrowthJourneyView } from '@/components/GrowthJourneyView';
import { FollowUpModal } from '@/components/FollowUpModal';
import { SecurityModal } from '@/components/SecurityModal';
import {
  JournalEntry,
  JournalMessage,
  ReflectionMode,
  MoodType,
  UserAction,
  GrowthRecord,
  ReflectionInsight,
  ExtractedInsightsPayload,
  ActionOutcome,
} from '@/lib/types';
import {
  getUserEntries,
  getEntryMessages,
  createJournalEntry,
  appendTurnToEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getUserActions,
  saveUserAction,
  updateUserAction,
  saveReflectionInsight,
  getUserGrowthRecords,
  saveGrowthRecord,
} from '@/lib/firestore-db';

export default function HomePage() {
  const { user, loading: authLoading, authError, signInWithGoogle, signOut } = useAuth();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ActiveTab>('journal');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [followUpTargetAction, setFollowUpTargetAction] = useState<UserAction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Track viewport changes for responsive sidebar default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'history') {
      setIsSidebarOpen(true);
      if (activeEntry) {
        setActiveTab('journal');
      } else {
        setActiveTab('history');
      }
    } else {
      setActiveTab(tab);
    }
  };

  // Journal State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [persistenceStatus, setPersistenceStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Reflect-Act-Grow Engine State
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [extractedInsights, setExtractedInsights] = useState<ExtractedInsightsPayload | null>(null);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);

  // Load all user data when authenticated
  useEffect(() => {
    let isCancelled = false;

    async function loadUserData() {
      if (!user?.uid) {
        setEntries([]);
        setActiveEntry(null);
        setMessages([]);
        setUserActions([]);
        setGrowthRecords([]);
        setExtractedInsights(null);
        return;
      }

      try {
        setLoadingEntries(true);
        const [userEntries, actions, growth] = await Promise.all([
          getUserEntries(user.uid),
          getUserActions(user.uid),
          getUserGrowthRecords(user.uid),
        ]);

        if (!isCancelled) {
          setEntries(userEntries);
          setUserActions(actions);
          setGrowthRecords(growth);
        }
      } catch (err) {
        console.error('Failed to load user data from Firestore:', err);
      } finally {
        if (!isCancelled) {
          setLoadingEntries(false);
        }
      }
    }

    loadUserData();

    return () => {
      isCancelled = true;
    };
  }, [user?.uid]);

  // Load messages when an entry is selected
  const handleSelectEntry = async (entry: JournalEntry) => {
    setActiveEntry(entry);
    setExtractedInsights(null);
    setError(null);
    setActiveTab('journal');
    if (!user?.uid) return;

    try {
      setPersistenceStatus('idle');
      const entryMessages = await getEntryMessages(user.uid, entry.id);
      setMessages(entryMessages);
    } catch (err) {
      console.error('Failed to load messages for entry:', err);
      setError('Could not load messages for the selected entry.');
    }
  };

  // Start fresh entry
  const handleNewEntry = () => {
    setActiveEntry(null);
    setMessages([]);
    setExtractedInsights(null);
    setError(null);
    setPersistenceStatus('idle');
    setActiveTab('journal');
  };

  // Delete an entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user?.uid) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (activeEntry?.id === entryId) {
        handleNewEntry();
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Failed to delete reflection entry.');
    }
  };

  // Update entry metadata
  const handleUpdateMetadata = async (updates: {
    title?: string;
    mood?: MoodType;
    category?: string;
  }) => {
    if (!user?.uid || !activeEntry) return;
    try {
      await updateJournalEntry(user.uid, activeEntry.id, updates);
      setActiveEntry((prev) => (prev ? { ...prev, ...updates } : null));
      setEntries((prev) =>
        prev.map((e) => (e.id === activeEntry.id ? { ...e, ...updates } : e))
      );
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
  };

  // Send message / trigger reflection
  const handleSendMessage = async ({
    prompt,
    mode,
    mood,
    category,
    title,
  }: {
    prompt: string;
    mode: ReflectionMode;
    mood: MoodType;
    category: string;
    title: string;
  }) => {
    if (!user?.uid) {
      setError('Please sign in to save your reflections.');
      return;
    }

    setError(null);
    setAiLoading(true);
    setPersistenceStatus('saving');

    try {
      // 1. Call server-side Gemini API with resilient fallback ladder
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode,
          mood,
          category,
          title,
          history: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Failed to generate reflection response from Gemini');
      }

      const aiText = data.text;
      const modelUsed = data.modelUsed || 'gemini-3.6-flash';

      // 2. Persist to User-Isolated Firestore
      if (!activeEntry) {
        // Create brand new entry
        const { entry: newEntry, messages: newMessages } = await createJournalEntry(user.uid, {
          title: title === 'New Reflection' ? (prompt.slice(0, 35) + '...') : title,
          category,
          mood,
          userPrompt: prompt,
          aiResponse: aiText,
          mode,
          modelUsed,
        });

        setActiveEntry(newEntry);
        setMessages(newMessages);
        setEntries((prev) => [newEntry, ...prev]);
      } else {
        // Append turn to existing entry
        const { userMessage, aiMessage } = await appendTurnToEntry(user.uid, activeEntry.id, {
          userPrompt: prompt,
          aiResponse: aiText,
          mode,
          modelUsed,
        });

        setMessages((prev) => [...prev, userMessage, aiMessage]);
        setActiveEntry((prev) =>
          prev
            ? {
                ...prev,
                turnCount: prev.turnCount + 1,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        setEntries((prev) =>
          prev.map((e) =>
            e.id === activeEntry.id
              ? {
                  ...e,
                  turnCount: e.turnCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : e
          )
        );
      }

      setPersistenceStatus('saved');
    } catch (err: unknown) {
      console.error('Error during reflection flow:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      setPersistenceStatus('error');
      throw err;
    } finally {
      setAiLoading(false);
    }
  };

  // Module 1: Extract Insights & Action Suggestion via Gemini
  const handleExtractInsights = async () => {
    if (!user?.uid || messages.length === 0) return;

    try {
      setInsightsLoading(true);
      setError(null);

      const latestUserPrompt = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
      const latestAiResponse = messages.filter((m) => m.role === 'assistant').slice(-1)[0]?.content || '';

      const res = await fetch('/api/gemini/extract-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: latestUserPrompt,
          aiResponse: latestAiResponse,
          history: messages,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to extract insights');
      }

      const insightsPayload: ExtractedInsightsPayload = await res.json();
      setExtractedInsights(insightsPayload);
    } catch (err: unknown) {
      console.error('Insights extraction error:', err);
      setError(err instanceof Error ? err.message : 'Could not extract insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Module 2: User Confirms & Commits Action
  const handleConfirmInsightAction = async (params: {
    goal: string;
    challenge: string;
    actionText: string;
    timeframe: string;
    insights: string[];
    sentiment?: string;
  }) => {
    if (!user?.uid) return;

    try {
      // 1. Save Reflection Insight in Firestore
      const savedReflection = await saveReflectionInsight(user.uid, {
        entryId: activeEntry?.id || '',
        goal: params.goal,
        challenge: params.challenge,
        insight: params.insights.join('; '),
        decision: 'Action committed by user',
        opportunity: params.actionText,
        status: 'confirmed',
      });

      // 2. Save UserAction in Firestore
      const savedAction = await saveUserAction(user.uid, {
        reflectionId: savedReflection.id,
        entryId: activeEntry?.id || '',
        actionText: params.actionText,
        timeframe: params.timeframe,
        status: 'accepted',
      });

      setUserActions((prev) => [savedAction, ...prev]);
    } catch (err) {
      console.error('Error committing insight action:', err);
      throw err;
    }
  };

  // User manually creates action in Action Engine
  const handleAddNewAction = async (actionText: string, timeframe: string) => {
    if (!user?.uid) return;
    const action = await saveUserAction(user.uid, {
      actionText,
      timeframe,
      status: 'accepted',
      entryId: activeEntry?.id || '',
    });
    setUserActions((prev) => [action, ...prev]);
  };

  // Module 3 & 4: User Check-in Outcome & Growth Journey Recording
  const handleFollowUpComplete = async (result: {
    actionId: string;
    outcome: ActionOutcome;
    outcomeReason: string;
    learning: string;
    adaptedActionText?: string;
    growthSummary: string;
  }) => {
    if (!user?.uid) return;

    // 1. Update action status
    await updateUserAction(user.uid, result.actionId, {
      status: result.outcome === 'completed' ? 'completed' : result.outcome === 'partial' ? 'partial' : 'missed',
      outcome: result.outcome,
      outcomeReason: result.outcomeReason,
      learning: result.learning,
      completedAt: new Date().toISOString(),
    });

    setUserActions((prev) =>
      prev.map((a) =>
        a.id === result.actionId
          ? {
              ...a,
              status: result.outcome === 'completed' ? 'completed' : result.outcome === 'partial' ? 'partial' : 'missed',
              outcome: result.outcome,
              outcomeReason: result.outcomeReason,
              learning: result.learning,
            }
          : a
      )
    );

    // 2. Create Growth Record in Firestore
    const targetAction = userActions.find((a) => a.id === result.actionId);
    const growthRecord = await saveGrowthRecord(user.uid, {
      actionId: result.actionId,
      entryId: targetAction?.entryId || '',
      reflectionId: targetAction?.reflectionId || '',
      goal: targetAction?.actionText ? `Progress on: ${targetAction.actionText}` : 'Continuous Personal Growth',
      challenge: result.outcomeReason || 'Daily balancing and follow-through',
      actionText: targetAction?.actionText || 'Micro-action step',
      outcome: result.outcome,
      learning: result.learning,
      growthSummary: result.growthSummary,
    });

    setGrowthRecords((prev) => [growthRecord, ...prev]);

    // 3. If user accepted adapted action, persist that as a new pending action
    if (result.adaptedActionText) {
      const adaptedAction = await saveUserAction(user.uid, {
        actionText: result.adaptedActionText,
        timeframe: 'Next step',
        status: 'accepted',
        adaptedActionId: result.actionId,
      });
      setUserActions((prev) => [adaptedAction, ...prev]);
    }
  };

  // Quick Action: Summarize
  const handleGenerateSummary = async () => {
    if (!user?.uid || !activeEntry || messages.length === 0) return;

    setError(null);
    setAiLoading(true);
    setPersistenceStatus('saving');

    try {
      const summaryPrompt = 'Please analyze this entire reflection thread and synthesize a structured executive summary with core themes, emotional patterns, and actionable insights.';

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: summaryPrompt,
          mode: 'summary',
          mood: activeEntry.mood || 'thoughtful',
          history: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const summaryText = data.text;
      const modelUsed = data.modelUsed || 'gemini-3.6-flash';

      await updateJournalEntry(user.uid, activeEntry.id, { summary: summaryText });
      const { userMessage, aiMessage } = await appendTurnToEntry(user.uid, activeEntry.id, {
        userPrompt: summaryPrompt,
        aiResponse: summaryText,
        mode: 'summary',
        modelUsed,
        summary: summaryText,
      });

      setActiveEntry((prev) => (prev ? { ...prev, summary: summaryText, turnCount: prev.turnCount + 1 } : null));
      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === activeEntry.id
            ? { ...e, summary: summaryText, turnCount: e.turnCount + 1, updatedAt: new Date().toISOString() }
            : e
        )
      );

      setPersistenceStatus('saved');
    } catch (err: unknown) {
      console.error('Summary error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(msg);
      setPersistenceStatus('error');
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Action: Brainstorm
  const handleBrainstormIdeas = async () => {
    if (!user?.uid || !activeEntry || messages.length === 0) return;

    setError(null);
    setAiLoading(true);
    setPersistenceStatus('saving');

    try {
      const brainstormPrompt = 'Based on our conversation so far, brainstorm 5 fresh perspectives, practical mini-experiments, or constructive next steps.';

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: brainstormPrompt,
          mode: 'brainstorm',
          mood: activeEntry.mood || 'thoughtful',
          history: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Failed to brainstorm ideas');
      }

      const ideasText = data.text;
      const modelUsed = data.modelUsed || 'gemini-3.6-flash';

      const { userMessage, aiMessage } = await appendTurnToEntry(user.uid, activeEntry.id, {
        userPrompt: brainstormPrompt,
        aiResponse: ideasText,
        mode: 'brainstorm',
        modelUsed,
      });

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setActiveEntry((prev) => (prev ? { ...prev, turnCount: prev.turnCount + 1 } : null));
      setEntries((prev) =>
        prev.map((e) =>
          e.id === activeEntry.id
            ? { ...e, turnCount: e.turnCount + 1, updatedAt: new Date().toISOString() }
            : e
        )
      );

      setPersistenceStatus('saved');
    } catch (err: unknown) {
      console.error('Brainstorm error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to brainstorm ideas';
      setError(msg);
      setPersistenceStatus('error');
    } finally {
      setAiLoading(false);
    }
  };

  const activeActionsCount = userActions.filter(
    (a) => a.status === 'accepted' || a.status === 'edited' || a.status === 'suggested'
  ).length;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        user={user}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onNewEntry={() => {
          handleNewEntry();
          setActiveTab('journal');
        }}
        onSignOut={signOut}
        entriesCount={entries.length}
        activeActionsCount={activeActionsCount}
        growthCount={growthRecords.length}
        onOpenSecurityInfo={() => setIsSecurityModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main View Area */}
      {!user ? (
        <LandingHero
          onSignIn={signInWithGoogle}
          authLoading={authLoading}
          authError={authError}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile & Tablet Backdrop Overlay */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
              aria-hidden="true"
            />
          )}

          {/* Left Sidebar History (Responsive Slide-in Drawer on Mobile/Tab, Smooth Collapsible Sidebar on Laptop/Desktop) */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] transform transition-transform duration-200 ease-in-out shadow-2xl
              lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none lg:transition-[width] lg:duration-200
              ${isSidebarOpen ? 'translate-x-0 lg:w-80 flex-shrink-0' : '-translate-x-full lg:w-0 lg:overflow-hidden'}
              ${activeTab === 'history' ? 'block' : ''}
            `}
          >
            <div className="w-80 h-full">
              <SidebarHistory
                entries={entries}
                activeEntryId={activeEntry?.id || null}
                onSelectEntry={(entry) => {
                  handleSelectEntry(entry);
                  setActiveTab('journal');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                onNewEntry={() => {
                  handleNewEntry();
                  setActiveTab('journal');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                onDeleteEntry={handleDeleteEntry}
                loading={loadingEntries}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>

          {/* Central Active Content based on activeTab */}
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            {activeTab === 'journal' || (activeTab === 'history' && !activeEntry) ? (
              <ActiveWorkspace
                key={activeEntry?.id || 'new_workspace'}
                userId={user.uid}
                entry={activeEntry}
                messages={messages}
                onSendMessage={handleSendMessage}
                onGenerateSummary={handleGenerateSummary}
                onBrainstormIdeas={handleBrainstormIdeas}
                onExtractInsights={handleExtractInsights}
                extractedInsights={extractedInsights}
                onConfirmInsightAction={handleConfirmInsightAction}
                onDismissInsights={() => setExtractedInsights(null)}
                onUpdateMetadata={handleUpdateMetadata}
                loading={aiLoading}
                insightsLoading={insightsLoading}
                error={error}
                onClearError={() => setError(null)}
                persistenceStatus={persistenceStatus}
              />
            ) : activeTab === 'actions' ? (
              <div className="flex-1 overflow-y-auto scroll-smooth px-3 sm:px-6 py-4">
                <ActionEngineView
                  actions={userActions}
                  userId={user.uid}
                  onCheckIn={(action) => setFollowUpTargetAction(action)}
                  onAddNewAction={handleAddNewAction}
                  onNavigateToJournal={() => setActiveTab('journal')}
                />
              </div>
            ) : activeTab === 'growth' ? (
              <div className="flex-1 overflow-y-auto scroll-smooth px-3 sm:px-6 py-4">
                <GrowthJourneyView
                  growthRecords={growthRecords}
                  userId={user.uid}
                  onNavigateToJournal={() => setActiveTab('journal')}
                />
              </div>
            ) : (
              <ActiveWorkspace
                key={activeEntry?.id || 'selected_history_workspace'}
                userId={user.uid}
                entry={activeEntry}
                messages={messages}
                onSendMessage={handleSendMessage}
                onGenerateSummary={handleGenerateSummary}
                onBrainstormIdeas={handleBrainstormIdeas}
                onExtractInsights={handleExtractInsights}
                extractedInsights={extractedInsights}
                onConfirmInsightAction={handleConfirmInsightAction}
                onDismissInsights={() => setExtractedInsights(null)}
                onUpdateMetadata={handleUpdateMetadata}
                loading={aiLoading}
                insightsLoading={insightsLoading}
                error={error}
                onClearError={() => setError(null)}
                persistenceStatus={persistenceStatus}
              />
            )}
          </div>
        </div>
      )}

      {/* Module 3: Follow-Up / Check-In Modal */}
      {followUpTargetAction && user && (
        <FollowUpModal
          action={followUpTargetAction}
          userId={user.uid}
          onClose={() => setFollowUpTargetAction(null)}
          onFollowUpComplete={handleFollowUpComplete}
        />
      )}

      {/* Security and Threat Model Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userId={user?.uid}
      />
    </div>
  );
}
