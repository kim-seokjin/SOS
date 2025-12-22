import React, { useEffect, useState, useRef } from 'react';
import { Shuffle, RotateCcw, Lightbulb } from 'lucide-react';
import { recordGame, getPuzzleImage } from '@/lib/game';
import { showToast } from '@/lib/customToast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessDialog } from '@/components/SuccessDialog';
import { HintDialog } from '@/components/HintDialog';
import { useAuthStore } from '@/lib/store/useAuthStore';

const optimizeImage = (
    src: string,
    maxWidth: number = 1024 // Limit max width for mobile optimization
): Promise<{ url: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failure'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const optimizedUrl = URL.createObjectURL(blob);
                    resolve({ url: optimizedUrl, width, height });
                } else {
                    reject(new Error('Blob creation failed'));
                }
            }, 'image/webp', 0.85);
        };

        img.onerror = (e) => reject(e);
    });
};

const GRID_SIZE = 4;
const DEFAULT_ITEMS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    return {
        id: (i + 1).toString(),
        pos: `${col * (100 / (GRID_SIZE - 1))}% ${row * (100 / (GRID_SIZE - 1))}%`
    };
});

export const Play: React.FC = () => {
    const [image, setImage] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<number>(2 / 3); // Default to 2/3 (portrait)
    const [shuffledItems, setShuffledItems] = useState<typeof DEFAULT_ITEMS>([]);
    const [selectedindex, setSelectedIndex] = useState<number | null>(null);
    const [isGlowing, setIsGlowing] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60000);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isHintActive, setIsHintActive] = useState(false);
    const [hintTimeLeft, setHintTimeLeft] = useState(10000);
    const [hasUsedHint, setHasUsedHint] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [rank, setRank] = useState<number | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const endTimeRef = useRef<number>(0);
    const navigate = useNavigate();

    const resetGame = () => {
        const shuffled = [...DEFAULT_ITEMS];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledItems(shuffled);
        setSelectedIndex(null);
        setIsWon(false);
        setIsGlowing(false);
        setIsGameOver(false);
        setTimeLeft(60000);
        setHasUsedHint(false);
        setHintTimeLeft(10000);
        setIsHintActive(false);
        setRank(undefined);
        setIsSubmitting(false);
    };

    const shufflePuzzle = () => {
        const shuffled = [...DEFAULT_ITEMS];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledItems(shuffled);
        setSelectedIndex(null);
    };

    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated()) {
            showToast.warning('로그인이 필요한 서비스입니다.', '로그인 필요');
            navigate('/signin?redirect=/play');
            return;
        }
        setIsLoading(false);
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await getPuzzleImage();
                const imageUrl = response.url;

                // Optimize image on client side
                const optimized = await optimizeImage(imageUrl);

                setImage(optimized.url);
                setAspectRatio(optimized.width / optimized.height);
                setIsImageLoaded(true);

                console.log("Image optimized and loaded");

            } catch (error) {
                console.error("Failed to fetch or optimize puzzle image:", error);
                showToast.error("이미지를 불러오는데 실패했습니다.");
            }
        };

        if (isAuthenticated()) {
            fetchImage();
        }
        resetGame();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (isLoading || !isImageLoaded) return; // Don't start timer while loading or image not ready
        if (isWon || isGameOver || isHintActive || isGlowing) {
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
    }, [isWon, isGameOver, shuffledItems, isHintActive, isLoading, isImageLoaded, isGlowing]); // Restart timer when shuffledItems changes (new game)

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
        if (isGlowing) {
            const timer = setTimeout(async () => {
                setIsWon(true);
                setIsGlowing(false);

                // Record Game Result
                const clearTimeMs = 60000 - timeLeft;
                setIsSubmitting(true);
                try {
                    const response = await recordGame(clearTimeMs);
                    if (response.success) {
                        setRank(response.rank);
                    }
                } catch (error: any) {
                    console.error('Failed to record game:', error);
                    if (error.response?.status === 400) {
                        showToast.error(error.response.data?.detail || '비정상적인 기록입니다.');
                    } else {
                        showToast.error('기록 저장에 실패했습니다.');
                    }
                } finally {
                    setIsSubmitting(false);
                }

            }, 2000); // Glow for 2 seconds
            return () => clearTimeout(timer);
        }
    }, [isGlowing, timeLeft]);

    useEffect(() => {
        if (isWon) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: ReturnType<typeof setInterval> = setInterval(function () {
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

    const handleTileClick = (index: number) => {
        if (isWon || isGameOver || isGlowing) return;

        if (selectedindex === null) {
            // Select first tile
            setSelectedIndex(index);
        } else if (selectedindex === index) {
            // Deselect if clicking same tile
            setSelectedIndex(null);
        } else {
            // Swap tiles
            const newItems = [...shuffledItems];
            [newItems[selectedindex], newItems[index]] = [newItems[index], newItems[selectedindex]];
            setShuffledItems(newItems);
            setSelectedIndex(null);
            checkWinCondition(newItems);
        }
    };

    const checkWinCondition = (currentItems: typeof DEFAULT_ITEMS) => {
        const isCorrect = currentItems.every((item, index) => item.id === DEFAULT_ITEMS[index].id);
        if (isCorrect) {
            setIsGlowing(true);
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
        <div className="w-full flex-1 flex flex-col items-center justify-center p-4 pb-4 md:pb-10">
            <Card className="bg-zinc-900/80 border-zinc-800 p-4 md:p-6 backdrop-blur-sm max-w-lg w-full">
                <div className="text-center mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">퍼즐을 완성해줘!</h1>
                    <p className="text-zinc-400 text-xs md:text-base">조각을 클릭하여 서로 위치를 바꾸세요.</p>
                </div>

                {/* Timer Bar */}
                <div className="mb-3 md:mb-4 w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-zinc-400">남은 시간</span>
                        {isLoading || !isImageLoaded ? (
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

                {isLoading || !isImageLoaded ? (
                    <div className="grid grid-cols-4 gap-0.5 w-full bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4 md:mb-6" style={{ aspectRatio: aspectRatio }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                            <Skeleton key={i} className="w-full h-full rounded-sm" />
                        ))}
                    </div>
                ) : (
                    <div
                        className={`grid grid-cols-4 gap-0.5 w-full bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4 md:mb-6 relative transition-all duration-1000 ${isGlowing ? 'shadow-[0_0_50px_20px_rgba(255,255,255,0.5)] z-20 scale-105 border-white' : ''
                            }`}
                        style={{ aspectRatio: aspectRatio }}
                    >
                        {isGameOver && !isWon && !isGlowing && (
                            <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                <h2 className="text-2xl md:text-3xl font-bold text-red-500 mb-2">Game Over</h2>
                                <p className="text-zinc-300 text-sm md:text-base">시간이 초과되었습니다.</p>
                            </div>
                        )}

                        {shuffledItems.map((item, index) => (
                            <div
                                key={index}
                                className={`w-full h-full rounded-sm overflow-hidden relative cursor-pointer transition-all duration-200 ${selectedindex === index
                                    ? 'ring-1 ring-yellow-400 ring-offset-1 ring-offset-zinc-900 z-10 scale-105'
                                    : 'hover:brightness-110'
                                    } ${isGlowing ? 'ring-0' : ''}`}
                                onClick={() => handleTileClick(index)}
                            >
                                <div
                                    className="w-full h-full"
                                    style={{
                                        backgroundImage: `url("${image}")`,
                                        backgroundSize: '400% 400%',
                                        backgroundPosition: item.pos
                                    }}
                                />
                            </div>
                        ))}
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
                    {isGameOver ? (
                        <Button
                            onClick={resetGame}
                            className="bg-zinc-800 text-white hover:bg-zinc-700 gap-2 font-bold px-6 py-4 md:py-2 h-auto md:h-10"
                        >
                            <RotateCcw className="w-4 h-4" />
                            다시 시작
                        </Button>
                    ) : (
                        <Button
                            onClick={shufflePuzzle}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 gap-2 font-bold px-6 py-4 md:py-2 h-auto md:h-10"
                        >
                            <Shuffle className="w-4 h-4" />
                            Shuffle
                        </Button>
                    )}
                </div>
            </Card>

            <SuccessDialog
                open={isWon}
                onOpenChange={(open) => !open && setIsWon(false)}
                record={getRecord()}
                rank={rank}
                isRankLoading={isSubmitting}
                onNavigateRanking={() => navigate('/ranking')}
                onRetry={resetGame}
            />

            {/* Hint Dialog */}
            <HintDialog
                open={isHintActive}
                onOpenChange={(open) => !open && setIsHintActive(false)}
                image={image}
                timeLeft={hintTimeLeft}
            />
        </div>
    );
};
