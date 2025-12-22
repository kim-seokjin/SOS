import axios from 'axios';
import { showToast } from '@/lib/customToast';

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
            const { status, data } = error.response;
            if (status === 401) {
                // Token expired or invalid
                const hadToken = !!localStorage.getItem('accessToken');
                localStorage.removeItem('accessToken');
                if (window.location.pathname !== '/signin') {
                    window.location.href = '/signin';
                }
                if (hadToken) {
                    showToast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
                }
            } else if (data?.detail) {
                console.log(data.detail)
                showToast.error(data.detail);
            } else if (status >= 500) {
                showToast.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', '서버 오류');
            }
        } else {
            showToast.error('서버와 연결할 수 없습니다.', '연결 실패');
        }
        return Promise.reject(error);
    }
);


export const getHiddenMessages = async () => {
    const { data } = await api.get<{ messages: string[] }>('/games/hidden-message');
    return data;
};


