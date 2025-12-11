import axios from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Error Handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                // Token expired or invalid
                localStorage.removeItem('accessToken');
                if (window.location.pathname !== '/signin') {
                    window.location.href = '/signin';
                }
                toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
            } else if (status >= 500) {
                toast.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        }
        return Promise.reject(error);
    }
);

export interface GameRecordResponse {
    success: boolean;
    rank: number;
}

export const recordGame = async (clearTimeMs: number): Promise<GameRecordResponse> => {
    const response = await api.post<GameRecordResponse>('/games/record', { clearTimeMs });
    return response.data;
};

export interface RankItem {
    rank: number;
    name: string;
    record: string; // "MM:SS.ms" or similar string format from server, or we format it. PRD says string.
    userId: string;
}

export interface MyRankResponse {
    rank: number;
    record: string;
}

export const getRankings = async (limit: number = 10): Promise<RankItem[]> => {
    const response = await api.get<RankItem[]>('/ranks', { params: { limit } });
    return response.data;
};

export const getMyRank = async (): Promise<MyRankResponse> => {
    const response = await api.get<MyRankResponse>('/ranks/my');
    return response.data;
};

