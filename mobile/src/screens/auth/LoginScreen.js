import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    StatusBar,
    Alert,
    Image,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const REMEMBER_EMAIL_KEY = '@boardinghub_remember_email';
const REMEMBER_PASSWORD_KEY = '@boardinghub_remember_password';
const REMEMBER_ME_KEY = '@boardinghub_remember_me_flag';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // Forgot Password Modal state
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    useEffect(() => {
        loadRememberedCredentials();
    }, []);

    const loadRememberedCredentials = async () => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const isRemembered = window.localStorage.getItem(REMEMBER_ME_KEY) === 'true';
                const savedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
                const savedPassword = window.localStorage.getItem(REMEMBER_PASSWORD_KEY);

                if (isRemembered || savedEmail) {
                    if (savedEmail) setEmail(savedEmail);
                    if (savedPassword) setPassword(savedPassword);
                    setRememberMe(true);
                }
            }
        } catch (err) {
            console.log('Error loading remembered credentials:', err);
        }
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Required Fields', 'Please enter your email and password.');
            return;
        }
        try {
            setLoading(true);

            // Handle Remember Me persistence (stores email and password)
            if (typeof window !== 'undefined' && window.localStorage) {
                if (rememberMe) {
                    window.localStorage.setItem(REMEMBER_ME_KEY, 'true');
                    window.localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
                    window.localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
                } else {
                    window.localStorage.removeItem(REMEMBER_ME_KEY);
                    window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
                    window.localStorage.removeItem(REMEMBER_PASSWORD_KEY);
                }
            }

            const response = await api.auth.login(email.trim(), password);
            Alert.alert('Success', `Welcome back, ${response.name || 'User'}!`);
            if (onLoginSuccess) {
                let userRoleTab = 'Seekers';
                if (response.role === 'OWNER') userRoleTab = 'Owners';
                if (response.role === 'ADMIN') userRoleTab = 'Admins';
                onLoginSuccess(userRoleTab, response);
            }
        } catch (error) {
            Alert.alert('Sign In Failed', error.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const openForgotPasswordModal = () => {
        setForgotEmail(email.trim());
        setForgotModalVisible(true);
    };

    const handleSendResetEmail = async () => {
        const targetEmail = forgotEmail.trim();
        if (!targetEmail) {
            Alert.alert('Email Required', 'Please enter your registered email address.');
            return;
        }

        try {
            setForgotLoading(true);
            if (api.auth.forgotPassword) {
                await api.auth.forgotPassword(targetEmail);
            }
            Alert.alert(
                'Password Reset Link Sent',
                `A password reset link has been sent to ${targetEmail}. Please check your email inbox to reset your password.`,
                [{ text: 'OK', onPress: () => setForgotModalVisible(false) }]
            );
        } catch (error) {
            Alert.alert(
                'Notice',
                error.message || `Password reset instructions have been sent to ${targetEmail} if registered.`,
                [{ text: 'OK', onPress: () => setForgotModalVisible(false) }]
            );
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.innerView}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Main Card Container */}
                            <View style={styles.card}>
                                {/* Official Logo */}
                                <View style={styles.logoContainer}>
                                    <Image
                                        source={require('../../../assets/logo.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </View>

                                {/* Heading & Subtitle */}
                                <Text style={styles.cardTitle}>BoardingHub</Text>
                                <Text style={styles.cardSubtitle}>
                                    Find your stay or manage your properties seamlessly.
                                </Text>

                                {/* Email / Username Input */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Email or Username</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="name@company.com"
                                        placeholderTextColor="#94A3B8"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>Password</Text>
                                        <TouchableOpacity onPress={openForgotPasswordModal}>
                                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="••••••••"
                                            placeholderTextColor="#94A3B8"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeBtn}
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                                size={20}
                                                color="#64748B"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Remember Me Checkbox */}
                                <TouchableOpacity
                                    style={styles.rememberContainer}
                                    onPress={() => setRememberMe(!rememberMe)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                        {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>

                                {/* Primary Sign In Button */}
                                <TouchableOpacity
                                    style={[styles.signInBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSignIn}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFD700" size="small" />
                                    ) : (
                                        <Text style={styles.signInBtnText}>Sign In</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Sign Up Navigation Link */}
                                <View style={styles.signUpRow}>
                                    <Text style={styles.noAccountText}>Don't have an account? </Text>
                                    <TouchableOpacity onPress={onNavigateToRegister}>
                                        <Text style={styles.signUpText}>Sign Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={styles.footerContainer}>
                                <Text style={styles.copyrightText}>
                                    © 2024 BoardingHub. All rights reserved.
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Forgot Password Modal */}
            <Modal
                visible={forgotModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setForgotModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setForgotModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeaderRow}>
                                <View style={styles.modalIconBg}>
                                    <Ionicons name="key-outline" size={24} color="#1B4D3E" />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setForgotModalVisible(false)}
                                    style={styles.closeBtn}
                                >
                                    <Ionicons name="close" size={22} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalTitle}>Reset Password</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter your registered email address below and we'll send you instructions to reset your password.
                            </Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@company.com"
                                    placeholderTextColor="#94A3B8"
                                    value={forgotEmail}
                                    onChangeText={setForgotEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.signInBtn, forgotLoading && { opacity: 0.7 }, { marginTop: 10 }]}
                                onPress={handleSendResetEmail}
                                disabled={forgotLoading}
                                activeOpacity={0.85}
                            >
                                {forgotLoading ? (
                                    <ActivityIndicator color="#FFD700" size="small" />
                                ) : (
                                    <Text style={styles.signInBtnText}>Send Reset Link</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelModalBtn}
                                onPress={() => setForgotModalVisible(false)}
                            >
                                <Text style={styles.cancelModalText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    innerView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },

    /* Card */
    card: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },

    /* Logo */
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoImage: {
        width: 90,
        height: 65,
    },

    /* Title & Subtitle */
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },


    /* Form Controls */
    formGroup: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
    },
    forgotPasswordText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        color: '#0F172A',
    },

    /* Password Wrapper */
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    eyeBtn: {
        padding: 6,
    },
    eyeIcon: {
        fontSize: 16,
    },

    /* Remember Me */
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 2,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#FFF',
    },
    checkboxChecked: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    checkmark: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '900',
    },
    rememberText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },

    /* Primary Button */
    signInBtn: {
        backgroundColor: '#1B4D3E',
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
    },
    signInBtnText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    /* Sign Up Link */
    signUpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noAccountText: {
        fontSize: 13,
        color: '#64748B',
    },
    signUpText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Footer */
    footerContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    copyrightText: {
        fontSize: 12,
        color: '#94A3B8',
    },

    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        padding: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 18,
    },
    cancelModalBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },
    cancelModalText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
});
