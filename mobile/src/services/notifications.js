import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Safely detect if running inside Expo Go app vs Standalone / Dev Build
const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient' ||
    (Constants.expoConfig?.name && !Constants.expoConfig?.extra?.eas?.projectId);

let Notifications = null;

// Dynamically require expo-notifications only if supported / available
try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function' && !isExpoGo) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    }
} catch (e) {
    console.log('[Push] Notice: expo-notifications module unavailable or disabled in Expo Go.');
}

/**
 * Register device for Expo Push Notifications and save token to backend
 */
export async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
        console.log('[Push] Running in Expo Go (SDK 53+). Remote device push notifications are reserved for standalone/development builds. In-app notifications are active.');
        return null;
    }

    if (!Notifications) {
        console.log('[Push] expo-notifications package not loaded.');
        return null;
    }

    let token = null;

    try {
        // Set up Android high priority notification channel
        if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
            try {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default Notifications',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#1B4D3E',
                    sound: 'default',
                });
            } catch (chanErr) {
                console.log('[Push] Channel setup notice:', chanErr?.message);
            }
        }

        // Check existing permission status
        if (typeof Notifications.getPermissionsAsync !== 'function') return null;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not already granted
        if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Notification permission denied by user.');
            return null;
        }

        // Project ID fallback for EAS
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ||
            Constants?.easConfig?.projectId;

        try {
            if (typeof Notifications.getExpoPushTokenAsync === 'function') {
                const pushTokenData = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined
                );
                token = pushTokenData?.data;
            }
        } catch (tokenErr) {
            console.log('[Push] Notice: Device push token skipped:', tokenErr?.message);
        }

        if (token) {
            console.log('[Push] Successfully generated Expo Push Token:', token);
            // Save push token to Spring Boot backend database
            await api.user.savePushToken(token);
            console.log('[Push] Push token registered with backend successfully.');
        }
    } catch (error) {
        console.log('[Push] Notice in registerForPushNotificationsAsync:', error?.message || error);
    }

    return token;
}

/**
 * Setup notification listeners for foreground, background, and cold-start tap handling
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    if (isExpoGo || !Notifications) {
        return () => { };
    }

    try {
        // 1. Foreground notification received listener
        const notificationListener = typeof Notifications.addNotificationReceivedListener === 'function'
            ? Notifications.addNotificationReceivedListener(notification => {
                console.log('[Push] Foreground notification received:', notification?.request?.content?.title);
                if (onNotificationReceived) {
                    onNotificationReceived(notification);
                }
            })
            : null;

        // 2. Notification tap response listener (Foreground / Backgrounded app)
        const responseListener = typeof Notifications.addNotificationResponseReceivedListener === 'function'
            ? Notifications.addNotificationResponseReceivedListener(response => {
                console.log('[Push] Notification tapped by user:', response?.notification?.request?.content?.data);
                if (onNotificationResponse) {
                    const data = response?.notification?.request?.content?.data || {};
                    onNotificationResponse(data);
                }
            })
            : null;

        // 3. Cold Start listener
        if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
            Notifications.getLastNotificationResponseAsync().then(response => {
                if (response) {
                    console.log('[Push] Cold start notification response detected:', response?.notification?.request?.content?.data);
                    if (onNotificationResponse) {
                        const data = response?.notification?.request?.content?.data || {};
                        onNotificationResponse(data);
                    }
                }
            }).catch(err => {
                console.log('[Push] Error checking cold start notification response:', err?.message);
            });
        }

        // Return cleanup unsubscribe function
        return () => {
            if (notificationListener && typeof Notifications.removeNotificationSubscription === 'function') {
                Notifications.removeNotificationSubscription(notificationListener);
            }
            if (responseListener && typeof Notifications.removeNotificationSubscription === 'function') {
                Notifications.removeNotificationSubscription(responseListener);
            }
        };
    } catch (e) {
        console.log('[Push] Notice setting up listeners:', e?.message);
        return () => { };
    }
}
