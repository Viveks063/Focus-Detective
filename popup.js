// DOM Elements
const setGoalBtn = document.getElementById('setGoalBtn');
const goalText = document.getElementById('goalText');
const goalProgress = document.getElementById('goalProgress');
const goalProgressBar = document.getElementById('goalProgressBar');
const goalStatus = document.getElementById('goalStatus');
const goalStreakCurrent = document.getElementById('goalStreakCurrent');
const goalStreakBest = document.getElementById('goalStreakBest');
const goalCompletedTotal = document.getElementById('goalCompletedTotal');
const weeklyGoalsBtn = document.getElementById('weeklyGoalsBtn');
const weeklyGoalsContent = document.getElementById('weeklyGoalsContent');
const currentSiteEl = document.getElementById('currentSite');
const currentSiteTimeEl = document.getElementById('currentSiteTime');
const currentSiteTypeEl = document.getElementById('currentSiteType');
const sitesList = document.getElementById('sitesList');

const blockedCounter = document.getElementById('blockedCounter');
const weeklyReportBtn = document.getElementById('weeklyReportBtn');
const weeklyReport = document.getElementById('weeklyReport');

const contrastToggle = document.getElementById('contrastToggle');
const dyslexiaToggle = document.getElementById('dyslexiaToggle');
const motionToggle = document.getElementById('motionToggle');
const soundToggle = document.getElementById('soundToggle');

const mainDashboard = document.getElementById('mainDashboard');
const modeBtns = document.querySelectorAll('.mode-btn');
const nudgeBoxEl = document.getElementById('nudgeBox');

const aiInputText = document.getElementById('aiInputText');
const summarizeTextBtn = document.getElementById('summarizeTextBtn');
const rewriteTextBtn = document.getElementById('rewriteTextBtn');
const improveTextBtn = document.getElementById('improveTextBtn');
const simplifyTextBtn = document.getElementById('simplifyTextBtn');
const aiOutputText = document.getElementById('aiOutputText');
const aiStatus = document.getElementById('aiStatus');

const voiceStartBtn = document.getElementById('voiceStartBtn');
const voiceStatus = document.getElementById('voiceStatus');
const voiceTranscript = document.getElementById('voiceTranscript');

let accessibility = {
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
  soundAlerts: true,
  simpleMode: false
};

let timerInterval = null;
document.getElementById('readingModeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'activateReadingMode' });
    }
  });
});

function showNudge(message, type = 'warning') {
  if (!nudgeBoxEl) return;
  nudgeBoxEl.textContent = message;
  nudgeBoxEl.className = `nudge-box ${type}`;
  nudgeBoxEl.style.display = 'block';
  setTimeout(() => {
    nudgeBoxEl.style.display = 'none';
  }, 5000);
}

// ===== LIVE TIMER & FOCUS MODE =====
let goalAchievedNotified = false;

function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.AudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function updateTimer() {
  chrome.storage.local.get(['focusMode', 'focusSessionStart', 'dailyGoal', 'currentSessionTime'], (data) => {
    const focusMode = data.focusMode || { active: false };
    const focusSessionStart = data.focusSessionStart;
    const dailyGoal = data.dailyGoal || { hours: 2, minutes: 0 };
    const currentSessionTime = data.currentSessionTime || 0;

    const goalSeconds = (dailyGoal.hours * 3600) + (dailyGoal.minutes * 60);

    if (focusMode.active && focusSessionStart) {
      const elapsedSeconds = Math.floor((Date.now() - focusSessionStart) / 1000) + currentSessionTime;
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;

      const goalProgressEl = document.getElementById('goalProgress');
      if (goalProgressEl) {
        const goalHours = Math.floor(goalSeconds / 3600);
        const goalMinutes = Math.floor((goalSeconds % 3600) / 60);
        goalProgressEl.textContent = `${hours}h ${minutes}m ${seconds}s / ${goalHours}h ${goalMinutes}m`;
      }

      const totalFocusTimeEl = document.getElementById('totalFocusTime');
      if (totalFocusTimeEl) {
        totalFocusTimeEl.textContent = `${hours}h ${minutes}m`;
      }

      // Check if goal is reached
      if (elapsedSeconds >= goalSeconds && !goalAchievedNotified) {
        goalAchievedNotified = true;
        playNotificationSound();
        showNudge('🎉 Goal achieved! Great work!', 'good');
      }
    } else {
      const totalTime = currentSessionTime;
      const hours = Math.floor(totalTime / 3600);
      const minutes = Math.floor((totalTime % 3600) / 60);
      const seconds = totalTime % 60;

      const goalProgressEl = document.getElementById('goalProgress');
      if (goalProgressEl) {
        const goalHours = Math.floor(goalSeconds / 3600);
        const goalMinutes = Math.floor((goalSeconds % 3600) / 60);
        goalProgressEl.textContent = `${hours}h ${minutes}m ${seconds}s / ${goalHours}h ${goalMinutes}m`;
      }

      const totalFocusTimeEl = document.getElementById('totalFocusTime');
      if (totalFocusTimeEl) {
        totalFocusTimeEl.textContent = `${hours}h ${minutes}m`;
      }
    }
  });
}

function initTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 500);
  updateTimer();
}

document.getElementById('startFocusBtn').addEventListener('click', () => {
  goalAchievedNotified = false;
  const sessionStartTime = Date.now();
  console.log('START FOCUS clicked - sessionStartTime:', sessionStartTime);
  
  chrome.storage.local.get('currentSessionTime', (data) => {
    const currentSessionTime = data.currentSessionTime || 0;
    
    chrome.storage.local.set({ 
      focusMode: { active: true },
      focusSessionStart: sessionStartTime,
      currentSessionTime: currentSessionTime
    });
    document.getElementById('startFocusBtn').style.display = 'none';
    document.getElementById('stopFocusBtn').style.display = 'inline-block';
    document.getElementById('resetFocusBtn').style.display = 'inline-block';
    updateTimer();
    updateDashboard();
  });
});

document.getElementById('stopFocusBtn').addEventListener('click', () => {
  console.log('STOP FOCUS clicked');
  chrome.storage.local.get(['focusSessionStart', 'currentSessionTime'], (data) => {
    const focusSessionStart = data.focusSessionStart;
    const currentSessionTime = data.currentSessionTime || 0;
    
    if (focusSessionStart) {
      const elapsedSeconds = Math.floor((Date.now() - focusSessionStart) / 1000);
      const newTotalSessionTime = currentSessionTime + elapsedSeconds;
      
      console.log('Elapsed this session:', elapsedSeconds, 'Total session time:', newTotalSessionTime);
      
      chrome.storage.local.get('focusData', (storageData) => {
        const focusData = storageData.focusData || { totalFocusTime: 0 };
        focusData.totalFocusTime = (focusData.totalFocusTime || 0) + elapsedSeconds;
        
        chrome.storage.local.set({ 
          focusData,
          focusMode: { active: false },
          focusSessionStart: null,
          currentSessionTime: newTotalSessionTime
        });
        document.getElementById('startFocusBtn').style.display = 'inline-block';
  document.getElementById('stopFocusBtn').style.display = 'none';
  document.getElementById('resetFocusBtn').style.display = 'none';
        updateTimer();
        updateDashboard();
      });
    }
  });

  goalAchievedNotified = false;
});

