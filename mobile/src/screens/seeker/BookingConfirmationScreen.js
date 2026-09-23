import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    Alert,
    Platform,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmationScreen({ booking = {}, onGoToBookings, onContactHost, onGoHome }) {
    const bookingId = booking.id || 'BH-2026-X891';
    const propertyTitle = booking.title || 'Green Valley Boarding';
    const location = booking.location || 'Moratuwa, Sri Lanka';
    const date = booking.date || 'Sep 10, 2026';
    const roomType = booking.roomType || 'Shared Room';
    const price = booking.price ? booking.price.toLocaleString() : '15,000';
    const ownerName = booking.ownerName || 'Sunethra Silva';
    const ownerPhone = booking.ownerPhone || '+94 77 123 4567';

    const handleWhatsAppChat = () => {
        const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`Hi ${ownerName}, regarding my booking request (${bookingId}) for "${propertyTitle}" on BoardingHub.`);
        const url = `whatsapp://send?phone=${cleanPhone}&text=${text}`;
        Linking.canOpenURL(url)
            .then(supported => {
                if (supported) Linking.openURL(url);
                else Alert.alert('WhatsApp Not Installed', `Call or message ${ownerName} at ${ownerPhone}`);
            })
            .catch(() => Alert.alert('Contact Host', `Call ${ownerName} at ${ownerPhone}`));
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Celebratory Checkmark Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircleOuter}>
                        <View style={styles.iconCircleInner}>
                            <Ionicons name="checkmark-sharp" size={44} color="#FFFFFF" />
                        </View>
                    </View>
                </View>

                {/* Main Heading */}
                <Text style={styles.successTitle}>Booking Requested!</Text>
                <Text style={styles.successSubtitle}>
                    Your request has been sent to <Text style={{ fontWeight: '800', color: '#1B4D3E' }}>{ownerName}</Text>. You will receive a response shortly.
                </Text>

                {/* Booking Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.refLabel}>REFERENCE ID</Text>
                        <Text style={styles.refValue}>{bookingId}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBody}>
                        <Text style={styles.propertyTitle}>{propertyTitle}</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={15} color="#64748B" style={{ marginRight: 6 }} />
                            <Text style={styles.infoText}>{location}</Text>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Move-in Date</Text>
                                <Text style={styles.detailVal}>{date}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Room Type</Text>
                                <Text style={styles.detailVal}>{roomType}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Monthly Rent</Text>
                                <Text style={styles.detailValGold}>Rs. {price}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>PENDING APPROVAL</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Host Info Box */}
                <View style={styles.hostCard}>
                    <View style={styles.hostAvatar}>
                        <Ionicons name="person" size={22} color="#1B4D3E" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.hostTitle}>Property Owner</Text>
                        <Text style={styles.hostName}>{ownerName}</Text>
                        <Text style={styles.hostPhone}>{ownerPhone}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.whatsappBtn}
                        onPress={handleWhatsAppChat}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => {
                            if (onContactHost) onContactHost(booking);
                            else Alert.alert('Contact Host', `Calling ${ownerName} at ${ownerPhone}...`);
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="call" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={onGoToBookings}
                    activeOpacity={0.85}
                >
                    <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>View My Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onGoHome}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryBtnText}>Back to Home</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 30,
        alignItems: 'center',
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Icon Animation Circle */
    iconContainer: {
        marginBottom: 20,
    },
    iconCircleOuter: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#C3DCD4',
    },
    iconCircleInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    /* Headings */
    successTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
        marginBottom: 24,
    },

    /* Summary Card */
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    refLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    refValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },
    cardBody: {},
    propertyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 13,
        color: '#64748B',
    },

    /* Grid */
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    detailItem: {
        width: '46%',
    },
    detailLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 2,
    },
    detailVal: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    detailValGold: {
        fontSize: 14,
        fontWeight: '900',
        color: '#D97706',
    },
    statusBadge: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#047857',
    },

    /* Host Card */
    hostCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#C3DCD4',
        marginBottom: 24,
    },
    hostAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    hostTitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    hostName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    hostPhone: {
        fontSize: 12,
        color: '#475569',
    },
    whatsappBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Buttons */
    primaryBtn: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        backgroundColor: '#1B4D3E',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    secondaryBtn: {
        width: '100%',
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
});
