// Site Classification
const productiveSites = ['google.com', 'docs.google.com', 'github.com', 'stackoverflow.com', 'notion.so', 'drive.google.com', 'figma.com', 'linkedin.com', 'coursera.org', 'udemy.com', 'medium.com', 'dev.to'];
const distractionSites = ['youtube.com', 'tiktok.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'netflix.com', 'twitch.tv', 'x.com', 'discord.com'];

function isDistraction(hostname) {
  return distractionSites.some(site => hostname.includes(site));
}

// Initialize data
function initializeData() {
  chrome.storage.local.get(['focusData'], (data) => {
    if (!data.focusData) {
      chrome.storage.local.set({
        focusData: {
          totalFocusTime: 0,
          tabSwitches: 0,
          distractionTime: 0,
          sites: {},
          sessionStart: Date.now()
        },
        streaks: {
          current: 0,
          best: 0,
          lastDate: new Date().toDateString()
        },
        hourlyData: {}
      });
    }
  });
}

// Track tab changes
let lastTabId = null;
let tabStartTime = {};

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Save time from previous tab
  if (lastTabId && tabStartTime[lastTabId]) {
    const timeSpent = Math.floor((Date.now() - tabStartTime[lastTabId]) / 1000);
    updateSiteTime(lastTabId, timeSpent);
  }

  // Start tracking new tab
  lastTabId = activeInfo.tabId;
  tabStartTime[activeInfo.tabId] = Date.now();

  // Increment tab switches
  chrome.storage.local.get('focusData', (data) => {
    if (!data.focusData) return;
    const focusData = data.focusData;
    focusData.tabSwitches += 1;
    chrome.storage.local.set({ focusData });
  });

  // Check focus mode and block if needed
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.log('Tab no longer exists');
      return;
    }
    if (tab) {
      checkFocusMode(tab);
    }
  });
});

// Listen for tab updates (when URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    checkFocusMode(tab);
  }
});

function updateSiteTime(tabId, timeSpent) {
  chrome.tabs.get(tabId, (tab) => {
    // Handle error if tab no longer exists
    if (chrome.runtime.lastError) {
      console.log('Cannot update time: Tab closed');
      return;
    }

    if (!tab || !tab.url) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      chrome.storage.local.get(['focusData', 'hourlyData'], (data) => {
        if (!data.focusData) return;

        const focusData = data.focusData;
        const hourlyData = data.hourlyData || {};

        if (!focusData.sites[hostname]) {
          focusData.sites[hostname] = { time: 0, isDistraction: isDistraction(hostname) };
        }

        focusData.sites[hostname].time += timeSpent;

        // Update total time
        if (isDistraction(hostname)) {
          focusData.distractionTime += timeSpent;
        } else {
          focusData.totalFocusTime += timeSpent;
          
          // Track hourly data
          const now = new Date();
          const hour = now.getHours();
          if (!hourlyData[hour]) hourlyData[hour] = 0;
          hourlyData[hour] += timeSpent;
        }

        chrome.storage.local.set({ focusData, hourlyData });
      });
    } catch (e) {
      console.log('Error parsing URL:', e);
    }
  });
}

function checkFocusMode(tab) {
  chrome.storage.local.get('focusMode', (data) => {
    const focusMode = data.focusMode || { active: false };

    if (!focusMode.active) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      if (isDistraction(hostname)) {
        // Block this tab IMMEDIATELY
        chrome.tabs.sendMessage(tab.id, { action: 'blockSite' }).catch(() => {
          // If content script not loaded, inject it
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: blockSiteDirectly
          }).catch(() => {});
        });
      }
    } catch (e) {
      // Silently fail on URL parse error
    }
  });
}

// Function to block site directly (executed in tab)
function blockSiteDirectly() {
  document.body.innerHTML = '';
  document.body.style.cssText = 'background: #e74c3c; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;';

  const block = document.createElement('div');
  block.style.cssText = 'background: #c0392b; color: white; padding: 60px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold;';
  block.innerHTML = '⏸ <br> Focus Mode Active <br> <br> This site is blocked!';
  document.body.appendChild(block);

  document.body.style.pointerEvents = 'none';
}

// Reset daily data at midnight
function scheduleDailyReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow - now;

  setTimeout(() => {
    // Check if focus time > 1 hour for streak
    chrome.storage.local.get(['focusData', 'streaks'], (data) => {
      const focusData = data.focusData;
      const streaks = data.streaks || { current: 0, best: 0 };
      
      if (focusData && focusData.totalFocusTime >= 3600) { // 1 hour minimum
        streaks.current += 1;
        if (streaks.current > streaks.best) {
          streaks.best = streaks.current;
        }
      } else {
        streaks.current = 0;
      }
      
      // Reset daily data
      chrome.storage.local.set({
        focusData: {
          totalFocusTime: 0,
          tabSwitches: 0,
          distractionTime: 0,
          sites: {},
          sessionStart: Date.now()
        },
        streaks: streaks,
        hourlyData: {}
      });
    });

    scheduleDailyReset();
  }, msUntilMidnight);
}

// Initialize
initializeData();
scheduleDailyReset();