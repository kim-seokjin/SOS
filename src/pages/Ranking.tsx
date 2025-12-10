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
