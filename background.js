// Site Classification
const productiveSites = ['google.com', 'docs.google.com', 'github.com', 'stackoverflow.com', 'notion.so', 'drive.google.com', 'figma.com', 'linkedin.com', 'coursera.org', 'udemy.com', 'medium.com', 'dev.to'];
const distractionSites = ['youtube.com', 'tiktok.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'netflix.com', 'twitch.tv', 'x.com', 'discord.com'];

function isDistraction(hostname) {
  return distractionSites.some(site => hostname.includes(site));
}

// Initialize data
function initializeData() {
  chrome.storage.local.get(['focusData', 'currentSessionTime'], (data) => {
    if (!data.focusData) {
      chrome.storage.local.set({
        focusData: {
          totalFocusTime: 0,
          tabSwitches: 0,
          distractionTime: 0,
          sites: {}
        },
        streaks: {
          current: 0,
          best: 0,
          lastDate: new Date().toDateString()
        },
        hourlyData: {},
        currentSessionTime: 0
      });
    }
  });
}

// Update current site display
function updateCurrentSite(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      chrome.storage.local.get('focusData', (data) => {
        const focusData = data.focusData || {};
        
        // Save current site info
        chrome.storage.local.set({
          currentSite: {
            url: tab.url,
            hostname: hostname,
            isDistraction: isDistraction(hostname),
            timeOnSite: focusData.sites?.[hostname]?.time || 0,
            tabId: tabId
          }
        });
      });
    } catch (e) {
      console.log('Error parsing URL:', e);
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

  // Update current site display
  updateCurrentSite(activeInfo.tabId);

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
    // Update current site if this is the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id === tabId) {
        updateCurrentSite(tabId);
      }
    });
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

      chrome.storage.local.get(['focusData', 'hourlyData', 'focusMode'], (data) => {
        if (!data.focusData) return;

        const focusData = data.focusData;
        const hourlyData = data.hourlyData || {};
        const focusMode = data.focusMode || { active: false };

        if (!focusData.sites[hostname]) {
          focusData.sites[hostname] = { time: 0, isDistraction: isDistraction(hostname) };
        }

        focusData.sites[hostname].time += timeSpent;

        // Update total time only if focus mode is active
        if (focusMode.active) {
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
    chrome.storage.local.get(['focusData', 'streaks', 'dailyGoal', 'goalStats', 'weeklyGoalData', 'currentSessionTime'], (data) => {
      const focusData = data.focusData;
      const streaks = data.streaks || { current: 0, best: 0 };
      const dailyGoal = data.dailyGoal || { hours: 2, minutes: 0 };
      const goalStats = data.goalStats || { currentStreak: 0, bestStreak: 0, totalCompleted: 0 };
      const weeklyGoalData = data.weeklyGoalData || {};
      const currentSessionTime = data.currentSessionTime || 0;
      
      // Check focus streak (1+ hour)
      if (focusData && focusData.totalFocusTime >= 3600) {
        streaks.current += 1;
        if (streaks.current > streaks.best) {
          streaks.best = streaks.current;
        }
      } else {
        streaks.current = 0;
      }
      
      // Check goal completion (use currentSessionTime for goal tracking)
      const goalSeconds = (dailyGoal.hours * 3600) + (dailyGoal.minutes * 60);
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      if (currentSessionTime >= goalSeconds) {
        weeklyGoalData[today] = true;
      } else {
        weeklyGoalData[today] = false;
        // Break goal streak if not completed
        goalStats.currentStreak = 0;
      }
      
      // Reset daily data but keep currentSessionTime if it's part of the same goal
      chrome.storage.local.set({
        focusData: {
          totalFocusTime: 0,
          tabSwitches: 0,
          distractionTime: 0,
          sites: {}
        },
        streaks: streaks,
        goalStats: goalStats,
        weeklyGoalData: weeklyGoalData,
        hourlyData: {},
        currentSite: {},
        currentSessionTime: 0  // Reset session time at midnight
      });
    });

    scheduleDailyReset();
  }, msUntilMidnight);
}

