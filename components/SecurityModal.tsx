'use client';

import React from 'react';
import { X, ShieldCheck, Lock, Database, Key, Server, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function SecurityModal({ isOpen, onClose, userId }: SecurityModalProps) {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      risk: 'Malicious user injections, oversized prompt payloads',
      mitigation: 'Defensive schema validation, length bounds, null-safe payload extraction, input sanitization.',
    },
    {
      zone: '2. Planning & Reasoning',
      risk: 'Indirect prompt injection, instruction hijacking',
      mitigation: 'Plain data delimiters, scoped system prompts, resilient multi-model fallback chain.',
    },
    {
      zone: '3. Tool Execution',
      risk: 'Privilege escalation, SSRF, dynamic code execution',
      mitigation: 'Server-side API routes only, no client credentials, strict isolation of runtime operations.',
    },
    {
      zone: '4. Memory & State',
      risk: 'Cross-user data leakage, unauthorized reads/writes',
      mitigation: 'Owner-bound Firestore rules (/users/{userId}/*), zero-insecure defaults, strict undefined-stripping.',
    },
    {
      zone: '5. Inter-System Communication',
      risk: 'API Key exposure, token interception',
      mitigation: 'Gemini API keys stored strictly in Server Environment / Secret Manager, client never receives keys.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Security Architecture & Threat Model
              </h3>
              <p className="text-xs text-slate-400">
                OWASP & Google Cloud production compliance standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Isolation Scope */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active User Document Isolation:</span>
          </div>
          <code className="block font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            /users/{userId || '[AUTHENTICATED_UID]'}/entries/{'{entryId}'}
          </code>
          <p className="text-[11px] text-slate-400">
            Enforced by Cloud Firestore Security Rules. Other authenticated users cannot read, list, or write to this path.
          </p>
        </div>

        {/* Threat Summary Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            5-Zone Threat Summary Table
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="p-2.5">Threat Zone</th>
                  <th className="p-2.5">Identified Risk</th>
                  <th className="p-2.5">Countermeasure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {threatZones.map((row) => (
                  <tr key={row.zone} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-medium text-indigo-300 whitespace-nowrap">{row.zone}</td>
                    <td className="p-2.5 text-slate-400">{row.risk}</td>
                    <td className="p-2.5 text-emerald-300/90">{row.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firestore Security Rules Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            Deployed Firestore Security Rules
          </h4>
          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
