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

export default function BookingRequestDetailScreen({ request, onBack, onAccept, onReject }) {
    const currentRequest = request || {
        id: 'req_1',
        tenantName: 'Sulari Gamage',
        tenantPhone: '+94 77 987 6543',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        propertyTitle: 'Green Valley Boarding',
        roomType: 'Shared Room (Room 101)',
        occupantsCount: 2,
        remainingSpaces: 2,
        moveInDate: 'September 10, 2026',
        occupants: '2 Persons',
        message: 'I am highly interested in securing the shared room at Green Valley Boarding. I appreciate the property\'s commitment to sustainable living and eco-friendly practices.',
        tags: ['New Applicant', 'Eco-conscious']
    };

    const remaining = currentRequest.remainingSpaces !== undefined ? currentRequest.remainingSpaces : 1;
    const isFilled = remaining <= 0;
    const requestedOccupants = currentRequest.occupantsCount || 1;

    const handleWhatsAppApplicant = () => {
        const cleanPhone = (currentRequest.tenantPhone || '').replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}`;
        Linking.openURL(url).catch(() => Alert.alert('WhatsApp Error', 'Could not launch WhatsApp.'));
    };

    const handleCallApplicant = () => {
        const cleanPhone = (currentRequest.tenantPhone || '').replace(/[^0-9+]/g, '');
        const url = `tel:${cleanPhone}`;
        Linking.openURL(url).catch(() => Alert.alert('Phone Error', 'Could not open phone dialer.'));
    };

    const handleAcceptClick = () => {
        if (isFilled) {
            Alert.alert('Already Filled ❌', 'There are no spaces available for this room or house. You cannot approve this request.');
            return;
        }
        if (requestedOccupants > remaining) {
            Alert.alert('Insufficient Spaces ❌', `Only ${remaining} space(s) available, but applicant requested ${requestedOccupants} occupant space(s).`);
            return;
        }
        Alert.alert(
            'Confirm Approval 🟢',
            `Are you sure you want to approve this booking request for ${currentRequest.tenantName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve Request',
                    style: 'default',
                    onPress: () => {
                        if (onAccept) onAccept(currentRequest.id);
                        else Alert.alert('Request Accepted 🎉', `Booking request for ${currentRequest.tenantName} has been approved.`);
                    }
                }
            ]
        );
    };

    const handleRejectClick = () => {
        Alert.alert(
            'Confirm Rejection 🔴',
            `Are you sure you want to decline the booking request from ${currentRequest.tenantName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline Request',
                    style: 'destructive',
                    onPress: () => {
                        if (onReject) onReject(currentRequest.id);
                        else Alert.alert('Request Declined', `Booking request for ${currentRequest.tenantName} was declined.`);
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Request</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 1. Applicant Profile Card */}
                <View style={styles.profileCard}>
                    <Image source={{ uri: currentRequest.avatar }} style={styles.avatar} />
                    <Text style={styles.tenantName}>{currentRequest.tenantName}</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>{currentRequest.tenantPhone}</Text>

                    {/* Direct Contact Buttons for Applicant */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12, width: '100%' }}>
                        <TouchableOpacity
                            style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            onPress={handleWhatsAppApplicant}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-whatsapp" size={16} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: '#E6F0EC', borderWidth: 1, borderColor: '#C3DCD4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            onPress={handleCallApplicant}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="call" size={16} color="#133E32" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#133E32', fontWeight: '800', fontSize: 13 }}>Call Applicant</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Verified Profile Row */}
                    <View style={styles.verifiedRow}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                        <Text style={styles.verifiedText}>Verified Profile</Text>
                    </View>
                </View>

                {/* 2. Request Details */}
                <Text style={styles.sectionTitle}>Request Details</Text>

                {/* Remaining Spaces Box */}
                <View style={[styles.detailCard, { backgroundColor: isFilled ? '#FEF2F2' : '#F0FDF4', borderColor: isFilled ? '#FECACA' : '#BBF7D0' }]}>
                    <View style={[styles.detailIconBox, { backgroundColor: isFilled ? '#FEE2E2' : '#DCFCE7' }]}>
                        <Ionicons name={isFilled ? "alert-circle" : "checkmark-circle"} size={20} color={isFilled ? "#DC2626" : "#166534"} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: isFilled ? '#991B1B' : '#166534' }]}>AVAILABILITY STATUS</Text>
                        <Text style={[styles.detailValue, { color: isFilled ? '#DC2626' : '#166534' }]}>
                            {isFilled ? 'Already Filled (0 Spaces Remaining)' : `${remaining} Space(s) Remaining`}
                        </Text>
                    </View>
                </View>

                {/* Property Detail Box */}
                <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                        <Ionicons name="business-outline" size={18} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>PROPERTY</Text>
                        <Text style={styles.detailValue}>{currentRequest.propertyTitle}</Text>
                    </View>
                </View>

                {/* Room Type Box */}
                <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                        <Ionicons name="bed-outline" size={18} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>ROOM TYPE / NATURE</Text>
                        <Text style={styles.detailValue}>{currentRequest.roomType}</Text>
                    </View>
                </View>

                {/* Move-in Date Box */}
                <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                        <Ionicons name="calendar-outline" size={18} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>MOVE-IN DATE</Text>
                        <Text style={styles.detailValue}>{currentRequest.moveInDate}</Text>
                    </View>
                </View>

                {/* Occupants Box */}
                <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                        <Ionicons name="people-outline" size={18} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>REQUESTED OCCUPANTS</Text>
                        <Text style={styles.detailValue}>{currentRequest.occupantsCount || 1} Occupant(s)</Text>
                    </View>
                </View>

                {/* 3. Message Section */}
                <Text style={styles.sectionTitle}>Message from {currentRequest.tenantName.split(' ')[0]}</Text>

                <View style={styles.messageCard}>
                    <Text style={styles.quoteMark}>”</Text>
                    <Text style={styles.messageText}>
                        "{currentRequest.message || 'I am highly interested in securing the shared room at Green Valley Boarding.'}"
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectClick} activeOpacity={0.8}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.acceptBtn, isFilled && { backgroundColor: '#94A3B8' }]}
                    onPress={handleAcceptClick}
                    activeOpacity={isFilled ? 1 : 0.85}
                >
                    <Text style={styles.acceptBtnText}>{isFilled ? 'Already Filled' : 'Accept Request'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
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

    /* Profile Card */
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 14,
    },
    tenantName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    verifiedText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tagGreen: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    tagGreenText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    tagGrey: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tagGreyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },

    /* Section Titles */
    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
        marginTop: 4,
    },

    /* Detail Cards */
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    detailIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Message Card */
    messageCard: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    quoteMark: {
        fontSize: 48,
        fontWeight: '900',
        color: '#E2E8F0',
        lineHeight: 40,
        marginBottom: -10,
    },
    messageText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
        fontWeight: '500',
    },

    /* Bottom Action Bar */
    bottomBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    rejectBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    rejectBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    acceptBtn: {
        flex: 1.5,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#D97706', // Golden Amber
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    acceptBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