// ===== RESET TIMER BUTTON =====
const resetFocusBtn = document.getElementById('resetFocusBtn');
if (resetFocusBtn) {
  resetFocusBtn.addEventListener('click', () => {
    console.log('RESET TIMER clicked');
    
    chrome.storage.local.set({
      focusSessionStart: null,
      focusMode: { active: false },
      currentSessionTime: 0
    });
    
    goalAchievedNotified = false;
    updateTimer();
    updateDashboard();
    showNudge('🔄 Timer reset! Ready for a fresh start.', 'good');
  });
}

document.getElementById('readingModeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleReading' }).catch(() => {});
    }
  });
});

initTimer();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    updateTimer();
    updateDashboard();
  }
});

// ===== SITES DISPLAY =====
function updateSitesDisplay() {
  chrome.storage.local.get(['currentSite', 'focusData'], (data) => {
    const currentSite = data.currentSite || {};
    const focusData = data.focusData || {};

    if (currentSite.url) {
      try {
        const url = new URL(currentSite.url);
        const domain = url.hostname;
        currentSiteEl.textContent = domain;
        currentSiteEl.title = currentSite.url;
        
        const timeSpent = currentSite.timeOnSite || 0;
        const mins = Math.floor(timeSpent / 60);
        currentSiteTimeEl.textContent = `Time on this site: ${mins}m`;

        const isDistraction = currentSite.isDistraction;
        let typeHTML = '';
        if (isDistraction !== undefined) {
          typeHTML = `<div class="site-type ${isDistraction ? 'distraction' : 'productive'}">
            ${isDistraction ? '⚠️ Distraction' : '✅ Productive'}
          </div>`;
        }
        currentSiteTypeEl.innerHTML = typeHTML;
      } catch (e) {
        currentSiteEl.textContent = 'Invalid URL';
        currentSiteTimeEl.textContent = '';
        currentSiteTypeEl.innerHTML = '';
      }
    } else {
      currentSiteEl.textContent = 'Not detected';
      currentSiteTimeEl.textContent = '';
      currentSiteTypeEl.innerHTML = '';
    }

    const sites = focusData.sites || {};
    
    if (Object.keys(sites).length === 0) {
      sitesList.innerHTML = '<div class="empty-state">No sites tracked yet. Start a focus session!</div>';
    } else {
      const sortedSites = Object.entries(sites)
        .sort((a, b) => b[1].time - a[1].time);

      sitesList.innerHTML = sortedSites.map(([site, data]) => {
        const mins = Math.floor(data.time / 60);
        const secs = data.time % 60;
        const isDistraction = data.isDistraction;
        const typeClass = isDistraction ? 'distraction' : 'productive';
        const typeIcon = isDistraction ? '⚠️' : '✅';
        
        return `
          <div class="site-item ${typeClass}">
            <div>
              <div class="site-name">${site}</div>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">${typeIcon} ${isDistraction ? 'Distraction' : 'Productive'}</div>
            </div>
            <div class="site-duration">${mins}m ${secs}s</div>
          </div>
        `;
      }).join('');
    }
  });
}

updateSitesDisplay();
setInterval(updateSitesDisplay, 1000);

// ===== GOALS & PROGRESS TRACKING =====
function updateGoalDisplay() {
  chrome.storage.local.get(['dailyGoal', 'currentSessionTime', 'goalStats'], (data) => {
    const goal = data.dailyGoal || { hours: 2, minutes: 0 };
    const currentSessionTime = data.currentSessionTime || 0;
    const goalStats = data.goalStats || { currentStreak: 0, bestStreak: 0, totalCompleted: 0 };
    
    const goalSeconds = (goal.hours * 3600) + (goal.minutes * 60);
    const currentSeconds = currentSessionTime;
    
    goalText.textContent = `Goal: ${goal.hours}h ${goal.minutes}m of focus`;
    
    const currentHours = Math.floor(currentSeconds / 3600);
    const currentMinutes = Math.floor((currentSeconds % 3600) / 60);
    const goalHours = Math.floor(goalSeconds / 3600);
    const goalMinutes = Math.floor((goalSeconds % 3600) / 60);
    
    goalProgress.textContent = `${currentHours}h ${currentMinutes}m / ${goalHours}h ${goalMinutes}m`;
    
    const percentage = Math.min(100, Math.round((currentSeconds / goalSeconds) * 100));
    goalProgressBar.style.width = percentage + '%';
    
    if (percentage >= 100) {
      goalStatus.textContent = '🎉 Goal completed! Amazing work!';
      goalStatus.style.color = '#27ae60';
      goalStatus.style.fontWeight = 'bold';
      
      const today = new Date().toDateString();
      if (!goalStats.lastCompleted || goalStats.lastCompleted !== today) {
        goalStats.currentStreak += 1;
        if (goalStats.currentStreak > goalStats.bestStreak) {
          goalStats.bestStreak = goalStats.currentStreak;
        }
        goalStats.totalCompleted += 1;
        goalStats.lastCompleted = today;
        chrome.storage.local.set({ goalStats });
        
        showNudge('🎉 Daily goal completed! Streak: ' + goalStats.currentStreak + ' days!', 'good');
      }
    } else if (percentage >= 75) {
      goalStatus.textContent = '🔥 Almost there! Keep pushing!';
      goalStatus.style.color = '#f39c12';
    } else if (percentage >= 50) {
      goalStatus.textContent = '💪 Halfway there! You got this!';
      goalStatus.style.color = '#3498db';
    } else if (percentage >= 25) {
      goalStatus.textContent = '🚀 Good start! Keep going!';
      goalStatus.style.color = '#667eea';
    } else {
      goalStatus.textContent = 'Keep going! You got this 💪';
      goalStatus.style.color = '#666';
    }
    
    goalStreakCurrent.textContent = goalStats.currentStreak;
    goalStreakBest.textContent = goalStats.bestStreak;
    goalCompletedTotal.textContent = goalStats.totalCompleted;
  });
}

