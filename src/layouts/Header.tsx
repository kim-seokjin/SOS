import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SOSLogo } from '@/components/SOSLogo';
import { useAuthStore } from '@/lib/store/useAuthStore';

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Trophy, LogOut, ChevronRight, ClipboardList } from 'lucide-react';
import Avatar from "boring-avatars";

export const Header: React.FC = () => {
    const { user, accessToken, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const isLoggedIn = !!user && !!accessToken;

    const handleLogout = () => {
        clearAuth();
        setOpen(false);
        navigate('/');
    };

    return (
        <header className="w-full flex items-center justify-center p-6 pb-0">
            <div className="flex items-center justify-between w-full max-w-4xl px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-lg">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <SOSLogo />
                    <span className="text-xl font-bold tracking-tight text-white">SOS</span>
                </Link>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="text-white/90 hover:text-white transition-colors p-1" aria-label="메뉴 열기">
                            <Menu className="w-6 h-6" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="right" hideClose className="bg-white/5 backdrop-blur-xl border-l border-white/10 text-white flex flex-col p-6">
                        {/* Avatar Section */}
                        <div className="mb-8">
                            {isLoggedIn && user ? (
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        key={user.name}
                                        name={user.name}
                                        colors={["#FACC15", "#000000", "#FFFFFF", "#52525B", "#EAB308"]}
                                        variant="beam"
                                        size={48}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base md:text-lg break-keep leading-tight">{user.name}님</span>
                                        <span className="text-xs md:text-sm text-zinc-400 break-keep mt-0.5">저희의 특별한 날을 지켜주세요!</span>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to="/signin?redirect=/"
                                    className="flex items-center gap-4 group cursor-pointer"
                                    onClick={() => setOpen(false)}
                                >
                                    <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Avatar
                                            name="Guest"
                                            colors={["#52525B", "#3F3F46", "#27272A", "#18181B", "#09090B"]}
                                            variant="beam"
                                            size={48}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-bold text-base md:text-lg break-keep leading-tight">로그인이 필요합니다</span>
                                        <span className="text-xs md:text-sm text-zinc-400 break-keep mt-0.5">저희의 특별한 날을 지켜주세요!</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                                </Link>
                            )}
                        </div>

                        {/* Menu Items */}
                        <nav className="flex flex-col gap-2 flex-1">
                            {user && (
                                <Link
                                    to="/my-records"
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-zinc-200 hover:text-white group"
                                    onClick={() => setOpen(false)}
                                >
                                    <div className="bg-zinc-800/50 p-2 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">나의 기록</span>
                                </Link>
                            )}
                            <Link
                                to="/hall-of-fame"
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-zinc-200 hover:text-white group"
                                onClick={() => setOpen(false)}
                            >
                                <div className="bg-zinc-800/50 p-2 rounded-lg group-hover:bg-zinc-800 transition-colors">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <span className="font-medium">명예의 전당</span>
                            </Link>
                        </nav>

                        {/* Footer - Logout */}
                        {isLoggedIn && (
                            <div className="pt-6 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-red-500/10 transition-all text-zinc-400 hover:text-red-400 group"
                                >
                                    <div className="bg-zinc-800/50 p-2 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">로그아웃</span>
                                </button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};
