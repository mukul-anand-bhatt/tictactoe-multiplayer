export interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    error?: string;
    token?: string;
    user?: any;
}

const BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        return data;
    }
    throw new Error('Invalid response format');
}

export const api = {
    get: async <T>(endpoint: string, token?: string): Promise<T> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });
        return handleResponse<T>(response);
    },

    post: async <T>(endpoint: string, body: any, token?: string): Promise<T> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        return handleResponse<T>(response);
    },

    delete: async <T>(endpoint: string, token?: string): Promise<T> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        return handleResponse<T>(response);
    }
};
