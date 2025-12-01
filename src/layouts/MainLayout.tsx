import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import LightRays from '@/components/LightRays';

export const MainLayout: React.FC = () => {
    return (
        <div className="relative w-full min-h-screen bg-[#030014] overflow-hidden selection:bg-white/20">
            <div className="absolute inset-0 z-0">
                <LightRays
                    raysOrigin={'top-center'}
                    raysSpeed={1}
                    lightSpread={0.5}
                    rayLength={3}
                    fadeDistance={1.0}
                    saturation={1.0}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0.0}
                    distortion={0.0}
                    className="" />
            </div>

            <Header />

            <div className="relative z-10">
                <Outlet />
            </div>
        </div>
    );
};
