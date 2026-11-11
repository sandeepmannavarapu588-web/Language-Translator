/**
 * Language Translator - Main Application Script
 * Integrates MyMemory Translation API & Web Speech API
 */

// --- Supported Languages Data ---
const LANGUAGES = {
  "autodetect": { name: "✨ Auto Detect", speechCode: "en-US" },
  "en": { name: "English", speechCode: "en-US" },
  "te": { name: "Telugu (తెలుగు)", speechCode: "te-IN" },
  "hi": { name: "Hindi (हिन्दी)", speechCode: "hi-IN" },
  "ta": { name: "Tamil (தமிழ்)", speechCode: "ta-IN" },
  "kn": { name: "Kannada (ಕನ್ನಡ)", speechCode: "kn-IN" },
  "ml": { name: "Malayalam (മലയാളം)", speechCode: "ml-IN" },
  "bn": { name: "Bengali (বাংলা)", speechCode: "bn-IN" },
  "mr": { name: "Marathi (मराठी)", speechCode: "mr-IN" },
  "gu": { name: "Gujarati (ગુજરાતી)", speechCode: "gu-IN" },
  "pa": { name: "Punjabi (ਪੰਜਾਬੀ)", speechCode: "pa-IN" },
  "ur": { name: "Urdu (اردو)", speechCode: "ur-PK" },
  "es": { name: "Spanish (Español)", speechCode: "es-ES" },
  "fr": { name: "French (Français)", speechCode: "fr-FR" },
  "de": { name: "German (Deutsch)", speechCode: "de-DE" },
  "ar": { name: "Arabic (العربية)", speechCode: "ar-SA" },
  "it": { name: "Italian (Italiano)", speechCode: "it-IT" },
  "pt": { name: "Portuguese (Português)", speechCode: "pt-PT" },
  "ru": { name: "Russian (Русский)", speechCode: "ru-RU" },
  "ja": { name: "Japanese (日本語)", speechCode: "ja-JP" },
  "ko": { name: "Korean (한국어)", speechCode: "ko-KR" },
  "zh-CN": { name: "Chinese (Simplified) (中文)", speechCode: "zh-CN" },
  "tr": { name: "Turkish (Türkçe)", speechCode: "tr-TR" },
  "nl": { name: "Dutch (Nederlands)", speechCode: "nl-NL" },
  "pl": { name: "Polish (Polski)", speechCode: "pl-PL" },
  "sv": { name: "Swedish (Svenska)", speechCode: "sv-SE" },
  "el": { name: "Greek (Ελληνικά)", speechCode: "el-GR" },
  "vi": { name: "Vietnamese (Tiếng Việt)", speechCode: "vi-VN" },
  "id": { name: "Indonesian (Bahasa Indonesia)", speechCode: "id-ID" },
  "th": { name: "Thai (ไทย)", speechCode: "th-TH" }
};

// --- Phonetic Transliteration (Input Tools) Mapping ---
const TRANSLITERATE_CODES = {
  'te': 'te-t-i0-und', // Telugu
  'hi': 'hi-t-i0-und', // Hindi
  'ta': 'ta-t-i0-und', // Tamil
  'kn': 'kn-t-i0-und', // Kannada
  'ml': 'ml-t-i0-und', // Malayalam
  'bn': 'bn-t-i0-und', // Bengali
  'mr': 'mr-t-i0-und', // Marathi
  'gu': 'gu-t-i0-und', // Gujarati
  'pa': 'pa-t-i0-und', // Punjabi
  'ur': 'ur-t-i0-und', // Urdu
  'ar': 'ar-t-i0-und', // Arabic
  'ru': 'ru-t-i0-und', // Russian
  'el': 'el-t-i0-und'  // Greek
};

/**
 * Transliterate phonetic Latin text to native script
 * e.g. "ela unaru" -> "ఎలా ఉన్నారు", "miru ekkada" -> "మీరు ఎక్కడ"
 */
