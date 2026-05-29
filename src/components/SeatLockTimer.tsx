"use client";

import React, { useState, useEffect } from 'react';
import { Timer, Lock } from 'lucide-react';

interface SeatLockTimerProps {
  onExpire: () => void;
  durationSeconds?: number;
}

const SeatLockTimer = ({ onExpire, durationSeconds = 300 }: SeatLockTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/50 rounded-full text-amber-500 font-bold animate-pulse">
      <Lock className="w-4 h-4" />
      <Timer className="w-4 h-4" />
      <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
      <span className="text-xs font-normal ml-1">Seats Locked</span>
    </div>
  );
};

export default SeatLockTimer;