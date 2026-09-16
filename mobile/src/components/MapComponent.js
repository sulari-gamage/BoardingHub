import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Linking
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({
    latitude = 6.9271,
    longitude = 79.8612,
    onDragEnd,
    title = 'Boarding Property',
    description = 'Drag marker to adjust exact location',
    height = 220,
    draggable = true,
    showDirectionsBtn = false,
    interactive = true
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

    return (
        <View style={[styles.container, { height }]}>
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
                    urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    maximumZ={19}
                    tileSize={256}
                    shouldReplaceMapPaths={true}
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

            {/* Optional Get Directions Floating Button */}
            {showDirectionsBtn ? (
                <TouchableOpacity
                    style={styles.directionsBtn}
                    onPress={handleOpenDirections}
                    activeOpacity={0.85}
                >
                    <Ionicons name="navigate-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#E6F0EC',
        position: 'relative',
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    directionsBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});
