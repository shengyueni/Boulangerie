const PHASES = [
  { key: "inhale", label: "吸气", seconds: 4 },
  { key: "hold", label: "停留", seconds: 4 },
  { key: "exhale", label: "呼气", seconds: 6 }
];

Page({
  data: {
    phaseIndex: 0,
    phase: PHASES[0],
    secondsLeft: PHASES[0].seconds,
    running: false
  },

  timer: null,

  onUnload() {
    this.clearTimer();
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  start() {
    if (this.timer) return;
    this.setData({ running: true });
    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
  },

  pause() {
    this.clearTimer();
    this.setData({ running: false });
  },

  reset() {
    this.clearTimer();
    this.setData({
      phaseIndex: 0,
      phase: PHASES[0],
      secondsLeft: PHASES[0].seconds,
      running: false
    });
  },

  tick() {
    if (this.data.secondsLeft > 1) {
      this.setData({ secondsLeft: this.data.secondsLeft - 1 });
      return;
    }
    const phaseIndex = (this.data.phaseIndex + 1) % PHASES.length;
    this.setData({
      phaseIndex,
      phase: PHASES[phaseIndex],
      secondsLeft: PHASES[phaseIndex].seconds
    });
  }
});
