import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SOSLogo } from '@/components/SOSLogo';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle
} from "@/components/ui/drawer";

const signInSchema = z.object({
    name: z.string().min(1, '이름을 입력해주세요'),
    phone: z.string()
        .min(1, '전화번호를 입력해주세요')
        .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)')
});

type SignInFormValues = z.infer<typeof signInSchema>;

import { signIn } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";

export const SignIn: React.FC = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [formData, setFormData] = useState<SignInFormValues | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const {
        control,
        handleSubmit,
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            name: '',
            phone: ''
        }
    });

    const onSubmit = (data: SignInFormValues) => {
        setFormData(data);
        setIsDrawerOpen(true);
    };

    const handleConfirm = async () => {
        console.log("handleConfirm called");
        if (!formData) {
            console.log("No formData");
            return;
        }

        try {
            console.log("Calling signIn API...");
            const { user, accessToken } = await signIn(formData.name, formData.phone);
            console.log("signIn success:", user);
            setAuth(user, accessToken);
            setIsDrawerOpen(false);
            toast.success(`환영합니다, ${user.name}님!`);
            navigate('/play');
        } catch (error: any) {
            console.error('Login failed:', error);
            // Error handling is mostly done in interceptor, but we can catch specific cases or fallback
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (!error.response) {
                toast.error('서버와 연결할 수 없습니다.');
            } else {
                toast.error('로그인에 실패했습니다.');
            }
        }
    };


    return (
        <div className="w-full flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="flex flex-col items-center space-y-2 md:space-y-4 pb-2 md:pb-8">
                    <div className="scale-100 md:scale-150 mb-2">
                        <SOSLogo />
                    </div>
                    <div className="text-center space-y-1 md:space-y-2">
                        <CardTitle className="text-xl md:text-2xl font-bold">환영합니다</CardTitle>
                        <CardDescription className="text-zinc-400 text-xs md:text-sm">
                            원활한 게임 진행을 위해 정보를 입력해주세요
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3 md:space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-10" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-16 w-full mt-6" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-6">
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="name" className="text-zinc-200 group-data-[invalid=true]/field:text-destructive">이름</FieldLabel>
                                        <Input
                                            {...field}
                                            id="name"
                                            placeholder="이름을 입력하세요"
                                            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="phone" className="text-zinc-200 group-data-[invalid=true]/field:text-destructive">전화번호</FieldLabel>
                                        <Input
                                            {...field}
                                            id="phone"
                                            type="tel"
                                            placeholder="010-0000-0000"
                                            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                                            aria-invalid={fieldState.invalid}
                                            onChange={(e) => {
                                                const formatted = formatPhoneNumber(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-5 md:py-6 text-base md:text-lg"
                            >
                                입력 완료
                            </Button>
                            <p className="text-xs text-zinc-500 text-center break-keep">
                                ※ 입력한 정보는 경품 지급 후 일괄 삭제됩니다.
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="bg-zinc-900 border-zinc-800 text-white">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle className="text-2xl font-bold text-center text-white">입력 정보 확인</DrawerTitle>
                            <DrawerDescription className="text-zinc-400 text-center">
                                입력하신 정보가 맞는지 확인해주세요.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0 space-y-4">
                            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm">이름</span>
                                    <span className="font-bold text-lg">{formData?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400 text-sm">전화번호</span>
                                    <span className="font-bold text-lg">{formData?.phone}</span>
                                </div>
                            </div>
                        </div>
                        <DrawerFooter>
                            <Button onClick={handleConfirm} className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-6 text-lg">
                                확인
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white py-6">
                                    수정하기
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
};
