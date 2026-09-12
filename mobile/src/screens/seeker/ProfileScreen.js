import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function ProfileScreen({ onLogout, onNavigateTab, onOpenNotifications, onOpenReviews, currentUser, onUserUpdated }) {
    const user = {
        name: currentUser?.name || 'User Renter',
        email: currentUser?.email || 'seeker@email.com',
        avatarUrl: currentUser?.avatarUrl || null,
        rating: 4.8,
        pastStays: 0,
        isVerified: true,
    };
    const hasAvatar = Boolean(user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim().length > 0);

    const handlePickAvatar = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access media gallery is required!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const pickedUri = asset.base64
                    ? `data:image/jpeg;base64,${asset.base64}`
                    : asset.uri;

                const updatedData = await api.user.updateProfile({ avatarUrl: pickedUri });
                if (onUserUpdated) {
                    onUserUpdated(updatedData);
                }
                Alert.alert('Success 🎉', 'Profile picture updated successfully!');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to update avatar: ' + err.message);
        }
    };

    const menuItems = [
        {
            id: 'personal',
            icon: 'person-outline',
            title: 'Personal Information',
            subtitle: 'Update your details',
            onPress: () => Alert.alert('Personal Information', 'User profile details settings coming soon!')
        },
        {
            id: 'notifications',
            icon: 'notifications-outline',
            title: 'Notifications',
            subtitle: 'Manage alerts',
            onPress: () => {
                if (onOpenNotifications) onOpenNotifications();
                else if (onNavigateTab) onNavigateTab('NOTIFICATIONS');
            }
        },
        {
            id: 'security',
            icon: 'shield-checkmark-outline',
            title: 'Privacy & Security',
            subtitle: 'Password and security',
            onPress: () => Alert.alert('Privacy & Security', 'Security settings coming soon!')
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            title: 'Help & Support',
            subtitle: 'Get assistance',
            onPress: () => Alert.alert('Help & Support', 'BoardingHub Support: support@boardinghub.lk')
        },
        {
            id: 'reviews',
            icon: 'chatbox-ellipses-outline',
            title: 'My Reviews',
            subtitle: 'See feedback',
            onPress: () => {
                if (onOpenReviews) onOpenReviews();
                else if (onNavigateTab) onNavigateTab('REVIEWS');
            }
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentUser?.avatarUrl}
                onOpenNotifications={() => {
                    if (onOpenNotifications) onOpenNotifications();
                    else if (onNavigateTab) onNavigateTab('NOTIFICATIONS');
                }}
                onOpenProfile={() => {
                    if (onNavigateTab) onNavigateTab('PROFILE');
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Screen Heading */}
                <Text style={styles.screenHeading}>My Profile</Text>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrapper}>
                        {hasAvatar ? (
                            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={[styles.avatarImage, styles.placeholderAvatarLarge]}>
                                <Ionicons name="person" size={40} color="#133E32" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickAvatar} activeOpacity={0.8}>
                            <Ionicons name="pencil" size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    {/* Verified Badge */}
                    <View style={styles.verifiedPill}>
                        <Text style={styles.verifiedPillText}>Verified Renter</Text>
                    </View>

                    {/* Switch to Owner Dashboard Banner */}
                    <TouchableOpacity
                        style={styles.switchOwnerBanner}
                        onPress={() => onNavigateTab && onNavigateTab('OWNER_HOME')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="business" size={16} color="#133E32" style={{ marginRight: 6 }} />
                        <Text style={styles.switchOwnerText}>Switch to Owner Dashboard</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row (2 Cards) */}
                <View style={styles.statsRow}>
                    {/* Rating Card */}
                    <View style={styles.statCard}>
                        <Ionicons name="star-outline" size={24} color="#133E32" style={styles.statIcon} />
                        <Text style={styles.statVal}>{user.rating}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>

                    {/* Past Stays Card */}
                    <View style={styles.statCard}>
                        <Ionicons name="home-outline" size={24} color="#133E32" style={styles.statIcon} />
                        <Text style={styles.statVal}>{user.pastStays}</Text>
                        <Text style={styles.statLabel}>Past Stays</Text>
                    </View>
                </View>

                {/* Menu Options Group Card */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, idx) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, idx === menuItems.length - 1 && styles.lastMenuItem]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconBg}>
                                <Ionicons name={item.icon} size={20} color="#133E32" />
                            </View>

                            <View style={styles.menuTextContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>

                            <Ionicons name="chevron-forward" size={18} color="#64748B" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        Alert.alert(
                            'Logout',
                            'Are you sure you want to log out of BoardingHub?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', style: 'destructive', onPress: onLogout }
                            ]
                        );
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <BottomNavBar
                activeTab="PROFILE"
                onTabChange={(tab) => onNavigateTab && onNavigateTab(tab)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Scroll Content */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 24,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Screen Title */
    screenHeading: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
        marginBottom: 16,
    },

    /* Profile Card */
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#A7F3D0',
    },
    placeholderAvatarLarge: {
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 14,
    },
    verifiedPill: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 20,
    },
    verifiedPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#065F46',
    },
    switchOwnerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    switchOwnerText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Stats Row */
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    statIcon: {
        marginBottom: 6,
    },
    statVal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },

    /* Menu Card */
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuTextContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },

    /* Logout Button */
    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        height: 48,
        borderRadius: 14,
    },
    logoutBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#DC2626',
    },
});
