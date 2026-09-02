import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Image,
    Modal,
    TextInput,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewsScreen({ boarding = {}, onBack }) {
    const title = boarding.title || 'Green Valley Boarding';
    const ratingScore = boarding.rating || 4.8;

    const [reviews, setReviews] = useState([
        {
            id: 'r1',
            author: 'Kasun Rajapaksha',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            rating: 5,
            date: 'Aug 14, 2026',
            comment: 'Super peaceful environment for students. The WiFi speed is excellent for online studies and exams!',
            helpfulCount: 12
        },
        {
            id: 'r2',
            author: 'Anjali Perera',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
            rating: 4.5,
            date: 'Jul 28, 2026',
            comment: 'Very clean rooms and safe locality. The landlady Sunethra is very helpful and responsive.',
            helpfulCount: 8
        },
        {
            id: 'r3',
            author: 'Dinesh Fernando',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
            rating: 5,
            date: 'Jun 10, 2026',
            comment: 'Great value for money. 10 min walk to Moratuwa campus bus stop.',
            helpfulCount: 4
        }
    ]);

    const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');

    const handleAddReview = () => {
        if (!userComment.trim()) {
            Alert.alert('Missing Text', 'Please enter a review comment.');
            return;
        }

        const newReview = {
            id: `r_${Date.now()}`,
            author: 'Sulari Gamage',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            rating: userRating,
            date: 'Today',
            comment: userComment,
            helpfulCount: 0
        };

        setReviews([newReview, ...reviews]);
        setUserComment('');
        setIsWriteModalVisible(false);
        Alert.alert('Review Submitted', 'Thank you for sharing your feedback!');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews & Ratings</Text>
                <TouchableOpacity style={styles.writeBtn} onPress={() => setIsWriteModalVisible(true)} activeOpacity={0.85}>
                    <Ionicons name="pencil" size={16} color="#1B4D3E" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Rating Overview Card */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewScoreCol}>
                        <Text style={styles.bigScore}>{ratingScore}</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons key={s} name="star" size={14} color="#D97706" />
                            ))}
                        </View>
                        <Text style={styles.totalCount}>{reviews.length + 120} Reviews</Text>
                    </View>

                    <View style={styles.dividerVertical} />

                    {/* Breakdown Bars */}
                    <View style={styles.barsCol}>
                        {[
                            { label: 'Cleanliness', score: '4.9', width: '95%' },
                            { label: 'Location', score: '4.8', width: '92%' },
                            { label: 'Value', score: '4.7', width: '88%' },
                            { label: 'Host', score: '5.0', width: '100%' },
                        ].map((item) => (
                            <View key={item.label} style={styles.barRow}>
                                <Text style={styles.barLabel}>{item.label}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: item.width }]} />
                                </View>
                                <Text style={styles.barScore}>{item.score}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Subheading */}
                <View style={styles.subHeaderRow}>
                    <Text style={styles.subHeading}>User Reviews ({reviews.length})</Text>
                    <TouchableOpacity onPress={() => setIsWriteModalVisible(true)}>
                        <Text style={styles.writeTextLink}>+ Write Review</Text>
                    </TouchableOpacity>
                </View>

                {/* Reviews List */}
                {reviews.map((rev) => (
                    <View key={rev.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                            <Image source={{ uri: rev.avatar }} style={styles.authorAvatar} />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.authorName}>{rev.author}</Text>
                                <Text style={styles.reviewDate}>{rev.date}</Text>
                            </View>

                            <View style={styles.starBadge}>
                                <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                                <Text style={styles.starBadgeText}>{rev.rating}</Text>
                            </View>
                        </View>

                        <Text style={styles.commentText}>{rev.comment}</Text>

                        <View style={styles.reviewFooter}>
                            <TouchableOpacity style={styles.helpfulBtn} activeOpacity={0.8}>
                                <Ionicons name="thumbs-up-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.helpfulText}>Helpful ({rev.helpfulCount})</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Write Review Modal Sheet */}
            <Modal
                visible={isWriteModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsWriteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Write a Review</Text>
                            <TouchableOpacity onPress={() => setIsWriteModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.targetProperty}>{title}</Text>

                        {/* Interactive Star Picker */}
                        <Text style={styles.pickerLabel}>Your Rating</Text>
                        <View style={styles.interactiveStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setUserRating(star)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={star <= userRating ? 'star' : 'star-outline'}
                                        size={32}
                                        color="#D97706"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Review Input */}
                        <Text style={styles.pickerLabel}>Your Experience</Text>
                        <TextInput
                            style={styles.reviewInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Share details about room condition, facilities, host friendliness, or location..."
                            placeholderTextColor="#94A3B8"
                            value={userComment}
                            onChangeText={setUserComment}
                            textAlignVertical="top"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity style={styles.submitReviewBtn} onPress={handleAddReview} activeOpacity={0.85}>
                            <Text style={styles.submitReviewText}>Submit Review</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
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
    writeBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Overview Card */
    overviewCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    overviewScoreCol: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 16,
    },
    bigScore: {
        fontSize: 36,
        fontWeight: '900',
        color: '#1B4D3E',
        lineHeight: 40,
    },
    starsRow: {
        flexDirection: 'row',
        marginVertical: 4,
        gap: 2,
    },
    totalCount: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    dividerVertical: {
        width: 1,
        backgroundColor: '#F1F5F9',
        marginRight: 16,
    },

    barsCol: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barLabel: {
        width: 70,
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    barTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#1B4D3E',
        borderRadius: 3,
    },
    barScore: {
        width: 24,
        fontSize: 11,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'right',
    },

    /* Subheader */
    subHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subHeading: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    writeTextLink: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Review Card */
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 14,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    authorAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 10,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    reviewDate: {
        fontSize: 11,
        color: '#94A3B8',
    },
    starBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    starBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#B45309',
    },

    commentText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 12,
    },
    reviewFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    helpfulBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helpfulText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },

    /* Modal */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    targetProperty: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B4D3E',
        marginBottom: 16,
    },
    pickerLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    interactiveStars: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    reviewInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        padding: 12,
        height: 100,
        fontSize: 14,
        color: '#0F172A',
        marginBottom: 20,
    },
    submitReviewBtn: {
        backgroundColor: '#1B4D3E',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitReviewText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