async function transliterateText(text, langCode) {
  const itc = TRANSLITERATE_CODES[langCode];
  if (!itc || !text || !text.trim()) return text;

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text.trim())}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = await response.json();
    if (data && data[0] === 'SUCCESS' && Array.isArray(data[1])) {
      const convertedWords = data[1].map(item => (item[1] && item[1][0]) ? item[1][0] : item[0]);
      return convertedWords.join(' ');
    }
  } catch (err) {
    console.warn('Transliteration failed:', err);
  }
  return text;
}

// --- DOM Elements ---
const sourceLangSelect = document.getElementById('source-lang');
const targetLangSelect = document.getElementById('target-lang');
const swapLangBtn = document.getElementById('swap-lang-btn');

const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const charCounter = document.getElementById('char-counter');

const translateBtn = document.getElementById('translate-btn');
const btnSpinner = document.getElementById('btn-spinner');
const btnIcon = document.getElementById('btn-icon');
const loadingOverlay = document.getElementById('loading-overlay');
const translationStatus = document.getElementById('translation-status');

const sourceBadge = document.getElementById('source-badge');
const targetBadge = document.getElementById('target-badge');

const convertTypingBtn = document.getElementById('convert-typing-btn');
const clearInputBtn = document.getElementById('clear-input-btn');
const pasteInputBtn = document.getElementById('paste-input-btn');
const micBtn = document.getElementById('mic-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

const listenSourceBtn = document.getElementById('listen-source-btn');
const listenTargetBtn = document.getElementById('listen-target-btn');
const copyTargetBtn = document.getElementById('copy-target-btn');
const shareTargetBtn = document.getElementById('share-target-btn');

const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const themeToggle = document.getElementById('theme-toggle');
const toastContainer = document.getElementById('toast-container');

const aboutModal = document.getElementById('about-modal');
const openAboutBtn = document.getElementById('open-about-btn');
const closeAboutBtn = document.getElementById('close-about-btn');
const modalOkBtn = document.getElementById('modal-ok-btn');
const footerAboutLink = document.getElementById('footer-about-link');

// --- State Variables ---
let isTranslating = false;
let isSpeaking = false;
let recognition = null;
let isRecording = false;
let lastDetectedSource = 'en';
const STORAGE_HISTORY_KEY = 'language_translator_history';
const STORAGE_THEME_KEY = 'language_translator_theme';

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initLanguages();
  initTheme();
  initHistory();
  initSpeechRecognition();
  setupEventListeners();
  updateCharCount();
});

/**
 * Populate language selectors with comprehensive language data
 */
function initLanguages() {
  sourceLangSelect.innerHTML = '';
  targetLangSelect.innerHTML = '';

  Object.entries(LANGUAGES).forEach(([code, lang]) => {
    // Source options include Auto Detect
    const srcOpt = document.createElement('option');
    srcOpt.value = code;
    srcOpt.textContent = lang.name;
    if (code === 'en') srcOpt.selected = true;
    sourceLangSelect.appendChild(srcOpt);

    // Target options exclude Auto Detect
    if (code !== 'autodetect') {
      const tgtOpt = document.createElement('option');
      tgtOpt.value = code;
      tgtOpt.textContent = lang.name;
      if (code === 'es') tgtOpt.selected = true;
      targetLangSelect.appendChild(tgtOpt);
    }
  });

  updateLanguageBadges();
}

/**
 * Update language badge indicators
 */
function updateLanguageBadges() {
  const srcCode = sourceLangSelect.value;
  const tgtCode = targetLangSelect.value;
  
  sourceBadge.textContent = LANGUAGES[srcCode] ? LANGUAGES[srcCode].name.split(' (')[0] : srcCode;
  targetBadge.textContent = LANGUAGES[tgtCode] ? LANGUAGES[tgtCode].name.split(' (')[0] : tgtCode;
}

