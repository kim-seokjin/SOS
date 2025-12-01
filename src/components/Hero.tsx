import React from 'react';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';
import { GameGuide } from '@/components/GameGuide';

export const Hero: React.FC = () => {
    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium text-white/80 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <Timer className="w-4 h-4" />
                <span>타임어택 챌린지: 우리의 특별한 날을 지켜줘!</span>
            </div>

            <h1 className="max-w-5xl mb-12 text-left text-6xl font-bold tracking-tight text-white md:text-8xl lg:text-9xl leading-[0.9]">
                Save<br />
                Our<br />
                Special day
            </h1>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Button
                    variant="secondary"
                    size="lg"
                    className="h-14 px-10 text-lg font-medium text-black bg-white hover:bg-white/90 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    지금 시작하기
                </Button>

                <GameGuide>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-14 px-10 text-lg font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        게임 규칙 안내
                    </Button>
                </GameGuide>
            </div>
        </div>
    );
};
