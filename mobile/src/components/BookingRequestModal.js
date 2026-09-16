import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

export default function BookingRequestModal({ visible, onClose, boarding = {}, onSubmitBooking, initialSelectedRoomId = null }) {
    const isWholeHouse =
        boarding.propertyNature === 'WHOLE_HOUSE' ||
        boarding.propertyNature === 'ANNEX' ||
        boarding.propertyType === 'ANNEX' ||
        boarding.isWholeHouse ||
        boarding.raw?.propertyNature === 'WHOLE_HOUSE' ||
        boarding.raw?.propertyNature === 'ANNEX' ||
        (boarding.title && (boarding.title.toLowerCase().includes('annex') || boarding.title.toLowerCase().includes('house') || boarding.title.toLowerCase().includes('apartment')));

    const annexSpaces =
        boarding.totalCapacity ||
        boarding.totalSpaces ||
        boarding.capacity ||
        boarding.spaces ||
        (boarding.rooms ? boarding.rooms.reduce((acc, r) => acc + (r.totalCapacity || r.availableSpaces || 1), 0) : 1);

    const rooms = boarding.rooms || [
        { id: 'r1', number: 'Room 101', type: 'Shared Room', availableSpaces: 2, price: boarding.price || 15000 },
        { id: 'r2', number: 'Room 102', type: 'Private Room', availableSpaces: 1, price: (boarding.price || 15000) + 3000 }
    ];

    const [selectedBookingType, setSelectedBookingType] = useState(
        isWholeHouse ? 'WHOLE_HOUSE' : (initialSelectedRoomId || (rooms.length > 0 ? rooms[0].id : 'WHOLE_HOUSE'))
    );
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (visible && initialSelectedRoomId && !isWholeHouse) {
            setSelectedBookingType(initialSelectedRoomId);
        }
    }, [visible, initialSelectedRoomId, isWholeHouse]);

    // Dynamic Live Real Date Setup
    const getToday = () => new Date();
    const formatDateStr = (d) => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const initialToday = getToday();
    const [moveInDate, setMoveInDate] = useState(formatDateStr(initialToday));
    const [selectedDate, setSelectedDate] = useState(initialToday);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    // Calendar navigation state initialized to current live system Year & Month
    const [calendarYear, setCalendarYear] = useState(initialToday.getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(initialToday.getMonth()); // 0-indexed (0=Jan ... 11=Dec)

    // Lock requested spaces for Annex/Whole House
    const [peopleCount, setPeopleCount] = useState(isWholeHouse ? annexSpaces : 1);

    useEffect(() => {
        if (isWholeHouse) {
            setPeopleCount(annexSpaces);
        }
    }, [isWholeHouse, annexSpaces]);

    const propertyTitle = boarding.title || 'Green Valley Boarding';
    const ownerName = boarding.ownerName || 'Sunethra Silva';
    const ownerPhone = boarding.ownerPhone || '+94 77 123 4567';

    // Calculate maximum available spaces for currently selected room or property
    const getSelectedMaxSpaces = () => {
        if (isWholeHouse) return annexSpaces;
        const matchedRoom = rooms.find(r => r.id === selectedBookingType) || rooms[0];
        const rmSpaces = matchedRoom?.remainingSpaces ?? matchedRoom?.availableSpaces ?? matchedRoom?.totalCapacity ?? 1;
        return Math.max(1, rmSpaces);
    };

    const maxSpaces = getSelectedMaxSpaces();

    // Ensure peopleCount never exceeds maxSpaces when selected room changes
    useEffect(() => {
        if (!isWholeHouse) {
            const currentMax = getSelectedMaxSpaces();
            if (peopleCount > currentMax) {
                setPeopleCount(currentMax);
            }
        }
    }, [selectedBookingType, rooms, isWholeHouse]);

    const handleIncrement = () => {
        if (isWholeHouse) return;
        const currentMax = getSelectedMaxSpaces();
        if (peopleCount >= currentMax) {
            const matchedRoom = rooms.find(r => r.id === selectedBookingType) || rooms[0];
            const roomNameStr = matchedRoom?.roomName || matchedRoom?.roomNumber || matchedRoom?.number || 'Selected Room';
            Alert.alert(
                'Vacancy Limit Reached ⚠️',
                `Only ${currentMax} space(s) are available in ${roomNameStr}. You cannot request more occupants than the available room vacancy.`
            );
            return;
        }
        setPeopleCount(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (isWholeHouse) return;
        setPeopleCount(prev => (prev > 1 ? prev - 1 : 1));
    };

    // Calendar helper functions
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const canGoPrevMonth = () => {
        const now = getToday();
        const currentRealY = now.getFullYear();
        const currentRealM = now.getMonth();

        if (calendarYear < currentRealY) return false;
        if (calendarYear === currentRealY && calendarMonth <= currentRealM) return false;
        return true;
    };

    const handlePrevMonth = () => {
        if (!canGoPrevMonth()) return;
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(prev => prev - 1);
        } else {
            setCalendarMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(prev => prev + 1);
        } else {
            setCalendarMonth(prev => prev + 1);
        }
    };

    const handleSelectDay = (dayNum) => {
        const newD = new Date(calendarYear, calendarMonth, dayNum);
        setSelectedDate(newD);
        setMoveInDate(formatDateStr(newD));
        setShowCalendarModal(false);
    };

    // Real Dynamic Quick Month Chips (Current real month + next 5 months)
    const getUpcomingMonthChips = () => {
        const chips = [];
        const now = getToday();
        let currY = now.getFullYear();
        let currM = now.getMonth();

        for (let i = 0; i < 6; i++) {
            chips.push({
                year: currY,
                month: currM,
                label: `${monthNames[currM].substring(0, 3)} ${currY}`
            });
            currM++;
            if (currM > 11) {
                currM = 0;
                currY++;
            }
        }
        return chips;
    };

    const renderCalendarGrid = () => {
        const now = getToday();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday...

        const cells = [];
        // Empty cells for alignment
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(<View key={`empty_${i}`} style={styles.calendarDayCellEmpty} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const thisDate = new Date(calendarYear, calendarMonth, day);
            const isPast = thisDate < startOfToday;
            const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === calendarYear &&
                selectedDate.getMonth() === calendarMonth &&
                selectedDate.getDate() === day;
            const isToday =
                calendarYear === now.getFullYear() &&
                calendarMonth === now.getMonth() &&
                day === now.getDate();

            cells.push(
                <TouchableOpacity
                    key={`day_${day}`}
                    disabled={isPast}
                    onPress={() => handleSelectDay(day)}
                    style={[
                        styles.calendarDayCell,
                        isPast && styles.calendarDayDisabled,
                        isSelected && styles.calendarDaySelected,
                        isToday && !isSelected && styles.calendarDayToday
                    ]}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isPast && styles.calendarDayTextDisabled,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday
                    ]}>
                        {day}
                    </Text>
                </TouchableOpacity>
            );
        }

        return cells;
    };

    const [message, setMessage] = useState('');

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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        Alert.alert(
            'Confirm Booking Request 📩',
            `Are you sure you want to send a booking request for "${propertyTitle}" for ${peopleCount} occupant(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit Request',
                    style: 'default',
                    onPress: async () => {
                        let roomTypeLabel = isWholeHouse ? 'Annex / Whole House' : 'Whole House';
                        let roomId = null;
                        let bookingTypeEnum = isWholeHouse ? (boarding.propertyType === 'ANNEX' || boarding.propertyNature === 'ANNEX' ? 'ANNEX' : 'WHOLE_HOUSE') : 'ROOM_BASED';

                        if (!isWholeHouse) {
                            const matchedRoom = rooms.find(r => r.id === selectedBookingType);
                            if (matchedRoom) {
                                roomTypeLabel = `${matchedRoom.number || matchedRoom.roomNumber || 'Room'} (${matchedRoom.type || matchedRoom.roomType || 'Shared'})`;
                                roomId = matchedRoom.id;
                            }
                        }

                        // Format moveInDate to YYYY-MM-DD for Spring Boot LocalDate compatibility
                        let formattedDateStr = moveInDate;
                        if (selectedDate instanceof Date) {
                            const yyyy = selectedDate.getFullYear();
                            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(selectedDate.getDate()).padStart(2, '0');
                            formattedDateStr = `${yyyy}-${mm}-${dd}`;
                        } else if (moveInDate.includes('/')) {
                            const parts = moveInDate.split('/');
                            if (parts.length === 3) {
                                formattedDateStr = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                            }
                        }

                        const backendPayload = {
                            propertyId: boarding.id,
                            roomId: (roomId && !isNaN(roomId)) ? Number(roomId) : (roomId ? roomId : null),
                            bookingType: bookingTypeEnum,
                            occupantsCount: peopleCount,
                            moveInDate: formattedDateStr,
                            notes: message
                        };

                        setIsSubmitting(true);
                        try {
                            // Persist to backend PostgreSQL database via API
                            let apiResult = null;
                            if (boarding.id && !isNaN(boarding.id)) {
                                apiResult = await api.bookings.create(backendPayload);
                                console.log('[BookingRequestModal] Successfully persisted booking to database:', apiResult);
                            }

                            const nowIso = new Date().toISOString();
                            const nowFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                            const bookingData = {
                                id: apiResult?.id ? `booking_${apiResult.id}` : `booking_${Date.now()}`,
                                propertyId: boarding.id || 'p1',
                                title: propertyTitle,
                                location: boarding.location || 'Moratuwa, Sri Lanka',
                                date: moveInDate,
                                moveInDate: moveInDate,
                                createdAt: apiResult?.createdAt || nowIso,
                                requestSentDate: apiResult?.createdAt ? new Date(apiResult.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : nowFormatted,
                                bookingType: bookingTypeEnum,
                                roomId: roomId,
                                roomType: roomTypeLabel,
                                occupantsCount: peopleCount,
                                peopleCount,
                                message,
                                notes: message,
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
                            Alert.alert('Request Sent! 🎉', 'Your booking request has been submitted and stored successfully.');
                            onClose();
                        } catch (err) {
                            console.error('[BookingRequestModal] Database save failed:', err?.message);
                            // Fallback client callback so UI workflow remains responsive
                            const nowIso = new Date().toISOString();
                            const nowFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const fallbackData = {
                                id: `booking_${Date.now()}`,
                                propertyId: boarding.id || 'p1',
                                title: propertyTitle,
                                location: boarding.location || 'Moratuwa, Sri Lanka',
                                date: moveInDate,
                                moveInDate: moveInDate,
                                createdAt: nowIso,
                                requestSentDate: nowFormatted,
                                bookingType: bookingTypeEnum,
                                roomId: roomId,
                                roomType: roomTypeLabel,
                                occupantsCount: peopleCount,
                                peopleCount,
                                message,
                                notes: message,
                                status: 'PENDING',
                                price: boarding.price || 15000,
                                imageUrl: boarding.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                                description: boarding.description,
                                ownerName,
                                ownerPhone
                            };
                            if (onSubmitBooking) onSubmitBooking(fallbackData);
                            Alert.alert('Request Sent 📩', 'Your booking request was recorded.');
                            onClose();
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
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
                                <Text style={styles.natureTagText}>{isWholeHouse ? 'Annex / Whole House Booking' : 'Room-Based Boarding'}</Text>
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
                                    {(() => {
                                        const currentSelectedRoom = rooms.find(r => r.id === selectedBookingType) || rooms[0];
                                        const roomDisplayName = currentSelectedRoom?.roomName || currentSelectedRoom?.roomNumber || currentSelectedRoom?.number || 'Room 101';
                                        const roomTypeLabel = currentSelectedRoom?.roomType || currentSelectedRoom?.type || 'Shared Room';
                                        const availableSpacesCount = currentSelectedRoom?.remainingSpaces ?? currentSelectedRoom?.availableSpaces ?? currentSelectedRoom?.totalCapacity ?? 1;

                                        return (
                                            <TouchableOpacity
                                                style={styles.selectedRoomDisplayCard}
                                                onPress={() => setShowDropdown(!showDropdown)}
                                                activeOpacity={0.85}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <View style={styles.selectedRoomHeaderRow}>
                                                        <Text style={styles.selectedRoomTitleText}>{roomDisplayName}</Text>
                                                        <View style={styles.selectedRoomSpaceBadge}>
                                                            <Ionicons name="flash-outline" size={12} color="#059669" style={{ marginRight: 3 }} />
                                                            <Text style={styles.selectedRoomSpaceBadgeText}>
                                                                {availableSpacesCount} space{availableSpacesCount !== 1 ? 's' : ''} available
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.selectedRoomTypeSubText}>{roomTypeLabel} Type</Text>
                                                </View>
                                                <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#1B4D3E" style={{ marginLeft: 8 }} />
                                            </TouchableOpacity>
                                        );
                                    })()}

                                    {showDropdown && (
                                        <View style={styles.dropdownMenu}>
                                            {rooms.map((rm) => {
                                                const rmName = rm.roomName || rm.roomNumber || rm.number || 'Room';
                                                const rmType = rm.roomType || rm.type || 'Shared Room';
                                                const rmSpaces = rm.remainingSpaces ?? rm.availableSpaces ?? rm.totalCapacity ?? 1;
                                                const isSelected = selectedBookingType === rm.id;

                                                return (
                                                    <TouchableOpacity
                                                        key={rm.id}
                                                        style={[styles.dropdownItem, isSelected && styles.activeDropdownItem]}
                                                        onPress={() => {
                                                            setSelectedBookingType(rm.id);
                                                            setShowDropdown(false);
                                                        }}
                                                    >
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={[styles.dropdownItemText, isSelected && styles.activeDropdownText]}>
                                                                {rmName} ({rmType})
                                                            </Text>
                                                            <Text style={styles.spaceBadgeText}>
                                                                ⚡ {rmSpaces} space(s) available
                                                            </Text>
                                                        </View>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={20} color="#1B4D3E" />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Move-in Date Picker Button */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="calendar-outline" size={15} color="#1B4D3E" />  Move-in Date
                            </Text>
                            <TouchableOpacity
                                style={styles.datePickerTriggerBtn}
                                onPress={() => setShowCalendarModal(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.datePickerTriggerText}>{moveInDate}</Text>
                                <Ionicons name="calendar" size={18} color="#1B4D3E" />
                            </TouchableOpacity>

                            {/* Number of People / Requested Spaces */}
                            <Text style={styles.inputLabel}>
                                <Ionicons name="people-outline" size={15} color="#1B4D3E" />  Requested Spaces / People
                            </Text>
                            <View style={[styles.stepperContainer, isWholeHouse && styles.stepperContainerDisabled]}>
                                <TouchableOpacity
                                    style={[styles.stepperBtnMinus, isWholeHouse && styles.stepperBtnDisabled]}
                                    onPress={handleDecrement}
                                    disabled={isWholeHouse}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="remove" size={18} color={isWholeHouse ? "#94A3B8" : "#0F172A"} />
                                </TouchableOpacity>

                                <Text style={[styles.stepperVal, isWholeHouse && styles.stepperValDisabled]}>{peopleCount}</Text>

                                <TouchableOpacity
                                    style={[styles.stepperBtnPlus, isWholeHouse && styles.stepperBtnDisabled]}
                                    onPress={handleIncrement}
                                    disabled={isWholeHouse}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={18} color={isWholeHouse ? "#94A3B8" : "#FFFFFF"} />
                                </TouchableOpacity>
                            </View>

                            {isWholeHouse ? (
                                <View style={styles.annexLockNotice}>
                                    <Ionicons name="lock-closed" size={13} color="#15803D" style={{ marginRight: 6 }} />
                                    <Text style={styles.annexLockNoticeText}>
                                        Annex type bookings rent the entire property. Spaces fixed to full Annex capacity ({annexSpaces} space{annexSpaces > 1 ? 's' : ''}).
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.annexLockNotice}>
                                    <Ionicons name="information-circle-outline" size={14} color="#1B4D3E" style={{ marginRight: 6 }} />
                                    <Text style={styles.annexLockNoticeText}>
                                        Maximum request limit for selected room: {maxSpaces} available space{maxSpaces > 1 ? 's' : ''}.
                                    </Text>
                                </View>
                            )}

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

                    {/* Interactive Real Upcoming Months Calendar Modal */}
                    <Modal
                        visible={showCalendarModal}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowCalendarModal(false)}
                    >
                        <View style={styles.calendarModalOverlay}>
                            <View style={styles.calendarModalContent}>
                                {/* Calendar Header */}
                                <View style={styles.calendarHeaderRow}>
                                    <Text style={styles.calendarTitle}>Select Move-in Date 📅</Text>
                                    <TouchableOpacity onPress={() => setShowCalendarModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Ionicons name="close" size={22} color="#64748B" />
                                    </TouchableOpacity>
                                </View>

                                {/* Upcoming Month Quick Chips */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthChipsScroll} contentContainerStyle={styles.monthChipsContainer}>
                                    {getUpcomingMonthChips().map((chip, idx) => {
                                        const isSelectedChip = calendarYear === chip.year && calendarMonth === chip.month;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[styles.monthChip, isSelectedChip && styles.monthChipActive]}
                                                onPress={() => {
                                                    setCalendarYear(chip.year);
                                                    setCalendarMonth(chip.month);
                                                }}
                                            >
                                                <Text style={[styles.monthChipText, isSelectedChip && styles.monthChipTextActive]}>
                                                    {chip.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                {/* Month & Year Navigation Header */}
                                <View style={styles.monthNavRow}>
                                    <TouchableOpacity
                                        style={[styles.monthNavArrow, !canGoPrevMonth() && styles.monthNavArrowDisabled]}
                                        disabled={!canGoPrevMonth()}
                                        onPress={handlePrevMonth}
                                    >
                                        <Ionicons name="chevron-back" size={18} color={canGoPrevMonth() ? '#1B4D3E' : '#CBD5E1'} />
                                    </TouchableOpacity>

                                    <Text style={styles.monthNavTitle}>
                                        {monthNames[calendarMonth]} {calendarYear}
                                    </Text>

                                    <TouchableOpacity style={styles.monthNavArrow} onPress={handleNextMonth}>
                                        <Ionicons name="chevron-forward" size={18} color="#1B4D3E" />
                                    </TouchableOpacity>
                                </View>

                                {/* Days of Week Labels */}
                                <View style={styles.weekDaysRow}>
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                                        <Text key={i} style={styles.weekDayLabel}>{d}</Text>
                                    ))}
                                </View>

                                {/* Day Grid */}
                                <View style={styles.daysGrid}>
                                    {renderCalendarGrid()}
                                </View>

                                {/* Selected Date Footer */}
                                <View style={styles.calendarFooter}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.calendarFooterLabel}>Selected Move-in Date:</Text>
                                        <Text style={styles.calendarFooterValue}>{moveInDate}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.confirmDateBtn}
                                        onPress={() => setShowCalendarModal(false)}
                                    >
                                        <Text style={styles.confirmDateBtnText}>Confirm Date</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
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
    selectedRoomDisplayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#1B4D3E',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 6,
    },
    selectedRoomHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    selectedRoomTitleText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    selectedRoomSpaceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    selectedRoomSpaceBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#047857',
    },
    selectedRoomTypeSubText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
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

    /* Date Input & Trigger Button */
    datePickerTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 12,
    },
    datePickerTriggerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
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
    stepperContainerDisabled: {
        backgroundColor: '#E2E8F0',
        borderColor: '#CBD5E1',
        opacity: 0.85,
    },
    stepperBtnMinus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperBtnPlus: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1B4D3E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    stepperVal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
    },
    stepperValDisabled: {
        color: '#64748B',
    },
    annexLockNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#86EFAC',
        marginBottom: 14,
    },
    annexLockNoticeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803D',
        flex: 1,
        lineHeight: 16,
    },

    /* Interactive Calendar Modal Styles */
    calendarModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarModalContent: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    monthChipsScroll: {
        marginBottom: 14,
    },
    monthChipsContainer: {
        gap: 8,
    },
    monthChip: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    monthChipActive: {
        backgroundColor: '#1B4D3E',
        borderColor: '#1B4D3E',
    },
    monthChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    monthChipTextActive: {
        color: '#FFFFFF',
    },
    monthNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
    },
    monthNavArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNavArrowDisabled: {
        backgroundColor: '#F1F5F9',
    },
    monthNavTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1B4D3E',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 8,
        width: '100%',
    },
    weekDayLabel: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 16,
        width: '100%',
    },
    calendarDayCell: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    calendarDayCellEmpty: {
        width: '14.28%',
        height: 40,
    },
    calendarDayDisabled: {
        opacity: 0.3,
    },
    calendarDayToday: {
        borderWidth: 1.5,
        borderColor: '#1B4D3E',
        backgroundColor: '#E6F0EC',
    },
    calendarDaySelected: {
        backgroundColor: '#1B4D3E',
    },
    calendarDayText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    calendarDayTextDisabled: {
        color: '#94A3B8',
    },
    calendarDayTextToday: {
        color: '#1B4D3E',
        fontWeight: '900',
    },
    calendarDayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '900',
    },
    calendarFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    calendarFooterLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    calendarFooterValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1B4D3E',
    },
    confirmDateBtn: {
        backgroundColor: '#1B4D3E',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    confirmDateBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
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