// ==========================================================================
// Theme Management (Dark & Light Mode)
// ==========================================================================

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', initialTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_THEME_KEY, newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// ==========================================================================
// Event Listeners
// ==========================================================================

function setupEventListeners() {
  // Translate on button click
  translateBtn.addEventListener('click', () => {
    translateText();
  });

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter
  sourceText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      translateText();
    }
  });

  // Character counter
  sourceText.addEventListener('input', updateCharCount);

  // Language dropdown change
  sourceLangSelect.addEventListener('change', updateLanguageBadges);
  targetLangSelect.addEventListener('change', updateLanguageBadges);

  // Swap Languages
  swapLangBtn.addEventListener('click', swapLanguages);

  // Clear buttons
  clearInputBtn.addEventListener('click', () => {
    sourceText.value = '';
    updateCharCount();
    sourceText.focus();
    showToast('Input text cleared', 'info');
  });

  clearAllBtn.addEventListener('click', () => {
    sourceText.value = '';
    targetText.value = '';
    updateCharCount();
    resetStatus();
    stopAudio();
    showToast('All fields cleared', 'info');
  });

  // Paste from clipboard
  pasteInputBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sourceText.value = text;
        updateCharCount();
        showToast('Text pasted from clipboard', 'info');
      }
    } catch (err) {
      showToast('Clipboard access was blocked or not supported', 'error');
    }
  });

  // Copy target text
  copyTargetBtn.addEventListener('click', copyTranslation);

  // Share target text
  shareTargetBtn.addEventListener('click', shareTranslation);

  // Text to Speech
  listenSourceBtn.addEventListener('click', () => {
    const lang = sourceLangSelect.value === 'autodetect' ? lastDetectedSource : sourceLangSelect.value;
    speakText(sourceText.value, lang, listenSourceBtn);
  });

  listenTargetBtn.addEventListener('click', () => {
    speakText(targetText.value, targetLangSelect.value, listenTargetBtn);
  });

  // Voice typing (mic)
  micBtn.addEventListener('click', toggleSpeechRecognition);

  // Convert typing button (magic wand)
  if (convertTypingBtn) {
    convertTypingBtn.addEventListener('click', async () => {
      const text = sourceText.value.trim();
      const srcLang = sourceLangSelect.value;
      if (!text) {
        showToast('Please type some text in English letters first', 'warning');
        return;
      }
      if (!TRANSLITERATE_CODES[srcLang]) {
        showToast(`Typing conversion is available for Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, etc.`, 'info');
        return;
      }
      showToast('Converting typing to native script...', 'info', 1500);
      const converted = await transliterateText(text, srcLang);
      if (converted && converted !== text) {
        sourceText.value = converted;
        updateCharCount();
        showToast('Converted typing to native script ✨', 'success');
      } else {
        showToast('Text is already converted or could not be converted', 'info');
      }
    });
  }

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // History Clear
  clearHistoryBtn.addEventListener('click', clearHistory);

  // About Modal
  openAboutBtn.addEventListener('click', openModal);
  if (footerAboutLink) footerAboutLink.addEventListener('click', openModal);
  closeAboutBtn.addEventListener('click', closeModal);
  modalOkBtn.addEventListener('click', closeModal);
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutModal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function updateCharCount() {
  const count = sourceText.value.length;
  charCounter.textContent = `${count} / 1000`;
  if (count >= 1000) {
    charCounter.style.color = 'var(--color-error)';
  } else {
    charCounter.style.color = '';
  }
}

function resetStatus() {
  translationStatus.innerHTML = '<span class="status-dot"></span> Ready';
}

// ==========================================================================
// Swap Languages Functionality
// ==========================================================================

