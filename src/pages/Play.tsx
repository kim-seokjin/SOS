import React, { useEffect, useState, useRef } from 'react';
import { createSwapy } from 'swapy';
import { Shuffle, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import puzzle1 from '@/assets/puzzles/puzzle1.png';
import puzzle2 from '@/assets/puzzles/puzzle2.png';
import gameGuideSuccess from '@/assets/images/game_guide_success.png';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";

const PUZZLE_IMAGES = [puzzle1, puzzle2];

const DEFAULT_ITEMS = [
    { id: '1', pos: '0% 0%' },
    { id: '2', pos: '50% 0%' },
    { id: '3', pos: '100% 0%' },
    { id: '4', pos: '0% 50%' },
    { id: '5', pos: '50% 50%' },
    { id: '6', pos: '100% 50%' },
    { id: '7', pos: '0% 100%' },
    { id: '8', pos: '50% 100%' },
    { id: '9', pos: '100% 100%' },
];

const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export const Play: React.FC = () => {
    const [image, setImage] = useState<string>('');
    const [shuffledItems, setShuffledItems] = useState<typeof DEFAULT_ITEMS>([]);
    const [isWon, setIsWon] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60000);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isHintActive, setIsHintActive] = useState(false);
    const [hintTimeLeft, setHintTimeLeft] = useState(3000);
    const [hasUsedHint, setHasUsedHint] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const swapyRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endTimeRef = useRef<number>(0);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Select random image on mount
        const randomImage = PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)];
        setImage(randomImage);
        shufflePuzzle();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (isLoading) return; // Don't start timer while loading
        if (isWon || isGameOver || isHintActive) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        // Start timer
        endTimeRef.current = Date.now() + timeLeft;

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = endTimeRef.current - now;

            if (remaining <= 0) {
                setTimeLeft(0);
                setIsGameOver(true);
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                setTimeLeft(remaining);
            }
        }, 10);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isWon, isGameOver, shuffledItems, isHintActive, isLoading]); // Restart timer when shuffledItems changes (new game)

    // Hint Timer
    useEffect(() => {
        let hintInterval: ReturnType<typeof setInterval>;

        if (isHintActive && hintTimeLeft > 0) {
            hintInterval = setInterval(() => {
                setHintTimeLeft((prev) => {
                    if (prev <= 10) {
                        setIsHintActive(false);
                        return 0;
                    }
                    return prev - 10;
                });
            }, 10);
        } else if (hintTimeLeft <= 0) {
            setIsHintActive(false);
        }

        return () => {
            if (hintInterval) clearInterval(hintInterval);
        };
    }, [isHintActive, hintTimeLeft]);

    useEffect(() => {
        if (!isLoading && containerRef.current && shuffledItems.length > 0) {
            if (swapyRef.current) {
                swapyRef.current.destroy();
            }

            swapyRef.current = createSwapy(containerRef.current, {
                animation: 'dynamic',
                enabled: !isWon && !isGameOver // Disable dragging if game over or won
            });

            swapyRef.current.onSwap((event: any) => {
                checkWinCondition(event.newSlotItemMap.asObject);
            });
        }
    }, [shuffledItems, isWon, isGameOver, isLoading]);

    useEffect(() => {
        if (isWon) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);
        }
    }, [isWon]);

    const shufflePuzzle = () => {
        const shuffled = [...DEFAULT_ITEMS];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledItems(shuffled);
        setIsWon(false);
        setIsGameOver(false);
        setTimeLeft(60000);
        setHasUsedHint(false);
        setHintTimeLeft(3000);
        setIsHintActive(false);
    };

    const checkWinCondition = (slotItemMap: Record<string, string>) => {
        // slotItemMap maps slotId -> itemId
        // We expect slot 'a' to have item '1', 'b' -> '2', etc.
        const correctMapping: Record<string, string> = {
            'a': '1', 'b': '2', 'c': '3',
            'd': '4', 'e': '5', 'f': '6',
            'g': '7', 'h': '8', 'i': '9'
        };

        let allCorrect = true;
        for (const slot of SLOTS) {
            if (slotItemMap[slot] !== correctMapping[slot]) {
                allCorrect = false;
                break;
            }
        }

        if (allCorrect) {
            setIsWon(true);
        }
    };

    const formatTime = (ms: number) => {
        if (ms >= 60000) return "01:00";
        const seconds = Math.floor(ms / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    };

    const getRecord = () => {
        const timeTaken = 60000 - timeLeft;
        const seconds = Math.floor(timeTaken / 1000);
        const centiseconds = Math.floor((timeTaken % 1000) / 10);
        return `${seconds}.${centiseconds.toString().padStart(2, '0')}`;
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 pt-20 pb-4 md:pt-24 md:pb-10">
            <Card className="bg-zinc-900/80 border-zinc-800 p-4 md:p-6 backdrop-blur-sm max-w-lg w-full">
                <div className="text-center mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">퍼즐을 완성해줘!</h1>
                    <p className="text-zinc-400 text-xs md:text-base">조각을 드래그하여 결혼 사진을 완성하세요.</p>
                </div>

                {/* Timer Bar */}
                <div className="mb-3 md:mb-4 w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-zinc-400">남은 시간</span>
                        {isLoading ? (
                            <Skeleton className="h-5 w-16" />
                        ) : (
                            <span className={`text-sm font-bold font-mono ${timeLeft <= 10000 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 md:h-2.5 overflow-hidden">
                        <div
                            className={`h-2 md:h-2.5 rounded-full ${timeLeft <= 10000 ? 'bg-red-500' : 'bg-white'} w-full origin-left`}
                            style={{ transform: `scaleX(${timeLeft / 60000})` }}
                        ></div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-3 gap-1 w-full bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4 md:mb-6" style={{ aspectRatio: '1/1' }}>
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Skeleton key={i} className="w-full h-full rounded-sm" />
                        ))}
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="grid grid-cols-3 gap-1 w-full bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4 md:mb-6 relative"
                        style={{ aspectRatio: '1/1' }}
                    >
                        {isGameOver && !isWon && (
                            <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                <h2 className="text-2xl md:text-3xl font-bold text-red-500 mb-2">Game Over</h2>
                                <p className="text-zinc-300 text-sm md:text-base">시간이 초과되었습니다.</p>
                            </div>
                        )}

                        {/* We map over SLOTS to create the grid structure. 
                            The content of each slot is determined by shuffledItems initially, 
                            but swapy handles the DOM manipulation after that. 
                            However, for React to render correctly initially, we need to place items in slots.
                        */}
                        {SLOTS.map((slot, index) => {
                            const item = shuffledItems[index];
                            if (!item) return null;

                            return (
                                <div key={slot} data-swapy-slot={slot} className="w-full h-full rounded-sm overflow-hidden relative">
                                    <div
                                        key={item.id}
                                        data-swapy-item={item.id}
                                        className="w-full h-full cursor-grab active:cursor-grabbing hover:brightness-110 transition-filter"
                                        style={{
                                            backgroundImage: `url(${image})`,
                                            backgroundSize: '300% 300%',
                                            backgroundPosition: item.pos
                                        }}
                                    >
                                        {/* Number for debugging/easier solving - Removed old hint */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className={isGameOver ? "flex justify-center" : "flex justify-between gap-3"}>
                    {!isGameOver && (
                        <Button
                            onClick={() => {
                                setIsHintActive(true);
                                setHasUsedHint(true);
                            }}
                            disabled={hasUsedHint}
                            className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2 font-bold px-6 py-4 md:py-2 h-auto md:h-10"
                        >
                            <Lightbulb className={`w-4 h-4 ${isHintActive ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                            Hint
                        </Button>
                    )}
                    <Button
                        onClick={shufflePuzzle}
                        className={`${isGameOver ? '' : 'flex-1'} bg-white text-black hover:bg-zinc-200 gap-2 font-bold px-6 py-4 md:py-2 h-auto md:h-10`}
                    >
                        {isGameOver ? <RotateCcw className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
                        {isGameOver ? '다시 시작' : 'Shuffle'}
                    </Button>
                </div>
            </Card>

            <Dialog open={isWon} onOpenChange={(open) => !open && setIsWon(false)}>
                <DialogContent
                    className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold">결혼식을 구해줘서 고마워!</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            <img
                                src={gameGuideSuccess}
                                alt="Celebration"
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <DialogDescription className="text-center text-zinc-300 text-base">
                            덕분에 엉망이 될 뻔한 결혼 사진을 되살렸어!<br />
                            우리의 소중한 추억을 지켜줘서 정말 고마워.
                        </DialogDescription>
                        <div className="bg-zinc-800/50 px-6 py-3 rounded-lg border border-zinc-700">
                            <p className="text-zinc-400 text-sm mb-1">기록</p>
                            <p className="text-2xl font-bold text-green-400 font-mono">{getRecord()}초</p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button
                            onClick={() => navigate('/ranking')}
                            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-6"
                        >
                            실시간 랭킹 확인하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hint Dialog */}
            <Dialog open={isHintActive} onOpenChange={(open) => !open && setIsHintActive(false)}>
                <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800 text-white" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">Hint</DialogTitle>
                        <DialogDescription className="text-center text-zinc-400">
                            3초 동안 완성된 결혼 사진을 확인할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mt-2">
                        <img src={image} alt="Original Puzzle" className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <span className="text-2xl font-bold font-mono text-yellow-400">
                                {(hintTimeLeft / 1000).toFixed(2)}s
                            </span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