if (setGoalBtn) {
  setGoalBtn.addEventListener('click', () => {
    const hours = prompt('Enter hours goal (0-24):', '2');
    const minutes = prompt('Enter minutes goal (0-59):', '0');
    
    if (hours !== null && minutes !== null && !isNaN(hours) && !isNaN(minutes)) {
      const h = Math.max(0, Math.min(24, parseInt(hours)));
      const m = Math.max(0, Math.min(59, parseInt(minutes)));
      
      chrome.storage.local.set({ 
        dailyGoal: { hours: h, minutes: m } 
      }, () => {
        showNudge(`✅ Goal set: ${h}h ${m}m daily focus!`, 'good');
        updateGoalDisplay();
      });
    }
  });
}

if (weeklyGoalsBtn) {
  weeklyGoalsBtn.addEventListener('click', () => {
    chrome.storage.local.get(['goalStats', 'weeklyGoalData'], (data) => {
      const stats = data.goalStats || { totalCompleted: 0, currentStreak: 0, bestStreak: 0 };
      const weeklyData = data.weeklyGoalData || {};
      
      let report = '<strong>📊 This Week\'s Performance:</strong><br><br>';
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let completedDays = 0;
      
      days.forEach(day => {
        const completed = weeklyData[day] || false;
        if (completed) completedDays++;
        const icon = completed ? '✅' : '❌';
        report += `${icon} ${day}: ${completed ? 'Completed' : 'Not completed'}<br>`;
      });
      
      report += `<br><strong>Week Summary:</strong><br>`;
      report += `• Days completed: ${completedDays}/7<br>`;
      report += `• Current streak: ${stats.currentStreak} days<br>`;
      report += `• Best streak: ${stats.bestStreak} days<br>`;
      report += `• Lifetime goals: ${stats.totalCompleted}<br><br>`;
      
      if (completedDays >= 5) {
        report += '<strong>🔥 Amazing week! You are crushing it!</strong>';
      } else if (completedDays >= 3) {
        report += '<strong>👍 Good week! Keep the momentum!</strong>';
      } else {
        report += '<strong>💪 Let us aim higher next week!</strong>';
      }
      
      weeklyGoalsContent.innerHTML = report;
    });
  });
}

// ===== CHROME BUILT-IN AI CHALLENGE 2025 =====
// Intelligent Writing & Reading Assistant with Client-Side Privacy

// Helper function for UI feedback (you might have your own)
function showNudge(message, type = 'info') {
    console.log(`Nudge (${type}): ${message}`);
    // Replace with your actual UI notification logic
    if (aiStatus) aiStatus.textContent = message;
}

async function checkAIAvailability() {
    if (!aiStatus) return; // Exit if status element doesn't exist

    try {
        let statusHTML = '🧠 Chrome Built-in AI Status:<br>';
        const apis = {};

        // --- CHECK CORE API (LanguageModel) ---
        // This is the main check now, replacing window.ai
        if (typeof window.LanguageModel === 'undefined') {
            aiStatus.innerHTML = '❌ Chrome LanguageModel AI not available. Check flags like: chrome://flags/#prompt-api-for-gemini-nano';
            return;
        }

        statusHTML += '✅ Core Client-side AI (LanguageModel) detected (Privacy-First)<br><br>';

        // Check Prompt API (using LanguageModel)
        try {
            const avail = await window.LanguageModel.availability();
            statusHTML += `📝 Prompt API (LanguageModel): ${avail}<br>`;
            apis.prompt = avail;
        } catch (e) {
            statusHTML += `❌ Prompt API (LanguageModel): Error checking availability (${e.message})<br>`;
            apis.prompt = 'error';
        }

        // --- CHECK SPECIFIC TASK APIs ---
        // NOTE: The existence and names of these objects (Proofreader, Summarizer, etc.)
        // MUST be verified against the latest Chrome AI documentation.

        // Check Proofreader API
        if (typeof window.Proofreader !== 'undefined') {
            try {
                const avail = await window.Proofreader.availability();
                statusHTML += `✅ Proofreader API: ${avail}<br>`;
                apis.proofreader = avail;
            } catch (e) {
                statusHTML += `⚠️ Proofreader API: Error checking availability (${e.message})<br>`;
                apis.proofreader = 'error';
            }
        } else {
            statusHTML += `❓ Proofreader API: Not detected (Check latest docs/flags)<br>`;
            apis.proofreader = 'not_detected';
        }

        // Check Summarizer API
        if (typeof window.Summarizer !== 'undefined') {
            try {
                const avail = await window.Summarizer.availability();
                statusHTML += `📄 Summarizer API: ${avail}<br>`;
                apis.summarizer = avail;
            } catch (e) {
                statusHTML += `⚠️ Summarizer API: Error checking availability (${e.message})<br>`;
                apis.summarizer = 'error';
            }
        } else {
            statusHTML += `❓ Summarizer API: Not detected (Check latest docs/flags)<br>`;
            apis.summarizer = 'not_detected';
        }

        // Check Translator API
        if (typeof window.Translator !== 'undefined') {
            try {
                const avail = await window.Translator.availability();
                statusHTML += `🌐 Translator API: ${avail}<br>`;
                apis.translator = avail;
            } catch (e) {
                statusHTML += `⚠️ Translator API: Error checking availability (${e.message})<br>`;
                apis.translator = 'error';
            }
        } else {
            statusHTML += `❓ Translator API: Not detected (Check latest docs/flags)<br>`;
            apis.translator = 'not_detected';
        }

        // Check Writer API
        if (typeof window.Writer !== 'undefined') {
            try {
                const avail = await window.Writer.availability();
                statusHTML += `✏️ Writer API: ${avail}<br>`;
                apis.writer = avail;
            } catch (e) {
                statusHTML += `⚠️ Writer API: Error checking availability (${e.message})<br>`;
                apis.writer = 'error';
            }
        } else {
            statusHTML += `❓ Writer API: Not detected (Check latest docs/flags)<br>`;
            apis.writer = 'not_detected';
        }

        // Check Rewriter API
        if (typeof window.Rewriter !== 'undefined') {
            try {
                const avail = await window.Rewriter.availability();
                statusHTML += `🖊️ Rewriter API: ${avail}<br>`;
                apis.rewriter = avail;
            } catch (e) {
                statusHTML += `⚠️ Rewriter API: Error checking availability (${e.message})<br>`;
                apis.rewriter = 'error';
            }
        } else {
            statusHTML += `❓ Rewriter API: Not detected (Check latest docs/flags)<br>`;
            apis.rewriter = 'not_detected';
        }

        statusHTML += `<br>🔒 Processing happens locally if API status is 'available'!`;
        aiStatus.innerHTML = statusHTML;

        // Optionally store the availability status globally if needed
        window.chromeAIApis = apis;

    } catch (e) {
        aiStatus.innerHTML = `❌ Global Error Checking AI Availability: ${e.message}`;
        console.error("Global AI Check Error:", e);
    }
}

