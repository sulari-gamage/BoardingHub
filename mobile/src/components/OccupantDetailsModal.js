import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    Linking,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function OccupantDetailsModal({
    visible,
    onClose,
    occupants = [],
    loading = false,
    title = 'Current Occupants',
    onRemoveOccupant
}) {
    const formatWhatsAppPhone = (phoneStr) => {
        if (!phoneStr) return '94771234567';
        let digits = phoneStr.toString().replace(/[^0-9]/g, '');
        if (!digits) return '94771234567';

        if (digits.startsWith('0') && digits.length === 10) {
            digits = '94' + digits.substring(1);
        } else if (digits.startsWith('7') && digits.length === 9) {
            digits = '94' + digits;
        } else if (digits.startsWith('0094')) {
            digits = digits.substring(2);
        }
        return digits;
    };

    const handleWhatsAppPress = (seekerName, phone) => {
        const cleanPhone = formatWhatsAppPhone(phone);
        const message = encodeURIComponent(`Hi ${seekerName || 'there'}, contacting you regarding your boarding room reservation on BoardingHub.`);

        const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
        const webUrl = `https://wa.me/${cleanPhone}?text=${message}`;

        Linking.canOpenURL(appUrl).then((supported) => {
            if (supported) {
                return Linking.openURL(appUrl);
            } else {
                return Linking.openURL(webUrl);
            }
        }).catch(() => {
            Linking.openURL(webUrl).catch(() => {
                Alert.alert('Error', 'Unable to open WhatsApp. Please ensure WhatsApp is installed.');
            });
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.headerTitleRow}>
                            <Ionicons name="people" size={22} color="#133E32" style={{ marginRight: 8 }} />
                            <Text style={styles.modalTitle}>{title}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#133E32" style={{ marginVertical: 30 }} />
                        ) : occupants.length > 0 ? (
                            occupants.map((occ, idx) => {
                                const name = occ.seekerName || occ.userName || occ.user?.fullName || 'Occupant';
                                const initial = name.charAt(0).toUpperCase();

                                let avatar = occ.seekerAvatarUrl || occ.seekerAvatar || occ.user?.avatarUrl;
                                if (avatar && typeof avatar === 'string' && avatar.startsWith('/')) {
                                    const baseUrl = api.getBaseUrl ? api.getBaseUrl() : 'http://192.168.1.100:8080';
                                    avatar = `${baseUrl}${avatar}`;
                                }

                                const phone = occ.seekerPhone || occ.seekerWhatsapp || occ.user?.phone || occ.phone || '';
                                const roomTitle = occ.roomName || occ.roomNumber || occ.roomType || occ.propertyTitle || 'Boarding Room';
                                const approvedDate = occ.approvedDate || occ.updatedAt || occ.createdAt;
                                const dateFormatted = approvedDate
                                    ? new Date(approvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Active Member';

                                return (
                                    <View key={occ.id || idx} style={styles.occupantCard}>
                                        <View style={styles.avatarRow}>
                                            {avatar ? (
                                                <Image source={{ uri: avatar }} style={styles.avatarImage} />
                                            ) : (
                                                <View style={styles.avatarFallback}>
                                                    <Text style={styles.avatarInitial}>{initial}</Text>
                                                </View>
                                            )}

                                            <View style={styles.nameCol}>
                                                <Text style={styles.nameText}>{name}</Text>
                                                <View style={styles.badgeRow}>
                                                    <Ionicons name="bed-outline" size={12} color="#133E32" style={{ marginRight: 4 }} />
                                                    <Text style={styles.roomText}>{roomTitle}</Text>
                                                </View>
                                                <Text style={styles.dateText}>Occupant since: {dateFormatted}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.actionsRow}>
                                            {phone ? (
                                                <TouchableOpacity
                                                    style={styles.whatsappBtn}
                                                    onPress={() => handleWhatsAppPress(name, phone)}
                                                    activeOpacity={0.85}
                                                >
                                                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                                    <Text style={styles.whatsappBtnText}>WhatsApp Chat</Text>
                                                </TouchableOpacity>
                                            ) : null}

                                            <TouchableOpacity
                                                style={styles.removeBtn}
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Remove Occupant 🔴',
                                                        `Are you sure you want to remove ${name} from this property booking? This will restore property availability.`,
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            {
                                                                text: 'Remove Occupant',
                                                                style: 'destructive',
                                                                onPress: async () => {
                                                                    try {
                                                                        if (occ.id) {
                                                                            await api.bookings.updateStatus(occ.id, 'REMOVED');
                                                                        }
                                                                        Alert.alert('Occupant Removed', `${name} has been removed from bookings.`);
                                                                        if (onRemoveOccupant) onRemoveOccupant(occ.id);
                                                                    } catch (err) {
                                                                        Alert.alert('Error', err.message || 'Could not remove occupant.');
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons name="trash-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                                                <Text style={styles.removeBtnText}>Remove</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color="#94A3B8" />
                                <Text style={styles.emptyTitle}>No Occupants Found</Text>
                                <Text style={styles.emptySubtitle}>There are currently no approved occupants for this boarding.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollBody: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    occupantCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 14,
    },
    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarInitial: {
        fontSize: 22,
        fontWeight: '900',
        color: '#133E32',
    },
    nameCol: {
        flex: 1,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 3,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    },
    roomText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#133E32',
    },
    dateText: {
        fontSize: 11,
        color: '#64748B',
    },
    actionsRow: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        gap: 10,
    },
    whatsappBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    whatsappBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    removeBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#DC2626',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 10,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        textAlign: 'center',
    },
});
