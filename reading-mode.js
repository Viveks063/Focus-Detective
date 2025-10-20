// Reading Mode Content Script
let readingModeActive = false;
let currentFontSize = 18;

// Create reading mode overlay
function enableReadingMode() {
  if (readingModeActive) return;
  readingModeActive = true;

  // Remove ads and distracting elements
  const selectorsToRemove = [
    'iframe[src*="ads"]',
    '.ad', '.ads', '.advertisement',
    '.sidebar', '.related-videos',
    '.comments', '.social-share',
    '.popup', '.modal', '.banner',
    '.newsletter-signup',
    'script[src*="ads"]',
    '[data-ad-slot]'
  ];

  selectorsToRemove.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
      });
    } catch (e) {}
  });

  // Remove existing reading mode styles if any
  const existing = document.getElementById('reading-mode-styles');
  if (existing) existing.remove();

  // Apply reading-friendly styles
  const style = document.createElement('style');
  style.id = 'reading-mode-styles';
  style.textContent = `
    body.reading-mode {
      background: #f5f1e8 !important;
      color: #333 !important;
      font-family: Georgia, 'Times New Roman', serif !important;
      line-height: 1.8 !important;
      font-size: 18px !important;
      max-width: 900px !important;
      margin: 0 auto !important;
      padding: 70px 20px 40px 20px !important;
    }

    body.reading-mode * {
      font-family: Georgia, 'Times New Roman', serif !important;
      line-height: 1.8 !important;
    }

    body.reading-mode .reading-mode-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #333;
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    body.reading-mode .reading-mode-toolbar button {
      background: #4285f4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 10px;
      font-weight: bold;
    }

    body.reading-mode .reading-mode-toolbar button:hover {
      background: #357ae8;
      transform: scale(1.05);
    }

    body.reading-mode .reading-mode-toolbar .theme-btn,
    body.reading-mode .reading-mode-toolbar .size-btn {
      background: #555;
      margin-left: 5px;
      padding: 8px 12px;
    }

    body.reading-mode .reading-mode-toolbar .theme-btn:hover,
    body.reading-mode .reading-mode-toolbar .size-btn:hover {
      background: #777;
    }

    body.reading-mode article,
    body.reading-mode .article,
    body.reading-mode main,
    body.reading-mode .content,
    body.reading-mode .post {
      background: #fafaf8 !important;
      padding: 40px !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }

    body.reading-mode p {
      margin: 1.5em 0 !important;
      color: #444 !important;
      font-family: Georgia, serif !important;
    }

    body.reading-mode h1,
    body.reading-mode h2,
    body.reading-mode h3 {
      color: #222 !important;
      font-weight: 600 !important;
      margin-top: 1.5em !important;
      margin-bottom: 0.5em !important;
      font-family: Georgia, serif !important;
    }

    body.reading-mode a {
      color: #4285f4 !important;
      text-decoration: underline !important;
    }

    body.reading-mode img {
      max-width: 100% !important;
      height: auto !important;
      margin: 20px 0 !important;
      border-radius: 4px !important;
    }

    body.reading-mode blockquote {
      border-left: 4px solid #4285f4 !important;
      padding-left: 20px !important;
      margin-left: 0 !important;
      color: #666 !important;
      font-style: italic !important;
    }

    body.reading-mode.dark-theme {
      background: #1a1a1a !important;
      color: #e0e0e0 !important;
    }

    body.reading-mode.dark-theme article,
    body.reading-mode.dark-theme main,
    body.reading-mode.dark-theme .content {
      background: #2a2a2a !important;
      color: #e0e0e0 !important;
    }

    body.reading-mode.dark-theme p,
    body.reading-mode.dark-theme h1,
    body.reading-mode.dark-theme h2,
    body.reading-mode.dark-theme h3 {
      color: #e0e0e0 !important;
    }
  `;
  document.head.appendChild(style);

  // Add reading mode toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'reading-mode-toolbar';
  toolbar.id = 'reading-mode-toolbar';
  toolbar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: bold;">📖 Reading Mode Active</span>
      <button class="theme-btn" id="darkThemeBtn">🌙 Dark</button>
      <button class="theme-btn" id="lightThemeBtn">☀️ Light</button>
      <button class="size-btn" id="increaseSizeBtn">A+</button>
      <button class="size-btn" id="decreaseSizeBtn">A-</button>
    </div>
    <button id="exitReadingBtn" style="background: #e74c3c;">✕ Exit</button>
  `;
  document.body.insertBefore(toolbar, document.body.firstChild);
  document.body.classList.add('reading-mode');

  // Theme controls
  document.getElementById('darkThemeBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.add('dark-theme');
    document.body.style.background = '#1a1a1a';
    document.body.style.color = '#e0e0e0';
  });

  document.getElementById('lightThemeBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.remove('dark-theme');
    document.body.style.background = '#f5f1e8';
    document.body.style.color = '#333';
  });

  document.getElementById('increaseSizeBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentFontSize += 2;
    if (currentFontSize > 32) currentFontSize = 32;
    document.body.style.fontSize = currentFontSize + 'px';
  });

  document.getElementById('decreaseSizeBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentFontSize -= 2;
    if (currentFontSize < 12) currentFontSize = 12;
    document.body.style.fontSize = currentFontSize + 'px';
  });

  // Exit reading mode
  document.getElementById('exitReadingBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    disableReadingMode();
  });
}

// Disable reading mode
function disableReadingMode() {
  if (!readingModeActive) return;
  readingModeActive = false;

  document.getElementById('reading-mode-styles')?.remove();
  document.getElementById('reading-mode-toolbar')?.remove();
  document.body.classList.remove('reading-mode', 'dark-theme');
  document.body.style.padding = '';
  document.body.style.background = '';
  document.body.style.color = '';
  document.body.style.fontSize = '';
  location.reload();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'toggleReadingMode') {
      if (readingModeActive) {
        disableReadingMode();
        sendResponse({ status: 'disabled' });
      } else {
        enableReadingMode();
        sendResponse({ status: 'enabled' });
      }
    } else if (request.action === 'blockDistractions') {
      blockDistractionSites();
      sendResponse({ status: 'blocked' });
    } else if (request.action === 'checkReadingMode') {
      sendResponse({ status: readingModeActive ? 'enabled' : 'disabled' });
    }
  } catch (e) {
    console.error('Error:', e);
    sendResponse({ status: 'error', error: e.message });
  }
});

// Block distraction sites
function blockDistractionSites() {
  const distractionSites = [
    'youtube.com', 'tiktok.com', 'twitter.com', 'instagram.com',
    'facebook.com', 'reddit.com', 'netflix.com', 'twitch.tv', 'x.com'
  ];

  const currentDomain = window.location.hostname;
  const isDistraction = distractionSites.some(site => currentDomain.includes(site));

  if (isDistraction) {
    const style = document.createElement('style');
    style.id = 'distraction-block-style';
    style.textContent = `
      body {
        opacity: 0.3 !important;
        pointer-events: none !important;
      }
      body::before {
        content: '⏸ Focus Mode Active - This site is blocked' !important;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 40px 60px;
        border-radius: 12px;
        font-size: 24px;
        font-weight: bold;
        z-index: 100000;
        text-align: center;
        pointer-events: auto;
        white-space: nowrap;
      }
    `;
    if (!document.getElementById('distraction-block-style')) {
      document.head.appendChild(style);
    }
  }
}