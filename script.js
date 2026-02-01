/* ================= DOM ================= */

const streakEl = document.getElementById("streak");
const timerEl = document.getElementById("timer");
const progressEl = document.querySelector(".progress");
const sessionsEl = document.getElementById("sessions");
const taskInput = document.getElementById("taskInput");
const lastTaskEl = document.getElementById("lastTask");
const toast = document.getElementById("toast");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const workInput = document.getElementById("work");
const breakInput = document.getElementById("break");
const themeToggle = document.getElementById("themeToggle");

/* ================= Sounds ================= */

const workEndSound = new Audio("sounds/work-end.mp3");
const breakEndSound = new Audio("sounds/break-start.mp3");
const longBreakEndSound = new Audio("sounds/long-break.mp3");

/* ================= Constants ================= */

const LONG_BREAK_AFTER = 4;
const LONG_BREAK_MINUTES = 15;
const RADIUS = 628;

/* ================= State ================= */

let state = {
  work: +localStorage.work || 25,
  break: +localStorage.break || 5,
  sessions: +localStorage.sessions || 0,
  task: localStorage.task || "",
  lastTask: localStorage.lastTask || "None",

  stats: JSON.parse(localStorage.stats || "{}"),
  streak: +localStorage.streak || 0,
  lastSessionDate: localStorage.lastSessionDate || null,

  isWork: true,
  isLongBreak: false,
  running: false,
  startTime: 0,
  duration: 0,
  rafId: null,
  cycleCount: +localStorage.cycleCount || 0,

  nextDuration: null
};

/* ================= Init ================= */

workInput.value = state.work;
breakInput.value = state.break;
sessionsEl.textContent = state.sessions;
taskInput.value = state.task;
lastTaskEl.textContent = state.lastTask;
streakEl.textContent = state.streak;

resetTimer();
renderChart();

/* ================= Utils ================= */
function isTabHidden() {
  return document.visibilityState === "hidden";
}


function showToast(msg) {
  toast.textContent = msg;
  toast.style.opacity = 1;
  setTimeout(() => (toast.style.opacity = 0), 2000);
}

function showNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // ✅ Only notify when tab is not visible
  if (!isTabHidden()) return;

  new Notification(title, {
    body,
    icon: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
  });
}


function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ================= Timer ================= */

function startTimer() {
  if (state.running) return;

  state.running = true;
  state.duration =
    state.nextDuration ??
    (state.isWork ? state.work : state.break) * 60 * 1000;

  state.nextDuration = null;
  state.startTime = Date.now();
  loop();
}

function loop() {
  if (!state.running) return;

  const elapsed = Date.now() - state.startTime;
  const remaining = state.duration - elapsed;

  timerEl.textContent = formatTime(remaining);
  progressEl.style.strokeDashoffset =
    RADIUS - (elapsed / state.duration) * RADIUS;

  if (remaining <= 0) {
    finishSession();
    return;
  }

  state.rafId = requestAnimationFrame(loop);
}

function finishSession() {
  // animation
  progressEl.classList.add("complete");
  setTimeout(() => progressEl.classList.remove("complete"), 600);

  state.running = false;
  cancelAnimationFrame(state.rafId);
  progressEl.style.strokeDashoffset = RADIUS;

  /* ===== WORK FINISHED ===== */
  if (state.isWork) {
    workEndSound.play();
    state.sessions++;
    state.cycleCount++;

    localStorage.sessions = state.sessions;
    localStorage.cycleCount = state.cycleCount;
    sessionsEl.textContent = state.sessions;

    if (state.task.trim()) {
      state.lastTask = state.task;
      localStorage.lastTask = state.lastTask;
      lastTaskEl.textContent = state.lastTask;
    }

    updateStreakAndStats();

    if (state.cycleCount % LONG_BREAK_AFTER === 0) {
      state.isWork = false;
      state.isLongBreak = true;
      state.nextDuration = LONG_BREAK_MINUTES * 60 * 1000;

      showToast("🎉 Long Break Time!");
      showNotification(
        "Work Complete",
        "Great job! Take a long break 🎉"
      );
    } else {
      state.isWork = false;
      state.isLongBreak = false;

      showToast("☕ Short Break Time!");
      showNotification(
        "Work Complete",
        "Time for a short break ☕"
      );
    }
  }
  /* ===== BREAK FINISHED ===== */
  else {
    if (state.isLongBreak) {
      longBreakEndSound.play();
    } else {
      breakEndSound.play();
    }

    state.isWork = true;
    state.isLongBreak = false;

    showToast("💼 Back to Work!");
    showNotification(
      "Break Over",
      "Back to work 💼 Stay focused"
    );
  }

  // AUTO START NEXT SESSION
  setTimeout(startTimer, 1000);
}

/* ================= Reset / Pause ================= */

function pauseTimer() {
  state.running = false;
  cancelAnimationFrame(state.rafId);
}

function resetTimer() {
  pauseTimer();
  timerEl.textContent = formatTime(state.work * 60 * 1000);
  progressEl.style.strokeDashoffset = RADIUS;
}

/* ================= Stats ================= */

function updateStreakAndStats() {
  const today = new Date().toISOString().split("T")[0];

  state.stats[today] = (state.stats[today] || 0) + 1;
  localStorage.stats = JSON.stringify(state.stats);

  if (!state.lastSessionDate) {
    state.streak = 1;
  } else {
    const diff =
      (new Date(today) - new Date(state.lastSessionDate)) /
      (1000 * 60 * 60 * 24);

    state.streak = diff === 1 ? state.streak + 1 : diff === 0 ? state.streak : 1;
  }

  state.lastSessionDate = today;
  localStorage.lastSessionDate = today;
  localStorage.streak = state.streak;
  streakEl.textContent = state.streak;

  renderChart();
}

function renderChart() {
  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const max = Math.max(...days.map(d => state.stats[d] || 0), 1);

  days.forEach(day => {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${((state.stats[day] || 0) / max) * 100}%`;
    chart.appendChild(bar);
  });
}

/* ================= Events ================= */

startBtn.onclick = () => {
  requestNotificationPermission();
  startTimer();
};

pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;

workInput.onchange = () => {
  state.work = +workInput.value;
  localStorage.work = state.work;
  resetTimer();
};

breakInput.onchange = () => {
  state.break = +breakInput.value;
  localStorage.break = state.break;
  resetTimer();
};

taskInput.oninput = () => {
  state.task = taskInput.value;
  localStorage.task = state.task;
};

document.querySelectorAll(".presets button").forEach(btn => {
  btn.onclick = () => {
    state.work = +btn.dataset.work;
    state.break = +btn.dataset.break;
    workInput.value = state.work;
    breakInput.value = state.break;
    localStorage.work = state.work;
    localStorage.break = state.break;
    resetTimer();
  };
});

themeToggle.onclick = () => {
  document.body.classList.toggle("light");
};

/* ================= END ================= */
