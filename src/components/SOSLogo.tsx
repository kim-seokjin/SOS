import React from 'react';
import { Puzzle, Timer } from 'lucide-react';

export const SOSLogo: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] overflow-hidden group">
            {/* Background Pulse Effect */}
            <div className="absolute inset-0 bg-white/5 animate-pulse" />

            {/* Puzzle Icon (Base) */}
            <Puzzle className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />

            {/* Timer Overlay (Small badge) */}
            <div className="absolute bottom-1 right-1 z-20 bg-white-500/80 rounded-full p-[2px] border border-white/20 shadow-sm">
                <Timer className="w-2.5 h-2.5 text-white" />
            </div>
        </div>
    );
};
