import React from 'react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timer, Gift, Play } from 'lucide-react';
import worriedGloom from '@/assets/images/worried_gloom2.png';

interface GameGuideProps {
    children: React.ReactNode;
}

export const GameGuide: React.FC<GameGuideProps> = ({ children }) => {
    const slides = [
        {
            title: "🧩 SOS",
            description: "으악! 우리 결혼식에 쓰일 결혼 사진이 다 흩어졌어.\n\n퍼즐을 맞춰서 원래대로 돌려줘!",
            icon: <img src={worriedGloom} alt="Worried Gloom" className="w-24 h-24 object-contain mb-4 drop-shadow-lg" />
        },
        {
            title: "🎮 게임 미션 & 규칙",
            description: "미션은 뒤죽박죽 섞인 3x3 퍼즐 맞추기!\n제한 시간은 딱 60초야.\n\n빠른 손놀림과 집중력이 필요해.",
            icon: <Timer className="w-16 h-16 text-orange-500 mb-4" />,
        },
        {
            title: "🎁 랭킹 이벤트",
            description: "실시간으로 다른 하객들과 기록 경쟁을 해봐.\n가장 빨리 성공한 1등부터 3등한테는 신혼여행 다녀와서 특별한 선물을 줄게!",
            icon: <Gift className="w-16 h-16 text-yellow-400 mb-4" />
        },
        {
            title: "준비됐어?",
            description: "지금 바로 도전해서 우리의 소중한 결혼사진을 완성해줘!",
            icon: <Play className="w-16 h-16 text-green-500 mb-4" />,
            action: true
        }
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full sm:max-w-[800px] bg-black/40 border-white/10 backdrop-blur-2xl text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <Carousel className="w-full max-w-[85vw] mx-auto">
                    <CarouselContent>
                        {slides.map((slide, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <Card className="bg-transparent border-none shadow-none">
                                        <CardContent className="flex flex-col items-center justify-center p-6 md:p-12 text-center min-h-[400px] md:min-h-[500px]">
                                            <div className="mb-6 md:mb-8 animate-bounce-slow transform scale-125 md:scale-150">
                                                {slide.icon}
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-white drop-shadow-lg">{slide.title}</h2>
                                            <p className="text-base md:text-xl text-white/90 whitespace-pre-line mb-6 md:mb-8 leading-relaxed max-w-2xl drop-shadow-md">
                                                {slide.description}
                                            </p>
                                            {slide.action && (
                                                <Button className="w-full max-w-xs md:max-w-md bg-white text-black hover:bg-white/90 font-bold py-6 md:py-8 text-lg md:text-xl rounded-full mt-4 md:mt-6 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                                    게임 시작하기
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 md:left-4 bg-white/10 border-white/10 text-white hover:bg-white/20 w-8 h-8 md:w-12 md:h-12 rounded-full backdrop-blur-md" />
                    <CarouselNext className="right-2 md:right-4 bg-white/10 border-white/10 text-white hover:bg-white/20 w-8 h-8 md:w-12 md:h-12 rounded-full backdrop-blur-md" />
                </Carousel>
            </DialogContent>
        </Dialog>
    );
};