// Run the check shortly after the page loads
setTimeout(checkAIAvailability, 1000);


// ===== EVENT LISTENERS (Refactored) =====

// --- PROOFREADER API ---
// const proofreadTextBtn = document.getElementById('proofreadTextBtn'); {
//     proofreadTextBtn.addEventListener('click', async () => {
//         const text = aiInputText?.value;
//         if (!text) {
//             showNudge('❌ Please enter text to proofread', 'warning');
//             return;
//         }

//         if (typeof window.Proofreader === 'undefined') {
//             showNudge('❌ Proofreader API not detected. Check flags/docs.', 'error');
//             return;
//         }

//         aiStatus.textContent = '⏳ Checking Proofreader availability...';
//         proofreadTextBtn.disabled = true;

//         try {
//             const availability = await window.Proofreader.availability();

//             if (availability === 'available') {
//                 aiStatus.textContent = '⏳ Proofreading...';
//                 const proofreader = await window.Proofreader.create(); // Assuming no options needed
//                 const corrected = await proofreader.proofread(text);

//                 aiOutputText.innerHTML = `<strong>✅ Proofread:</strong><br>${corrected}`;
//                 aiOutputText.style.display = 'block';
//                 aiStatus.textContent = '✅ Proofreading complete! 🔒 All done locally.';
//                 proofreader.destroy();

//             } else if (availability === 'downloading' || availability === 'downloadable') {
//                 aiStatus.textContent = '⏳ Proofreader model needs download. Trying to create...';
//                 // Attempt to create, which might trigger download/progress
//                  const proofreader = await window.Proofreader.create({
//                     monitor(m) {
//                         m.addEventListener('downloadprogress', (e) => {
//                              aiStatus.textContent = `⏳ Downloading Proofreader: ${Math.round((e.loaded / e.total) * 100)}%`;
//                          });
//                     }
//                  });
//                  // Re-check after attempting creation, might need user interaction or time
//                  aiStatus.textContent = '⏳ Download initiated (if needed). Please wait and try again.';
//                  // You might want more sophisticated logic here to wait for download completion

//             } else { // 'unavailable' or other states
//                  throw new Error(`Proofreader status: ${availability}`);
//             }
//         } catch (e) {
//             console.error('Proofread error:', e);
//             aiStatus.textContent = `❌ Proofread failed: ${e.message}`;
//             aiOutputText.innerHTML = `⚠️ Proofreader unavailable. Status: ${window.chromeAIApis?.proofreader || 'unknown'}. Check flags/docs.`;
//             aiOutputText.style.display = 'block';
//         } finally {
//              proofreadTextBtn.disabled = false;
//         }
//     });
// }

// --- SUMMARIZER API ---
if (summarizeTextBtn) {
    summarizeTextBtn.addEventListener('click', async () => {
        const text = aiInputText?.value;
        if (!text) {
            showNudge('❌ Please enter text to summarize', 'warning');
            return;
        }

        summarizeTextBtn.disabled = true;
        let summary = '';
        let success = false;
        let usedApi = '';

        // Try dedicated Summarizer API first
        if (typeof window.Summarizer !== 'undefined') {
            aiStatus.textContent = '⏳ Checking Summarizer availability...';
            try {
                const availability = await window.Summarizer.availability();
                if (availability === 'available') {
                    usedApi = 'Summarizer';
                    aiStatus.textContent = '⏳ Summarizing with dedicated API...';
                     const summarizer = await window.Summarizer.create();
                     summary = await summarizer.summarize(text);
                     summarizer.destroy();
                     success = true;
                } else if (availability === 'downloading' || availability === 'downloadable') {
                    aiStatus.textContent = '⏳ Summarizer model needs download. Trying fallback...';
                    // Trigger download attempt for next time, but use fallback now
                     window.Summarizer.create({ monitor(m){ m.addEventListener('downloadprogress', e => {}); } }).catch(()=>{});
                } else {
                     aiStatus.textContent = `⚠️ Summarizer status: ${availability}. Trying fallback...`;
                }
            } catch (e) {
                 console.error('Summarizer API check/use error:', e);
                 aiStatus.textContent = '⚠️ Summarizer API error. Trying fallback...';
            }
        } else {
             aiStatus.textContent = '❓ Summarizer API not detected. Trying fallback...';
        }

        // Fallback to LanguageModel (Prompt API) if Summarizer failed or not available
        if (!success && typeof window.LanguageModel !== 'undefined') {
             aiStatus.textContent = '⏳ Checking LanguageModel availability for summary...';
             try {
                 const availability = await window.LanguageModel.availability();
                 if (availability === 'available') {
                     usedApi = 'LanguageModel';
                     aiStatus.textContent = '⏳ Summarizing with LanguageModel...';
                     const session = await window.LanguageModel.create({
                         expectedInputs: [{ type: 'text', languages: ['en'] }], // <-- ADD THIS LINE
                         expectedOutputs: [{ type: 'text', languages: ['en'] }] // <-- ADD THIS LINE
                     });
                     summary = await session.prompt(`Summarize the following text in 2-3 concise sentences:\n\n${text}`);
                     session.destroy();
                     success = true;
                 } else {
                     aiStatus.textContent = `❌ LanguageModel status: ${availability}. Cannot summarize.`;
                 }
             } catch (e) {
                 console.error('LanguageModel fallback error:', e);
                 aiStatus.textContent = `❌ LanguageModel fallback failed: ${e.message}`;
                 // Check for the specific UnknownError crash
                 if (e.name === 'UnknownError' && e.message.includes('generic failures')) {
                    aiOutputText.innerHTML = `⚠️ AI Model crashed during summarization. Try restarting the browser or check for updates.`;
                    aiOutputText.style.display = 'block';
                 }
            }
        }

        // Display result or final error
        if (success) {
            aiOutputText.innerHTML = `<strong>📄 Summary (via ${usedApi}):</strong><br>${summary}`;
            aiOutputText.style.display = 'block';
            aiStatus.textContent = `✅ Summarized successfully via ${usedApi}! 🔒 Local & Private`;
        } else if (!aiOutputText.innerHTML.includes('crashed')) { // Don't overwrite crash message
            aiStatus.textContent = '❌ Summarization unavailable.';
            aiOutputText.innerHTML = `⚠️ No available API (Summarizer or LanguageModel). Check flags/docs.`;
            aiOutputText.style.display = 'block';
        }

        summarizeTextBtn.disabled = false;
    });
}

