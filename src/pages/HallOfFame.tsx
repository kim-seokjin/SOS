import React, { useState, useEffect } from 'react';
import { Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '@/lib/socket';
import { getRankings, getMyRank } from '@/lib/ranking';
import type { RankItem } from '@/lib/ranking';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from '@/lib/customToast';

export const HallOfFame: React.FC = () => {
    const [rankingData, setRankingData] = useState<RankItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRank, setMyRank] = useState<number | null>(null);
    const user = useAuthStore(state => state.user);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchRankings = async () => {
        setIsLoading(true);
        try {
            // Always fetch top 10 for Hall of Fame
            const data = await getRankings(0, 10);
            setRankingData(data.items);
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load handling
    useEffect(() => {
        const initialize = async () => {
            console.log("Initializing Hall of Fame, user:", user?.id);
            if (user) {
                try {
                    const myRankData = await getMyRank();
                    setMyRank(myRankData.rank);
                } catch (e) {
                    console.error("Failed to fetch my rank", e);
                }
            }
            await fetchRankings();
            setIsInitialLoad(false);
        };

        if (isInitialLoad) {
            initialize();
        }
    }, [user, isInitialLoad]);

    useEffect(() => {
        console.log('Setting up socket listeners for /ranking namespace (Hall of Fame)');

        // Manual connect since autoConnect might have happened early
        if (!socket.connected) {
            socket.on('connect', () => {
                console.log('Socket connected to /ranking namespace:', socket.id);
            });
            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });
            socket.connect();
        }

        const handleRankingUpdate = async (data: any) => {
            console.log('Ranking update received via Socket.IO:', data);
            showToast.success('명예의 전당이 업데이트되었습니다!');

            // Re-fetch everything
            fetchRankings();
            if (user) {
                try {
                    const myRankData = await getMyRank();
                    setMyRank(myRankData.rank);
                } catch (e) {
                    console.error("Failed to update my rank on socket signal", e);
                }
            }
        };

        socket.on('ranking_update', handleRankingUpdate);

        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('ranking_update', handleRankingUpdate);
        };
    }, [user]);


    const maskName = (name: string) => {
        if (!name) return '***';
        if (name.length <= 2) {
            return name[0] + '*';
        }
        return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    };

    return (
        <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-2 md:p-6">
            <Card className="bg-zinc-900/80 border-zinc-800 p-4 md:p-6 backdrop-blur-sm max-w-2xl w-full">
                <div className="text-center mb-4 md:mb-8 relative flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 ring-1 ring-red-500/20 mb-2">
                        <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-red-400 tracking-wider">LIVE</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">명예의 전당</h1>
                    <p className="text-sm md:text-base text-zinc-400">저희의 결혼식을 완성해주셔서 감사합니다.</p>
                </div>

                <div className="rounded-md border border-zinc-800 mb-0 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-900/50">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-center text-zinc-400 w-[15%] h-8 md:h-10 text-xs md:text-sm">순위</TableHead>
                                <TableHead className="text-center text-zinc-400 w-[55%] h-8 md:h-10 text-xs md:text-sm">이름</TableHead>
                                <TableHead className="text-center text-zinc-400 w-[30%] h-8 md:h-10 text-xs md:text-sm">기록(초)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={i} className="border-zinc-800/50">
                                        <TableCell className="text-center py-2 md:py-3"><Skeleton className="h-4 w-4 mx-auto bg-zinc-800" /></TableCell>
                                        <TableCell className="text-center py-2 md:py-3"><Skeleton className="h-4 w-20 mx-auto bg-zinc-800" /></TableCell>
                                        <TableCell className="text-center py-2 md:py-3"><Skeleton className="h-4 w-12 mx-auto bg-zinc-800" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {rankingData.map((item, index) => {
                                        const rank = index + 1;
                                        let rankStyles = "text-zinc-300";
                                        let rowStyles = "border-zinc-800 hover:bg-zinc-800/50";
                                        let RankIcon = null;

                                        if (rank === 1) {
                                            rankStyles = "text-yellow-400 font-bold";
                                            rowStyles = "border-zinc-800 bg-yellow-500/10 hover:bg-yellow-500/20";
                                            RankIcon = <Crown className="w-4 h-4 ml-1 inline-block" />;
                                        } else if (rank === 2) {
                                            rankStyles = "text-slate-300 font-bold";
                                            rowStyles = "border-zinc-800 bg-slate-400/10 hover:bg-slate-400/20";
                                            RankIcon = <Medal className="w-4 h-4 ml-1 inline-block" />;
                                        } else if (rank === 3) {
                                            rankStyles = "text-amber-600 font-bold";
                                            rowStyles = "border-zinc-800 bg-amber-500/10 hover:bg-amber-500/20";
                                            RankIcon = <Medal className="w-4 h-4 ml-1 inline-block" />;
                                        }

                                        // Highlight my rank logic
                                        const isMyRank = rank === myRank;

                                        return (
                                            <motion.tr
                                                key={item.userId || item.rank} // Use userId if available, else rank fallback
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{
                                                    layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }, // Expo.easeOut approximation
                                                    opacity: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                                                    y: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                                                }}
                                                className={`transition-colors data-[state=selected]:bg-muted border-b ${rowStyles}`}
                                                style={{ position: 'relative' }} // Needed for layout animations sometimes
                                            >
                                                <TableCell className={`font-medium ${rankStyles}`}>
                                                    <div className="flex items-center">
                                                        <motion.span
                                                            key={rank} // Trigger animation when rank changes
                                                            initial={{ y: 10, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            {rank}
                                                        </motion.span>
                                                        {RankIcon}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-zinc-300">
                                                    <div className="relative inline-flex items-center">
                                                        {maskName(item.name)}
                                                        {isMyRank && (
                                                            <span className="absolute -top-1 -right-2 flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-green-400">
                                                    {item.record}
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
