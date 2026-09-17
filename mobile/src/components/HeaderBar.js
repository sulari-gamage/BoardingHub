import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

export default function HeaderBar({
    title = 'BoardingHub',
    onOpenNotifications,
    onOpenProfile,
    showBack = false,
    onBack,
    userAvatar
}) {
    const insets = useSafeAreaInsets();
    const hasAvatar = Boolean(userAvatar && typeof userAvatar === 'string' && userAvatar.trim().length > 0);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchUnreadCount = async () => {
            try {
                const res = await api.notifications.getUnreadCount();
                if (isMounted && res && typeof res.count === 'number') {
                    setUnreadCount(res.count);
                }
            } catch (e) {
                // Ignore silent header count fetch errors
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000); // Polling unread count every 15s

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.headerContent}>
                {/* Left Section: Back Button or Logo + Title */}
                <View style={styles.headerLeft}>
                    {showBack ? (
                        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.logoBadgeContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.headerTitle}>{title}</Text>
                        </View>
                    )}
                </View>

                {/* Right Section: Notification Bell + Profile Avatar */}
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notifBtn}
                        onPress={onOpenNotifications}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                        {unreadCount > 0 && (
                            <View style={styles.notifBadgeContainer}>
                                <Text style={styles.notifBadgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.profileAvatarWrapper}
                        onPress={onOpenProfile}
                        activeOpacity={0.85}
                    >
                        {hasAvatar ? (
                            <Image
                                source={{ uri: userAvatar }}
                                style={styles.profileAvatar}
                            />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Ionicons name="person" size={18} color="#133E32" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#133E32',
    },
    headerContent: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logoBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notifBtn: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notifBadgeContainer: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#133E32',
    },
    notifBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    profileAvatarWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#C3DCD4',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
    },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
