// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const breakTimerBtn = document.getElementById('breakTimerBtn');
const customTimerBtn = document.getElementById('customTimerBtn');
const timerProgress = document.getElementById('timerProgress');

const blockedCounter = document.getElementById('blockedCounter');
const weeklyReportBtn = document.getElementById('weeklyReportBtn');
const weeklyReport = document.getElementById('weeklyReport');

const contrastToggle = document.getElementById('contrastToggle');
const dyslexiaToggle = document.getElementById('dyslexiaToggle');
const motionToggle = document.getElementById('motionToggle');
const soundToggle = document.getElementById('soundToggle');

const mainDashboard = document.getElementById('mainDashboard');
const modeBtns = document.querySelectorAll('.mode-btn');

// Timer state
let timerInterval = null;
let timeLeft = 1500; // 25 minutes in seconds
let totalTime = 1500;
let isRunning = false;

// Accessibility state
let accessibility = {
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
  soundAlerts: true,
  simpleMode: false
};

// ===== POMODORO TIMER =====
function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  timerProgress.style.width = progress + '%';
}

function playSound() {
  if (!accessibility.soundAlerts) return;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerLabel.textContent = '⏱️ Focus in progress...';
  startTimerBtn.disabled = true;
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      playSound();
      playSound();
      timerLabel.textContent = '✅ Time\'s up! Take a break!';
      startTimerBtn.disabled = false;
      timeLeft = totalTime;
      updateTimerDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  timerLabel.textContent = '⏸ Paused';
  startTimerBtn.disabled = false;
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = totalTime;
  updateTimerDisplay();
  timerLabel.textContent = 'Ready to focus?';
  startTimerBtn.disabled = false;
}

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

breakTimerBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = 300; // 5 minutes
  totalTime = 300;
  updateTimerDisplay();
  timerLabel.textContent = '☕ Break time (5 min)';
  startTimerBtn.disabled = false;
});

customTimerBtn.addEventListener('click', () => {
  const mins = prompt('Enter minutes:', '25');
  if (mins && !isNaN(mins)) {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = parseInt(mins) * 60;
    totalTime = timeLeft;
    updateTimerDisplay();
    timerLabel.textContent = `⏱️ ${mins} minute timer`;
    startTimerBtn.disabled = false;
  }
});

// ===== DISTRACTION COUNTER =====
function updateBlockedCounter() {
  chrome.storage.local.get('blockedAttempts', (data) => {
    const blocked = data.blockedAttempts || 0;
    blockedCounter.textContent = blocked;
  });
}

function incrementBlockedCounter() {
  chrome.storage.local.get('blockedAttempts', (data) => {
    const blocked = (data.blockedAttempts || 0) + 1;
    chrome.storage.local.set({ blockedAttempts: blocked });
    updateBlockedCounter();
  });
}

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

// Mode toggle
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
function updateDashboard() {
  chrome.storage.local.get(['focusData', 'focusMode', 'streaks', 'hourlyData'], (data) => {
    const focusData = data.focusData || {};
    const focusMode = data.focusMode || { active: false };
    const streaks = data.streaks || {};
    const hourlyData = data.hourlyData || {};

    // Update focus time
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

    // Update heatmap
    updateHeatmap(hourlyData);

    // Update achievements
    updateAchievements(streaks, score);

    // Generate AI Insights
    generateInsights(focusData, streaks, score);

    // Generate Achievements List
    generateAchievementsList(streaks, score, focusData.totalFocusTime || 0);

    // Update button states
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

function updateHeatmap(hourlyData) {
  const heatmapEl = document.getElementById('heatmap');
  heatmapEl.innerHTML = '';
  
  for (let i = 0; i < 24; i++) {
    const focusTime = hourlyData[i] || 0;
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    
    let level = 0;
    if (focusTime > 1200) level = 4;
    else if (focusTime > 600) level = 3;
    else if (focusTime > 300) level = 2;
    else if (focusTime > 0) level = 1;
    
    if (level > 0) cell.classList.add(`level-${level}`);
    cell.textContent = i;
    heatmapEl.appendChild(cell);
  }
}

function updateAchievements(streaks, score) {
  let achievements = '';
  if (score >= 80) achievements += '🎯 ';
  if ((streaks.current || 0) >= 3) achievements += '🔥 ';
  if ((streaks.current || 0) >= 7) achievements += '⭐ ';
  
  document.getElementById('achievements').textContent = achievements || '🚀 Keep grinding!';
}

// Focus Mode
document.getElementById('startFocusBtn').addEventListener('click', () => {
  chrome.storage.local.set({ focusMode: { active: true } });
  updateDashboard();
});

document.getElementById('stopFocusBtn').addEventListener('click', () => {
  chrome.storage.local.set({ focusMode: { active: false } });
  updateDashboard();
});

// Reading Mode
document.getElementById('readingModeBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleReading' }).catch(() => {});
    }
  });
});

