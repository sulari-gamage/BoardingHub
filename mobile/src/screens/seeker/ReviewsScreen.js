import React, { useState, useEffect } from 'react';
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
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ReviewsScreen({ boarding = {}, onBack, currentUser, onReviewAdded }) {
    const title = boarding.title || 'Boarding Property';

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [boarding?.id]);

    const loadReviews = async () => {
        if (!boarding?.id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await api.reviews.getByPropertyId(boarding.id);
            if (data && Array.isArray(data)) {
                setReviews(data);
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.log('Error loading property reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReview = async () => {
        if (!userComment.trim()) {
            Alert.alert('Missing Text', 'Please enter a review comment.');
            return;
        }

        if (!boarding?.id) {
            Alert.alert('Error', 'Property ID is missing.');
            return;
        }

        try {
            setIsSubmitting(true);
            const newReview = await api.reviews.create({
                propertyId: typeof boarding.id === 'string' ? parseInt(boarding.id, 10) : boarding.id,
                rating: userRating,
                comment: userComment.trim(),
            });

            const updatedReviews = [newReview, ...reviews];
            setReviews(updatedReviews);

            const newAvg = (updatedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / updatedReviews.length).toFixed(1);
            const updatedBoarding = {
                ...boarding,
                rating: parseFloat(newAvg),
                reviewsCount: updatedReviews.length,
            };

            if (onReviewAdded) {
                onReviewAdded(updatedBoarding);
            }

            setUserComment('');
            setIsWriteModalVisible(false);
            Alert.alert('Review Submitted ⭐', 'Thank you for sharing your feedback!');
        } catch (error) {
            console.log('Error submitting review:', error);
            Alert.alert('Submission Error', error.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const computedRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : (boarding.rating ? Number(boarding.rating).toFixed(1) : 'N/A');

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
                <View style={[styles.overviewCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.bigScore}>{computedRating}</Text>
                        <View style={[styles.starsRow, { marginVertical: 6 }]}>
                            {[1, 2, 3, 4, 5].map((s) => {
                                const numRating = parseFloat(computedRating) || 0;
                                const isFull = s <= Math.floor(numRating);
                                const isHalf = !isFull && s - 0.5 <= numRating;
                                return (
                                    <Ionicons
                                        key={s}
                                        name={isFull ? "star" : isHalf ? "star-half" : "star-outline"}
                                        size={20}
                                        color="#D97706"
                                        style={{ marginHorizontal: 2 }}
                                    />
                                );
                            })}
                        </View>
                        <Text style={[styles.totalCount, { fontSize: 13, color: '#64748B' }]}>{reviews.length} Verified Seeker Reviews</Text>
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
                {loading ? (
                    <ActivityIndicator size="large" color="#1B4D3E" style={{ marginVertical: 30 }} />
                ) : reviews.length > 0 ? (
                    reviews.map((rev) => {
                        const dateStr = rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recently';
                        const author = rev.seekerName || 'Anonymous Seeker';
                        const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

                        return (
                            <View key={rev.id || Math.random().toString()} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: avatar }} style={styles.authorAvatar} />

                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.authorName}>{author}</Text>
                                        <Text style={styles.reviewDate}>{dateStr}</Text>
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
                                        <Text style={styles.helpfulText}>Helpful</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 10 }}>
                        <Ionicons name="chatbox-ellipses-outline" size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1B4D3E', marginBottom: 4 }}>No Reviews Yet</Text>
                        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                            Be the first seeker to write a review for this boarding place!
                        </Text>
                    </View>
                )}
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

                        <Text style={styles.pickerLabel}>Your Rating</Text>
                        <View style={styles.interactiveStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setUserRating(star)}
                                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                                    activeOpacity={0.7}
                                    style={{ padding: 4 }}
                                >
                                    <Ionicons
                                        name={star <= userRating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={star <= userRating ? '#D97706' : '#94A3B8'}
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
                        <TouchableOpacity
                            style={styles.submitReviewBtn}
                            onPress={handleAddReview}
                            disabled={isSubmitting}
                            activeOpacity={0.85}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.submitReviewText}>Submit Review</Text>
                            )}
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
