"use client";

import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteStop {
  station: string;
  code: string;
  arrival: string;
  departure: string;
  occupancy: number; // 0-100
}

interface RouteMapProps {
  stops: RouteStop[];
  currentStationCode?: string;
}

const RouteMap = ({ stops, currentStationCode }: RouteMapProps) => {
  return (
    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {stops.map((stop, idx) => {
        const isCurrent = stop.code === currentStationCode;
        const occupancyColor = 
          stop.occupancy < 40 ? 'text-green-500' :
          stop.occupancy < 75 ? 'text-yellow-500' : 'text-red-500';

        return (
          <div key={stop.code} className={cn("relative group", isCurrent && "animate-pulse")}>
            {/* Station Dot */}
            <div className={cn(
              "absolute -left-[29px] top-1.5 w-5 h-5 rounded-full border-4 border-background transition-all duration-300",
              isCurrent ? "bg-primary scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-muted group-hover:bg-primary/50"
            )} />

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">{stop.station}</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{stop.code}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {stop.arrival}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Platform {Math.floor(Math.random() * 5) + 1}</span>
                </div>
              </div>

              <div className="text-right">
                <div className={cn("flex items-center gap-1 text-xs font-black uppercase", occupancyColor)}>
                  <Users className="w-3 h-3" />
                  {stop.occupancy}% Occupied
                </div>
                <div className="w-24 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", stop.occupancy < 40 ? 'bg-green-500' : stop.occupancy < 75 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${stop.occupancy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RouteMap;