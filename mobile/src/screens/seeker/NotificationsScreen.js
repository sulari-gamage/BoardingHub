import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function NotificationsScreen({ onBack, onSelectNotification }) {
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await api.notifications.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log('[NotificationsScreen] Error fetching notifications:', error?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAllAsRead = async () => {
        try {
            await api.notifications.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.log('[NotificationsScreen] Error marking all as read:', error?.message);
        }
    };

    const handleSelectNotification = async (item) => {
        if (!item.isRead) {
            // Optimistically mark as read in state instantly
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            try {
                await api.notifications.markAsRead(item.id);
            } catch (error) {
                console.log('[NotificationsScreen] Error marking notification read:', error?.message);
            }
        }
        if (onSelectNotification) {
            onSelectNotification(item);
        }
    };

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return 'Just now';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            const diffInMins = Math.floor(diffInSeconds / 60);
            if (diffInMins < 60) return `${diffInMins}m ago`;
            const diffInHours = Math.floor(diffInMins / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 30) return `${diffInDays}d ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return dateStr;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING_REQUEST':
                return { name: 'calendar', color: '#1B4D3E', bg: '#E6F0EC' };
            case 'BOOKING_APPROVED':
                return { name: 'checkmark-circle', color: '#166534', bg: '#DCFCE7' };
            case 'BOOKING_REJECTED':
                return { name: 'close-circle', color: '#991B1B', bg: '#FEE2E2' };
            case 'BOOKING_CANCELLED':
                return { name: 'alert-circle', color: '#D97706', bg: '#FEF3C7' };
            case 'MOVE_IN_REMINDER':
                return { name: 'alarm', color: '#2563EB', bg: '#DBEAFE' };
            case 'NEW_REVIEW':
                return { name: 'star', color: '#D97706', bg: '#FEF3C7' };
            default:
                return { name: 'notifications', color: '#475569', bg: '#F1F5F9' };
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const filteredNotifications = notifications.filter(n => {
        if (activeCategory === 'READ') return n.isRead === true;
        if (activeCategory === 'UNREAD') return n.isRead === false;
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Notifications</Text>

                <TouchableOpacity
                    style={[styles.markReadBtn, unreadCount === 0 && styles.markReadBtnDisabled]}
                    onPress={markAllAsRead}
                    disabled={unreadCount === 0}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-done-outline" size={16} color={unreadCount > 0 ? '#1B4D3E' : '#94A3B8'} />
                    <Text style={[styles.markReadText, unreadCount === 0 && styles.markReadTextDisabled]}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            {/* Category Filter Bar (All, Read, Unread) */}
            <View style={styles.filterBar}>
                {[
                    { key: 'ALL', label: 'All' },
                    { key: 'READ', label: 'Read' },
                    { key: 'UNREAD', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
                ].map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[styles.filterChip, activeCategory === cat.key && styles.filterChipActive]}
                        onPress={() => setActiveCategory(cat.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterChipText, activeCategory === cat.key && styles.filterChipTextActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Notifications Feed */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B4D3E']} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1B4D3E" />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((item) => {
                        const iconConfig = getNotificationIcon(item.type);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.notifCard, !item.isRead && styles.unreadCard]}
                                onPress={() => handleSelectNotification(item)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.iconBg, { backgroundColor: iconConfig.bg }]}>
                                    <Ionicons
                                        name={iconConfig.name}
                                        size={20}
                                        color={iconConfig.color}
                                    />
                                </View>

                                <View style={styles.notifContent}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>
                                            {item.title}
                                        </Text>
                                        {!item.isRead && <View style={styles.unreadDot} />}
                                    </View>

                                    <Text style={styles.notifMessage}>{item.message}</Text>
                                    <Text style={styles.timestampText}>{formatRelativeTime(item.createdAt)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>
                            You are all caught up! Updates regarding your bookings will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    markReadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
    },
    markReadBtnDisabled: {
        backgroundColor: '#F1F5F9',
    },
    markReadText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    markReadTextDisabled: {
        color: '#94A3B8',
    },

    /* Filter Bar */
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    filterChipActive: {
        backgroundColor: '#1B4D3E',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFD700',
        fontWeight: '800',
    },

    /* Feed */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 14,
    },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
        elevation: 2,
    },
    iconBg: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    notifContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        flex: 1,
    },
    unreadTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginLeft: 6,
    },
    notifMessage: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 19,
        marginBottom: 6,
    },
    timestampText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },

    /* Empty State */
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 30,
        lineHeight: 20,
    },
});
