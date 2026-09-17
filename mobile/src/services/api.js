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

import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe Storage helper (prefers AsyncStorage, fallback to window.localStorage / memory storage)
let memoryStore = {};
const storage = {
    getItem: async (key) => {
        try {
            if (AsyncStorage && AsyncStorage.getItem) {
                const val = await AsyncStorage.getItem(key);
                if (val !== null) return val;
            }
        } catch (e) { }
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) { }
        return memoryStore[key] || null;
    },
    setItem: async (key, value) => {
        try {
            if (AsyncStorage && AsyncStorage.setItem) {
                await AsyncStorage.setItem(key, value);
            }
        } catch (e) { }
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (e) { }
        memoryStore[key] = value;
    },
    removeItem: async (key) => {
        try {
            if (AsyncStorage && AsyncStorage.removeItem) {
                await AsyncStorage.removeItem(key);
            }
        } catch (e) { }
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
            console.warn('[API] ✗  Error:', errorMessage);
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

        forgotPassword: async (email) => {
            return await request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
        },

        verifyOtp: async (email, otp) => {
            return await request('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            });
        },

        resetPassword: async (token, newPassword) => {
            return await request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword }),
            });
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
            return await request(`/properties/${id}?t=${Date.now()}`, { method: 'GET' });
        },

        getMyProperties: async () => {
            return await request(`/properties/my-properties?t=${Date.now()}`, { method: 'GET' });
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

        geocode: async (address, city = '') => {
            const queryParams = new URLSearchParams({ address });
            if (city) queryParams.append('city', city);
            return await request(`/properties/geocode?${queryParams.toString()}`, { method: 'GET' });
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

        getByPropertyId: async (propertyId) => {
            try {
                return await request(`/bookings/property/${propertyId}`, { method: 'GET' });
            } catch (e) {
                return [];
            }
        },

        updateStatus: async (id, status) => {
            return await request(`/bookings/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
        },

        delete: async (id) => {
            return await request(`/bookings/${id}`, { method: 'DELETE' });
        },

        deleteBooking: async (id) => {
            return await request(`/bookings/${id}`, { method: 'DELETE' });
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

        getMyReviews: async () => {
            return await request('/reviews/my', { method: 'GET' });
        },
    },

    // Favorite / Saved Services
    favorites: {
        getSaved: async () => {
            return await request('/favorites', { method: 'GET' });
        },

        toggle: async (propertyId) => {
            return await request(`/favorites/${propertyId}/toggle`, {
                method: 'POST',
            });
        },
    },

    // Admin Services
    admin: {
        getPendingProperties: async () => {
            return await request('/admin/properties/pending', { method: 'GET' });
        },

        approveProperty: async (id) => {
            return await request(`/admin/properties/${id}/approve`, { method: 'PATCH' });
        },

        rejectProperty: async (id) => {
            return await request(`/admin/properties/${id}/reject`, { method: 'PATCH' });
        },
    },

    // User / Profile Services
    user: {
        getProfile: async () => {
            return await request(`/users/profile?t=${Date.now()}`, { method: 'GET' });
        },

        updateProfile: async (userData) => {
            const data = await request('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(userData),
            });
            // Also update local cached user data if present
            try {
                const currentUserStr = await storage.getItem(USER_KEY);
                if (currentUserStr) {
                    const currentUser = JSON.parse(currentUserStr);
                    const updatedUser = { ...currentUser, ...data };
                    await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
                }
            } catch (e) { }
            return data;
        },

        changePassword: async (passwordData) => {
            return await request('/users/change-password', {
                method: 'PUT',
                body: JSON.stringify(passwordData),
            });
        },
    },

    storage,
};

export default api;