// --- TRANSLATOR API ---
if (translateTextBtn) {
    translateTextBtn.addEventListener('click', async () => {
        const text = aiInputText?.value;
        const targetLang = document.getElementById('targetLanguage')?.value || 'es'; // Get target lang from dropdown
        if (!text) {
            showNudge('❌ Please enter text to translate', 'warning');
            return;
        }

        if (typeof window.Translator === 'undefined') {
            showNudge('❌ Translator API not detected. Check flags/docs.', 'error');
            return;
        }

        aiStatus.textContent = '⏳ Checking Translator availability...';
        translateTextBtn.disabled = true;

        try {
            const availability = await window.Translator.availability();

            if (availability === 'available') {
                aiStatus.textContent = `⏳ Translating to ${targetLang.toUpperCase()}...`;
                 const translator = await window.Translator.create({ targetLanguage: targetLang });
                 const translated = await translator.translate(text);

                 aiOutputText.innerHTML = `<strong>🌐 Translated (${targetLang.toUpperCase()}):</strong><br>${translated}`;
                 aiOutputText.style.display = 'block';
                 aiStatus.textContent = '✅ Translation complete! 🔒 Private & Offline';
                 translator.destroy();

            } else if (availability === 'downloading' || availability === 'downloadable') {
                 aiStatus.textContent = `⏳ Translator model for ${targetLang.toUpperCase()} needs download. Trying to create...`;
                 // Attempt to create, triggering download
                 const translator = await window.Translator.create({
                     targetLanguage: targetLang,
                     monitor(m) {
                         m.addEventListener('downloadprogress', (e) => {
                             aiStatus.textContent = `⏳ Downloading Translator (${targetLang.toUpperCase()}): ${Math.round((e.loaded / e.total) * 100)}%`;
                         });
                    }
                 });
                 aiStatus.textContent = '⏳ Download initiated (if needed). Please wait and try again.';
            } else {
                 throw new Error(`Translator status: ${availability}`);
            }
        } catch (e) {
            console.error('Translation error:', e);
            aiStatus.textContent = `❌ Translation failed: ${e.message}`;
            aiOutputText.innerHTML = `⚠️ Translator unavailable. Status: ${window.chromeAIApis?.translator || 'unknown'}. Check flags/docs.`;
            aiOutputText.style.display = 'block';
        } finally {
            translateTextBtn.disabled = false;
        }
    });
}

// --- WRITER API (Used for Improve & Simplify) ---
async function useWriterAPI(text, options, buttonElement, actionName) {
    if (!text) {
        showNudge(`❌ Please enter text to ${actionName.toLowerCase()}`, 'warning');
        return;
    }
    if (typeof window.Writer === 'undefined') {
        showNudge(`❌ Writer API not detected for ${actionName}. Check flags/docs.`, 'error');
        return;
    }

    aiStatus.textContent = `⏳ Checking Writer availability for ${actionName}...`;
    buttonElement.disabled = true;

    try {
        const availability = await window.Writer.availability();
        let outputText = '';

        if (availability === 'available') {
             aiStatus.textContent = `⏳ ${actionName}...`;
             const writer = await window.Writer.create(options);
             outputText = await writer.write(text);
             writer.destroy();

             aiOutputText.innerHTML = `<strong>✏️ ${actionName}:</strong><br>${outputText}`;
             aiOutputText.style.display = 'block';
             aiStatus.textContent = `✅ ${actionName} complete! 🔒 100% Local`;

        } else if (availability === 'downloading' || availability === 'downloadable') {
             aiStatus.textContent = `⏳ Writer model needs download for ${actionName}. Trying to create...`;
             const writer = await window.Writer.create({
                ...options, // Include original options
                 monitor(m) {
                     m.addEventListener('downloadprogress', (e) => {
                         aiStatus.textContent = `⏳ Downloading Writer: ${Math.round((e.loaded / e.total) * 100)}%`;
                     });
                }
             });
             aiStatus.textContent = '⏳ Download initiated (if needed). Please wait and try again.';
        } else {
             throw new Error(`Writer status: ${availability}`);
        }
    } catch (e) {
        console.error(`${actionName} error:`, e);
        aiStatus.textContent = `❌ ${actionName} failed: ${e.message}`;
        aiOutputText.innerHTML = `⚠️ Writer API unavailable for ${actionName}. Status: ${window.chromeAIApis?.writer || 'unknown'}. Check flags/docs.`;
        aiOutputText.style.display = 'block';
         // Check for the specific UnknownError crash
         if (e.name === 'UnknownError' && e.message.includes('generic failures')) {
            aiOutputText.innerHTML = `⚠️ AI Model crashed during ${actionName}. Try restarting the browser or check for updates.`;
         }
    } finally {
         buttonElement.disabled = false;
    }
}

if (improveTextBtn) {
    improveTextBtn.addEventListener('click', () => {
        useWriterAPI(aiInputText?.value, { tone: 'professional', length: 'medium' }, improveTextBtn, 'Improved');
    });
}

if (simplifyTextBtn) {
    simplifyTextBtn.addEventListener('click', () => {
        useWriterAPI(aiInputText?.value, { tone: 'casual', length: 'short' }, simplifyTextBtn, 'Simplified');
    });
}


// --- REWRITER API ---
if (rewriteTextBtn) {
    rewriteTextBtn.addEventListener('click', async () => {
        const text = aiInputText?.value;
        if (!text) {
            showNudge('❌ Please enter text to rewrite', 'warning');
            return;
        }

        if (typeof window.Rewriter === 'undefined') {
            showNudge('❌ Rewriter API not detected. Check flags/docs.', 'error');
            return;
        }

        aiStatus.textContent = '⏳ Checking Rewriter availability...';
        rewriteTextBtn.disabled = true;

        try {
            const availability = await window.Rewriter.availability();

            if (availability === 'available') {
                 aiStatus.textContent = '⏳ Rewriting...';
                 const rewriter = await window.Rewriter.create(); // Assuming no options needed
                 const rewritten = await rewriter.rewrite(text); // Assuming method is rewrite

                 aiOutputText.innerHTML = `<strong>🖊️ Rewritten Version:</strong><br>${rewritten}`;
                 aiOutputText.style.display = 'block';
                 aiStatus.textContent = '✅ Alternative generated! 🔒 No cloud services used';
                 rewriter.destroy();

            } else if (availability === 'downloading' || availability === 'downloadable') {
                 aiStatus.textContent = '⏳ Rewriter model needs download. Trying to create...';
                 const rewriter = await window.Rewriter.create({
                     monitor(m) {
                         m.addEventListener('downloadprogress', (e) => {
                             aiStatus.textContent = `⏳ Downloading Rewriter: ${Math.round((e.loaded / e.total) * 100)}%`;
                         });
                     }
                 });
                 aiStatus.textContent = '⏳ Download initiated (if needed). Please wait and try again.';
            } else {
                 throw new Error(`Rewriter status: ${availability}`);
            }
        } catch (e) {
            console.error('Rewrite error:', e);
            aiStatus.textContent = `❌ Rewrite failed: ${e.message}`;
            aiOutputText.innerHTML = `⚠️ Rewriter API unavailable. Status: ${window.chromeAIApis?.rewriter || 'unknown'}. Check flags/docs.`;
            aiOutputText.style.display = 'block';
            // Check for the specific UnknownError crash
             if (e.name === 'UnknownError' && e.message.includes('generic failures')) {
                aiOutputText.innerHTML = `⚠️ AI Model crashed during rewrite. Try restarting the browser or check for updates.`;
             }
        } finally {
            rewriteTextBtn.disabled = false;
        }
    });
}