function swapLanguages() {
  const currentSource = sourceLangSelect.value;
  const currentTarget = targetLangSelect.value;

  // Cannot swap if source is auto detect
  if (currentSource === 'autodetect') {
    showToast('Cannot swap while Auto Detect is selected', 'warning');
    return;
  }

  // Animate swap button
  swapLangBtn.classList.add('rotating');
  setTimeout(() => swapLangBtn.classList.remove('rotating'), 400);

  // Swap language dropdown values
  sourceLangSelect.value = currentTarget;
  targetLangSelect.value = currentSource;
  updateLanguageBadges();

  // Swap text if translation exists
  const currentSrcText = sourceText.value;
  const currentTgtText = targetText.value;

  if (currentTgtText.trim() !== '') {
    sourceText.value = currentTgtText;
    targetText.value = currentSrcText;
    updateCharCount();
  }

  showToast('Languages swapped', 'info');
}

// ==========================================================================
// Translation Engine (MyMemory Translation API)
// ==========================================================================

/**
 * Decode HTML entities returned by translation APIs (e.g. &#39; -> ')
 */
function decodeHTMLEntities(text) {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

/**
 * Perform translation using fetch() and async/await
 */
async function translateText() {
  let text = sourceText.value.trim();

  // Input validation
  if (!text) {
    showToast('Please enter text to translate', 'warning');
    sourceText.focus();
    return;
  }

  if (isTranslating) return;

  const srcLang = sourceLangSelect.value;
  const tgtLang = targetLangSelect.value;

  if (srcLang === tgtLang) {
    showToast('Source and target languages are identical', 'warning');
    targetText.value = text;
    return;
  }

  // Automatic Typing Conversion:
  // If user typed English letters with a regional language selected (e.g. "ela unaru" -> "ఎలా ఉన్నారు")
  if (TRANSLITERATE_CODES[srcLang] && /[a-zA-Z]/.test(text)) {
    translationStatus.innerHTML = '<span class="status-dot busy"></span> Converting typing...';
    try {
      const converted = await transliterateText(text, srcLang);
      if (converted && converted !== text) {
        text = converted;
        sourceText.value = converted;
        updateCharCount();
        const langName = LANGUAGES[srcLang]?.name.split(' (')[0] || '';
        showToast(`Converted typing to ${langName} script ✨`, 'info', 2500);
      }
    } catch (e) {
      console.warn('Transliteration failed:', e);
    }
  }

  // Format language pair for MyMemory API
  const langPair = `${srcLang}|${tgtLang}`;
  const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

  setLoadingState(true);
  const startTime = performance.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200 || data.responseStatus === '200') {
      const translated = decodeHTMLEntities(data.responseData.translatedText);
      targetText.value = translated;

      let detectedLang = srcLang;
      if (srcLang === 'autodetect' && data.responseData.detectedLanguage) {
        detectedLang = data.responseData.detectedLanguage.toLowerCase();
        lastDetectedSource = detectedLang;
        const detectedName = LANGUAGES[detectedLang] ? LANGUAGES[detectedLang].name.split(' (')[0] : detectedLang.toUpperCase();
        sourceBadge.textContent = `✨ ${detectedName}`;
        showToast(`Detected language: ${detectedName}`, 'info');
      }

      const duration = Math.round(performance.now() - startTime);
      translationStatus.innerHTML = `<span class="status-dot"></span> Translated in ${duration}ms`;

      // Save to localStorage history
      saveToHistory({
        sourceLang: detectedLang,
        targetLang: tgtLang,
        sourceText: text,
        targetText: translated,
        timestamp: new Date().toISOString()
      });

      if (translated.trim().toLowerCase() === text.trim().toLowerCase() && srcLang !== tgtLang) {
        const langName = LANGUAGES[srcLang] ? LANGUAGES[srcLang].name.split(' (')[0] : srcLang;
        showToast(`Tip: "${text}" is written in English letters. For ${langName}, enter native script (e.g. తెలుగు) or click 🎙️ Mic to speak!`, 'warning', 6500);
      } else {
        showToast('Translation completed successfully!', 'success');
      }
    } else if (data.responseStatus === 403 || data.responseDetails?.toLowerCase().includes('quota')) {
      throw new Error(data.responseDetails || 'MyMemory daily query limit reached.');
    } else {
      throw new Error(data.responseDetails || 'Failed to translate. Please try again.');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Translation Error:', error);
    const msg = error.name === 'AbortError' ? 'Translation request timed out. Please check your internet connection.' : error.message;
    showToast(`Translation error: ${msg}`, 'error');
    translationStatus.innerHTML = `<span class="status-dot" style="background-color: var(--color-error)"></span> Error`;
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(loading) {
  isTranslating = loading;
  if (loading) {
    loadingOverlay.classList.remove('hidden');
    btnSpinner.classList.remove('hidden');
    btnIcon.classList.add('hidden');
    translateBtn.disabled = true;
    translationStatus.innerHTML = '<span class="status-dot busy"></span> Translating...';
  } else {
    loadingOverlay.classList.add('hidden');
    btnSpinner.classList.add('hidden');
    btnIcon.classList.remove('hidden');
    translateBtn.disabled = false;
  }
}

// ==========================================================================
// Text to Speech (Web Speech API)
// ==========================================================================

function speakText(text, langCode, buttonElement) {
  if (!text || text.trim() === '') {
    showToast('Nothing to listen to. Enter or translate some text.', 'warning');
    return;
  }

  if (!('speechSynthesis' in window)) {
    showToast('Text-to-Speech is not supported in this browser.', 'error');
    return;
  }

  // If already speaking, stop it
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    stopAudio();
    return;
  }

  window.speechSynthesis.cancel(); // Clear any queued utterances

  const langConfig = LANGUAGES[langCode] || LANGUAGES['en'];
  const speechCode = langConfig.speechCode || 'en-US';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechCode;
  utterance.rate = 0.95; // Slightly slower for clearer pronunciation
  utterance.pitch = 1.0;

  // Attempt voice matching
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang === speechCode || v.lang.startsWith(speechCode.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    if (buttonElement) {
      buttonElement.classList.add('speaking');
      const icon = buttonElement.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-circle-stop';
    }
  };

  utterance.onend = () => {
    stopAudio();
  };

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    stopAudio();
    showToast('Could not play audio for this language on your device', 'warning');
  };

  window.speechSynthesis.speak(utterance);
}

