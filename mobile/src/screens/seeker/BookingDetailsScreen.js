import React, { useState } from 'react';
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
    Linking,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const isMoveInDateReached = (dateStr) => {
    if (!dateStr) return false;
    try {
        let dateObj = null;
        if (typeof dateStr === 'string') {
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }
            } else if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
            }
        }
        if (!dateObj || isNaN(dateObj.getTime())) {
            dateObj = new Date(dateStr);
        }
        if (isNaN(dateObj.getTime())) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        return today >= target;
    } catch (e) {
        return false;
    }
};

export default function BookingDetailsScreen({ booking = {}, onBack, onCancelBooking }) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [liveOwnerData, setLiveOwnerData] = useState(null);
    const [isOwnerReviewed, setIsOwnerReviewed] = useState(false);

    React.useEffect(() => {
        const checkReviewStatus = async () => {
            const rawStatus = booking.status || 'PENDING';
            if (rawStatus !== 'PENDING' || booking.isReviewed) {
                setIsOwnerReviewed(true);
                return;
            }
            if (booking.id) {
                try {
                    const reviewed = await AsyncStorage.getItem(`reviewed_booking_${booking.id}`);
                    if (reviewed === 'true') {
                        setIsOwnerReviewed(true);
                    }
                } catch (e) { }
            }
        };
        checkReviewStatus();
    }, [booking.id, booking.status]);

    React.useEffect(() => {
        const fetchLiveOwnerData = async () => {
            try {
                const propId = booking.propertyId || (booking.property && booking.property.id);
                if (propId && !isNaN(propId)) {
                    const propData = await api.properties.getById(propId);
                    if (propData && (propData.ownerName || propData.ownerWhatsapp || propData.owner)) {
                        setLiveOwnerData({
                            ownerName: propData.ownerName || propData.owner?.name,
                            ownerPhone: propData.ownerWhatsapp || propData.ownerPhone || propData.ownerWhatsappNumber || propData.owner?.whatsappNumber || '',
                            ownerAvatarUrl: propData.ownerAvatar || propData.ownerAvatarUrl || propData.owner?.avatarUrl || null,
                        });
                    }
                }
            } catch (err) {
                console.log('[BookingDetailsScreen] Could not fetch live property details for owner:', err?.message);
            }
        };
        fetchLiveOwnerData();
    }, [booking.propertyId]);

    const title = booking.title || 'Boarding Property';
    const location = booking.location || 'Moratuwa, Sri Lanka';
    const date = booking.date || 'Sep 10, 2026';
    const roomType = booking.roomType || 'Room Request';
    const roomName = booking.roomName || (booking.roomType ? booking.roomType.split('(')[0]?.trim() : null);
    const isRoomBased = booking.bookingType === 'ROOM_BASED' || !!booking.roomId || !!booking.roomName;
    const price = booking.price ? booking.price.toLocaleString() : '0';
    const status = booking.status || 'PENDING';
    const imageUrl = booking.imageUrl;
    const ownerName = liveOwnerData?.ownerName || booking.ownerName || 'Property Owner';
    const ownerPhone = liveOwnerData?.ownerPhone || booking.ownerPhone || '';
    const ownerAvatarUrl = liveOwnerData?.ownerAvatarUrl || booking.ownerAvatarUrl;

    const isApproved = status === 'ACCEPTED' || status === 'APPROVED';
    const isRejected = status === 'REJECTED' || status === 'DECLINED';
    const isCancelled = status === 'CANCELLED';
    const isResponded = isApproved || isRejected || isCancelled;

    const targetMoveInDate = booking.moveInDate || booking.date || date;
    const moveInReached = isMoveInDateReached(targetMoveInDate);

    // Dynamic 4-step status timeline
    const timelineSteps = [
        {
            label: 'Booking Request Sent',
            date: booking.date || 'Submitted',
            done: true
        },
        {
            label: 'Owner Review',
            date: (isOwnerReviewed || isResponded) ? 'Review Completed' : 'Awaiting Owner Review',
            done: isOwnerReviewed || isResponded
        },
        {
            label: 'Owner Response',
            date: isApproved ? 'Approved by Owner' : isRejected ? 'Declined by Owner' : isCancelled ? 'Request Cancelled' : 'Pending Decision',
            done: isResponded
        },
        {
            label: 'Move-in Status',
            date: isApproved
                ? (moveInReached ? 'Moved In (Date Reached)' : `Scheduled for ${targetMoveInDate}`)
                : (isRejected ? 'Declined' : isCancelled ? 'Cancelled' : 'Pending Approval'),
            done: isApproved && moveInReached
        }
    ];

    const handleCallHost = () => {
        if (!ownerPhone) {
            Alert.alert('Contact Owner', 'Owner phone number is not available.');
            return;
        }
        const dialable = ownerPhone.replace(/[^0-9+]/g, '');
        if (dialable) {
            Linking.openURL(`tel:${dialable}`).catch(() => {
                Alert.alert('Phone Dial Error', `Could not open phone dialer for ${ownerPhone}`);
            });
        } else {
            Alert.alert('Contact Owner', 'Invalid phone number format.');
        }
    };

    const handleWhatsAppChat = () => {
        if (!ownerPhone) {
            Alert.alert('Contact Owner', 'Owner WhatsApp number is not available.');
            return;
        }
        let digits = ownerPhone.replace(/[^0-9]/g, '');
        if (digits.length === 10 && digits.startsWith('0')) {
            digits = '94' + digits.substring(1);
        } else if (digits.length === 9 && !digits.startsWith('94')) {
            digits = '94' + digits;
        }
        const text = encodeURIComponent(`Hi ${ownerName}, regarding my booking request for "${title}" on BoardingHub.`);
        const url = `https://wa.me/${digits}?text=${text}`;
        Linking.openURL(url).catch(() => {
            const appUrl = `whatsapp://send?phone=${digits}&text=${text}`;
            Linking.openURL(appUrl).catch(() => {
                Alert.alert('WhatsApp Error', `Could not open WhatsApp for ${ownerPhone}`);
            });
        });
    };

    const handleCancelPress = () => {
        Alert.alert(
            'Cancel Booking Request ⚠️',
            `Are you sure you want to cancel your booking request for "${title}"?\n\nThis action cannot be undone.`,
            [
                { text: 'Keep Request', style: 'cancel' },
                {
                    text: 'Yes, Cancel Request',
                    style: 'destructive',
                    onPress: async () => {
                        setIsCancelling(true);
                        try {
                            if (booking.id && !isNaN(booking.id)) {
                                try {
                                    await api.bookings.delete(booking.id);
                                } catch (delErr) {
                                    console.log('[BookingDetailsScreen] Delete endpoint error, falling back to CANCELLED status update:', delErr?.message);
                                    await api.bookings.updateStatus(booking.id, 'CANCELLED');
                                }
                            }
                            if (onCancelBooking) {
                                onCancelBooking(booking.id);
                            }
                            Alert.alert('Booking Cancelled 🚫', 'Your booking request has been successfully cancelled and removed.');
                            onBack();
                        } catch (err) {
                            console.error('[BookingDetailsScreen] Cancel error:', err?.message);
                            if (onCancelBooking) {
                                onCancelBooking(booking.id);
                            }
                            Alert.alert('Booking Cancelled 🚫', 'Your booking request status was updated.');
                            onBack();
                        } finally {
                            setIsCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
                    <Ionicons name="share-social-outline" size={20} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Property Card Header */}
                <View style={styles.propertyCard}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.cardImagePlaceholder}>
                            <Ionicons name="home-outline" size={40} color="#94A3B8" />
                            <Text style={styles.cardImagePlaceholderText}>Property Photo</Text>
                        </View>
                    )}

                    <View style={styles.cardInfo}>
                        <View style={styles.statusBadgeRow}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    status === 'PENDING'
                                        ? styles.pendingBadge
                                        : status === 'ACCEPTED' || status === 'APPROVED'
                                            ? styles.acceptedBadge
                                            : styles.pastBadge
                                ]}
                            >
                                <Ionicons
                                    name={status === 'PENDING' ? 'time' : status === 'ACCEPTED' || status === 'APPROVED' ? 'checkmark-circle' : 'archive'}
                                    size={12}
                                    color="#FFFFFF"
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={styles.statusBadgeText}>{status}</Text>
                            </View>

                            <Text style={styles.priceVal}>Rs. {price} <Text style={styles.pricePeriod}>/ mo</Text></Text>
                        </View>

                        <Text style={styles.titleText}>{title}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                            <Text style={styles.locationText}>{location}</Text>
                        </View>
                    </View>
                </View>

                {/* Selected Room Specification (For Room-Based Boardings) */}
                {isRoomBased && (
                    <>
                        <Text style={styles.sectionHeading}>Selected Room Specifications</Text>
                        <View style={styles.roomSpecCard}>
                            <View style={styles.roomSpecHeader}>
                                <View style={styles.roomSpecBadgeIcon}>
                                    <Ionicons name="bed" size={18} color="#1B4D3E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roomSpecTitle}>{roomName || 'Selected Room'}</Text>
                                    <Text style={styles.roomSpecSubtitle}>{roomType}</Text>
                                </View>
                                <View style={styles.roomBadge}>
                                    <Text style={styles.roomBadgeText}>ROOM-BASED</Text>
                                </View>
                            </View>

                            <View style={styles.summaryDivider} />

                            <View style={styles.roomSpecGrid}>
                                <View style={styles.roomSpecCol}>
                                    <Ionicons name="people-outline" size={15} color="#64748B" style={{ marginBottom: 2 }} />
                                    <Text style={styles.roomSpecLabel}>Occupants</Text>
                                    <Text style={styles.roomSpecVal}>{booking.occupantsCount || 1} Person(s)</Text>
                                </View>

                                <View style={styles.roomSpecCol}>
                                    <Ionicons name="cash-outline" size={15} color="#64748B" style={{ marginBottom: 2 }} />
                                    <Text style={styles.roomSpecLabel}>Rent Rate</Text>
                                    <Text style={styles.roomSpecValGold}>Rs. {price} / mo</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Progress Status Timeline */}
                <Text style={styles.sectionHeading}>Request Progress</Text>
                <View style={styles.timelineCard}>
                    {timelineSteps.map((step, idx) => (
                        <View key={idx} style={styles.timelineItem}>
                            <View style={styles.timelineIconCol}>
                                <View style={[styles.timelineNode, step.done && styles.timelineNodeDone]}>
                                    <Ionicons
                                        name={step.done ? 'checkmark' : 'ellipse-outline'}
                                        size={12}
                                        color={step.done ? '#FFFFFF' : '#94A3B8'}
                                    />
                                </View>
                                {idx < timelineSteps.length - 1 && (
                                    <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />
                                )}
                            </View>

                            <View style={styles.timelineContent}>
                                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                                    {step.label}
                                </Text>
                                <Text style={styles.stepDate}>{step.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Booking Summary Specifications */}
                <Text style={styles.sectionHeading}>Booking Summary</Text>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Move-in Date</Text>
                        <Text style={styles.summaryVal}>{date}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Room / Type</Text>
                        <Text style={styles.summaryVal}>{roomType}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Occupants Count</Text>
                        <Text style={styles.summaryVal}>{booking.occupantsCount || 1} {booking.occupantsCount === 1 ? 'Person' : 'People'}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Monthly Rent</Text>
                        <Text style={styles.summaryValGold}>Rs. {price} / mo</Text>
                    </View>
                </View>

                {/* Property Owner Info & Call CTA */}
                <Text style={styles.sectionHeading}>Property Owner</Text>
                <View style={styles.ownerCard}>
                    <View style={styles.ownerAvatar}>
                        {ownerAvatarUrl ? (
                            <Image source={{ uri: ownerAvatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 21 }} />
                        ) : (
                            <Ionicons name="person" size={24} color="#1B4D3E" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ownerName}>{ownerName}</Text>
                        <Text style={styles.ownerPhone}>{ownerPhone || 'Contact via WhatsApp/Call'}</Text>
                    </View>

                    <TouchableOpacity style={styles.whatsappHostBtn} onPress={handleWhatsAppChat} activeOpacity={0.85}>
                        <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.callHostBtn} onPress={handleCallHost} activeOpacity={0.85}>
                        <Ionicons name="call" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Move-in Rules & Guidelines */}
                <Text style={styles.sectionHeading}>Move-in Guidelines</Text>
                <View style={styles.rulesCard}>
                    <View style={styles.ruleItem}>
                        <Ionicons name="shield-checkmark-outline" size={16} color="#1B4D3E" style={{ marginRight: 8 }} />
                        <Text style={styles.ruleText}>ID verification required at check-in</Text>
                    </View>
                    <View style={styles.ruleItem}>
                        <Ionicons name="key-outline" size={16} color="#1B4D3E" style={{ marginRight: 8 }} />
                        <Text style={styles.ruleText}>Key collection will be coordinated by host</Text>
                    </View>
                    <View style={styles.ruleItem}>
                        <Ionicons name="time-outline" size={16} color="#1B4D3E" style={{ marginRight: 8 }} />
                        <Text style={styles.ruleText}>Standard move-in hours: 9:00 AM - 6:00 PM</Text>
                    </View>
                </View>

                {/* Cancel Booking Action Button */}
                {status === 'PENDING' && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, isCancelling && { opacity: 0.6 }]}
                        onPress={handleCancelPress}
                        activeOpacity={0.85}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator color="#DC2626" size="small" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                                <Text style={styles.cancelBtnText}>Cancel Booking Request</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    shareBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Scroll */
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Property Card */
    propertyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#CBD5E1',
    },
    cardInfo: {
        padding: 16,
    },
    statusBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingBadge: {
        backgroundColor: '#78350F',
    },
    acceptedBadge: {
        backgroundColor: '#1B4D3E',
    },
    pastBadge: {
        backgroundColor: '#64748B',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    priceVal: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    pricePeriod: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    titleText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        color: '#64748B',
    },

    /* Section Headings */
    sectionHeading: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
        marginTop: 4,
    },

    /* Selected Room Specification Card */
    roomSpecCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    roomSpecHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomSpecBadgeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    roomSpecTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    roomSpecSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },
    roomBadge: {
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A3D0C3',
    },
    roomBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    roomSpecGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomSpecCol: {
        flex: 1,
        alignItems: 'flex-start',
    },
    roomSpecLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    roomSpecVal: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
    },
    roomSpecValGold: {
        fontSize: 13,
        fontWeight: '900',
        color: '#D97706',
        marginTop: 2,
    },

    /* Timeline */
    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    timelineIconCol: {
        alignItems: 'center',
        marginRight: 14,
        width: 24,
    },
    timelineNode: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F1F5F9',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineNodeDone: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
    timelineLineDone: {
        backgroundColor: '#1B4D3E',
    },
    timelineContent: {
        flex: 1,
        justifyContent: 'center',
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    stepLabelDone: {
        fontWeight: '800',
        color: '#0F172A',
    },
    stepDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },

    /* Summary Card */
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    summaryVal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    summaryValGold: {
        fontSize: 14,
        fontWeight: '900',
        color: '#D97706',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },

    /* Owner Card */
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    ownerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    ownerName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    ownerPhone: {
        fontSize: 12,
        color: '#64748B',
    },
    whatsappHostBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#25D366',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    callHostBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Rules */
    rulesCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7',
        marginBottom: 24,
        gap: 10,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ruleText: {
        fontSize: 13,
        color: '#166534',
        fontWeight: '600',
    },

    /* Cancel Button */
    cancelBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#DC2626',
    },
});
