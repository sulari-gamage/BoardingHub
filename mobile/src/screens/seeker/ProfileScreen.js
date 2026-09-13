import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BottomNavBar from '../../components/BottomNavBar';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function ProfileScreen({
    onLogout,
    onNavigateTab,
    onOpenNotifications,
    onOpenReviews,
    currentUser,
    onUserUpdated,
    savedBoardings = [],
    userBookings = [],
}) {
    const [profile, setProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
    const [loading, setLoading] = useState(false);

    // Edit Profile Modal State
    const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Change Password Modal State
    const [isSecurityVisible, setIsSecurityVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const data = await api.user.getProfile();
            if (data) {
                setProfile(data);
                setAvatarUrl(data.avatarUrl || '');
                if (onUserUpdated) onUserUpdated(data);
            }
        } catch (err) {
            console.log('[ProfileScreen] Profile fetch error:', err.message);
        }
    };

    const userName = profile?.name || currentUser?.name || 'User Renter';
    const userEmail = profile?.email || currentUser?.email || 'seeker@email.com';
    const userPhone = profile?.phone || currentUser?.phone || 'Not provided';
    const currentAvatar = avatarUrl || profile?.avatarUrl || currentUser?.avatarUrl || null;
    const hasAvatar = Boolean(currentAvatar && typeof currentAvatar === 'string' && currentAvatar.trim().length > 0);

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

                setAvatarUrl(pickedUri);
                setLoading(true);

                const updatedData = await api.user.updateProfile({ name: userName, avatarUrl: pickedUri });
                setProfile(updatedData);
                if (onUserUpdated) {
                    onUserUpdated(updatedData);
                }
                Alert.alert('Success 🎉', 'Profile picture updated successfully!');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to update avatar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditProfile = () => {
        setEditName(userName);
        setEditPhone(userPhone === 'Not provided' ? '' : userPhone);
        setIsEditProfileVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert('Required Field', 'Please enter your name.');
            return;
        }

        try {
            setIsSavingProfile(true);
            const updatedData = await api.user.updateProfile({
                name: editName.trim(),
                phone: editPhone.trim(),
                avatarUrl: currentAvatar,
            });
            setProfile(updatedData);
            if (onUserUpdated) onUserUpdated(updatedData);
            setIsEditProfileVisible(false);
            Alert.alert('Profile Updated 🎉', 'Your details have been updated successfully!');
        } catch (error) {
            Alert.alert('Update Failed', error.message || 'Could not update profile details.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Required Fields', 'Please fill in all password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
            return;
        }

        try {
            setIsSavingPassword(true);
            await api.user.changePassword({
                currentPassword,
                newPassword,
            });
            setIsSecurityVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Password Changed 🔒', 'Your password has been changed successfully!');
        } catch (error) {
            Alert.alert('Change Failed', error.message || 'Could not change password.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const menuItems = [
        {
            id: 'personal',
            icon: 'person-outline',
            title: 'Personal Information',
            subtitle: 'Update your name & phone',
            onPress: handleOpenEditProfile,
        },
        {
            id: 'notifications',
            icon: 'notifications-outline',
            title: 'Notifications',
            subtitle: 'Manage alerts',
            onPress: () => {
                if (onOpenNotifications) onOpenNotifications();
                else if (onNavigateTab) onNavigateTab('NOTIFICATIONS');
            },
        },
        {
            id: 'security',
            icon: 'shield-checkmark-outline',
            title: 'Privacy & Security',
            subtitle: 'Change password',
            onPress: () => setIsSecurityVisible(true),
        },
        {
            id: 'reviews',
            icon: 'chatbox-ellipses-outline',
            title: 'My Reviews',
            subtitle: 'See feedback',
            onPress: () => {
                if (onOpenReviews) onOpenReviews();
                else if (onNavigateTab) onNavigateTab('REVIEWS');
            },
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            title: 'Help & Support',
            subtitle: 'Get assistance',
            onPress: () => Alert.alert('Help & Support 💬', 'Need assistance? Email us at support@boardinghub.lk or contact us via WhatsApp.'),
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Standardized HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentAvatar || currentUser?.avatarUrl}
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
                    <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.85}>
                        {hasAvatar ? (
                            <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={[styles.avatarImage, styles.placeholderAvatarLarge]}>
                                <Ionicons name="person" size={40} color="#133E32" />
                            </View>
                        )}
                        <View style={styles.editAvatarBtn}>
                            <Ionicons name="camera" size={14} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>

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

                {/* Stats Row (Real Metrics: Saved & Requests) */}
                <View style={styles.statsRow}>
                    {/* Saved Properties Card */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => onNavigateTab && onNavigateTab('FAVORITES')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="heart-outline" size={24} color="#EF4444" style={styles.statIcon} />
                        <Text style={styles.statVal}>{savedBoardings.length}</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                    </TouchableOpacity>

                    {/* My Requests Card */}
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => onNavigateTab && onNavigateTab('BOOKINGS')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="paper-plane-outline" size={24} color="#133E32" style={styles.statIcon} />
                        <Text style={styles.statVal}>{userBookings.length}</Text>
                        <Text style={styles.statLabel}>My Requests</Text>
                    </TouchableOpacity>
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

            {/* Edit Personal Information Modal */}
            <Modal visible={isEditProfileVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Personal Information</Text>
                            <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your full name"
                        />

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#F1F5F9', color: '#64748B' }]}
                            value={userEmail}
                            editable={false}
                        />

                        <Text style={styles.inputLabel}>Phone / WhatsApp Number</Text>
                        <TextInput
                            style={styles.input}
                            value={editPhone}
                            onChangeText={setEditPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSaveProfile}
                            disabled={isSavingProfile}
                        >
                            {isSavingProfile ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Privacy & Security Modal */}
            <Modal visible={isSecurityVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Privacy & Security</Text>
                            <TouchableOpacity onPress={() => setIsSecurityVisible(false)}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Current Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showCurrentPassword ? "eye" : "eye-off"} size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSavePassword}
                            disabled={isSavingPassword}
                        >
                            {isSavingPassword ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    switchOwnerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        marginTop: 4,
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

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
        marginBottom: 14,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 44,
        marginBottom: 14,
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    eyeBtn: {
        padding: 4,
    },
    saveBtn: {
        backgroundColor: '#133E32',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
