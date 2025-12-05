import React, { useState, useEffect } from 'react';
import { Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Card } from '@/components/ui/card';

// Mock Data Generation
const KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
const KOREAN_NAMES = ['민준', '서준', '도윤', '예준', '시우', '하준', '지호', '주원', '지우', '준우', '서현', '서연', '지민', '윤서', '하은', '예은', '수아', '지아', '민서', '채원'];

const generateMockData = () => {
    const data = [];
    for (let i = 1; i <= 30; i++) {
        // Generate random seconds between 5.00 and 59.99
        const totalSeconds = 5 + Math.random() * 55;
        const seconds = Math.floor(totalSeconds);
        const centiseconds = Math.floor((totalSeconds % 1) * 100);

        const timeString = `${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;

        const surname = KOREAN_SURNAMES[Math.floor(Math.random() * KOREAN_SURNAMES.length)];
        const name = KOREAN_NAMES[Math.floor(Math.random() * KOREAN_NAMES.length)];

        data.push({
            id: i,
            name: surname + name,
            record: timeString,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
        });
    }
    // Sort by record (mocking "best time" - simpler string sort for now, ideally should be numeric)
    return data.sort((a, b) => a.record.localeCompare(b.record));
};

const MOCK_DATA = generateMockData();
const ITEMS_PER_PAGE = 10;

import { Skeleton } from "@/components/ui/skeleton";

export const Ranking: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rankingData, setRankingData] = useState(MOCK_DATA);
    const [isLoading, setIsLoading] = useState(true);

    const totalPages = Math.ceil(rankingData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentData = rankingData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const maskName = (name: string) => {
        if (name.length <= 2) {
            return name[0] + '*';
        }
        return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    };

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        if (isLoading) return; // Don't shuffle while loading
        const interval = setInterval(() => {
            setRankingData((prevData) => {
                const newData = [...prevData];
                // Shuffle a bit to simulate rank changes
                for (let i = 0; i < newData.length; i++) {
                    if (Math.random() > 0.7) {
                        const j = Math.floor(Math.random() * newData.length);
                        [newData[i], newData[j]] = [newData[j], newData[i]];
                    }
                }
                return newData;
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 pt-20 md:pt-24">
            <Card className="bg-zinc-900/80 border-zinc-800 p-6 backdrop-blur-sm max-w-2xl w-full">
                <div className="text-center mb-8 relative">
                    <h1 className="text-3xl font-bold text-white mb-2">실시간 랭킹</h1>
                    <p className="text-zinc-400">결혼식을 구한 최고의 영웅들입니다.</p>
                </div>

                <div className="rounded-md border border-zinc-800 mb-6 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableHead className="text-zinc-400 w-[100px]">순위</TableHead>
                                <TableHead className="text-zinc-400">이름</TableHead>
                                <TableHead className="text-zinc-400 text-right">기록</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-zinc-800">
                                        <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
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

                                        return (
                                            <motion.tr
                                                key={item.id}
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
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-500" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === currentPage}
                                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                                        className={page === currentPage ? "bg-zinc-800 text-white border-zinc-700" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-500" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </Card>
        </div>
    );
};