// ===== PROACTIVE VOICE ASSISTANT =====

let siteTimeTracking = {};
let lastNudgeTime = {};

function speakNotification(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
}

function checkProactiveNudges() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    const tab = tabs[0];
    const url = new URL(tab.url);
    const hostname = url.hostname;

    chrome.storage.local.get(['focusMode', 'focusData', 'dailyGoal'], (data) => {
      const focusMode = data.focusMode || { active: false };
      const focusData = data.focusData || {};
      const dailyGoal = data.dailyGoal || { hours: 2, minutes: 0 };

      if (!focusMode.active) return;

      // Track time on current site
      if (!siteTimeTracking[hostname]) {
        siteTimeTracking[hostname] = 0;
      }
      siteTimeTracking[hostname] += 1;

      const isDistraction = isDistraction(hostname);
      const timeOnSite = siteTimeTracking[hostname];
      const focusScore = calculateFocusScore(focusData);

      // NUDGE 1: Spending too long on distraction site
      if (isDistraction && timeOnSite > 1200 && (!lastNudgeTime[hostname] || Date.now() - lastNudgeTime[hostname] > 600000)) {
        const minutes = Math.floor(timeOnSite / 60);
        chrome.runtime.sendMessage({
          action: 'showNudge',
          message: `You've been on ${hostname.split('.')[0]} for ${minutes} minutes. Switch back to work?`,
          type: 'distraction'
        }).catch(() => {});
        
        speakNotification(`You've been on ${hostname.split('.')[0]} for ${minutes} minutes. Consider switching back to work.`);
        lastNudgeTime[hostname] = Date.now();
      }

      // NUDGE 2: Focus score dropping
      if (focusScore < 40 && (!lastNudgeTime['score'] || Date.now() - lastNudgeTime['score'] > 900000)) {
        chrome.runtime.sendMessage({
          action: 'showNudge',
          message: `Your focus score is at ${focusScore}%. Would you like a 5-minute break?`,
          type: 'break'
        }).catch(() => {});

        speakNotification(`Your focus score is dropping. Would you like a 5-minute break?`);
        lastNudgeTime['score'] = Date.now();
      }

      // NUDGE 3: Goal progress update
      const goalSeconds = (dailyGoal.hours * 3600) + (dailyGoal.minutes * 60);
      const progress = Math.round((focusData.totalFocusTime / goalSeconds) * 100);
      
      if (progress > 0 && progress % 25 === 0 && (!lastNudgeTime['progress'] || Date.now() - lastNudgeTime['progress'] > 1800000)) {
        chrome.runtime.sendMessage({
          action: 'showNudge',
          message: `Great job! You're ${progress}% of the way to your goal!`,
          type: 'positive'
        }).catch(() => {});

        speakNotification(`Great job! You're ${progress} percent of the way to your goal!`);
        lastNudgeTime['progress'] = Date.now();
      }
    });
  });
}

function calculateFocusScore(focusData) {
  const totalTime = (focusData.totalFocusTime || 0) + (focusData.distractionTime || 0);
  return totalTime > 0 ? Math.round((focusData.totalFocusTime / totalTime) * 100) : 0;
}

// Check for nudges every 60 seconds
setInterval(checkProactiveNudges, 60000);

// ===== READING MODE =====

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enableReadingMode') {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'activateReadingMode'
    });
  }
  
  if (request.action === 'summarizePage') {
    // Get page content and send to popup for summarization
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'getPageContent'
    }, (response) => {
      if (response && response.content) {
        sendResponse({ summary: generateSummary(response.content) });
      }
    });
    return true;
  }

  if (request.action === 'textToSpeech') {
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    sendResponse({ status: 'speaking' });
  }
});

function generateSummary(content) {
  // Simple extractive summarization (can be replaced with AI API)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const summaryLength = Math.ceil(sentences.length / 3);
  return sentences.slice(0, summaryLength).join('. ') + '.';
}

// Initialize everything
initializeData();
scheduleDailyReset();