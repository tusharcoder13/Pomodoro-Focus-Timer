const display = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workInput = document.getElementById('workDuration');
const breakInput = document.getElementById('breakDuration');

let timer = null;
let timeLeft = workInput.value * 60;
let isWorking = true;

function updateDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  display.textContent = `${m}:${s}`;
}

function switchMode() {
  isWorking = !isWorking;
  timeLeft = (isWorking ? workInput.value : breakInput.value) * 60;
  alert(isWorking ? "Time to Work!" : "Break Time!");
  updateDisplay();
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(timer);
      timer = null;
      switchMode();
    } else {
      updateDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  timeLeft = workInput.value * 60;
  updateDisplay();
}

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;
workInput.onchange = resetTimer;
breakInput.onchange = resetTimer;

updateDisplay(); // Initialize display
