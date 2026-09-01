import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookingRequestModal from '../components/BookingRequestModal';

export default function DetailsScreen({ boarding = {}, onBack, onBookSuccess }) {
    const [isSaved, setIsSaved] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState('shared');
    const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

    const title = boarding.title || 'Green Valley Boarding';
    const location = boarding.location || 'Moratuwa, Sri Lanka';
    const price = boarding.price ? boarding.price.toLocaleString() : '15,000';
    const rating = boarding.rating || 4.8;
    const imageUrl = boarding.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

    const handleBookNowPress = () => {
        setIsBookingModalVisible(true);
    };

    const handleShare = () => {
        Alert.alert("Share Property", `Share link for "${title}" copied to clipboard!`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Cover Hero Image & Floating Navigation Bar */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />

                    {/* Top Action Overlay Bar */}
                    <View style={styles.topBarOverlay}>
                        <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={20} color="#0F172A" />
                        </TouchableOpacity>

                        <View style={styles.topRightActions}>
                            <TouchableOpacity
                                style={styles.circleBtn}
                                onPress={() => setIsSaved(!isSaved)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={isSaved ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={isSaved ? '#EF4444' : '#0F172A'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.circleBtn} onPress={handleShare} activeOpacity={0.8}>
                                <Ionicons name="share-social-outline" size={20} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Image Pagination Dots */}
                    <View style={styles.paginationDots}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </View>

                {/* Content Details */}
                <View style={styles.content}>
                    {/* Location Pin Header */}
                    <View style={styles.locationHeaderRow}>
                        <Ionicons name="location-outline" size={16} color="#1B4D3E" style={{ marginRight: 4 }} />
                        <Text style={styles.locationHeaderText}>{location}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.mainTitle}>{title}</Text>

                    {/* Rating & Verified Badge Row */}
                    <View style={styles.ratingVerifiedRow}>
                        <View style={styles.ratingSubRow}>
                            <Ionicons name="star-outline" size={16} color="#D97706" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingScore}>{rating}</Text>
                            <TouchableOpacity>
                                <Text style={styles.reviewsLink}>(124 Reviews)</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* About This Property */}
                    <Text style={styles.sectionHeading}>About this property</Text>
                    <Text style={styles.aboutParagraph}>
                        Experience modern, sustainable living at Green Valley Boarding. Located just 10 minutes from the university, this newly constructed facility offers a professional, quiet environment ideal for focused studies or remote work. Featuring robust security, high-speed connectivity, and biophilic design elements throughout the common areas.
                    </Text>
                    <TouchableOpacity style={{ marginBottom: 20 }}>
                        <Text style={styles.readMoreLink}>Read more</Text>
                    </TouchableOpacity>

                    {/* Amenities Grid (2x2) */}
                    <Text style={styles.sectionHeading}>Amenities</Text>
                    <View style={styles.amenitiesGrid}>
                        <View style={styles.amenityCard}>
                            <Ionicons name="wifi-outline" size={24} color="#1B4D3E" style={styles.amenityIcon} />
                            <Text style={styles.amenityCardText}>High-Speed WiFi</Text>
                        </View>

                        <View style={styles.amenityCard}>
                            <Ionicons name="shirt-outline" size={24} color="#1B4D3E" style={styles.amenityIcon} />
                            <Text style={styles.amenityCardText}>Laundry Facilities</Text>
                        </View>

                        <View style={styles.amenityCard}>
                            <View style={styles.pIconWrapper}>
                                <Text style={styles.pIconText}>P</Text>
                            </View>
                            <Text style={styles.amenityCardText}>Secure Parking</Text>
                        </View>

                        <View style={styles.amenityCard}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#1B4D3E" style={styles.amenityIcon} />
                            <Text style={styles.amenityCardText}>24/7 Security</Text>
                        </View>
                    </View>

                    {/* Show All Amenities Button */}
                    <TouchableOpacity style={styles.showAllAmenitiesBtn} activeOpacity={0.8}>
                        <Text style={styles.showAllAmenitiesText}>Show all 24 amenities</Text>
                    </TouchableOpacity>

                    {/* Available Rooms Section */}
                    <Text style={styles.sectionHeading}>Available Rooms</Text>
                    <View style={styles.roomCard}>
                        <View style={styles.roomHeaderRow}>
                            <Text style={styles.roomTypeTitle}>Shared Room</Text>
                            <View style={styles.roomCardBadge}>
                                <Ionicons name="people-outline" size={13} color="#1B4D3E" style={{ marginRight: 4 }} />
                                <Text style={styles.roomBadgeText}>2 Spaces Available</Text>
                            </View>
                        </View>

                        {/* Room Features Bullet Points */}
                        <View style={styles.bulletsContainer}>
                            <Text style={styles.bulletItem}>• Attached Bathroom</Text>
                            <Text style={styles.bulletItem}>• Study Desk Included</Text>
                            <Text style={styles.bulletItem}>• Balcony Access</Text>
                        </View>

                        <View style={styles.roomCardDivider} />

                        {/* Room Card Footer Row */}
                        <View style={styles.roomFooterRow}>
                            <View>
                                <Text style={styles.roomPriceText}>Rs.{price}</Text>
                                <Text style={styles.roomPricePeriod}>/ Month</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.selectRoomBtn}
                                onPress={() => setSelectedRoom('shared')}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={selectedRoom === 'shared' ? 'radio-button-on' : 'radio-button-off'}
                                    size={18}
                                    color="#1B4D3E"
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={styles.selectRoomText}>Select Room</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Location Map Section */}
                    <Text style={styles.sectionHeading}>Location</Text>
                    <View style={styles.mapCard}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80' }}
                            style={styles.mapImage}
                            resizeMode="cover"
                        />
                        <View style={styles.mapOverlayPin}>
                            <Ionicons name="location" size={24} color="#1B4D3E" />
                            <View style={styles.mapPinBadge}>
                                <Text style={styles.mapPinText}>Moratuwa</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Booking Request Modal */}
            <BookingRequestModal
                visible={isBookingModalVisible}
                onClose={() => setIsBookingModalVisible(false)}
                boarding={boarding}
                onSubmitBooking={(bookingData) => {
                    if (onBookSuccess) onBookSuccess(bookingData);
                }}
            />

            {/* Fixed Bottom Action Bar */}
            <View style={styles.bottomFixedBar}>
                <View>
                    <Text style={styles.bottomPriceVal}>Rs.{price}</Text>
                    <TouchableOpacity>
                        <Text style={styles.bottomViewDetailsLink}>View Details</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={handleBookNowPress}
                    activeOpacity={0.85}
                >
                    <Text style={styles.bookNowBtnText}>BOOK NOW</Text>
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
    scrollContent: {
        paddingBottom: 24,
    },

    /* Hero Image & Top Bar */
    imageContainer: {
        position: 'relative',
        height: 280,
        width: '100%',
        backgroundColor: '#E2E8F0',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    topBarOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topRightActions: {
        flexDirection: 'row',
        gap: 10,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    paginationDots: {
        position: 'absolute',
        bottom: 14,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#FFFFFF',
        width: 9,
    },

    /* Main Content */
    content: {
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    locationHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationHeaderText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 10,
        letterSpacing: -0.4,
    },
    ratingVerifiedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingScore: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginRight: 6,
    },
    reviewsLink: {
        fontSize: 13,
        color: '#64748B',
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    verifiedBadge: {
        backgroundColor: '#E6F4EA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },

    /* Section Titles */
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
    },
    aboutParagraph: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 6,
    },
    readMoreLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
        textDecorationLine: 'underline',
    },

    /* Amenities Grid */
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
    },
    amenityCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amenityIcon: {
        marginBottom: 8,
    },
    pIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    pIconText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
    },
    amenityCardText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
    },
    showAllAmenitiesBtn: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    showAllAmenitiesText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Available Rooms Card */
    roomCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    roomHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    roomTypeTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    roomCardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roomBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    bulletsContainer: {
        marginBottom: 14,
        gap: 4,
    },
    bulletItem: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    roomCardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 14,
    },
    roomFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomPriceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    roomPricePeriod: {
        fontSize: 12,
        color: '#64748B',
    },
    selectRoomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectRoomText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },

    /* Map Card */
    mapCard: {
        position: 'relative',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapOverlayPin: {
        position: 'absolute',
        top: '40%',
        left: '42%',
        alignItems: 'center',
    },
    mapPinBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    mapPinText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Fixed Bottom Action Bar */
    bottomFixedBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    bottomPriceVal: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    bottomViewDetailsLink: {
        fontSize: 12,
        color: '#64748B',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    bookNowBtn: {
        backgroundColor: '#D97706',
        borderRadius: 12,
        paddingHorizontal: 28,
        paddingVertical: 12,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    bookNowBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
