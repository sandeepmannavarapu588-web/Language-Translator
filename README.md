# 🌍 AI-Based Language Translator Web Application

A modern, responsive, and feature-packed Language Translator web application designed to break language barriers across Indian regional languages and major global languages.

Built with **HTML5**, **CSS3**, modern **ES6+ JavaScript**, **MyMemory Translation API**, and the browser's native **Web Speech API**.

---

## 🚀 Key Features

1. **Multi-Language Translation**:
   - Real-time cloud translation powered by **MyMemory Translation API**.
   - Supports Indian regional languages: **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, **Kannada (ಕನ್ನಡ)**, **Malayalam (മലയാളം)**, **Bengali (বাংলা)**, **Marathi (मराठी)**, **Gujarati (ગુજરાતી)**, **Punjabi (ਪੰਜਾਬੀ)**, and **Urdu (اردو)**.
   - Supports world languages: **English**, **Spanish**, **French**, **German**, **Arabic**, **Italian**, **Portuguese**, **Russian**, **Japanese**, **Korean**, **Chinese**, and more.
   - **Auto Detect** option for source language detection.

2. **Text Input & Utilities**:
   - Real-time character counter (`0 / 1000`).
   - One-click Clear Input and Clear All buttons.
   - Instant paste from clipboard button.
   - Quick language swap with animated 360° flip icon and automatic text exchange.
   - Keyboard shortcut: `Ctrl + Enter` (or `Cmd + Enter`) to translate immediately.

3. **Audio & Voice Features (Web Speech API)**:
   - **Text-to-Speech (TTS)**: Listen to both original input text and translated output in natural voices matching regional accents.
   - **Speech-to-Text (Voice Typing)**: Speak directly into your microphone to dictate sentences hands-free (supported in modern browsers like Chrome, Edge).

4. **Translation History**:
   - Automatic local persistence using browser `localStorage` (up to 20 recent translations).
   - Interactive history cards with one-click **"Use / Load"** into translator, copy, and individual item deletion.
   - Clear all history with confirmation.

5. **Theme & Modern UI/UX**:
   - Light blue, white, and purple aesthetic with glassmorphism touches and ambient background glow.
   - **Dark Mode and Light Mode** toggle, persisting preference across page reloads.
   - Elegant toast notification system for feedback (copied, swapped, cleared, errors).
   - Fully responsive design for desktops, tablets, and smartphones.

---

## 🛠️ Technology Stack

- **Markup**: HTML5 Semantic Elements (`<header>`, `<main>`, `<section>`, `<footer>`, `<dialog>/modal`)
- **Styling**: CSS3 (Custom CSS variables, Flexbox, CSS Grid, Glassmorphism, animations)
- **Scripting**: Vanilla JavaScript (ES6+, `async`/`await`, `fetch()`, DOM manipulation)
- **External APIs**:
  - [MyMemory Translation API](https://mymemory.translated.net/) for translation data
  - [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`SpeechSynthesis` & `SpeechRecognition`)
- **Typography & Icons**: Google Fonts (`Outfit`, `Plus Jakarta Sans`), Font Awesome 6 CDN

---

## 📁 Project Structure

```
Language-Translator/
│
├── index.html     # Semantic HTML5 layout and modal structure
├── style.css      # Modern responsive styling, color palette, dark mode
├── script.js      # API handling, Web Speech integration, localStorage history
└── README.md      # Project documentation and guide
```

---

## 💻 How to Run with VS Code Live Server

Follow these simple steps to launch the application on your computer:

### Step 1: Open VS Code
1. Launch **Visual Studio Code**.
2. Go to **File** > **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the `Language-Translator` directory.

### Step 2: Install Live Server Extension
1. In VS Code, click the **Extensions** icon on the left sidebar (or press `Ctrl + Shift + X`).
2. Search for **Live Server** (by *Ritwick Dey*).
3. Click **Install**.

### Step 3: Run the Application
1. In the VS Code file explorer, right-click on `index.html`.
2. Click **Open with Live Server** (or click the **Go Live** button in the bottom status bar).
3. Your default web browser will automatically open and display the application at:
   ```
   http://127.0.0.1:5500/index.html
   ```

---

## 🌐 API Details & Behavior

- **Endpoint**:
  ```
  https://api.mymemory.translated.net/get?q={text}&langpair={source}|{target}
  ```
- **Entity Decoding**: MyMemory responses often include HTML entities (such as `&#39;` for apostrophes). The application includes an automated entity decoder to ensure human-readable text display.
- **Quota Handling**: The application handles daily rate limits gracefully and alerts the user with descriptive toast messages.

---

## 📄 License & Attribution

Designed and developed with modern web standards. Built for high performance, accessibility, and intuitive user experience.
