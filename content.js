// Focus Detective Content Script
console.log('Content script loaded on:', window.location.href);

let readingModeOn = false;
let originalHTML = null;

// Make sure listener is registered
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);
  
  try {
    if (request.action === 'toggleReading') {
      if (readingModeOn) {
        exitReadingMode();
        sendResponse({ success: true, mode: 'off' });
      } else {
        enterReadingMode();
        sendResponse({ success: true, mode: 'on' });
      }
      return true;
    } else if (request.action === 'blockSite') {
      blockCurrentSite();
      sendResponse({ success: true });
      return true;
    }
  } catch(e) {
    console.error('Error in message handler:', e);
    sendResponse({ success: false, error: e.message });
  }
});

function enterReadingMode() {
  if (readingModeOn) return;
  readingModeOn = true;
  
  console.log('Entering reading mode');

  // Save original HTML
  originalHTML = document.documentElement.innerHTML;

  // Extract text content
  const textContent = document.body.innerText || document.body.textContent || '';

  // Clear and rebuild
  document.body.innerHTML = '';
  document.body.style.cssText = 'background: #f5f1e8 !important; color: #333 !important; padding: 70px 40px 40px 40px !important; max-width: 900px !important; margin: 0 auto !important;';

  // Create toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'reading-toolbar';
  toolbar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #333; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 99999;';
  
  toolbar.innerHTML = `
    <span style="font-weight: bold; font-size: 16px;">📖 Reading Mode</span>
    <div style="display: flex; gap: 8px;">
      <button id="dark-btn" style="background: #555; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">🌙 Dark</button>
      <button id="light-btn" style="background: #555; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">☀️ Light</button>
      <button id="plus-btn" style="background: #555; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">A+</button>
      <button id="minus-btn" style="background: #555; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">A-</button>
      <button id="exit-btn" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold;">Exit</button>
    </div>
  `;
  document.body.appendChild(toolbar);

  // Create content box
  const contentBox = document.createElement('div');
  contentBox.id = 'reading-content';
  contentBox.style.cssText = 'background: #fafaf8; padding: 40px; border-radius: 8px; font-family: Georgia, serif; line-height: 1.8; font-size: 18px; color: #333;';
  contentBox.innerText = textContent;
  document.body.appendChild(contentBox);

  // Button handlers with try-catch
  try {
    document.getElementById('dark-btn').addEventListener('click', () => {
      document.body.style.background = '#1a1a1a';
      document.body.style.color = '#e0e0e0';
      const content = document.getElementById('reading-content');
      if (content) {
        content.style.background = '#2a2a2a';
        content.style.color = '#e0e0e0';
      }
    });

    document.getElementById('light-btn').addEventListener('click', () => {
      document.body.style.background = '#f5f1e8';
      document.body.style.color = '#333';
      const content = document.getElementById('reading-content');
      if (content) {
        content.style.background = '#fafaf8';
        content.style.color = '#333';
      }
    });

    document.getElementById('plus-btn').addEventListener('click', () => {
      const current = parseInt(window.getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = (current + 2) + 'px';
    });

    document.getElementById('minus-btn').addEventListener('click', () => {
      const current = parseInt(window.getComputedStyle(document.body).fontSize);
      if (current > 12) document.body.style.fontSize = (current - 2) + 'px';
    });

    document.getElementById('exit-btn').addEventListener('click', () => {
      exitReadingMode();
    });
  } catch(e) {
    console.error('Error attaching button handlers:', e);
  }
  
  console.log('Reading mode entered successfully');
}

function exitReadingMode() {
  if (!readingModeOn) return;
  readingModeOn = false;

  if (originalHTML) {
    document.documentElement.innerHTML = originalHTML;
  }
  
  console.log('Reading mode exited');
}

function blockCurrentSite() {
  // Clear page
  document.body.innerHTML = '';
  document.body.style.cssText = 'background: #e74c3c; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;';

  // Show blocking message
  const block = document.createElement('div');
  block.style.cssText = 'background: #c0392b; color: white; padding: 60px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold;';
  block.innerHTML = '⏸ <br> Focus Mode Active <br> <br> This site is blocked!';
  document.body.appendChild(block);

  // Disable all interaction
  document.body.style.pointerEvents = 'none';
}

// ===== READING MODE CONTENT SCRIPT =====

let readingModeActive = false;
let originalHtml = null;

function extractReadableContent() {
  // Remove script, style, nav, footer
  const clone = document.body.cloneNode(true);
  
  clone.querySelectorAll('script, style, nav, footer, .ad, .advertisement, [role="navigation"]').forEach(el => {
    el.remove();
  });

  // Get main content
  const article = clone.querySelector('article') || clone.querySelector('main') || clone.querySelector('[role="main"]');
  const content = article || clone;

  return {
    title: document.title,
    content: content.innerText,
    html: content.innerHTML
  };
}

function enableReadingMode() {
  if (readingModeActive) return;
  
  readingModeActive = true;
  originalHtml = document.documentElement.innerHTML;

  const readable = extractReadableContent();

  // Create reading mode container
  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${readable.title} - Reading Mode</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          background: #fafafa;
          color: #2c3e50;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif;
          line-height: 1.8;
          font-size: 16px;
          padding: 40px 20px;
        }
        
        .reading-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .reading-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ecf0f1;
        }
        
        .reading-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a2332;
        }
        
        .reading-controls {
          display: flex;
          gap: 10px;
        }
        
        .reading-btn {
          background: #1abc9c;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .reading-btn:hover {
          background: #16a085;
        }
        
        .reading-btn.secondary {
          background: #ecf0f1;
          color: #2c3e50;
        }
        
        .reading-content {
          font-size: 17px;
          line-height: 1.9;
          color: #34495e;
        }
        
        .reading-content p {
          margin-bottom: 18px;
        }
        
        .reading-content h1, .reading-content h2, .reading-content h3 {
          margin-top: 24px;
          margin-bottom: 12px;
          color: #1a2332;
          font-weight: 700;
        }
        
        .reading-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 20px 0;
        }
        
        .summary-box {
          background: linear-gradient(135deg, #f0fef9 0%, #e8fbf5 100%);
          border-left: 4px solid #1abc9c;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          font-size: 15px;
          line-height: 1.8;
        }
        
        .summary-title {
          font-weight: 700;
          color: #1abc9c;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="reading-container">
        <div class="reading-header">
          <h1 class="reading-title">${readable.title}</h1>
          <div class="reading-controls">
            <button class="reading-btn secondary" id="summaryBtn">📊 Summary</button>
            <button class="reading-btn secondary" id="speakBtn">🔊 Speak</button>
            <button class="reading-btn secondary" id="exitBtn">✕ Exit</button>
          </div>
        </div>
        <div class="reading-content" id="readingContent">
          ${readable.html}
        </div>
      </div>
      
      <script>
        document.getElementById('exitBtn').addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'exitReadingMode' });
        });
        
        document.getElementById('speakBtn').addEventListener('click', () => {
          const text = document.getElementById('readingContent').innerText;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        });
        
        document.getElementById('summaryBtn').addEventListener('click', () => {
          const content = document.getElementById('readingContent').innerText;
          const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
          const summaryLength = Math.max(3, Math.ceil(sentences.length / 4));
          const summary = sentences.slice(0, summaryLength).join('. ') + '.';
          
          const summaryBox = document.createElement('div');
          summaryBox.className = 'summary-box';
          summaryBox.innerHTML = \`
            <div class="summary-title">📋 Quick Summary</div>
            <p>\${summary}</p>
          \`;
          
          document.getElementById('readingContent').parentNode.insertBefore(summaryBox, document.getElementById('readingContent'));
        });
      </script>
    </body>
    </html>
  `;
}

function disableReadingMode() {
  if (!readingModeActive || !originalHtml) return;
  readingModeActive = false;
  document.documentElement.innerHTML = originalHtml;
  location.reload();
}

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activateReadingMode') {
    enableReadingMode();
    sendResponse({ status: 'reading mode activated' });
  }
  
  if (request.action === 'getPageContent') {
    const content = document.body.innerText;
    sendResponse({ content });
  }
  
  if (request.action === 'exitReadingMode') {
    disableReadingMode();
  }
});