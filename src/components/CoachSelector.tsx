"use client";

import React from 'react';
import { CoachData } from '@/types/booking';
import { cn } from '@/lib/utils';

interface CoachSelectorProps {
  coaches: CoachData[];
  selectedId: string;
  onSelect: (coach: CoachData) => void;
}

const CoachSelector = ({ coaches, selectedId, onSelect }: CoachSelectorProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {coaches.map((coach) => {
        const isSelected = selectedId === coach.id;
        const occupancyColor = 
          coach.occupancy < 50 ? 'bg-green-500' :
          coach.occupancy < 80 ? 'bg-yellow-500' : 'bg-red-500';

        return (
          <button
            key={coach.id}
            onClick={() => onSelect(coach)}
            className={cn(
              "flex flex-col items-center min-w-[80px] p-3 rounded-xl border-2 transition-all duration-300",
              isSelected 
                ? "border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20" 
                : "border-border bg-card/50 hover:border-primary/50"
            )}
          >
            <span className="text-xs text-muted-foreground mb-1">{coach.type}</span>
            <span className="text-lg font-black">{coach.id}</span>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", occupancyColor)}
                style={{ width: `${coach.occupancy}%` }}
              />
            </div>
            <span className="text-[10px] mt-1 font-bold opacity-70">
              {coach.availableSeats} Left
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CoachSelector;