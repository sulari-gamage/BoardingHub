import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHeader({
    title = "BoardingHub Admin",
    showBack = false,
    onBack,
    showProfileAvatar = false,
    onOpenProfile
}) {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.leftSection}>
                {showBack ? (
                    <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color="#133E32" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.gridBox}>
                        <Ionicons name="grid-outline" size={20} color="#133E32" />
                    </View>
                )}

                <Text style={styles.titleText}>{title}</Text>
            </View>

            {showProfileAvatar ? (
                <TouchableOpacity style={styles.avatarTouch} onPress={onOpenProfile} activeOpacity={0.8}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80' }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
                    <Ionicons name="menu-outline" size={22} color="#133E32" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingTop: Platform.OS === 'android' ? 38 : 14,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gridBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    menuBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTouch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#133E32',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
});
