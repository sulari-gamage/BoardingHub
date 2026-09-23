import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    Modal,
    TextInput,
    Alert,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ReviewsScreen({ boarding = {}, onBack, currentUser, onReviewAdded, mode = 'PROPERTY' }) {
    const isMyReviewsMode = mode === 'MY_REVIEWS' || !boarding?.id;
    const isOwner = currentUser?.role === 'OWNER';
    const title = isMyReviewsMode ? (isOwner ? 'Reviews & Feedback' : 'My Feedback & Reviews') : (boarding.title || 'Boarding Property');

    const [reviews, setReviews] = useState([]);
    const [appReviews, setAppReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(isMyReviewsMode ? 'MY' : 'PROPERTY');

    const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setActiveCategory(isMyReviewsMode ? 'MY' : 'PROPERTY');
        loadReviews();
    }, [boarding?.id, mode]);

    const loadReviews = async () => {
        try {
            setLoading(true);
            if (isMyReviewsMode) {
                const [myRes, appRes] = await Promise.all([
                    api.reviews.getMyReviews().catch(() => []),
                    api.reviews.getAppReviews().catch(() => []),
                ]);
                const myData = Array.isArray(myRes) ? myRes : [];
                const appData = Array.isArray(appRes) ? appRes : [];
                setReviews(myData);
                setAppReviews(appData);
            } else if (boarding?.id) {
                const data = await api.reviews.getByPropertyId(boarding.id);
                if (data && Array.isArray(data)) {
                    const propertyOnly = data.filter(r => r && (r.type === 'PROPERTY' || (r.propertyId && String(r.propertyId) === String(boarding.id))));
                    setReviews(propertyOnly);
                } else {
                    setReviews([]);
                }
            }
        } catch (error) {
            console.log('Error loading reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReview = async () => {
        const propertyIdToSend = (!isMyReviewsMode && boarding?.id)
            ? (typeof boarding.id === 'string' ? parseInt(boarding.id, 10) : boarding.id)
            : null;

        try {
            setIsSubmitting(true);
            const newReview = await api.reviews.create({
                propertyId: propertyIdToSend,
                rating: userRating,
                comment: userComment.trim(),
            });

            if (!propertyIdToSend) {
                setAppReviews(prev => [newReview, ...prev]);
            }
            setReviews(prev => [newReview, ...prev]);

            if (boarding?.id && onReviewAdded) {
                const updatedReviews = [newReview, ...reviews];
                const newAvg = (updatedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / updatedReviews.length).toFixed(1);
                const updatedBoarding = {
                    ...boarding,
                    rating: parseFloat(newAvg),
                    reviewsCount: updatedReviews.length,
                };
                onReviewAdded(updatedBoarding);
            }

            setUserComment('');
            setIsWriteModalVisible(false);
            Alert.alert('Review Submitted ⭐', 'Thank you for sharing your feedback with BoardingHub!');
        } catch (error) {
            console.log('Error submitting review:', error);
            Alert.alert('Submission Error', error.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const myReviewsList = reviews.filter(r => !currentUser?.id || (r.userId != null && String(r.userId) === String(currentUser.id)));
    const myReviewsCount = myReviewsList.length;
    const allAppReviewsCount = appReviews.length;

    const filteredReviews = isMyReviewsMode
        ? (activeCategory === 'APP' ? appReviews : myReviewsList)
        : reviews;

    const computedRating = filteredReviews.length > 0
        ? (filteredReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / filteredReviews.length).toFixed(1)
        : (reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 'N/A');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isMyReviewsMode ? (isOwner ? 'Reviews & Feedback' : 'My Reviews') : 'Reviews & Ratings'}</Text>
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
                        <Text style={[styles.totalCount, { fontSize: 13, color: '#64748B' }]}>
                            {isMyReviewsMode
                                ? `${filteredReviews.length} Reviews`
                                : `${reviews.length} Verified Seeker Reviews`}
                        </Text>
                    </View>
                </View>

                {/* Filter Categories Chips */}
                {isMyReviewsMode && (
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                        <TouchableOpacity
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                backgroundColor: activeCategory === 'MY' ? '#133E32' : '#F1F5F9',
                                borderWidth: 1,
                                borderColor: activeCategory === 'MY' ? '#133E32' : '#E2E8F0',
                            }}
                            onPress={() => setActiveCategory('MY')}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: activeCategory === 'MY' ? '#FFFFFF' : '#64748B' }}>
                                My Reviews ({myReviewsCount})
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 20,
                                backgroundColor: activeCategory === 'APP' ? '#133E32' : '#F1F5F9',
                                borderWidth: 1,
                                borderColor: activeCategory === 'APP' ? '#133E32' : '#E2E8F0',
                            }}
                            onPress={() => setActiveCategory('APP')}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: activeCategory === 'APP' ? '#FFFFFF' : '#64748B' }}>
                                All App Reviews ({allAppReviewsCount})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Subheading */}
                <View style={styles.subHeaderRow}>
                    <Text style={styles.subHeading}>
                        {isMyReviewsMode
                            ? (activeCategory === 'APP' ? `All App Reviews (${filteredReviews.length})` : `My Reviews (${filteredReviews.length})`)
                            : `Property Reviews (${filteredReviews.length})`}
                    </Text>
                    <TouchableOpacity onPress={() => setIsWriteModalVisible(true)}>
                        <Text style={styles.writeTextLink}>+ Rate App</Text>
                    </TouchableOpacity>
                </View>

                {/* Reviews List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#1B4D3E" style={{ marginVertical: 30 }} />
                ) : filteredReviews.length > 0 ? (
                    filteredReviews.map((rev) => {
                        const dateStr = rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recently';
                        const isPropertyReview = rev.type === 'PROPERTY' || rev.propertyId != null;
                        const author = rev.userName || rev.seekerName || 'User';
                        const isCurrentUserAuthor = currentUser?.id != null && rev.userId != null && String(rev.userId) === String(currentUser.id);

                        let avatar = (rev.userAvatar && typeof rev.userAvatar === 'string' && rev.userAvatar.trim().length > 0)
                            ? rev.userAvatar
                            : (rev.seekerAvatar && typeof rev.seekerAvatar === 'string' && rev.seekerAvatar.trim().length > 0)
                                ? rev.seekerAvatar
                                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

                        const propTitle = rev.propertyTitle && !rev.propertyTitle.includes('Platform') ? rev.propertyTitle : null;

                        return (
                            <View key={rev.id || Math.random().toString()} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: avatar }} style={styles.authorAvatar} />

                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.authorName}>{author}</Text>
                                            {isCurrentUserAuthor ? (
                                                <View style={{ backgroundColor: '#E6F0EC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#133E32' }}>You</Text>
                                                </View>
                                            ) : (
                                                <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>
                                                        {rev.userRole || (isPropertyReview ? 'Seeker' : 'App User')}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                            <Text style={styles.reviewDate}>{dateStr}</Text>
                                            {isPropertyReview ? (
                                                <Text style={[styles.reviewDate, { color: '#133E32', fontWeight: '700' }]} numberOfLines={1}>
                                                    • {propTitle || 'Property Review'}
                                                </Text>
                                            ) : (
                                                <Text style={[styles.reviewDate, { color: '#2563EB', fontWeight: '700' }]} numberOfLines={1}>
                                                    • App Feedback
                                                </Text>
                                            )}
                                        </View>
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
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#1B4D3E', marginBottom: 4 }}>No Reviews Found</Text>
                        <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                            {activeCategory === 'PROPERTY' ? "No property reviews received yet." : activeCategory === 'APP' ? "No app feedback submitted yet." : "No reviews found."}
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
                            <Text style={styles.modalTitle}>{isMyReviewsMode ? 'Write a Review About App' : 'Write a Review'}</Text>
                            <TouchableOpacity onPress={() => setIsWriteModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.targetProperty}>{isMyReviewsMode ? 'BoardingHub App Experience' : title}</Text>

                        <Text style={styles.pickerLabel}>Your Rating</Text>
                        <View style={styles.interactiveStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setUserRating(star)}
                                    hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                                    activeOpacity={0.6}
                                    style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                                >
                                    <Ionicons
                                        name={star <= userRating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={star <= userRating ? '#D97706' : '#94A3B8'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Review Input (Optional) */}
                        <Text style={styles.pickerLabel}>Your Experience (Optional)</Text>
                        <TextInput
                            style={styles.reviewInput}
                            multiline
                            numberOfLines={4}
                            placeholder={isMyReviewsMode ? "Share feedback about app design, performance, or suggestions..." : "Share details about room condition, facilities, host friendliness, or location..."}
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
        textAlign: 'justify',
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
