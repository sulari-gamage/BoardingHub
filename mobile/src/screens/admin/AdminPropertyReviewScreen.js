import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPropertyReviewScreen({ onBack, onApprove, onReject }) {
    const [adminNotes, setAdminNotes] = useState('');

    const property = {
        title: 'Green Valley Boarding',
        location: 'Moratuwa, Western Province',
        price: 'Rs. 15,000',
        image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        availableRooms: '5 Units',
        maxCapacity: '10 Persons',
        size: '2400 sq.ft',
        availableFrom: 'Immediate',
        amenities: [
            { label: 'High-Speed WiFi', active: true },
            { label: 'Laundry Facilities', active: true },
            { label: '24/7 Security CCTV', active: true },
            { label: 'Shared Kitchen', active: false },
            { label: 'Parking Space', active: false },
        ],
        owner: {
            name: 'John Silva',
            memberSince: 'Member since Jan 2023',
            email: 'john.silva.properties@email.com',
            phone: '+94 77 123 4567',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            verified: true,
        }
    };

    const handleApprove = () => {
        if (onApprove) onApprove();
        else Alert.alert('Property Approved ✅', 'Green Valley Boarding has been published to search results.');
    };

    const handleReject = () => {
        if (onReject) onReject();
        else Alert.alert('Property Declined ❌', 'Owner will be requested to update property details.');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#133E32" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Property</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 1. Cover Photo Banner */}
                <View style={styles.imageCard}>
                    <Image source={{ uri: property.image }} style={styles.coverImage} />
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusBadgeText}>Pending Review</Text>
                    </View>
                </View>

                {/* 2. Property Main Info */}
                <View style={styles.sectionCard}>
                    <Text style={styles.propertyTitle}>{property.title}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.locationText}>{property.location}</Text>
                    </View>

                    {/* Rent Box */}
                    <View style={styles.rentBox}>
                        <Text style={styles.rentLabel}>Proposed Monthly Rent</Text>
                        <Text style={styles.rentValue}>{property.price}</Text>
                    </View>

                    {/* 2x2 Specs Grid */}
                    <View style={styles.specsGrid}>
                        <View style={styles.specItem}>
                            <Ionicons name="enter-outline" size={18} color="#133E32" style={{ marginBottom: 4 }} />
                            <Text style={styles.specLabel}>Available Rooms</Text>
                            <Text style={styles.specValue}>{property.availableRooms}</Text>
                        </View>

                        <View style={styles.specItem}>
                            <Ionicons name="people-outline" size={18} color="#133E32" style={{ marginBottom: 4 }} />
                            <Text style={styles.specLabel}>Max Capacity</Text>
                            <Text style={styles.specValue}>{property.maxCapacity}</Text>
                        </View>

                        <View style={styles.specItem}>
                            <Ionicons name="shapes-outline" size={18} color="#133E32" style={{ marginBottom: 4 }} />
                            <Text style={styles.specLabel}>Property Size</Text>
                            <Text style={styles.specValue}>{property.size}</Text>
                        </View>

                        <View style={styles.specItem}>
                            <Ionicons name="calendar-outline" size={18} color="#133E32" style={{ marginBottom: 4 }} />
                            <Text style={styles.specLabel}>Available From</Text>
                            <Text style={styles.specValue}>{property.availableFrom}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Declared Amenities Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.cardHeaderTitle}>Declared Amenities</Text>
                    <View style={styles.amenitiesWrap}>
                        {property.amenities.map((item, idx) => (
                            <View
                                key={idx}
                                style={[styles.amenityChip, item.active ? styles.amenityChipActive : styles.amenityChipInactive]}
                            >
                                <Ionicons
                                    name={item.active ? "checkmark-circle-outline" : "ellipse-outline"}
                                    size={14}
                                    color={item.active ? "#133E32" : "#64748B"}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.amenityText, item.active && styles.amenityTextActive]}>
                                    {item.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 4. Owner Information */}
                <View style={styles.sectionCard}>
                    <Text style={styles.cardHeaderTitle}>Owner Information</Text>

                    <View style={styles.ownerHeaderRow}>
                        <Image source={{ uri: property.owner.avatar }} style={styles.ownerAvatar} />
                        <View>
                            <Text style={styles.ownerName}>{property.owner.name}</Text>
                            <Text style={styles.memberSince}>{property.owner.memberSince}</Text>
                        </View>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={16} color="#64748B" style={{ marginRight: 10 }} />
                        <Text style={styles.contactText}>{property.owner.email}</Text>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={16} color="#64748B" style={{ marginRight: 10 }} />
                        <Text style={styles.contactText}>{property.owner.phone}</Text>
                    </View>

                    {/* Identity Verification Pill */}
                    <View style={styles.verifiedBox}>
                        <Ionicons name="shield-checkmark" size={18} color="#133E32" style={{ marginRight: 8 }} />
                        <View>
                            <Text style={styles.verifiedTitle}>Identity Verified</Text>
                            <Text style={styles.verifiedSub}>NIC and Utility Bill matched.</Text>
                        </View>
                    </View>
                </View>

                {/* 5. System Assessment */}
                <View style={styles.sectionCard}>
                    <View style={styles.assessmentHeader}>
                        <Ionicons name="shield-outline" size={18} color="#B45309" style={{ marginRight: 8 }} />
                        <Text style={styles.cardHeaderTitle}>System Assessment</Text>
                    </View>

                    <Text style={styles.assessmentText}>
                        Automated checks indicate this property price is aligned with the Moratuwa area average (Rs. 14,500 - Rs. 18,000).
                    </Text>

                    <Text style={styles.inputLabel}>Admin Internal Notes</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add notes regarding this review..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={adminNotes}
                        onChangeText={setAdminNotes}
                    />
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
                    <Ionicons name="close-circle-outline" size={18} color="#991B1B" style={{ marginRight: 6 }} />
                    <Text style={styles.rejectBtnText}>Reject Listing</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.approveBtnText}>Approve Listing</Text>
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

    /* Cover Photo Card */
    imageCard: {
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    coverImage: {
        width: '100%',
        height: 200,
        borderRadius: 20,
    },
    statusBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D97706',
        marginRight: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Cards */
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    propertyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },

    rentBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    rentLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 2,
    },
    rentValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
    },

    /* 2x2 Grid */
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    specItem: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    specLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 2,
    },
    specValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    /* Amenities */
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 12,
    },
    amenitiesWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
    },
    amenityChipActive: {
        backgroundColor: '#E6F0EC',
        borderColor: '#C3DCD4',
    },
    amenityChipInactive: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    amenityText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    amenityTextActive: {
        color: '#133E32',
        fontWeight: '800',
    },

    /* Owner Info */
    ownerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    ownerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    memberSince: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    contactText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    verifiedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderRadius: 14,
        padding: 12,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    verifiedTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#133E32',
    },
    verifiedSub: {
        fontSize: 11,
        color: '#475569',
    },

    /* Assessment */
    assessmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    assessmentText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 6,
    },
    notesInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 80,
        textAlignVertical: 'top',
        fontSize: 13,
        color: '#0F172A',
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
        borderColor: '#FCA5A5',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
    },
    rejectBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#991B1B',
    },
    approveBtn: {
        flex: 1.2,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#133E32',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#133E32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    approveBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
