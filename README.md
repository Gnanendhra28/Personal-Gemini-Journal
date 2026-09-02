# 🌱 Personal Gemini Journal: Reflect. Act. Grow.

A private, intelligent AI reflection and growth companion powered by **Gemini 3.6 Flash**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore** user-isolated storage.

---

## 💡 The Reflect → Act → Grow Engine

Traditional journaling apps act merely as passive storage lockers. **Personal Gemini Journal** transforms raw thoughts into continuous personal evolution:

```
Reflect (Raw thoughts & dialogue)
   ↓
Understand (Extract meaningful goals & underlying challenges)
   ↓
Suggest Optional Action (Small, flexible micro-action)
   ↓
User Approves or Modifies Action (Accept, Edit, or Skip)
   ↓
Follow Up Later (Check in on outcome: Completed, Partial, Missed)
   ↓
Understand Outcome & Learn (Extract root cause & adaptive next step)
   ↓
Compounding Growth Over Time (Visual timeline across months)
```

### Key Modules:
1. **Module 1: Reflection & Understanding** — Multi-turn conversational sanctuary with structured analysis extracting Goals, Challenges, Tone, and Core Insights.
2. **Module 2: Action Engine** — User-approved micro-actions with clear timeframes, preventing pressure while enabling progress.
3. **Module 3: Adaptive Follow-up** — Intelligent check-ins that evaluate what got in the way without judgment and adapt future steps.
4. **Module 4: Growth Journey** — Interactive visual milestone graph charting `Reflection → Goal → Challenge → Action → Outcome → Learning → Growth`.

---

## 🏛️ Agentic Threat Modeling & Security Architecture

### The 5 Threat Zones Summary Table

| Threat Zone | Identified Risk | Countermeasure Implemented |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious prompt injections, oversized payload attacks, malformed JSON bodies | Strict Zod-like defensive schema decoding, null-safe payload destructuring, character-length enforcement, and input trimming. |
| **2. Planning & Reasoning** | System instruction bypass, conversational drift, ungrounded hallucinated instructions | Delimited plain-data prompt structuring, resilient fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **3. Tool Execution** | Dynamic code execution, SSRF, unauthorized elevation | Server-side proxy API routes (`/api/gemini/*`) exclusively; zero client-side SDK execution; parameterization of all downstream operations. |
| **4. Memory & State** | Cross-user data leakage, unauthenticated document writes, undefined property crash | Owner-bound Firestore Security Rules (`/users/{userId}/*`), strict undefined-stripping utility before all write operations. |
| **5. Inter-System Communication** | API key leakage, token sniffing in client bundles | Credentials stored exclusively in Google Cloud Secret Manager / Server Environment variables; zero client API keys. |

---

## 🔒 Cloud Firestore Security Rules

Database security rules enforce strict ownership isolation across entries, messages, reflections, actions, and growth records:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Journal entries sub-collection
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }

      // Reflect-Act-Grow: Extracted Reflection Insights
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Reflect-Act-Grow: User Actions & Commitments
      match /actions/{actionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Reflect-Act-Grow: Compounding Growth Records
      match /growth/{growthId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Legacy interactions
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🔑 Secret Management Setup (Google Secret Manager)

To configure production secrets on Google Cloud:

```bash
# 1. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com

# 2. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run runtime service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Cloud Run Deployment Flow & Campaign Verification

### 1. Build and Deploy Container

```bash
# Deploy service to Cloud Run with Secret Manager environment binding
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 2. Mandatory Challenge Verification Labeling

Apply the mandatory challenge verification label to register your Cloud Run service:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Comprehensive Functional Testing Walkthrough

### Test Case 1: Landing Page & Unauthenticated State
- **Action**: Navigate to `/`.
- **Expected Result**: 
  - Landing hero renders with the headline "Your Private AI Reflection & Growth Companion".
  - 4-stage engine visual cards (Reflect, Understand, Act, Grow) are displayed.
  - "Sign In with Google" button is prominent.

### Test Case 2: Federated Google Authentication
- **Action**: Click "Sign In with Google".
- **Expected Result**:
  - Firebase Authentication popup opens.
  - User authenticates and lands in their private sanctuary dashboard.
  - Navigation tabs (`Journal`, `Actions`, `Growth`, `History`) appear.
  - User profile is saved to `/users/{userId}` in Firestore.

### Test Case 3: Initial Multi-Turn Reflection Creation
- **Action**: In the journal workspace, select Mood ("Thoughtful" 🤔), select Mode ("Deep Reflection" 🪞), enter text: `"I felt overwhelmed by context switching today..."` and click **"Start Reflection"**.
- **Expected Result**:
  - Resilient Gemini fallback ladder processes the request (`gemini-3.6-flash`).
  - Empathetic AI response appears formatted in Markdown.
  - Entry is saved to Firestore under `/users/{userId}/entries/{entryId}`.
  - Green "Saved to Firestore" status renders.

### Test Case 4: Module 1 — Extracting Insights & Micro-Actions
- **Action**: In the active reflection thread, click the **"Extract Action"** button in the workspace toolbar.
- **Expected Result**:
  - Gemini analyzes the reflection and returns extracted Goal, Challenge, Tone, Key Insights, and an optional Micro-Action.
  - `ReflectionInsightCard` appears at the bottom of the conversation.

### Test Case 5: Module 2 — Editing & Committing an Action
- **Action**: In the `ReflectionInsightCard`, click **"Edit Action / Goal"**, adjust the text to `"Take a 10-minute break before the 2 PM meeting"`, set timeframe to `"Today"`, and click **"Accept & Commit Action"**.
- **Expected Result**:
  - Confirmation card appears.
  - Action is persisted to `/users/{userId}/actions/{actionId}` with status `accepted`.
  - The badge count on the **Actions** tab increments.

### Test Case 6: Module 3 — Action Check-In & Adaptive Learning
- **Action**: Switch to the **"Actions"** tab and click **"Check In"** on the commitment. Select **"Partially"**, add a reflection note: `"Finished half before urgent email arrived"`, and click **"Understand Outcome & Extract Learning"**.
- **Expected Result**:
  - Gemini synthesizes the outcome and generates an empathetic learning summary and an adapted next step.
  - Click **"Save to Growth Journey"**.

### Test Case 7: Module 4 — Growth Journey Timeline
- **Action**: Switch to the **"Growth"** tab.
- **Expected Result**:
  - The visual timeline renders a node with Goal, Challenge, Action Step, Learning, and Growth Synthesis.
  - Filter by month operates cleanly.

### Test Case 8: Multi-Turn Dialogue & Structured Summarization
- **Action**: In the journal workspace, click **"Summarize"** or **"Brainstorm"**.
- **Expected Result**:
  - Gemini outputs structured executive summaries and actionable ideas, persisted cleanly into Firestore.

### Test Case 9: Exporting Entry to Markdown
- **Action**: Click the **"Export"** button in the journal header.
- **Expected Result**:
  - A clean `.md` document containing metadata, executive summaries, and turn history is downloaded.

### Test Case 10: Security Modal & Isolation Verification
- **Action**: Click the **"Security"** button in the top navigation.
- **Expected Result**:
  - Modal opens displaying the 5-Zone Threat Summary Table, Firestore security rules, and active storage path (`/users/{userId}/*`).
