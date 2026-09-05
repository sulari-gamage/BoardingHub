import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Image,
    Alert,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingRequestModal({ visible, onClose, boarding = {}, onSubmitBooking }) {
    const isWholeHouse = boarding.propertyNature === 'WHOLE_HOUSE' || boarding.isWholeHouse;
    const rooms = boarding.rooms || [
        { id: 'r1', number: 'Room 101', type: 'Shared Room', availableSpaces: 2, price: boarding.price || 15000 },
        { id: 'r2', number: 'Room 102', type: 'Private Room', availableSpaces: 1, price: (boarding.price || 15000) + 3000 }
    ];

    const [selectedBookingType, setSelectedBookingType] = useState(
        isWholeHouse ? 'WHOLE_HOUSE' : (rooms.length > 0 ? rooms[0].id : 'WHOLE_HOUSE')
    );
    const [showDropdown, setShowDropdown] = useState(false);
    const [moveInDate, setMoveInDate] = useState('09/10/2026');
    const [peopleCount, setPeopleCount] = useState(1);
    const [message, setMessage] = useState('');

    const propertyTitle = boarding.title || 'Green Valley Boarding';
    const ownerName = boarding.ownerName || 'Sunethra Silva';
    const ownerPhone = boarding.ownerPhone || '+94 77 123 4567';

    const handleIncrement = () => setPeopleCount(prev => prev + 1);
    const handleDecrement = () => setPeopleCount(prev => (prev > 1 ? prev - 1 : 1));

    const handleWhatsAppChat = () => {
        const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`Hi ${ownerName}, I am interested in your property "${propertyTitle}" on BoardingHub.`);
        const url = `whatsapp://send?phone=${cleanPhone}&text=${text}`;
        Linking.canOpenURL(url)
            .then(supported => {
                if (supported) Linking.openURL(url);
                else Alert.alert('WhatsApp Not Installed', `You can contact ${ownerName} directly at ${ownerPhone}`);
            })
            .catch(() => Alert.alert('Contact Host', `Call or message ${ownerName} at ${ownerPhone}`));
    };

    const handleCallHost = () => {
        Alert.alert('Contact Owner', `Calling ${ownerName} at ${ownerPhone}...`);
    };

    const handleSubmit = () => {
        let roomTypeLabel = 'Whole House';
        let roomId = null;

        if (!isWholeHouse) {
            const matchedRoom = rooms.find(r => r.id === selectedBookingType);
            if (matchedRoom) {
                roomTypeLabel = `${matchedRoom.number} (${matchedRoom.type})`;
                roomId = matchedRoom.id;
            }
        }

        const bookingData = {
            id: `booking_${Date.now()}`,
            propertyId: boarding.id || 'p1',
            title: propertyTitle,
            location: boarding.location || 'Moratuwa, Sri Lanka',
            date: moveInDate,
            bookingType: isWholeHouse ? 'WHOLE_HOUSE' : 'ROOM',
            roomId: roomId,
            roomType: roomTypeLabel,
            peopleCount,
            message,
            status: 'PENDING',
            price: boarding.price || 15000,
            imageUrl: boarding.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            description: boarding.description,
            ownerName,
            ownerPhone
        };

        if (onSubmitBooking) {
            onSubmitBooking(bookingData);
        }
        onClose();
    };

    const getSelectedLabel = () => {
        if (isWholeHouse) return 'Whole House Rental';
        const matched = rooms.find(r => r.id === selectedBookingType);
        return matched ? `${matched.number} (${matched.type}) - ${matched.availableSpaces} space(s) left` : 'Select Room';
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header Row */}
                    <View style={styles.header}>
                        <View style={styles.brandRow}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandName}>BoardingHub</Text>
                        </View>

                        <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        {/* Property Card Header */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.modalTitle}>Send Booking Request</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={16} color="#1B4D3E" style={{ marginRight: 4 }} />
                                <Text style={styles.propertyName}>{propertyTitle}</Text>
                            </View>
                            <View style={styles.natureTag}>
                                <Ionicons name={isWholeHouse ? 'home' : 'bed'} size={12} color="#1B4D3E" style={{ marginRight: 4 }} />
                                <Text style={styles.natureTagText}>{isWholeHouse ? 'Whole House Booking' : 'Room-Based Boarding'}</Text>
                            </View>
                        </View>

                        {/* Direct Communication Info Card */}
                        <View style={styles.directContactCard}>
                            <Text style={styles.directContactTitle}>Direct Inquiry & Booking</Text>
                            <Text style={styles.directContactSub}>No online payments required. Connect directly with the owner for visits and key handover.</Text>
                            <View style={styles.contactRow}>
                                <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppChat} activeOpacity={0.85}>
                                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.whatsappBtnText}>WhatsApp Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.callOwnerBtn} onPress={handleCallHost} activeOpacity={0.85}>
                                    <Ionicons name="call" size={16} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.callOwnerBtnText}>Call Owner</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formContainer}>
                            {/* Booking Target (Room vs House) */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name={isWholeHouse ? 'home-outline' : 'bed-outline'} size={15} color="#1B4D3E" />
                                {isWholeHouse ? ' Booking Option' : ' Select Room'}
                            </Text>

                            {isWholeHouse ? (
                                <View style={styles.staticSelectionBox}>
                                    <Ionicons name="home" size={18} color="#1B4D3E" style={{ marginRight: 8 }} />
                                    <Text style={styles.staticSelectionText}>Entire House / Annex Rental</Text>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.dropdownBtn}
                                        onPress={() => setShowDropdown(!showDropdown)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.dropdownBtnText}>{getSelectedLabel()}</Text>
                                        <Ionicons name="chevron-down" size={18} color="#64748B" />
                                    </TouchableOpacity>

                                    {showDropdown && (
                                        <View style={styles.dropdownMenu}>
                                            {rooms.map((rm) => (
                                                <TouchableOpacity
                                                    key={rm.id}
                                                    style={[styles.dropdownItem, selectedBookingType === rm.id && styles.activeDropdownItem]}
                                                    onPress={() => {
                                                        setSelectedBookingType(rm.id);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <View>
                                                        <Text style={[styles.dropdownItemText, selectedBookingType === rm.id && styles.activeDropdownText]}>
                                                            {rm.number} ({rm.type})
                                                        </Text>
                                                        <Text style={styles.spaceBadgeText}>
                                                            ⚡ {rm.availableSpaces} space(s) available
                                                        </Text>
                                                    </View>
                                                    {selectedBookingType === rm.id && (
                                                        <Ionicons name="checkmark" size={18} color="#1B4D3E" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Move-in Date */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="calendar-outline" size={15} color="#1B4D3E" />  Move-in Date
                            </Text>
                            <View style={styles.dateInputRow}>
                                <TextInput
                                    style={styles.dateInput}
                                    value={moveInDate}
                                    onChangeText={setMoveInDate}
                                    placeholder="mm/dd/yyyy"
                                    placeholderTextColor="#94A3B8"
                                />
                                <Ionicons name="calendar-outline" size={18} color="#64748B" />
                            </View>

                            {/* Number of People */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="people-outline" size={15} color="#1B4D3E" />  Requested Spaces / People
                            </Text>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity
                                    style={styles.stepperBtnMinus}
                                    onPress={handleDecrement}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="remove" size={18} color="#0F172A" />
                                </TouchableOpacity>

                                <Text style={styles.stepperVal}>{peopleCount}</Text>

                                <TouchableOpacity
                                    style={styles.stepperBtnPlus}
                                    onPress={handleIncrement}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Message to Owner */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="chatbox-ellipses-outline" size={15} color="#1B4D3E" />  Message to Owner
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Introduce yourself or ask about visiting/inspection details..."
                                placeholderTextColor="#94A3B8"
                                textAlignVertical="top"
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleSubmit}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>Submit Booking Request</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 28,
        height: 22,
        marginRight: 8,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    closeBtn: {
        padding: 4,
    },

    scrollBody: {
        padding: 20,
    },

    /* Card Header */
    cardHeader: {
        backgroundColor: '#E6F0EC',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#C3DCD4',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    propertyName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B4D3E',
    },
    natureTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    natureTagText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Direct Contact Card */
    directContactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    directContactTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    directContactSub: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 10,
    },
    contactRow: {
        flexDirection: 'row',
        gap: 10,
    },
    whatsappBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#25D366',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    whatsappBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    callOwnerBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        borderWidth: 1,
        borderColor: '#C3DCD4',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callOwnerBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Form Container */
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        marginTop: 10,
    },
    staticSelectionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0EC',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#C3DCD4',
    },
    staticSelectionText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    dropdownBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 4,
    },
    dropdownBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    dropdownMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    activeDropdownItem: {
        backgroundColor: '#E6F0EC',
    },
    dropdownItemText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '700',
    },
    spaceBadgeText: {
        fontSize: 11,
        color: '#166534',
        fontWeight: '600',
        marginTop: 2,
    },
    activeDropdownText: {
        fontWeight: '800',
        color: '#1B4D3E',
    },

    /* Date Input */
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
    },
    dateInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },

    /* Stepper */
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
        width: 170,
    },
    stepperBtnMinus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperVal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    stepperBtnPlus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Text Area */
    textArea: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 14,
        height: 90,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        fontSize: 14,
        color: '#0F172A',
        marginBottom: 20,
    },

    /* Submit Button */
    submitBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        height: 50,
        borderRadius: 12,
        shadowColor: '#1B4D3E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});