// ===== AI INSIGHTS & SUMMARY =====
function generateInsights(focusData, streaks, score) {
  const insightsBox = document.getElementById('insightsBox');
  let insights = '';

  const totalTime = (focusData.totalFocusTime || 0) + (focusData.distractionTime || 0);

  // Insight 1: Focus Quality
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

  // Insight 2: Tab Switching Behavior
  const tabSwitches = focusData.tabSwitches || 0;
  if (tabSwitches < 5) {
    insights += `<p>✅ <strong>Minimal Distractions!</strong> Only ${tabSwitches} tab switches. Excellent attention control!</p>`;
  } else if (tabSwitches < 15) {
    insights += `<p>💡 <strong>Moderate Switching.</strong> ${tabSwitches} tab switches detected. Try batching tasks together!</p>`;
  } else {
    insights += `<p>🔴 <strong>High Tab Switching.</strong> ${tabSwitches} switches found. Consider using Focus Mode to minimize distractions.</p>`;
  }

  // Insight 3: Streak Status
  const currentStreak = streaks.current || 0;
  const bestStreak = streaks.best || 0;
  if (currentStreak > 0) {
    insights += `<p>🔥 <strong>Streak Active!</strong> You're on a ${currentStreak}-day focus streak! Your best is ${bestStreak} days. Keep it up!</p>`;
  } else if (totalTime > 3600) {
    insights += `<p>🚀 <strong>Start Your Streak!</strong> You've already done ${Math.floor(totalTime / 3600)}+ hours today. One more hour to start a streak!</p>`;
  } else {
    insights += `<p>💪 <strong>New Streak Opportunity!</strong> Get 1+ hour of focus today to start building a streak!</p>`;
  }

  // Insight 4: Time Analysis
  const focusHours = Math.floor((focusData.totalFocusTime || 0) / 3600);
  const focusMinutes = Math.floor(((focusData.totalFocusTime || 0) % 3600) / 60);
  if (focusHours > 0) {
    insights += `<p>📊 <strong>Today's Work:</strong> You've focused for ${focusHours}h ${focusMinutes}m. Great productivity!</p>`;
  }

  // Insight 5: Recommendation
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

  // Achievement 1: Focus Master
  if (score >= 80) {
    achievements += '🎯 ';
    descriptions += '<p>🎯 <strong>Focus Master:</strong> 80% focus score</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  // Achievement 2: 1 Hour
  if (totalFocusTime >= 3600) {
    achievements += '💪 ';
    descriptions += '<p>💪 <strong>Iron Will:</strong> 1+ hour focused</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  // Achievement 3: 2 Hours
  if (totalFocusTime >= 7200) {
    achievements += '🚀 ';
    descriptions += '<p>🚀 <strong>Productivity Beast:</strong> 2+ hours focused</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  // Achievement 4: 3 Day Streak
  if ((streaks.current || 0) >= 3) {
    achievements += '🔥 ';
    descriptions += '<p>🔥 <strong>On Fire:</strong> 3-day focus streak</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  // Achievement 5: 7 Day Streak
  if ((streaks.current || 0) >= 7) {
    achievements += '⭐ ';
    descriptions += '<p>⭐ <strong>Weekly Warrior:</strong> 7-day focus streak</p>';
    unlockedCount++;
  } else {
    achievements += '⚪ ';
  }

  // Achievement 6: Tab Control
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

// Summary button handler
document.getElementById('summarizeBtn').addEventListener('click', () => {
  chrome.storage.local.get('focusData', (data) => {
    generateSessionSummary(data.focusData || {});
  });
});