// ===== TEXT TO SPEECH (READ ALOUD) WITH OFFLINE SUPPORT =====
let currentUtterance = null;

if (readAloudBtn) {
  readAloudBtn.addEventListener('click', () => {
    const text = aiOutputText?.innerText || aiInputText?.value;
    
    if (!text) {
      showNudge('❌ No text to read', 'warning');
      return;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      readAloudBtn.textContent = '🔊 Read Aloud';
      aiStatus.textContent = 'Stopped reading.';
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;

    currentUtterance.onstart = () => {
      readAloudBtn.textContent = '⏸️ Stop Reading';
      aiStatus.textContent = '🔊 Reading aloud... 🔒 Offline audio synthesis';
    };

    currentUtterance.onend = () => {
      readAloudBtn.textContent = '🔊 Read Aloud';
      aiStatus.textContent = '✅ Reading complete!';
    };

    currentUtterance.onerror = (e) => {
      readAloudBtn.textContent = '🔊 Read Aloud';
      aiStatus.textContent = `❌ Error: ${e.error}`;
    };

    speechSynthesis.speak(currentUtterance);
  });
}

// ===== READING MODE WITH CHROME AI =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enableReadingMode') {
    chrome.tabs.sendMessage(sender.tab.id, { action: 'activateReadingMode' });
  }

  if (request.action === 'summarizePage') {
    chrome.tabs.sendMessage(sender.tab.id, { action: 'getPageContent' }, async (response) => {
      if (response && response.content) {
        try {
          let summary;
          if (window.ai && window.ai.summarizer) {
            const summarizer = await window.ai.summarizer.create();
            summary = await summarizer.summarize(response.content);
            summarizer.destroy();
          } else if (window.ai && window.ai.languageModel) {
            const session = await window.ai.languageModel.create();
            summary = await session.prompt(`Summarize this article:\n\n${response.content}`);
            session.destroy();
          }
          sendResponse({ summary });
        } catch (e) {
          sendResponse({ error: e.message });
        }
      }
    });
    return true;
  }

  if (request.action === 'textToSpeech') {
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    sendResponse({ status: 'speaking 🔒 locally' });
  }
});

// ===== PRIVACY & OFFLINE STATUS =====
console.log('✅ Writing Assistant loaded with Chrome Built-in AI APIs');
console.log('🔒 Privacy Status: Client-side processing enabled');
console.log('📡 Network Status: Works offline & online');
console.log('⚡ Performance: No API costs, no server dependency');

// ===== VOICE COMMANDS =====
let recognition;
let isListeningVoice = false;

if (voiceStartBtn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceStartBtn.addEventListener('click', async () => {
      if (!isListeningVoice) {
        try {
          recognition.start();
          isListeningVoice = true;
          voiceStartBtn.textContent = '🔴 Listening...';
          voiceStartBtn.style.background = '#e74c3c';
          voiceStatus.textContent = '🎤 Listening for commands... Speak now!';
          voiceStatus.style.background = '#ffe6e6';
        } catch (err) {
          voiceStatus.textContent = '❌ Could not start voice recognition';
          voiceTranscript.textContent = 'Note: Voice commands work best in Chrome. Make sure microphone is enabled.';
          console.error('Voice start error:', err);
        }
      } else {
        recognition.stop();
        isListeningVoice = false;
        voiceStartBtn.textContent = '🎤 Start Listening';
        voiceStartBtn.style.background = '';
        voiceStatus.textContent = 'Say: "Start focus", "Stop focus", "Set goal", "Show stats"';
        voiceStatus.style.background = '#f0f4ff';
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      voiceTranscript.textContent = `You said: "${transcript}"`;
      voiceTranscript.style.color = '#333';
      
      if (transcript.includes('start focus')) {
        chrome.storage.local.set({ focusMode: { active: true }, focusSessionStart: Date.now() });
        showNudge('✅ Focus Mode started via voice!', 'good');
        voiceStatus.textContent = '✅ Started Focus Mode!';
      } else if (transcript.includes('stop focus')) {
        chrome.storage.local.set({ focusMode: { active: false } });
        showNudge('✅ Focus Mode stopped via voice!', 'good');
        voiceStatus.textContent = '✅ Stopped Focus Mode!';
      } else if (transcript.includes('set goal')) {
        showNudge('🎯 Opening goal settings...', 'good');
        voiceStatus.textContent = '🎯 Click "Set Goal" button to configure';
      } else if (transcript.includes('show stats') || transcript.includes('my stats')) {
        showNudge('📊 Stats are displayed in the dashboard!', 'good');
        voiceStatus.textContent = '📊 Check your dashboard below!';
      } else {
        voiceStatus.textContent = '❓ Command not recognized. Try: "start focus", "stop focus"';
      }

      isListeningVoice = false;
      voiceStartBtn.textContent = '🎤 Start Listening';
      voiceStartBtn.style.background = '';
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        voiceStatus.textContent = '❌ Microphone access denied. Check browser permissions.';
      } else if (event.error === 'no-speech') {
        voiceStatus.textContent = '❌ No speech detected. Try again.';
      } else if (event.error === 'network') {
        voiceStatus.textContent = '❌ Network error. Check your connection.';
      } else {
        voiceStatus.textContent = '❌ Voice error: ' + event.error;
      }
      
      isListeningVoice = false;
      voiceStartBtn.textContent = '🎤 Start Listening';
      voiceStartBtn.style.background = '';
    };

    recognition.onend = () => {
      isListeningVoice = false;
      voiceStartBtn.textContent = '🎤 Start Listening';
      voiceStartBtn.style.background = '';
    };
  } else {
    voiceStatus.textContent = '❌ Voice recognition not supported in your browser';
    voiceStartBtn.disabled = true;
  }
}

