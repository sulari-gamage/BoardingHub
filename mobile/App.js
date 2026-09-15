import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './src/services/api';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Seeker Screens
import HomeScreen from './src/screens/seeker/HomeScreen';
import SearchScreen from './src/screens/seeker/SearchScreen';
import DetailsScreen from './src/screens/seeker/DetailsScreen';
import BookingsScreen from './src/screens/seeker/BookingsScreen';
import ProfileScreen from './src/screens/seeker/ProfileScreen';

import ImageGalleryScreen from './src/screens/seeker/ImageGalleryScreen';
import MapViewScreen from './src/screens/seeker/MapViewScreen';
import BookingConfirmationScreen from './src/screens/seeker/BookingConfirmationScreen';
import BookingDetailsScreen from './src/screens/seeker/BookingDetailsScreen';
import FavoritesScreen from './src/screens/seeker/FavoritesScreen';
import ReviewsScreen from './src/screens/seeker/ReviewsScreen';
import NotificationsScreen from './src/screens/seeker/NotificationsScreen';

// Owner Screens
import OwnerHomeScreen from './src/screens/owner/OwnerHomeScreen';
import OwnerPropertiesScreen from './src/screens/owner/OwnerPropertiesScreen';
import OwnerRequestsScreen from './src/screens/owner/OwnerRequestsScreen';
import OwnerProfileScreen from './src/screens/owner/OwnerProfileScreen';
import AddPropertyScreen from './src/screens/owner/AddPropertyScreen';
import OwnerPropertyDetailScreen from './src/screens/owner/OwnerPropertyDetailScreen';
import RoomManagementScreen from './src/screens/owner/RoomManagementScreen';
import AddRoomScreen from './src/screens/owner/AddRoomScreen';
import BookingRequestDetailScreen from './src/screens/owner/BookingRequestDetailScreen';