function stopAudio() {
  isSpeaking = false;
  [listenSourceBtn, listenTargetBtn].forEach(btn => {
    if (btn) {
      btn.classList.remove('speaking');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-volume-high';
    }
  });
}

// Ensure voices are loaded
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// ==========================================================================
// Voice Input (Speech Recognition)
// ==========================================================================

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = 'Voice typing is not supported in this browser (Supported in Chrome/Edge)';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('recording');
    showToast('Listening... Speak now into your microphone', 'info');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      sourceText.value = (sourceText.value ? sourceText.value + ' ' : '') + transcript;
      updateCharCount();
      showToast('Speech converted to text!', 'success');
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech Recognition error:', event.error);
    isRecording = false;
    micBtn.classList.remove('recording');
    if (event.error !== 'no-speech') {
      showToast(`Mic error: ${event.error}`, 'error');
    }
  };

  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove('recording');
  };
}

function toggleSpeechRecognition() {
  if (!recognition) {
    showToast('Speech Recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.', 'warning');
    return;
  }

  if (isRecording) {
    recognition.stop();
  } else {
    // Set recognition language based on selected source language
    const srcCode = sourceLangSelect.value;
    const langConfig = LANGUAGES[srcCode];
    recognition.lang = (langConfig && langConfig.speechCode) ? langConfig.speechCode : 'en-US';
    try {
      recognition.start();
    } catch (err) {
      console.error('Recognition start error:', err);
    }
  }
}

// ==========================================================================
// Copy & Share Functionality
// ==========================================================================

