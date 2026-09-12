import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Switch,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../../components/HeaderBar';
import api from '../../services/api';

export default function OwnerProfileScreen({
    onNavigateTab,
    onSwitchToSeeker,
    onLogout,
    onOpenNotifications,
    onUserUpdated,
    activeTab = 'Profile',
    currentUser
}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal Visibility States
    const [personalModalVisible, setPersonalModalVisible] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const [securityModalVisible, setSecurityModalVisible] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);

    // Form Field States
    const [editName, setEditName] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Security Form States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    // Notification Preference Toggles
    const [notifBookingRequests, setNotifBookingRequests] = useState(true);
    const [notifPropertyInquiries, setNotifPropertyInquiries] = useState(true);
    const [notifMarketing, setNotifMarketing] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        setLoading(true);
        try {
            const data = await api.user.getProfile();
            setProfile(data);
            setEditName(data.name || '');
            setEditWhatsapp(data.whatsappNumber || '');
            setAvatarUrl(data.avatarUrl || '');
            if (onUserUpdated && data) {
                onUserUpdated(data);
            }
        } catch (err) {
            console.log('[OwnerProfile] Profile fetch fallback:', err.message);
            // Fallback to local currentUser prop if network request fails
            if (currentUser) {
                setProfile({
                    name: currentUser.name || 'Property Owner',
                    email: currentUser.email || 'owner@boardinghub.lk',
                    whatsappNumber: currentUser.whatsappNumber || '',
                    avatarUrl: currentUser.avatarUrl || '',
                    propertiesCount: 0,
                    totalCapacity: 0,
                    averageRating: 5.0,
                    isVerified: true
                });
                setEditName(currentUser.name || '');
                setEditWhatsapp(currentUser.whatsappNumber || '');
                setAvatarUrl(currentUser.avatarUrl || '');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Profile Avatar Selection & Upload
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
                await handleUpdateProfile({ avatarUrl: pickedUri });
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick image: ' + err.message);
        }
    };

    // Save Personal & Contact Details
    const handleUpdateProfile = async (overrideData = {}) => {
        setIsSaving(true);
        try {
            const payload = {
                name: overrideData.name !== undefined ? overrideData.name : editName,
                whatsappNumber: overrideData.whatsappNumber !== undefined ? overrideData.whatsappNumber : editWhatsapp,
                avatarUrl: overrideData.avatarUrl !== undefined ? overrideData.avatarUrl : avatarUrl
            };

            const updatedData = await api.user.updateProfile(payload);
            setProfile(updatedData);
            if (onUserUpdated) {
                onUserUpdated(updatedData);
            }
            Alert.alert('Success 🎉', 'Profile details updated successfully!');
            setPersonalModalVisible(false);
            setContactModalVisible(false);
        } catch (err) {
            Alert.alert('Update Failed', err.message || 'Could not update profile details.');
        } finally {
            setIsSaving(false);
        }
    };

    // Save Password Change
    const handleChangePassword = async () => {
        if (!currentPassword) {
            Alert.alert('Required', 'Please enter your current password.');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'New password and confirm password do not match.');
            return;
        }

        setIsSaving(true);
        try {
            await api.user.changePassword({ currentPassword, newPassword });
            Alert.alert('Success 🔒', 'Password changed successfully!');
            setSecurityModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            Alert.alert('Password Change Failed', err.message || 'Could not update password.');
        } finally {
            setIsSaving(false);
        }
    };

    const displayName = profile?.name || currentUser?.name || 'Property Owner';
    const displayEmail = profile?.email || currentUser?.email || 'owner@boardinghub.lk';
    const displayWhatsapp = profile?.whatsappNumber || editWhatsapp || 'Not configured';
    const propertiesCount = profile?.propertiesCount !== undefined ? profile.propertiesCount : 0;
    const totalCapacity = profile?.totalCapacity !== undefined ? profile.totalCapacity : 0;
    const averageRating = profile?.averageRating !== undefined ? profile.averageRating.toFixed(1) : '5.0';
    const isVerified = profile?.isVerified ?? true;
    const currentAvatar = avatarUrl || profile?.avatarUrl || null;
    const hasAvatar = Boolean(currentAvatar && typeof currentAvatar === 'string' && currentAvatar.trim().length > 0);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* HeaderBar */}
            <HeaderBar
                title="BoardingHub"
                userAvatar={currentAvatar}
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Profile')}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#133E32" />
                    <Text style={styles.loadingText}>Loading Profile...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* 1. Main Profile Card */}
                    <View style={styles.profileCard}>
                        {/* Avatar with Camera Overlay */}
                        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.85}>
                            {hasAvatar ? (
                                <Image source={{ uri: currentAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholderAvatarLarge]}>
                                    <Ionicons name="person" size={44} color="#133E32" />
                                </View>
                            )}
                            <View style={styles.cameraCircle}>
                                <Ionicons name="camera" size={14} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>

                        {/* Name & Email */}
                        <Text style={styles.userName}>{displayName}</Text>
                        <Text style={styles.userEmail}>{displayEmail}</Text>
                    </View>

                    {/* 2. Metrics Card */}
                    <View style={styles.metricsCard}>
                        <View style={styles.metricColumn}>
                            <Ionicons name="bed-outline" size={20} color="#133E32" style={{ marginBottom: 6 }} />
                            <Text style={styles.metricLabel}>Total Capacity</Text>
                            <Text style={styles.metricValue}>{totalCapacity} Spaces</Text>
                        </View>

                        <View style={styles.metricDivider} />

                        <View style={styles.metricColumn}>
                            <Ionicons name="star-outline" size={20} color="#133E32" style={{ marginBottom: 6 }} />
                            <Text style={styles.metricLabel}>Avg Rating</Text>
                            <Text style={styles.metricValue}>{averageRating} / 5</Text>
                        </View>
                    </View>

                    {/* 3. Settings Menu List Card */}
                    <View style={styles.menuCard}>
                        {[
                            {
                                title: 'Personal Details',
                                subtitle: `${displayName} • ${displayEmail}`,
                                icon: 'person-outline',
                                action: () => setPersonalModalVisible(true)
                            },
                            {
                                title: 'Contact Settings',
                                subtitle: `WhatsApp: ${displayWhatsapp}`,
                                icon: 'call-outline',
                                action: () => setContactModalVisible(true)
                            },
                            {
                                title: 'Notification Preferences',
                                subtitle: 'Control alerts for booking requests & messages',
                                icon: 'notifications-outline',
                                action: () => setNotificationModalVisible(true)
                            },
                            {
                                title: 'Security Settings',
                                subtitle: 'Change password & login authentication',
                                icon: 'shield-outline',
                                action: () => setSecurityModalVisible(true)
                            },
                        ].map((item, idx, arr) => (
                            <TouchableOpacity
                                key={item.title}
                                style={[styles.menuRow, idx === arr.length - 1 && styles.menuRowLast]}
                                onPress={item.action}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuIconBox}>
                                    <Ionicons name={item.icon} size={20} color="#475569" />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </View>

                                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={() => {
                            Alert.alert(
                                'Confirm Logout 🚪',
                                'Are you sure you want to log out of BoardingHub?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', style: 'destructive', onPress: onLogout }
                                ]
                            );
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* ── MODAL 1: PERSONAL DETAILS EDIT ────────────────────────── */}
            <Modal visible={personalModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Personal Details</Text>
                            <TouchableOpacity onPress={() => setPersonalModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter full name"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Account Email (Read-Only)</Text>
                            <TextInput
                                style={[styles.textInput, styles.readOnlyInput]}
                                value={displayEmail}
                                editable={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => handleUpdateProfile({ name: editName })}
                            disabled={isSaving}
                            activeOpacity={0.85}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Personal Details</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL 2: CONTACT SETTINGS ─────────────────────────────── */}
            <Modal visible={contactModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Contact Settings</Text>
                            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Seekers will contact you on WhatsApp using this number for inquiry requests.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>WhatsApp Number</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editWhatsapp}
                                onChangeText={setEditWhatsapp}
                                placeholder="e.g. +94771234567"
                                placeholderTextColor="#94A3B8"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => handleUpdateProfile({ whatsappNumber: editWhatsapp })}
                            disabled={isSaving}
                            activeOpacity={0.85}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Save Contact Details</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL 3: SECURITY SETTINGS (CHANGE PASSWORD) ─────────── */}
            <Modal visible={securityModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Security Settings</Text>
                            <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showPasswords}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="At least 6 characters"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showPasswords}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput
                                style={styles.textInput}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter new password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showPasswords}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.showPassRow}
                            onPress={() => setShowPasswords(!showPasswords)}
                        >
                            <Ionicons
                                name={showPasswords ? 'checkbox' : 'square-outline'}
                                size={20}
                                color="#133E32"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.showPassText}>Show Passwords</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleChangePassword}
                            disabled={isSaving}
                            activeOpacity={0.85}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveBtnText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL 4: NOTIFICATION PREFERENCES ─────────────────────── */}
            <Modal visible={notificationModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notification Preferences</Text>
                            <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.switchTitle}>Booking Requests</Text>
                                <Text style={styles.switchSubtitle}>Alerts when seekers send new room requests</Text>
                            </View>
                            <Switch
                                value={notifBookingRequests}
                                onValueChange={setNotifBookingRequests}
                                trackColor={{ false: '#CBD5E1', true: '#C3DCD4' }}
                                thumbColor={notifBookingRequests ? '#133E32' : '#F1F5F9'}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.switchTitle}>Property Inquiries</Text>
                                <Text style={styles.switchSubtitle}>Direct WhatsApp messages & call alerts</Text>
                            </View>
                            <Switch
                                value={notifPropertyInquiries}
                                onValueChange={setNotifPropertyInquiries}
                                trackColor={{ false: '#CBD5E1', true: '#C3DCD4' }}
                                thumbColor={notifPropertyInquiries ? '#133E32' : '#F1F5F9'}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.switchTitle}>Platform News & Tips</Text>
                                <Text style={styles.switchSubtitle}>Updates on platform features & owner tools</Text>
                            </View>
                            <Switch
                                value={notifMarketing}
                                onValueChange={setNotifMarketing}
                                trackColor={{ false: '#CBD5E1', true: '#C3DCD4' }}
                                thumbColor={notifMarketing ? '#133E32' : '#F1F5F9'}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={() => {
                                Alert.alert('Saved 🎉', 'Notification preferences updated!');
                                setNotificationModalVisible(false);
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.saveBtnText}>Save Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Bottom Nav Bar */}
            <View style={styles.bottomNav}>
                {[
                    { id: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
                    { id: 'Properties', label: 'Properties', icon: 'home-outline', activeIcon: 'home' },
                    { id: 'Requests', label: 'Requests', icon: 'clipboard-outline', activeIcon: 'clipboard' },
                    { id: 'Profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.navItem, isActive && styles.navItemActive]}
                            onPress={() => onNavigateTab && onNavigateTab(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={20}
                                color={isActive ? '#133E32' : '#64748B'}
                            />
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Profile Header Card */
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
    },
    placeholderAvatarLarge: {
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#C3DCD4',
    },
    cameraCircle: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    verifiedBadgeCircle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },

    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 14,
    },

    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    propertyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    propertyTagText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#133E32',
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    verifiedTagText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },

    editProfileBtn: {
        flexDirection: 'row',
        width: '100%',
        height: 46,
        borderRadius: 12,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    editProfileBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    /* Metrics Card */
    metricsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    metricColumn: {
        flex: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#133E32',
    },
    metricDivider: {
        width: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },

    /* Menu List Card */
    menuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuRowLast: {
        borderBottomWidth: 0,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },

    /* Switch Banner */
    switchBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F0EC',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C3DCD4',
        marginBottom: 16,
    },
    switchBannerText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
    },

    /* Logout Button */
    logoutBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#DC2626',
    },

    /* Bottom Nav Bar */
    bottomNav: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 12,
    },
    navItemActive: {
        backgroundColor: '#E6F0EC',
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    navLabelActive: {
        color: '#133E32',
        fontWeight: '900',
    },

    /* Modal Component Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 18,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
    },
    textInput: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    readOnlyInput: {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
    },
    showPassRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    showPassText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#133E32',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    switchSubtitle: {
        fontSize: 11,
        color: '#64748B',
    },
    saveBtn: {
        height: 48,
        borderRadius: 14,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
