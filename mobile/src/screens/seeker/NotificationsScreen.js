import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ onBack, onSelectNotification }) {
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [notifications, setNotifications] = useState([
        {
            id: 'n1',
            type: 'BOOKING',
            title: 'Booking Request Received',
            message: 'Your booking request for Green Valley Boarding has been submitted to the owner Sunethra Silva.',
            timestamp: '10 mins ago',
            isUnread: true,
            icon: 'calendar'
        },
        {
            id: 'n2',
            type: 'BOOKING',
            title: 'Booking Accepted! 🎉',
            message: 'Sunrise Apartments owner Kamal Fernando accepted your request. Tap to contact owner via WhatsApp.',
            timestamp: '2 hours ago',
            isUnread: true,
            icon: 'checkmark-circle'
        },
        {
            id: 'n3',
            type: 'SYSTEM',
            title: 'New Boarding Places Near Moratuwa',
            message: '3 new female student boardings have been listed near University of Moratuwa.',
            timestamp: '1 day ago',
            isUnread: false,
            icon: 'home'
        },
        {
            id: 'n4',
            type: 'SYSTEM',
            title: 'Profile Verification Complete',
            message: 'Your renter identity has been verified successfully.',
            timestamp: '3 days ago',
            isUnread: false,
            icon: 'shield-checkmark'
        }
    ]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeCategory === 'BOOKINGS') return n.type === 'BOOKING';
        if (activeCategory === 'SYSTEM') return n.type === 'SYSTEM';
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

                <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead} activeOpacity={0.8}>
                    <Ionicons name="checkmark-done-outline" size={20} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            {/* Category Filter Bar */}
            <View style={styles.filterBar}>
                {['ALL', 'BOOKINGS', 'SYSTEM'].map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
                        onPress={() => setActiveCategory(cat)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
                            {cat === 'ALL' ? 'All Alerts' : cat === 'BOOKINGS' ? 'Bookings' : 'System'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Notifications Feed */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.notifCard, item.isUnread && styles.unreadCard]}
                            onPress={() => {
                                setNotifications(notifications.map(n => n.id === item.id ? { ...n, isUnread: false } : n));
                                if (onSelectNotification) onSelectNotification(item);
                            }}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.iconBg, item.type === 'BOOKING' ? styles.bookingIconBg : styles.systemIconBg]}>
                                <Ionicons
                                    name={item.icon || 'notifications'}
                                    size={20}
                                    color={item.type === 'BOOKING' ? '#1B4D3E' : '#D97706'}
                                />
                            </View>

                            <View style={styles.notifContent}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.notifTitle, item.isUnread && styles.unreadTitle]}>
                                        {item.title}
                                    </Text>
                                    {item.isUnread && <View style={styles.unreadDot} />}
                                </View>

                                <Text style={styles.notifMessage}>{item.message}</Text>
                                <Text style={styles.timestampText}>{item.timestamp}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
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
        paddingTop: Platform.OS === 'android' ? 20 : 0,
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
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
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
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    unreadCard: {
        backgroundColor: '#F0FDF4',
        borderColor: '#C3DCD4',
    },
    iconBg: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    bookingIconBg: {
        backgroundColor: '#E6F0EC',
    },
    systemIconBg: {
        backgroundColor: '#FEF3C7',
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
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '900',
        color: '#1B4D3E',
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
        color: '#475569',
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
