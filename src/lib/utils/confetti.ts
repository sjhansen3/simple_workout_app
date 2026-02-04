import confetti from "canvas-confetti";

export function fireConfetti() {
  // First burst - center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
  });

  // Left side burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#22c55e", "#3b82f6", "#f59e0b"],
    });
  }, 150);

  // Right side burst
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#22c55e", "#3b82f6", "#f59e0b"],
    });
  }, 300);
}

export function fireWorkoutCompleteConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#22c55e", "#10b981", "#34d399"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#22c55e", "#10b981", "#34d399"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Initial big burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#10b981", "#34d399", "#fbbf24", "#f59e0b"],
  });

  // Continuous stream
  frame();
}
