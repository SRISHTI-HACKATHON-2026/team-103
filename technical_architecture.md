# 🛠️ Care Companion: Technical Architecture

This document provides a deep dive into the internal logic, data flow, and architectural decisions of the Care Companion SaaS.

---

## 1. Frontend Architecture (home.html)

### Navigation System
The app uses a **Single Page Application (SPA)** architecture without a router library. 
- **Mechanism:** The `showTab(tabId)` function toggles the `active` class on different `<section>` containers.
- **Benefit:** Instant transitions and zero page reloads.

### State Management
Instead of a complex state manager (like Redux), we use **LocalStorage** as our "Source of Truth."
- **Data Schema:** 
  - `moods`: Array of objects `{ emotion, timestamp }`.
  - `history`: Array of chat messages.
  - `reminders`: Array of task configurations.
- **Syncing:** Every time a user interacts (logs a mood, sends a message), the relevant `localStorage` key is updated and the UI is re-rendered.

### Emotion Detection Logic
- **Library:** `face-api.js`
- **Execution:** When a photo is captured, the image is passed to `faceapi.detectSingleFace().withFaceExpressions()`. 
- **Processing:** This runs a **Tiny Face Detector** neural network in the browser (via WebGL/WASM). It returns a probability object. We use a `.reduce()` function to find the expression with the highest confidence score.

### Voice Engine (TTS)
- **API:** `window.speechSynthesis`
- **Modulation Logic:** 
  - We map emotions to a `pitch` (0.5 to 1.5) and `rate` (0.8 to 1.2).
  - **Negative Emotions (Sad/Anxious):** Low pitch, slow rate for a calming, grounded effect.
  - **Positive Emotions (Happy/Excited):** Higher pitch, faster rate for an upbeat effect.

---

## 2. Backend Architecture (server.js)

### Express Server
- **Environment:** Node.js
- **Middleware:** `cors` for cross-origin requests and `express.json()` for parsing body data.

### The Crisis Interceptor (Safety Layer)
Before any message is sent to the AI, it passes through a **Keyword Interception Layer**:
```javascript
const crisisKeywords = ["suicide", "kill myself", "want to die"...];
if (crisisKeywords.some(kw => lowerMsg.includes(kw))) {
    return res.json({ reply: "CRISIS_RESOURCES" });
}
```
- **Rationale:** AI can sometimes be unpredictable. Hardcoding safety resources for specific keywords ensures 100% reliability in critical moments.

### AI Integration
- **Engine:** GPT-4o-mini via **OpenRouter**.
- **System Prompting:** We inject a persistent `SYSTEM_PROMPT` that defines the "Gentle Friend" persona, ensuring the AI never uses clinical or cold language.

---

## 3. Data Flow: The "Mood-to-Chat" Loop

1. **User Action:** User logs "Sad" via Emoji.
2. **Storage:** `trackMood('sad')` is called.
3. **Trigger:** `consecutiveNegativeEmotions` increments.
4. **AI Context:** When the user next opens the chat, the `requestContent()` function reads the last entry from `localStorage` and appends `[SYSTEM_CONTENT_REQUEST] User is feeling sad` to the prompt.
5. **Output:** AI generates a comforting response specifically tailored to sadness.

---

## 4. UI/UX Design System (style.css)

### Glassmorphism Tokens
We use CSS Variables for theme consistency:
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.3);
  --blur: blur(12px);
}
```
- **Theming:** When `.dark-theme` is applied to the `<body>`, these variables are updated to dark translucent values.

### Visual Polish
- **Backdrop-Filter:** Used on all `.glass-panel` elements to create the frosted effect.
- **Micro-Animations:** CSS transitions (`transition: all 0.3s ease`) are applied to every button and card for a premium feel.