// ===== DISTRACTION COUNTER =====
function updateBlockedCounter() {
  chrome.storage.local.get('blockedAttempts', (data) => {
    const blocked = data.blockedAttempts || 0;
    blockedCounter.textContent = blocked;
  });
}

if (weeklyReportBtn) {
  weeklyReportBtn.addEventListener('click', () => {
    chrome.storage.local.get('weeklyStats', (data) => {
      const stats = data.weeklyStats || {};
      
      let report = '<strong>📊 This Week:</strong><br>';
      let totalBlocked = 0;
      
      for (const day in stats) {
        const count = stats[day];
        totalBlocked += count;
        report += `${day}: ${count} blocked attempts<br>`;
      }
      
      report += `<br><strong>Total:</strong> ${totalBlocked} blocked attempts<br>`;
      report += `<strong>Improvement:</strong> You avoided ${totalBlocked} distracting sites! 🎉`;
      
      document.getElementById('reportContent').innerHTML = report;
      weeklyReport.style.display = 'block';
    });
  });
}

// ===== ACCESSIBILITY TOGGLES =====
function toggleContrast() {
  accessibility.highContrast = !accessibility.highContrast;
  contrastToggle.classList.toggle('on');
  
  if (accessibility.highContrast) {
    document.body.style.background = '#000';
    document.querySelectorAll('.card').forEach(card => {
      card.style.background = '#111';
      card.style.color = '#ffff00';
    });
  } else {
    document.body.style.background = '';
    document.querySelectorAll('.card').forEach(card => {
      card.style.background = '';
      card.style.color = '';
    });
  }
}

function toggleDyslexia() {
  accessibility.dyslexiaFont = !accessibility.dyslexiaFont;
  dyslexiaToggle.classList.toggle('on');
  
  if (accessibility.dyslexiaFont) {
    document.body.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    document.body.style.letterSpacing = '0.05em';
  } else {
    document.body.style.fontFamily = '';
    document.body.style.letterSpacing = '';
  }
}

function toggleMotion() {
  accessibility.reduceMotion = !accessibility.reduceMotion;
  motionToggle.classList.toggle('on');
  
  if (accessibility.reduceMotion) {
    document.body.style.animation = 'none !important';
    document.querySelectorAll('*').forEach(el => {
      el.style.transition = 'none !important';
    });
  }
}

function toggleSound() {
  accessibility.soundAlerts = !accessibility.soundAlerts;
  soundToggle.classList.toggle('on');
}

function toggleSimpleMode() {
  accessibility.simpleMode = !accessibility.simpleMode;
  if (accessibility.simpleMode) {
    mainDashboard.classList.add('hidden');
    document.getElementById('pomodoroCard').style.order = '1';
  } else {
    mainDashboard.classList.remove('hidden');
  }
}

contrastToggle.addEventListener('click', toggleContrast);
dyslexiaToggle.addEventListener('click', toggleDyslexia);
motionToggle.addEventListener('click', toggleMotion);
soundToggle.addEventListener('click', toggleSound);

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (btn.dataset.mode === 'simple') {
      toggleSimpleMode();
    } else {
      accessibility.simpleMode = false;
      mainDashboard.classList.remove('hidden');
    }
  });
});

// ===== MAIN DASHBOARD =====

function updateAchievements(streaks, score) {
  let achievements = '';
  if (score >= 80) achievements += '🎯 ';
  if ((streaks.current || 0) >= 3) achievements += '🔥 ';
  if ((streaks.current || 0) >= 7) achievements += '⭐ ';
  
  document.getElementById('achievements').textContent = achievements || '🚀 Keep grinding!';
}

function generateInsights(focusData, streaks, score) {
  const insightsBox = document.getElementById('insightsBox');
  let insights = '';

  const totalTime = (focusData.totalFocusTime || 0) + (focusData.distractionTime || 0);

  if (score > 80) {
    insights += `<p>🎯 <strong>Excellent Focus!</strong> You're crushing it with ${score}% focus. You're in the top tier today!</p>`;
  } else if (score > 60) {
    insights += `<p>👍 <strong>Good Focus.</strong> You maintained ${score}% focus. Keep this momentum!</p>`;
  } else if (score > 40) {
    insights += `<p>⚠️ <strong>Room to Improve.</strong> Your focus is at ${score}%. Try using Pomodoro timer for better results.</p>`;
  } else if (totalTime > 0) {
    insights += `<p>📉 <strong>Low Focus Today.</strong> Only ${score}% focused. Take a break and reset!</p>`;
  } else {
    insights += `<p>🚀 <strong>Ready to Start?</strong> Begin a focus session to track your productivity!</p>`;
  }

  const tabSwitches = focusData.tabSwitches || 0;
  if (tabSwitches < 5) {
    insights += `<p>✅ <strong>Minimal Distractions!</strong> Only ${tabSwitches} tab switches. Excellent attention control!</p>`;
  } else if (tabSwitches < 15) {
    insights += `<p>💡 <strong>Moderate Switching.</strong> ${tabSwitches} tab switches detected. Try batching tasks together!</p>`;
  } else {
    insights += `<p>🔴 <strong>High Tab Switching.</strong> ${tabSwitches} switches found. Consider using Focus Mode to minimize distractions.</p>`;
  }

  const currentStreak = streaks.current || 0;
  const bestStreak = streaks.best || 0;
  if (currentStreak > 0) {
    insights += `<p>🔥 <strong>Streak Active!</strong> You're on a ${currentStreak}-day focus streak! Your best is ${bestStreak} days. Keep it up!</p>`;
  } else if (totalTime > 3600) {
    insights += `<p>🚀 <strong>Start Your Streak!</strong> You've already done ${Math.floor(totalTime / 3600)}+ hours today. One more hour to start a streak!</p>`;
  } else {
    insights += `<p>💪 <strong>New Streak Opportunity!</strong> Get 1+ hour of focus today to start building a streak!</p>`;
  }

  const focusHours = Math.floor((focusData.totalFocusTime || 0) / 3600);
  const focusMinutes = Math.floor(((focusData.totalFocusTime || 0) % 3600) / 60);
  if (focusHours > 0) {
    insights += `<p>📊 <strong>Today's Work:</strong> You've focused for ${focusHours}h ${focusMinutes}m. Great productivity!</p>`;
  }

  if (score < 50 && tabSwitches > 10) {
    insights += `<p>💡 <strong>Recommendation:</strong> Use Pomodoro timer + Focus Mode together for maximum focus.</p>`;
  } else if (score > 70) {
    insights += `<p>⭐ <strong>You're Awesome!</strong> Keep maintaining this focus level. You're building great habits!</p>`;
  }

  insightsBox.innerHTML = insights;
}