// Admin Screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminPendingPropertiesScreen from './src/screens/admin/AdminPendingPropertiesScreen';
import AdminPropertyReviewScreen from './src/screens/admin/AdminPropertyReviewScreen';
import AdminUserManagementScreen from './src/screens/admin/AdminUserManagementScreen';
import AdminUserDetailScreen from './src/screens/admin/AdminUserDetailScreen';
import AdminBookingMonitoringScreen from './src/screens/admin/AdminBookingMonitoringScreen';
import AdminAnalyticsScreen from './src/screens/admin/AdminAnalyticsScreen';
import AdminMoreScreen from './src/screens/admin/AdminMoreScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('LOGIN');
  const [userRole, setUserRole] = useState('SEEKER'); // 'SEEKER' | 'OWNER' | 'ADMIN'
  const [currentUser, setCurrentUser] = useState(null); // populated from API on login/register
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedOwnerProperty, setSelectedOwnerProperty] = useState(null);
  const [selectedOwnerRequest, setSelectedOwnerRequest] = useState(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('HOME');
  const [userBookings, setUserBookings] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [savedBoardings, setSavedBoardings] = useState([]);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  // Load saved boardings from Backend / AsyncStorage on app mount / user login
  useEffect(() => {
    const loadSavedBoardings = async () => {
      try {
        if (currentUser) {
          const remoteFavorites = await api.favorites.getSaved();
          if (Array.isArray(remoteFavorites)) {
            const formatted = remoteFavorites.map((p) => ({
              ...p,
              imageUrl: (p.imageUrls && p.imageUrls.length > 0)
                ? p.imageUrls[0]
                : (p.images && p.images.length > 0)
                  ? p.images[0].imageUrl
                  : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
              location: p.address || (p.city ? `${p.city}` : 'Location Not Set'),
              price: p.monthlyRent || p.price || 0,
              rent: `Rs. ${(p.monthlyRent || p.price || 0).toLocaleString()}/mo`,
              rating: p.rating != null ? p.rating : null,
            }));
            setSavedBoardings(formatted);
            const userKey = currentUser?.id || currentUser?.email;
            api.storage.setItem(`@saved_boardings_${userKey}`, JSON.stringify(formatted)).catch(() => { });
            return;
          }
        }

        // Fallback to local storage
        const userKey = currentUser?.id || currentUser?.email;
        const storageKey = userKey ? `@saved_boardings_${userKey}` : '@saved_boardings_default';
        const savedData = await api.storage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed)) {
            setSavedBoardings(parsed);
            return;
          }
        }
        setSavedBoardings([]);
      } catch (error) {
        console.log('[App] Error loading saved boardings:', error);
      }
    };
    loadSavedBoardings();
  }, [currentUser]);

  const handleToggleSaveBoarding = async (boarding) => {
    if (!boarding || !boarding.id) return;

    const rawId = boarding.id;
    const propId = typeof rawId === 'number' ? rawId : parseInt(rawId, 10);

    // Optimistic UI update with string-based ID comparison
    setSavedBoardings((prev) => {
      const exists = prev.some((b) => String(b.id) === String(boarding.id));
      const updated = exists
        ? prev.filter((b) => String(b.id) !== String(boarding.id))
        : [...prev, boarding];

      const userKey = currentUser?.id || currentUser?.email;
      const storageKey = userKey ? `@saved_boardings_${userKey}` : '@saved_boardings_default';
      api.storage.setItem(storageKey, JSON.stringify(updated)).catch((err) =>
        console.log('[App] Error saving boardings to local storage:', err)
      );

      return updated;
    });

    // Sync with database backend if logged in
    try {
      if (currentUser) {
        // Check if property ID is a valid numeric DB id (mock boardings have IDs like 'n1', 'p1')
        if (isNaN(propId) || propId <= 0) {
          console.log('[App] Property ID is non-numeric (mock/offline property); stored in local device storage only.');
          return;
        }

        const token = await api.auth.getToken();
        if (!token) {
          console.log('[App] User JWT token unavailable; stored in local device storage only.');
          return;
        }

        console.log('[App] Syncing favorite toggle to backend for propertyId:', propId);
        const response = await api.favorites.toggle(propId);
        console.log('[App] Favorite toggle backend response:', response);
      } else {
        console.log('[App] User is not logged in; saved to local storage only.');
      }
    } catch (err) {
      console.warn('[App] Remote favorite sync notice (fallback to local storage):', err?.message || err);
    }
  };

  const handleUserUpdated = (updatedUserData) => {
    if (!updatedUserData) return;
    setCurrentUser((prev) => ({
      ...(prev || {}),
      ...updatedUserData,
    }));
  };

  const handleApproveRequest = (id) => {
    setOwnerRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'APPROVED' } : req))
    );
  };

  const handleRejectRequest = (id) => {
    setOwnerRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'REJECTED' } : req))
    );
  };

  // Navigation Handlers
  const handleSelectBoarding = (boarding, origin = 'HOME') => {
    setSelectedBoarding(boarding);
    // If we're already coming from a main tab screen, store it as originScreen
    if (origin !== 'DETAILS') {
      setPreviousScreen(origin);
    }
    setCurrentScreen('DETAILS');
  };

  const handleSelectOwnerProperty = (prop) => {
    setSelectedOwnerProperty(prop);
    setCurrentScreen('OWNER_PROPERTY_DETAIL');
  };

  // After a booking is placed, navigate to confirmation screen
  const handleAddBooking = (booking) => {
    setSelectedBooking(booking);
    setCurrentScreen('BOOKING_CONFIRMATION');
  };

  const handleViewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setPreviousScreen(currentScreen);
    setCurrentScreen('BOOKING_DETAILS');
  };

  const handleOpenGallery = (boarding) => {
    if (boarding) {
      setSelectedBoarding(boarding);
      if (userRole === 'OWNER') setSelectedOwnerProperty(boarding);
    }
    // Only set previousScreen if not already in DETAILS
    if (currentScreen !== 'DETAILS') {
      setPreviousScreen(currentScreen);
    }
    setCurrentScreen('IMAGE_GALLERY');
  };

  const handleOpenMap = (boarding) => {
    if (boarding) setSelectedBoarding(boarding);
    if (currentScreen !== 'DETAILS') {
      setPreviousScreen(currentScreen);
    }
    setCurrentScreen('MAP_VIEW');
  };

  const handleOpenReviews = (boarding) => {
    if (boarding) setSelectedBoarding(boarding);
    if (currentScreen !== 'DETAILS') {
      setPreviousScreen(currentScreen);
    }
    setCurrentScreen('REVIEWS');
  };

  const handleOpenNotifications = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('NOTIFICATIONS');
  };

  const handleNavigateTab = (tab) => {
    if (userRole === 'ADMIN') {
      if (tab === 'Dashboard' || tab === 'ADMIN_DASHBOARD') setCurrentScreen('ADMIN_DASHBOARD');
      else if (tab === 'Listings' || tab === 'ADMIN_PENDING_PROPERTIES') setCurrentScreen('ADMIN_PENDING_PROPERTIES');
      else if (tab === 'Users' || tab === 'ADMIN_USER_MANAGEMENT') setCurrentScreen('ADMIN_USER_MANAGEMENT');
      else if (tab === 'More' || tab === 'ADMIN_MORE') setCurrentScreen('ADMIN_MORE');
      else if (tab === 'Bookings' || tab === 'ADMIN_BOOKING_MONITORING') setCurrentScreen('ADMIN_BOOKING_MONITORING');
      else if (tab === 'Analytics' || tab === 'ADMIN_ANALYTICS') setCurrentScreen('ADMIN_ANALYTICS');
      else if (tab === 'ADMIN_PROPERTY_REVIEW') setCurrentScreen('ADMIN_PROPERTY_REVIEW');
      return;
    }

    if (userRole === 'OWNER') {
      if (tab === 'Dashboard' || tab === 'OWNER_HOME' || tab === 'HOME') setCurrentScreen('OWNER_HOME');
      else if (tab === 'Properties' || tab === 'OWNER_PROPERTIES') setCurrentScreen('OWNER_PROPERTIES');
      else if (tab === 'Requests' || tab === 'OWNER_REQUESTS') setCurrentScreen('OWNER_REQUESTS');
      else if (tab === 'Profile' || tab === 'PROFILE' || tab === 'OwnerProfile' || tab === 'OWNER_PROFILE') setCurrentScreen('OWNER_PROFILE');
      else if (tab === 'REVIEWS') {
        setPreviousScreen('PROFILE');
        setCurrentScreen('REVIEWS');
      }
      else if (tab === 'NOTIFICATIONS') setCurrentScreen('NOTIFICATIONS');
      return;
    }

    if (tab === 'HOME') setCurrentScreen('HOME');
    else if (tab === 'SEARCH') setCurrentScreen('SEARCH');
    else if (tab === 'FAVORITES') setCurrentScreen('FAVORITES');
    else if (tab === 'BOOKINGS') setCurrentScreen('BOOKINGS');
    else if (tab === 'PROFILE' || tab === 'Profile') setCurrentScreen('PROFILE');
    else if (tab === 'NOTIFICATIONS') setCurrentScreen('NOTIFICATIONS');
    else if (tab === 'REVIEWS') setCurrentScreen('REVIEWS');
    else if (tab === 'MAP_VIEW') setCurrentScreen('MAP_VIEW');
  };

  const handleSwitchToOwner = () => {
    setUserRole('OWNER');
    setCurrentScreen('OWNER_HOME');
  };

  const handleSwitchToSeeker = () => {
    setUserRole('SEEKER');
    setCurrentScreen('HOME');
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) { }
    setCurrentUser(null);
    setSavedBoardings([]);
    setUserRole('SEEKER');
    setCurrentScreen('LOGIN');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        {/* Central Screen Router */}
        {currentScreen === 'REGISTER' ? (
          <RegisterScreen
            onNavigateToLogin={() => setCurrentScreen('LOGIN')}
            onRegisterSuccess={(role, userData) => {
              setCurrentUser(userData);
              if (role === 'Admins' || role === 'Admin') {
                setUserRole('ADMIN');
                setCurrentScreen('ADMIN_DASHBOARD');
              } else if (role === 'Owner' || role === 'Owners') {
                setUserRole('OWNER');
                setCurrentScreen('OWNER_HOME');
              } else {
                setUserRole('SEEKER');
                setCurrentScreen('HOME');
              }
            }}
          />
        ) : currentScreen === 'LOGIN' ? (
          <LoginScreen
            onLoginSuccess={(role, userData) => {
              setCurrentUser(userData);
              if (role === 'Admins' || role === 'Admin') {
                setUserRole('ADMIN');
                setCurrentScreen('ADMIN_DASHBOARD');
              } else if (role === 'Owners' || role === 'Owner') {
                setUserRole('OWNER');
                setCurrentScreen('OWNER_HOME');
              } else {
                setUserRole('SEEKER');
                setCurrentScreen('HOME');
              }
            }}
            onNavigateToRegister={() => setCurrentScreen('REGISTER')}
          />
        ) : currentScreen === 'OWNER_HOME' ? (
          <OwnerHomeScreen
            activeTab="Dashboard"
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
            onOpenNotifications={handleOpenNotifications}
            onViewAllRequests={() => setCurrentScreen('OWNER_REQUESTS')}
            onReviewRequest={() => setCurrentScreen('OWNER_REQUESTS')}
            onViewPropertyDetails={() => setCurrentScreen('OWNER_PROPERTIES')}
          />
        ) : currentScreen === 'OWNER_PROPERTIES' ? (
          <OwnerPropertiesScreen
            activeTab="Properties"
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
            onAddNewProperty={() => {
              setSelectedOwnerProperty(null);
              setCurrentScreen('ADD_PROPERTY');
            }}
            onSelectProperty={handleSelectOwnerProperty}
          />
        ) : currentScreen === 'OWNER_PROPERTY_DETAIL' ? (
          <OwnerPropertyDetailScreen
            property={selectedOwnerProperty}
            onBack={() => setCurrentScreen('OWNER_PROPERTIES')}
            onOpenRooms={() => setCurrentScreen('ROOM_MANAGEMENT')}
            onOpenGallery={() => handleOpenGallery(selectedOwnerProperty)}
            onEditProperty={() => setCurrentScreen('ADD_PROPERTY')}
            onOpenBookings={() => setCurrentScreen('OWNER_REQUESTS')}
            onPropertyUpdated={(updatedProp) => setSelectedOwnerProperty(updatedProp)}
          />
        ) : currentScreen === 'ROOM_MANAGEMENT' ? (
          <RoomManagementScreen
            property={selectedOwnerProperty}
            propertyName={selectedOwnerProperty?.title || 'Boarding Property'}
            onBack={() => setCurrentScreen('OWNER_PROPERTY_DETAIL')}
            onAddRoom={() => setCurrentScreen('ADD_ROOM')}
            onOpenBookings={() => setCurrentScreen('OWNER_REQUESTS')}
            onOpenGallery={() => handleOpenGallery(selectedOwnerProperty)}
            onPropertyUpdated={(updatedProp) => setSelectedOwnerProperty(updatedProp)}
          />
        ) : currentScreen === 'ADD_ROOM' ? (
          <AddRoomScreen
            onBack={() => setCurrentScreen('ROOM_MANAGEMENT')}
            onSaveRoom={() => setCurrentScreen('ROOM_MANAGEMENT')}
          />
        ) : currentScreen === 'OWNER_REQUESTS' ? (
          <OwnerRequestsScreen
            activeTab="Requests"
            currentUser={currentUser}
            requestsList={ownerRequests}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onNavigateTab={handleNavigateTab}
            onSelectRequest={(req) => {
              setSelectedOwnerRequest(req);
              setCurrentScreen('BOOKING_REQUEST_DETAIL');
            }}
          />
        ) : currentScreen === 'BOOKING_REQUEST_DETAIL' ? (
          <BookingRequestDetailScreen
            request={selectedOwnerRequest}
            onBack={() => setCurrentScreen('OWNER_REQUESTS')}
            onAccept={(id) => {
              handleApproveRequest(id || selectedOwnerRequest?.id);
              setCurrentScreen('OWNER_REQUESTS');
            }}
            onReject={(id) => {
              handleRejectRequest(id || selectedOwnerRequest?.id);
              setCurrentScreen('OWNER_REQUESTS');
            }}
          />
        ) : currentScreen === 'OWNER_PROFILE' ? (
          <OwnerProfileScreen
            activeTab="Profile"
            currentUser={currentUser}
            onUserUpdated={handleUserUpdated}
            onNavigateTab={handleNavigateTab}
            onSwitchToSeeker={handleSwitchToSeeker}
            onLogout={handleLogout}
          />
        ) : currentScreen === 'ADD_PROPERTY' ? (
          <AddPropertyScreen
            currentUser={currentUser}
            propertyToEdit={selectedOwnerProperty}
            onBack={() => setCurrentScreen('OWNER_PROPERTIES')}
            onSaveProperty={() => {
              setCurrentScreen('OWNER_PROPERTIES');
            }}
          />
        ) : currentScreen === 'ADMIN_DASHBOARD' ? (
          <AdminDashboardScreen
            activeTab="Dashboard"
            onNavigateTab={handleNavigateTab}
            onOpenPendingReview={() => setCurrentScreen('ADMIN_PENDING_PROPERTIES')}
          />
        ) : currentScreen === 'ADMIN_PENDING_PROPERTIES' ? (
          <AdminPendingPropertiesScreen
            activeTab="Listings"
            onNavigateTab={handleNavigateTab}
            onOpenNotifications={handleOpenNotifications}
            onSelectProperty={() => setCurrentScreen('ADMIN_PROPERTY_REVIEW')}
          />
        ) : currentScreen === 'ADMIN_PROPERTY_REVIEW' ? (
          <AdminPropertyReviewScreen
            onBack={() => setCurrentScreen('ADMIN_PENDING_PROPERTIES')}
            onApprove={() => setCurrentScreen('ADMIN_PENDING_PROPERTIES')}
            onReject={() => setCurrentScreen('ADMIN_PENDING_PROPERTIES')}
          />
        ) : currentScreen === 'ADMIN_USER_MANAGEMENT' ? (
          <AdminUserManagementScreen
            activeTab="Users"
            onNavigateTab={handleNavigateTab}
            onSelectUser={(user) => {
              setSelectedAdminUser(user);
              setCurrentScreen('ADMIN_USER_DETAIL');
            }}
          />
        ) : currentScreen === 'ADMIN_USER_DETAIL' ? (
          <AdminUserDetailScreen
            user={selectedAdminUser}
            onBack={() => setCurrentScreen('ADMIN_USER_MANAGEMENT')}
          />
        ) : currentScreen === 'ADMIN_BOOKING_MONITORING' ? (
          <AdminBookingMonitoringScreen
            activeTab="More"
            onNavigateTab={handleNavigateTab}
          />
        ) : currentScreen === 'ADMIN_ANALYTICS' ? (
          <AdminAnalyticsScreen
            activeTab="More"
            onNavigateTab={handleNavigateTab}
            onOpenNotifications={handleOpenNotifications}
          />
        ) : currentScreen === 'ADMIN_MORE' ? (
          <AdminMoreScreen
            activeTab="More"
            onNavigateTab={handleNavigateTab}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
            onOpenNotifications={handleOpenNotifications}
            onLogout={() => setCurrentScreen('LOGIN')}
          />
        ) : currentScreen === 'SEARCH' ? (
          <SearchScreen
            currentUser={currentUser}
            initialSearchQuery={searchInitialQuery}
            savedBoardings={savedBoardings}
            onToggleSaveBoarding={handleToggleSaveBoarding}
            onSelectBoarding={(b) => handleSelectBoarding(b, 'SEARCH')}
            onNavigateTab={(tab) => {
              setSearchInitialQuery('');
              handleNavigateTab(tab);
            }}
          />
        ) : currentScreen === 'FAVORITES' ? (
          <FavoritesScreen
            currentUser={currentUser}
            savedBoardings={savedBoardings}
            onToggleSaveBoarding={handleToggleSaveBoarding}
            onSelectBoarding={(b) => handleSelectBoarding(b, 'FAVORITES')}
            onNavigateTab={handleNavigateTab}
          />
        ) : currentScreen === 'BOOKINGS' ? (
          <BookingsScreen
            currentUser={currentUser}
            bookings={userBookings}
            onSelectBoarding={(b) => handleSelectBoarding(b, 'BOOKINGS')}
            onViewBookingDetails={handleViewBookingDetails}
            onNavigateTab={handleNavigateTab}
          />
        ) : currentScreen === 'PROFILE' ? (
          <ProfileScreen
            currentUser={currentUser}
            savedBoardings={savedBoardings}
            userBookings={userBookings}
            onUserUpdated={handleUserUpdated}
            onLogout={handleLogout}
            onNavigateTab={handleNavigateTab}
            onOpenNotifications={handleOpenNotifications}
            onOpenReviews={() => handleOpenReviews(selectedBoarding)}
          />
        ) : currentScreen === 'DETAILS' && selectedBoarding ? (
          <DetailsScreen
            boarding={selectedBoarding}
            isSaved={savedBoardings.some((b) => b.id === selectedBoarding.id)}
            onToggleSave={() => handleToggleSaveBoarding(selectedBoarding)}
            onBack={() => setCurrentScreen(previousScreen || 'HOME')}
            onBookSuccess={handleAddBooking}
            onOpenGallery={() => handleOpenGallery(selectedBoarding)}
            onOpenReviews={() => handleOpenReviews(selectedBoarding)}
            onOpenMap={() => handleOpenMap(selectedBoarding)}
            onViewOwnerProperties={(ownerName) => {
              setSearchInitialQuery(ownerName);
              setPreviousScreen('DETAILS');
              setCurrentScreen('SEARCH');
            }}
          />
        ) : currentScreen === 'IMAGE_GALLERY' ? (
          <ImageGalleryScreen
            boarding={selectedBoarding || selectedOwnerProperty || {}}
            isOwner={userRole === 'OWNER'}
            onBack={() => setCurrentScreen(previousScreen || (userRole === 'OWNER' ? 'OWNER_PROPERTY_DETAIL' : 'DETAILS'))}
            onPropertyUpdated={(updated) => {
              setSelectedOwnerProperty(updated);
              setSelectedBoarding(updated);
            }}
          />
        ) : currentScreen === 'MAP_VIEW' ? (
          <MapViewScreen
            onSelectBoarding={(b) => handleSelectBoarding(b, 'MAP_VIEW')}
            onBack={() => setCurrentScreen(previousScreen || 'HOME')}
            onToggleListView={() => setCurrentScreen('SEARCH')}
          />
        ) : currentScreen === 'BOOKING_CONFIRMATION' ? (
          <BookingConfirmationScreen
            booking={selectedBooking || {}}
            onGoToBookings={() => setCurrentScreen('BOOKINGS')}
            onGoHome={() => setCurrentScreen('HOME')}
          />
        ) : currentScreen === 'BOOKING_DETAILS' ? (
          <BookingDetailsScreen
            booking={selectedBooking || {}}
            onBack={() => setCurrentScreen(previousScreen || 'BOOKINGS')}
            onCancelBooking={(id) => {
              setUserBookings((prev) => prev.filter((b) => b.id !== id));
            }}
          />
        ) : currentScreen === 'REVIEWS' ? (
          <ReviewsScreen
            boarding={selectedBoarding || {}}
            currentUser={currentUser}
            mode={previousScreen === 'PROFILE' || previousScreen === 'OWNER_PROFILE' ? 'MY_REVIEWS' : 'PROPERTY'}
            onBack={() => {
              if (previousScreen === 'PROFILE' || previousScreen === 'OWNER_PROFILE') {
                setCurrentScreen(userRole === 'OWNER' ? 'OWNER_PROFILE' : 'PROFILE');
              } else {
                setCurrentScreen(previousScreen || (userRole === 'OWNER' ? 'OWNER_HOME' : 'DETAILS'));
              }
            }}
            onReviewAdded={(updatedBoarding) => {
              setSelectedBoarding(updatedBoarding);
              setSavedBoardings((prev) =>
                prev.map((b) => (b.id === updatedBoarding.id ? { ...b, rating: updatedBoarding.rating } : b))
              );
            }}
          />
        ) : currentScreen === 'NOTIFICATIONS' ? (
          <NotificationsScreen
            onBack={() => setCurrentScreen(previousScreen || 'HOME')}
            onSelectNotification={(notif) => {
              if (notif.type === 'BOOKING') setCurrentScreen('BOOKINGS');
            }}
          />
        ) : (
          <HomeScreen
            currentUser={currentUser}
            savedBoardings={savedBoardings}
            onToggleSaveBoarding={handleToggleSaveBoarding}
            onUserUpdated={handleUserUpdated}
            onSelectBoarding={(b) => handleSelectBoarding(b, 'HOME')}
            onNavigateTab={handleNavigateTab}
            onOpenNotifications={handleOpenNotifications}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
