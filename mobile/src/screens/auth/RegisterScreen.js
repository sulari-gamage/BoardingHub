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
    Image,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function RegisterScreen({ onNavigateToLogin, onRegisterSuccess }) {
    const [role, setRole] = useState('Seeker'); // Seeker | Owner
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !phone || !email || !password || !confirmPassword) {
            Alert.alert('Required Fields', 'Please fill in all required fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
            return;
        }
        if (!agreeTerms) {
            Alert.alert('Terms & Conditions', 'Please agree to the Terms of Service and Privacy Policy.');
            return;
        }

        try {
            setLoading(true);
            const backendRole = role.toUpperCase() === 'OWNER' ? 'OWNER' : 'SEEKER';
            const response = await api.auth.register({
                name: fullName.trim(),
                email: email.trim(),
                password: password,
                whatsappNumber: phone.trim(),
                role: backendRole
            });

            Alert.alert('Account Created!', `Welcome to BoardingHub, ${response.name}!`);
            if (onRegisterSuccess) {
                onRegisterSuccess(role, response);
            }
        } catch (error) {
            Alert.alert('Registration Failed', error.message || 'Could not create account.');
        } finally {
            setLoading(false);
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
                        {/* Top Back Navigation Bar */}
                        <View style={styles.topNavHeader}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={onNavigateToLogin}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={20} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header Logo & Title */}
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../../assets/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>

                            <Text style={styles.title}>Join BoardingHub</Text>
                            <Text style={styles.subtitle}>
                                Select your account type and get started.
                            </Text>

                            {/* User Role Selection Cards */}
                            <View style={styles.roleSelectionGroup}>
                                <Text style={styles.roleSelectionHeaderLabel}>I want to join as a:</Text>
                                <View style={styles.roleCardsRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleCard,
                                            role === 'Seeker' && styles.roleCardActive
                                        ]}
                                        onPress={() => setRole('Seeker')}
                                        activeOpacity={0.85}
                                    >
                                        <View style={[
                                            styles.roleIconCircle,
                                            role === 'Seeker' && styles.roleIconCircleActive
                                        ]}>
                                            <Ionicons
                                                name="person"
                                                size={20}
                                                color={role === 'Seeker' ? '#1B4D3E' : '#64748B'}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.roleCardTitle,
                                            role === 'Seeker' && styles.roleCardTitleActive
                                        ]}>
                                            Boarder / Seeker
                                        </Text>
                                        <Text style={styles.roleCardSubtext}>Looking for a stay</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.roleCard,
                                            role === 'Owner' && styles.roleCardActive
                                        ]}
                                        onPress={() => setRole('Owner')}
                                        activeOpacity={0.85}
                                    >
                                        <View style={[
                                            styles.roleIconCircle,
                                            role === 'Owner' && styles.roleIconCircleActive
                                        ]}>
                                            <Ionicons
                                                name="home"
                                                size={20}
                                                color={role === 'Owner' ? '#1B4D3E' : '#64748B'}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.roleCardTitle,
                                            role === 'Owner' && styles.roleCardTitleActive
                                        ]}>
                                            Property Owner
                                        </Text>
                                        <Text style={styles.roleCardSubtext}>List my property</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Form Fields */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#94A3B8"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Enter WhatsApp Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+94 77 000 0000"
                                    placeholderTextColor="#94A3B8"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email Address</Text>
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

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 24"
                                    placeholderTextColor="#94A3B8"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Gender Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Gender</Text>
                                <TouchableOpacity
                                    style={styles.dropdownBtn}
                                    onPress={() => setShowGenderPicker(!showGenderPicker)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.dropdownText}>{gender}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>

                                {showGenderPicker && (
                                    <View style={styles.genderOptionsContainer}>
                                        {['Male', 'Female', 'Other'].map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={[styles.genderOption, gender === item && styles.genderOptionSelected]}
                                                onPress={() => {
                                                    setGender(item);
                                                    setShowGenderPicker(false);
                                                }}
                                            >
                                                <Text style={[styles.genderOptionText, gender === item && styles.genderOptionTextSelected]}>
                                                    {item}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Password */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Password</Text>
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

                            {/* Confirm Password */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>

                            {/* Terms Agreement Checkbox */}
                            <TouchableOpacity
                                style={styles.termsContainer}
                                onPress={() => setAgreeTerms(!agreeTerms)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                                    {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.termsText}>
                                    I agree to the <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsHighlight}>Privacy Policy</Text>.
                                </Text>
                            </TouchableOpacity>

                            {/* Create Account Primary Button */}
                            <TouchableOpacity
                                style={[styles.createAccountBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFD700" size="small" />
                                ) : (
                                    <Text style={styles.createAccountBtnText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            {/* Already have an account link */}
                            <View style={styles.loginRow}>
                                <Text style={styles.alreadyText}>Already have an account? </Text>
                                <TouchableOpacity onPress={onNavigateToLogin}>
                                    <Text style={styles.loginText}>Log In</Text>
                                </TouchableOpacity>
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
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    topNavHeader: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 12,
        paddingBottom: 40,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },

    /* Header Logo & Title */
    logoContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    logoImage: {
        width: 90,
        height: 65,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 18,
    },

    /* Interactive Role Selection Cards */
    roleSelectionGroup: {
        marginBottom: 20,
    },
    roleSelectionHeaderLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    roleCardsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    roleCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    roleCardActive: {
        borderColor: '#1B4D3E',
        backgroundColor: '#F0F7F4',
        elevation: 3,
        shadowOpacity: 0.08,
    },
    roleIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleIconCircleActive: {
        backgroundColor: '#D1E7DD',
    },
    roleCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        textAlign: 'center',
        marginBottom: 2,
    },
    roleCardTitleActive: {
        color: '#1B4D3E',
        fontWeight: '800',
    },
    roleCardSubtext: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
    },

    /* Form Controls */
    formGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
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

    /* Gender Dropdown */
    dropdownBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
    },
    dropdownText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#64748B',
    },
    genderOptionsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
    },
    genderOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    genderOptionSelected: {
        backgroundColor: '#E6F0EC',
    },
    genderOptionText: {
        fontSize: 14,
        color: '#334155',
    },
    genderOptionTextSelected: {
        color: '#1B4D3E',
        fontWeight: '700',
    },

    /* Terms Checkbox */
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
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
    termsText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    termsHighlight: {
        fontWeight: '700',
        color: '#1B4D3E',
    },

    /* Primary Button */
    createAccountBtn: {
        backgroundColor: '#1B4D3E',
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 20,
    },
    createAccountBtnText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    /* Login Link */
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alreadyText: {
        fontSize: 13,
        color: '#64748B',
    },
    loginText: {
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
