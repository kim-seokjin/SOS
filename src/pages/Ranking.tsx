import React, { useState, useEffect } from 'react';
import { Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '@/lib/socket';
import { getRankings, getMyRank } from '@/lib/api';
import type { RankItem } from '@/lib/api';
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;


export const Ranking: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rankingData, setRankingData] = useState<RankItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRank, setMyRank] = useState<number | null>(null);
    const { isAuthenticated } = useAuthStore();

    const fetchRankings = async () => {
        setIsLoading(true);
        try {
            let limit = 10;
            let targetPage = 1;

            if (isAuthenticated()) {
                try {
                    const myRankData = await getMyRank();
                    setMyRank(myRankData.rank);

                    // Calculate required limit to include my rank
                    // If rank is 25, we need at least 30 items (page 3)
                    // If rank is 5, we need 10 items (page 1)
                    if (myRankData.rank > 10) {
                        limit = Math.ceil(myRankData.rank / 10) * 10;
                        targetPage = Math.ceil(myRankData.rank / 10);
                    }
                } catch (e) {
                    console.error("Failed to fetch my rank", e);
                    // Fallback to top 10 if my rank fetch fails
                }
            }

            const data = await getRankings(limit);
            setRankingData(data);

            if (isAuthenticated() && targetPage > 1 && !isLoading) {
                // Only set page if initial load or specific user action, 
                // but here we might want to avoid jumping pages on real-time update unless necessary.
                // For now, let's keep it simple: initial load sets page.
                setCurrentPage(targetPage);
            }
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
            // toast.error('랭킹 정보를 불러오는데 실패했습니다.'); // Suppress toast on frequent updates if any
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();

        // Connect to Socket.IO
        if (!socket.connected) {
            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
            });

            socket.on('connect_error', (err) => {
                console.log('Socket connection error:', err);
            });

            socket.connect();
        }

        const handleRankingUpdate = (data: any) => {
            console.log('Ranking update received:', data);
            if (Array.isArray(data)) {
                setRankingData(data);
            } else {
                fetchRankings();
            }
        };

        socket.on('ranking_update', handleRankingUpdate);

        return () => {
            socket.off('ranking_update', handleRankingUpdate);
        };
    }, []);


    const totalPages = Math.ceil(rankingData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentData = rankingData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
                <div className="text-center mb-4 md:mb-8 relative">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">명예의 전당</h1>
                    <p className="text-sm md:text-base text-zinc-400">저희의 결혼식을 완성해주셔서 감사합니다.</p>
                </div>

                <div className="rounded-md border border-zinc-800 mb-0 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-900/50">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-center text-zinc-400 w-[15%] h-8 md:h-10 text-xs md:text-sm">순위</TableHead>
                                <TableHead className="text-center text-zinc-400 w-[55%] h-8 md:h-10 text-xs md:text-sm">이름</TableHead>
                                <TableHead className="text-center text-zinc-400 w-[30%] h-8 md:h-10 text-xs md:text-sm">기록</TableHead>
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
                                    {currentData.map((item, index) => {
                                        const rank = startIndex + index + 1;
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
                                        if (isMyRank) {
                                            rowStyles = "border-yellow-500/50 bg-yellow-500/20 hover:bg-yellow-500/30 ring-1 ring-yellow-500/50 relative z-10";
                                        }

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
                                                    <div className="flex items-center gap-2">
                                                        {maskName(item.name)}
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
                {!isLoading && (
                    <div className="mt-4 text-zinc-400">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(p => p - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <PaginationItem key={i + 1}>
                                        <PaginationLink
                                            href="#"
                                            isActive={currentPage === i + 1}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(i + 1);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < totalPages) setCurrentPage(p => p + 1);
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>
        </div>
    );
};