async function copyTranslation() {
  const text = targetText.value;
  if (!text || text.trim() === '') {
    showToast('No translated text to copy', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('Translated text copied to clipboard!', 'success');
  } catch (err) {
    // Fallback for older browsers
    targetText.select();
    document.execCommand('copy');
    showToast('Translated text copied to clipboard!', 'success');
  }
}

async function shareTranslation() {
  const text = targetText.value;
  if (!text || text.trim() === '') {
    showToast('No translated text to share', 'warning');
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Translated with Language Translator',
        text: text
      });
    } catch (err) {
      // User cancelled share
    }
  } else {
    copyTranslation();
  }
}

// ==========================================================================
// Translation History (localStorage)
// ==========================================================================

function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveToHistory(item) {
  let history = getHistory();
  // Generate random unique ID
  item.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  // Check if identical to most recent entry to prevent duplicate spam
  if (history.length > 0 && 
      history[0].sourceText === item.sourceText && 
      history[0].targetLang === item.targetLang) {
    return;
  }

  // Prepend new item, cap at 20 items
  history.unshift(item);
  if (history.length > 20) {
    history = history.slice(0, 20);
  }

  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  const history = getHistory();
  if (history.length === 0) {
    showToast('History is already empty', 'info');
    return;
  }

  if (confirm('Are you sure you want to clear your translation history?')) {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
    renderHistory();
    showToast('Translation history cleared', 'info');
  }
}

function deleteHistoryItem(id) {
  let history = getHistory();
  history = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  showToast('Item removed from history', 'info');
}

function restoreHistoryItem(item) {
  sourceLangSelect.value = item.sourceLang;
  targetLangSelect.value = item.targetLang;
  updateLanguageBadges();
  sourceText.value = item.sourceText;
  targetText.value = item.targetText;
  updateCharCount();

  // Scroll smoothly back to translator
  document.getElementById('translator').scrollIntoView({ behavior: 'smooth' });
  showToast('Translation loaded into workbench', 'info');
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty" id="history-empty">
        <i class="fa-regular fa-folder-open empty-icon"></i>
        <p>No recent translations yet. Translate some text to build your history!</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = '';

  history.forEach(item => {
    const srcName = LANGUAGES[item.sourceLang] ? LANGUAGES[item.sourceLang].name.split(' (')[0] : item.sourceLang;
    const tgtName = LANGUAGES[item.targetLang] ? LANGUAGES[item.targetLang].name.split(' (')[0] : item.targetLang;
    const formattedDate = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-card-header">
        <span class="history-lang-badge">
          ${srcName} <i class="fa-solid fa-arrow-right" style="font-size:0.65rem;"></i> ${tgtName}
        </span>
        <span class="history-time">${formattedDate}</span>
      </div>
      <div class="history-body">
        <p class="history-source-text">${escapeHtml(item.sourceText)}</p>
        <p class="history-target-text">${escapeHtml(item.targetText)}</p>
      </div>
      <div class="history-card-actions">
        <button class="text-btn load-btn" title="Load into translator">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Use
        </button>
        <button class="icon-btn copy-btn" title="Copy translation">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button class="icon-btn delete-btn" title="Delete from history">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Bind action buttons
    card.querySelector('.load-btn').addEventListener('click', () => restoreHistoryItem(item));
    card.querySelector('.copy-btn').addEventListener('click', async () => {
      await navigator.clipboard.writeText(item.targetText);
      showToast('Copied to clipboard!', 'success');
    });
    card.querySelector('.delete-btn').addEventListener('click', () => deleteHistoryItem(item.id));

    historyList.appendChild(card);
  });
}

function initHistory() {
  renderHistory();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// Modal Management (About)
// ==========================================================================

function openModal() {
  aboutModal.classList.remove('hidden');
}

function closeModal() {
  aboutModal.classList.add('hidden');
}

// ==========================================================================
// Toast Notification Engine
// ==========================================================================

function showToast(message, type = 'info', duration = 3200) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';
  if (type === 'warning') iconClass = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }, duration);
}