function generateAchievementsList(streaks, score, totalFocusTime) {
  const achievementsDiv = document.getElementById('achievementsDetailed');
  let achievements = '<div style="font-size: 28px; margin: 10px 0;">';
  let descriptions = '<div style="font-size: 11px; color: #666; margin-top: 10px;">';

  let unlockedCount = 0;

  if (score >= 80) {
    achievements += '🎯 ';
    descriptions += '<p>🎯 <strong>Focus Master:</strong> 80% focus score</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  if (totalFocusTime >= 3600) {
    achievements += '💪 ';
    descriptions += '<p>💪 <strong>Iron Will:</strong> 1+ hour focused</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  if (totalFocusTime >= 7200) {
    achievements += '🚀 ';
    descriptions += '<p>🚀 <strong>Productivity Beast:</strong> 2+ hours focused</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  if ((streaks.current || 0) >= 3) {
    achievements += '🔥 ';
    descriptions += '<p>🔥 <strong>On Fire:</strong> 3-day focus streak</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  if ((streaks.current || 0) >= 7) {
    achievements += '⭐ ';
    descriptions += '<p>⭐ <strong>Weekly Warrior:</strong> 7-day focus streak</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  if ((document.getElementById('tabSwitches')?.textContent || '0') < 5) {
    achievements += '🎪 ';
    descriptions += '<p>🎪 <strong>Tab Minimalist:</strong> Less than 5 tab switches</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  achievements += '</div>';
  descriptions += '</div>';

  achievementsDiv.innerHTML = achievements + descriptions + `<p style="color: #667eea; font-weight: bold; margin-top: 10px;">${unlockedCount} achievements unlocked!</p>`;
}

function generateSessionSummary(focusData) {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryBox = document.getElementById('summaryBox');

  summarizeBtn.textContent = '⏳ Generating...';
  summarizeBtn.disabled = true;

  setTimeout(() => {
    const sortedSites = Object.entries(focusData.sites || {})
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 10);

    const productiveSites = sortedSites.filter(([, data]) => !data.isDistraction);
    const distractionSites = sortedSites.filter(([, data]) => data.isDistraction);

    const totalTime = (focusData.totalFocusTime || 0) + (focusData.distractionTime || 0);
    const focusScore = totalTime > 0 ? Math.round((focusData.totalFocusTime / totalTime) * 100) : 0;

    let summary = `<strong>📊 Your Session Summary</strong><br><br>`;
    
    summary += `<strong>⏱️ Time Breakdown:</strong><br>`;
    summary += `• Focus Time: ${Math.floor((focusData.totalFocusTime || 0) / 60)}m<br>`;
    summary += `• Distraction Time: ${Math.floor((focusData.distractionTime || 0) / 60)}m<br>`;
    summary += `• Focus Score: ${focusScore}%<br>`;
    summary += `• Tab Switches: ${focusData.tabSwitches || 0}<br><br>`;

    summary += `<strong>📚 Top Productive Sites:</strong><br>`;
    if (productiveSites.length > 0) {
      productiveSites.slice(0, 3).forEach(([site, data]) => {
        summary += `• ${site}: ${Math.floor(data.time / 60)}m<br>`;
      });
    } else {
      summary += `• None tracked<br>`;
    }

    summary += `<br><strong>📱 Top Distractions:</strong><br>`;
    if (distractionSites.length > 0) {
      distractionSites.slice(0, 3).forEach(([site, data]) => {
        summary += `• ${site}: ${Math.floor(data.time / 60)}m<br>`;
      });
    } else {
      summary += `• None (Great job!)<br>`;
    }

    summary += `<br><strong>💡 AI Insight:</strong><br>`;
    if (focusScore > 70) {
      summary += `Excellent session! You're maintaining great focus. Keep this up! 🎯`;
    } else if (focusScore > 50) {
      summary += `Good effort! Try reducing distraction site visits to boost your score. 💪`;
    } else if (focusScore > 0) {
      summary += `Use Focus Mode + Pomodoro timer together for next session. You got this! 🚀`;
    } else {
      summary += `Start a focus session to track your productivity! 🎯`;
    }

    summaryBox.innerHTML = summary;
    summaryBox.style.display = 'block';
    summarizeBtn.textContent = '📊 Generate Summary';
    summarizeBtn.disabled = false;
  }, 500);
}

document.getElementById('summarizeBtn').addEventListener('click', () => {
  chrome.storage.local.get('focusData', (data) => {
    generateSessionSummary(data.focusData || {});
  });
});

function updateDashboard() {
  chrome.storage.local.get(['focusData', 'focusMode', 'streaks', 'hourlyData'], (data) => {
    const focusData = data.focusData || {};
    const focusMode = data.focusMode || { active: false };
    const streaks = data.streaks || {};
    const hourlyData = data.hourlyData || {};

    const focusHours = Math.floor((focusData.totalFocusTime || 0) / 3600);
    const focusMinutes = Math.floor(((focusData.totalFocusTime || 0) % 3600) / 60);
    const focusTimeEl = document.getElementById('totalFocusTime');
    if (focusTimeEl) focusTimeEl.textContent = `${focusHours}h ${focusMinutes}m`;

    const tabSwitchesEl = document.getElementById('tabSwitches');
    if (tabSwitchesEl) tabSwitchesEl.textContent = focusData.tabSwitches || 0;

    const totalTime = (focusData.totalFocusTime || 0) + (focusData.distractionTime || 0);
    const score = totalTime > 0 ? Math.round((focusData.totalFocusTime / totalTime) * 100) : 0;
    const focusScoreEl = document.getElementById('focusScore');
    if (focusScoreEl) focusScoreEl.textContent = `${score}%`;
    const progressBarEl = document.getElementById('progressBar');
    if (progressBarEl) progressBarEl.style.width = score + '%';

    const resetFocusBtn = document.getElementById('resetFocusBtn');
    if (resetFocusBtn) {
      resetFocusBtn.style.display = 'block';
    }


    updateAchievements(streaks, score);
    generateInsights(focusData, streaks, score);
    generateAchievementsList(streaks, score, focusData.totalFocusTime || 0);

    const startFocusBtn = document.getElementById('startFocusBtn');
    const stopFocusBtn = document.getElementById('stopFocusBtn');
    if (startFocusBtn && stopFocusBtn) {
      if (focusMode.active) {
        startFocusBtn.style.display = 'none';
        stopFocusBtn.style.display = 'block';
      } else {
        startFocusBtn.style.display = 'block';
        stopFocusBtn.style.display = 'none';
      }
    }
  });

  updateBlockedCounter();
}

updateGoalDisplay();
updateDashboard();