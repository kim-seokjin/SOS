import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PartyPopper, Loader2, RotateCcw, Trophy } from 'lucide-react';
import { Typewriter } from './ui/Typewriter';
import { getHiddenMessages } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface HiddenMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRetry: () => void;
    onNavigateRanking: () => void;
}

export const HiddenMessageDialog: React.FC<HiddenMessageDialogProps> = ({
    open,
    onOpenChange,
    onRetry,
    onNavigateRanking
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState<string[]>([]);

    // Fetch messages on mount or open
    useEffect(() => {
        if (open && messages.length === 0) {
            getHiddenMessages()
                .then(data => setMessages(data.messages))
                .catch(err => console.error("Failed to fetch hidden messages", err));
        }
    }, [open, messages.length]);

    // Reset step when dialog opens
    useEffect(() => {
        if (open) {
            setCurrentStep(0);
        }
    }, [open]);

    const handleComplete = (index: number) => {
        if (index === currentStep) {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm rounded-xl">
                <DialogHeader>
                    <div className="mx-auto bg-yellow-400/10 p-3 rounded-full w-fit mb-4">
                        <PartyPopper className="w-8 h-8 text-yellow-400" />
                    </div>
                    <DialogTitle className="text-xl text-center font-bold">
                        축하합니다! 1등이시군요!
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 pt-2">
                        오직 1등에게만 보이는 비밀 메시지입니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-white/5 p-6 rounded-lg border border-white/10 mt-2 min-h-[300px]">
                    <div className="text-left space-y-4 font-medium leading-relaxed text-zinc-100">
                        {messages.length > 0 ? (
                            messages.map((msg, index) => (
                                currentStep >= index && (
                                    <p key={index} className={index === messages.length - 1 ? "font-bold" : ""}>
                                        <Typewriter
                                            text={msg}
                                            start={true}
                                            onComplete={() => handleComplete(index)}
                                            speed={index === messages.length - 1 ? 50 : 30}
                                        />
                                    </p>
                                )
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 pt-10">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-3 mt-6">
                    <div className="flex flex-row gap-3 w-full">
                        <Button
                            onClick={() => {
                                onRetry();
                                onOpenChange(false);
                            }}
                            className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 gap-2 font-bold py-6"
                        >
                            <RotateCcw className="w-4 h-4" />
                            재도전하기
                        </Button>
                        <Button
                            onClick={onNavigateRanking}
                            className="flex-1 bg-white text-black hover:bg-zinc-200 gap-2 font-bold py-6"
                        >
                            <Trophy className="w-4 h-4" />
                            명예의 전당 확인하기
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
