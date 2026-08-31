import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';

export default function DetailsScreen({ boarding, onBack }) {
    const handleContactOwner = () => {
        Alert.alert("Contact Owner", `Call ${boarding.ownerName} at ${boarding.ownerPhone}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Call Now", onPress: () => { } }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: boarding.imageUrl }} style={styles.image} />
                    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{boarding.title}</Text>
                    <Text style={styles.location}>📍 {boarding.location} • {boarding.distance}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>Rs. {boarding.price.toLocaleString()} <Text style={styles.period}>/ month</Text></Text>
                        <Text style={styles.rating}>★ {boarding.rating} ({boarding.reviewsCount} reviews)</Text>
                    </View>

                    <Text style={styles.sectionHeader}>Description</Text>
                    <Text style={styles.description}>{boarding.description}</Text>

                    <Text style={styles.sectionHeader}>Amenities</Text>
                    <View style={styles.amenitiesContainer}>
                        {boarding.amenities.map((item, index) => (
                            <View key={index} style={styles.amenityChip}>
                                <Text style={styles.amenityText}>✓ {item}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionHeader}>Property Owner</Text>
                    <View style={styles.ownerCard}>
                        <View style={styles.ownerAvatar}>
                            <Text style={styles.avatarText}>{boarding.ownerName[0]}</Text>
                        </View>
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>{boarding.ownerName}</Text>
                            <Text style={styles.ownerRole}>Verified Landlord</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Booking Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.contactBtn} onPress={handleContactOwner}>
                    <Text style={styles.contactBtnText}>📞 Contact Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookBtn} onPress={() => Alert.alert("Booking Request", "Booking request sent to owner!")}>
                    <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    imageContainer: { position: 'relative' },
    image: { width: '100%', height: 260 },
    backBtn: {
        position: 'absolute',
        top: 40,
        left: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    content: { padding: 20 },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
    location: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 14 },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 16,
    },
    price: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
    period: { fontSize: 12, color: '#64748B', fontWeight: '400' },
    rating: { fontSize: 13, fontWeight: '700', color: '#D97706' },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 14, marginBottom: 8 },
    description: { fontSize: 14, color: '#475569', lineHeight: 22 },
    amenitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    amenityChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    amenityText: { fontSize: 12, color: '#334155', fontWeight: '600' },
    ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 4 },
    ownerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
    ownerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    ownerRole: { fontSize: 12, color: '#64748B' },
    actionBar: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFF' },
    contactBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    contactBtnText: { color: '#1E293B', fontWeight: '700', fontSize: 14 },
    bookBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
