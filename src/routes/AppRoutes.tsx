import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages
const Home = React.lazy(() => import('@/pages/Home').then(module => ({ default: module.Home })));
const SignIn = React.lazy(() => import('@/pages/SignIn').then(module => ({ default: module.SignIn })));
const Play = React.lazy(() => import('@/pages/Play').then(module => ({ default: module.Play })));
const HallOfFame = React.lazy(() => import('@/pages/HallOfFame').then(module => ({ default: module.HallOfFame })));
const MyRecords = React.lazy(() => import('@/pages/MyRecords').then(module => ({ default: module.MyRecords })));
const NotFound = React.lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFound })));

const PageLoader = () => (
    <div className="w-full min-h-screen flex flex-col items-center bg-[#030014]">
        {/* Header Skeleton */}
        <div className="w-full flex items-center justify-center p-6 pb-0 mb-12">
            <div className="flex items-center justify-between w-full max-w-4xl px-6 py-3 bg-white/5 border border-white/10 rounded-full">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-white/10" />
                    <Skeleton className="w-12 h-6 rounded bg-white/10" />
                </div>
                <Skeleton className="w-6 h-6 rounded bg-white/10" />
            </div>
        </div>

        {/* Hero Skeleton */}
        <div className="flex flex-col items-center w-full max-w-5xl px-4 text-center">
            {/* Tag Skeleton */}
            <Skeleton className="h-8 w-64 rounded-full mb-8 bg-white/5" />

            {/* Title Skeleton */}
            <div className="flex flex-col items-center md:items-start gap-2 mb-12 w-full">
                <Skeleton className="h-24 w-64 md:w-96 bg-white/5" />
            </div>

            {/* Buttons Skeleton */}
            <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-14 w-64 rounded-full bg-white/5" />
                <Skeleton className="h-14 w-64 rounded-full bg-white/5" />
            </div>
        </div>
    </div>
);

const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="signin" element={<SignIn />} />
                    <Route path="play" element={<Play />} />
                    <Route path="hall-of-fame" element={<HallOfFame />} />
                    <Route path="my-records" element={<MyRecords />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
