import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    Image
} from 'react-native';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }) {
    const [selectedRole, setSelectedRole] = useState('Seekers'); // Seekers | Owners | Admins
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleSignIn = () => {
        if (!email || !password) {
            Alert.alert('Required Fields', 'Please enter your email and password.');
            return;
        }
        Alert.alert('Success', `Signed in as ${selectedRole}`);
        if (onLoginSuccess) {
            onLoginSuccess();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Card Container */}
                <View style={styles.card}>
                    {/* Official Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Heading & Subtitle */}
                    <Text style={styles.cardTitle}>BoardingHub</Text>
                    <Text style={styles.cardSubtitle}>
                        Find your stay or manage your properties seamlessly.
                    </Text>

                    {/* Role Switcher Tabs */}
                    <View style={styles.roleContainer}>
                        {['Seekers', 'Owners', 'Admins'].map((role) => {
                            const isActive = selectedRole === role;
                            return (
                                <TouchableOpacity
                                    key={role}
                                    style={[styles.roleTab, isActive && styles.roleTabActive]}
                                    onPress={() => setSelectedRole(role)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[styles.roleText, isActive && styles.roleTextActive]}
                                    >
                                        {role}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

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
                            <TouchableOpacity
                                onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent.')}
                            >
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
                                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
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
                        style={styles.signInBtn}
                        onPress={handleSignIn}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.signInBtnText}>Sign In</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },

    /* Card */
    card: {
        width: '100%',
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

    /* Role Switcher */
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        padding: 3,
        marginBottom: 20,
    },
    roleTab: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 7,
    },
    roleTabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    roleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    roleTextActive: {
        color: '#1B4D3E',
        fontWeight: '800',
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
});
