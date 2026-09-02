import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Image,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingRequestDetailScreen({ request, onBack, onAccept, onReject }) {
    const currentRequest = request || {
        id: 'req_1',
        tenantName: 'Sulari Gamage',
        tenantPhone: '+94 77 987 6543',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        isVerified: true,
        propertyTitle: 'Green Valley Boarding',
        roomType: 'Shared Room',
        moveInDate: 'September 10, 2026',
        occupants: '1 Person',
        message: 'I am highly interested in securing the shared room at Green Valley Boarding. I appreciate the property\'s commitment to sustainable living and eco-friendly practices. I am a quiet, responsible professional relocating for work and believe this environment would be perfect for my lifestyle.',
        tags: ['New Applicant', 'Eco-conscious']
    };

    const handleAcceptClick = () => {
        if (onAccept) onAccept(currentRequest.id);
        else Alert.alert('Request Accepted 🎉', `Booking request for ${currentRequest.tenantName} has been approved.`);
    };

    const handleRejectClick = () => {
        if (onReject) onReject(currentRequest.id);
        else Alert.alert('Request Declined', `Booking request for ${currentRequest.tenantName} was declined.`);
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

                    {/* Verified Profile Row */}
                    <View style={styles.verifiedRow}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                        <Text style={styles.verifiedText}>Verified Profile</Text>
                    </View>

                    {/* Applicant Badges */}
                    <View style={styles.tagsRow}>
                        <View style={styles.tagGreen}>
                            <Text style={styles.tagGreenText}>New Applicant</Text>
                        </View>
                        <View style={styles.tagGrey}>
                            <Text style={styles.tagGreyText}>Eco-conscious</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Request Details */}
                <Text style={styles.sectionTitle}>Request Details</Text>

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
                        <Text style={styles.detailLabel}>ROOM TYPE</Text>
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
                        <Ionicons name="person-outline" size={18} color="#133E32" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>OCCUPANTS</Text>
                        <Text style={styles.detailValue}>{currentRequest.occupants || '1 Person'}</Text>
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

                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptClick} activeOpacity={0.85}>
                    <Text style={styles.acceptBtnText}>Accept Request</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 35 : 0,
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
