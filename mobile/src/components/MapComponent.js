import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Linking
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({
    latitude = 6.9271,
    longitude = 79.8612,
    onDragEnd,
    title = 'Boarding Property',
    description = 'Drag marker to adjust exact location',
    height = 240,
    draggable = true,
    showDirectionsBtn = true,
    interactive = true,
    showHeader = true,
    collapsible = true
}) {
    // Sanitize numeric coordinates
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    const safeLat = (!isNaN(parsedLat) && parsedLat !== 0) ? parsedLat : 6.9271;
    const safeLng = (!isNaN(parsedLng) && parsedLng !== 0) ? parsedLng : 79.8612;

    const [currentCoords, setCurrentCoords] = useState({
        latitude: safeLat,
        longitude: safeLng
    });
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        setCurrentCoords({
            latitude: safeLat,
            longitude: safeLng
        });
    }, [safeLat, safeLng]);

    const handleMarkerDragEnd = (e) => {
        if (!e || !e.nativeEvent || !e.nativeEvent.coordinate) return;
        const newLat = e.nativeEvent.coordinate.latitude;
        const newLng = e.nativeEvent.coordinate.longitude;
        const updated = { latitude: newLat, longitude: newLng, lat: newLat, lng: newLng };
        setCurrentCoords({ latitude: newLat, longitude: newLng });
        if (onDragEnd) {
            onDragEnd(updated);
        }
    };

    const handleOpenDirections = () => {
        const url = Platform.select({
            ios: `maps:0,0?q=${safeLat},${safeLng}`,
            android: `geo:0,0?q=${safeLat},${safeLng}(${encodeURIComponent(title)})`,
            default: `https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`
        });
        Linking.openURL(url).catch(err => console.log('Error launching directions:', err));
    };

    const region = {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
    };

    const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${safeLat},${safeLng}&z=15&output=embed`;

    const isWeb = Platform.OS === 'web';

    return (
        <View style={styles.cardContainer}>
            {showHeader && (
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => collapsible && setIsCollapsed(!isCollapsed)}
                    activeOpacity={collapsible ? 0.7 : 1}
                >
                    <Text style={styles.cardTitle}>Map</Text>
                    {collapsible && (
                        <Ionicons
                            name={isCollapsed ? "chevron-down" : "chevron-up"}
                            size={18}
                            color="#0F172A"
                        />
                    )}
                </TouchableOpacity>
            )}

            {!isCollapsed && (
                <View style={[styles.mapContainer, { height }]}>
                    {isWeb ? (
                        <iframe
                            title="Google Maps Location"
                            width="100%"
                            height="100%"
                            style={{ border: 0, width: '100%', height: '100%', borderRadius: 12 }}
                            loading="lazy"
                            allowFullScreen
                            src={googleMapsEmbedUrl}
                        />
                    ) : (
                        <MapView
                            style={StyleSheet.absoluteFillObject}
                            region={region}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                            scrollEnabled={interactive}
                            zoomEnabled={interactive}
                            rotateEnabled={interactive}
                            pitchEnabled={interactive}
                            loadingEnabled={true}
                            loadingIndicatorColor="#133E32"
                            loadingBackgroundColor="#E6F0EC"
                        >
                            <UrlTile
                                urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                maximumZ={19}
                                tileSize={256}
                            />
                            <Marker
                                coordinate={{
                                    latitude: currentCoords.latitude,
                                    longitude: currentCoords.longitude
                                }}
                                draggable={draggable}
                                onDragEnd={handleMarkerDragEnd}
                                title={title}
                                description={description}
                            >
                                <View style={styles.customMarkerPin}>
                                    <Ionicons name="location" size={16} color="#FFD700" />
                                    <Text style={styles.markerText}>Pin Location</Text>
                                </View>
                            </Marker>
                        </MapView>
                    )}

                    {/* Optional Get Directions Floating Button */}
                    {showDirectionsBtn && (
                        <TouchableOpacity
                            style={styles.directionsBtn}
                            onPress={handleOpenDirections}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="navigate-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.directionsBtnText}>Get Directions</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginVertical: 10,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.2,
    },
    mapContainer: {
        width: '100%',
        position: 'relative',
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    customMarkerPin: {
        backgroundColor: '#133E32',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    directionsBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#133E32',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 10,
    },
    directionsBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    }
});
