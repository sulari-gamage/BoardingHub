import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatically detect the backend server IP from Expo Go's tunneling metadata.
// This works on both physical devices and emulators without any hardcoded IPs.
const getBaseUrl = () => {
    // Allow override via environment variable for CI / standalone builds
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    try {
        // Expo SDK 49+: expoConfig.hostUri (e.g. "192.168.1.10:8081")
        const hostUri =
            Constants.expoConfig?.hostUri ||
            // Expo SDK 46–48: manifest2 path used by Expo Go on physical devices
            Constants.manifest2?.extra?.expoGo?.debuggerHost ||
            // Expo SDK ≤45 / classic manifest
            Constants.manifest?.debuggerHost;

        if (hostUri) {
            const hostIp = hostUri.split(':')[0]; // strip the Metro bundler port
            console.log('[API] Auto-detected Expo host IP:', hostIp);
            return `http://${hostIp}:8080/api`;
        }
    } catch (e) {
        console.log('[API] Could not auto-detect Expo host IP:', e?.message);
    }

    // Fallback: Android emulator → 10.0.2.2 maps to host machine localhost
    if (Platform.OS === 'android') {
        console.log('[API] Falling back to Android emulator loopback (10.0.2.2)');
        return 'http://10.0.2.2:8080/api';
    }
    // iOS simulator / web
    return 'http://localhost:8080/api';
};

const BASE_URL = getBaseUrl();
console.log('BoardingHub API Base URL initialized:', BASE_URL);

const TOKEN_KEY = 'boardinghub_jwt_token';
const USER_KEY = 'boardinghub_user_data';

// Safe Storage helper (uses localStorage / memory storage fallback)
let memoryStore = {};
const storage = {
    getItem: async (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) { }
        return memoryStore[key] || null;
    },
    setItem: async (key, value) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (e) { }
        memoryStore[key] = value;
    },
    removeItem: async (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (e) { }
        delete memoryStore[key];
    }
};

// Helper to make fetch requests with standard error handling, 8s timeout & JWT injection
async function request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout guard

    try {
        const token = await storage.getItem(TOKEN_KEY);
        const fullUrl = `${BASE_URL}${endpoint}`;

        // ── DIAGNOSTIC LOGGING ──────────────────────────────────────────────
        console.log(`[API] →  ${options.method || 'GET'} ${fullUrl}`);
        if (token) console.log('[API]    Auth: Bearer', token.substring(0, 20) + '...');
        else console.log('[API]    Auth: none (unauthenticated request)');
        if (options.body) console.log('[API]    Body:', options.body);
        // ────────────────────────────────────────────────────────────────────

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(fullUrl, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        let data = null;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }

        // ── RESPONSE LOGGING ────────────────────────────────────────────────
        console.log(`[API] ←  ${response.status} ${response.statusText} | Content-Type: ${contentType}`);
        if (data) console.log('[API]    Response data:', JSON.stringify(data).substring(0, 200));
        // ────────────────────────────────────────────────────────────────────

        if (!response.ok) {
            const errorMessage = data?.message || data?.error || `Server error (${response.status})`;
            console.error('[API] ✗  Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Cannot connect to backend server at ${BASE_URL}. Please verify Spring Boot is running!`);
        }
        throw error;
    }
}

export const api = {
    // Auth Services
    auth: {
        login: async (email, password) => {
            const data = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.token) {
                await storage.setItem(TOKEN_KEY, data.token);
                await storage.setItem(USER_KEY, JSON.stringify(data));
            }
            return data;
        },

        register: async (userData) => {
            // Clear any existing session before registering a new account.
            // This prevents a stale JWT from a previous login/register from being
            // sent in the Authorization header, which can cause a 403 on the backend.
            await storage.removeItem(TOKEN_KEY);
            await storage.removeItem(USER_KEY);

            console.log('[API] Registering new user with role:', userData.role, '| email:', userData.email);

            const data = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            if (data.token) {
                await storage.setItem(TOKEN_KEY, data.token);
                await storage.setItem(USER_KEY, JSON.stringify(data));
            }
            return data;
        },

        logout: async () => {
            await storage.removeItem(TOKEN_KEY);
            await storage.removeItem(USER_KEY);
        },

        getCurrentUser: async () => {
            const userStr = await storage.getItem(USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        },

        getToken: async () => {
            return await storage.getItem(TOKEN_KEY);
        },
    },

    // Property Services
    properties: {
        getAll: async (filters = {}) => {
            const queryParams = new URLSearchParams();
            if (filters.city) queryParams.append('city', filters.city);
            if (filters.maxRent) queryParams.append('maxRent', filters.maxRent);
            if (filters.gender) queryParams.append('gender', filters.gender);

            const queryString = queryParams.toString();
            const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
            return await request(endpoint, { method: 'GET' });
        },

        getById: async (id) => {
            return await request(`/properties/${id}`, { method: 'GET' });
        },

        getMyProperties: async () => {
            return await request('/properties/my-properties', { method: 'GET' });
        },

        create: async (propertyData) => {
            return await request('/properties', {
                method: 'POST',
                body: JSON.stringify(propertyData),
            });
        },

        update: async (id, propertyData) => {
            return await request(`/properties/${id}`, {
                method: 'PUT',
                body: JSON.stringify(propertyData),
            });
        },

        delete: async (id) => {
            return await request(`/properties/${id}`, { method: 'DELETE' });
        },
    },

    // Booking Services
    bookings: {
        create: async (bookingData) => {
            return await request('/bookings', {
                method: 'POST',
                body: JSON.stringify(bookingData),
            });
        },

        getMyBookings: async () => {
            return await request('/bookings/my-bookings', { method: 'GET' });
        },

        getOwnerRequests: async () => {
            return await request('/bookings/owner-requests', { method: 'GET' });
        },

        updateStatus: async (id, status) => {
            return await request(`/bookings/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
        },
    },

    // Review Services
    reviews: {
        create: async (reviewData) => {
            return await request('/reviews', {
                method: 'POST',
                body: JSON.stringify(reviewData),
            });
        },

        getByPropertyId: async (propertyId) => {
            return await request(`/properties/${propertyId}/reviews`, { method: 'GET' });
        },
    },
};

export default api;
