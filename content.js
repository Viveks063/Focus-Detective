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