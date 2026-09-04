import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';

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
import AdminPropertyReviewScreen from './src/screens/admin/AdminPropertyReviewScreen';
import AdminUserManagementScreen from './src/screens/admin/AdminUserManagementScreen';
import AdminUserDetailScreen from './src/screens/admin/AdminUserDetailScreen';
import AdminBookingMonitoringScreen from './src/screens/admin/AdminBookingMonitoringScreen';
import AdminAnalyticsScreen from './src/screens/admin/AdminAnalyticsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('LOGIN');
  const [userRole, setUserRole] = useState('SEEKER'); // 'SEEKER' | 'OWNER' | 'ADMIN'
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedOwnerProperty, setSelectedOwnerProperty] = useState(null);
  const [selectedOwnerRequest, setSelectedOwnerRequest] = useState(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('HOME');
  const [userBookings, setUserBookings] = useState([]);

  // Navigation Handlers
  const handleSelectBoarding = (boarding, origin = 'HOME') => {
    setSelectedBoarding(boarding);
    setPreviousScreen(origin);
    setCurrentScreen('DETAILS');
  };

  const handleSelectOwnerProperty = (prop) => {
    setSelectedOwnerProperty(prop);
    setCurrentScreen('OWNER_PROPERTY_DETAIL');
  };

  const handleAddBooking = (newBooking) => {
    setUserBookings((prev) => [newBooking, ...prev]);
    setSelectedBooking(newBooking);
    setCurrentScreen('BOOKING_CONFIRMATION');
  };

  const handleViewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setPreviousScreen(currentScreen);
    setCurrentScreen('BOOKING_DETAILS');
  };

  const handleOpenGallery = (boarding) => {
    if (boarding) setSelectedBoarding(boarding);
    setPreviousScreen(currentScreen);
    setCurrentScreen('IMAGE_GALLERY');
  };

  const handleOpenMap = (boarding) => {
    if (boarding) setSelectedBoarding(boarding);
    setPreviousScreen(currentScreen);
    setCurrentScreen('MAP_VIEW');
  };

  const handleOpenReviews = (boarding) => {
    if (boarding) setSelectedBoarding(boarding);
    setPreviousScreen(currentScreen);
    setCurrentScreen('REVIEWS');
  };

  const handleOpenNotifications = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('NOTIFICATIONS');
  };

  const handleNavigateTab = (tab) => {
    if (userRole === 'ADMIN') {
      if (tab === 'Dashboard' || tab === 'ADMIN_DASHBOARD') setCurrentScreen('ADMIN_DASHBOARD');
      else if (tab === 'Listings' || tab === 'ADMIN_PROPERTY_REVIEW') setCurrentScreen('ADMIN_PROPERTY_REVIEW');
      else if (tab === 'Users' || tab === 'ADMIN_USER_MANAGEMENT') setCurrentScreen('ADMIN_USER_MANAGEMENT');
      else if (tab === 'Bookings' || tab === 'ADMIN_BOOKING_MONITORING') setCurrentScreen('ADMIN_BOOKING_MONITORING');
      else if (tab === 'Analytics' || tab === 'ADMIN_ANALYTICS') setCurrentScreen('ADMIN_ANALYTICS');
      return;
    }

    if (userRole === 'OWNER') {
      if (tab === 'Dashboard' || tab === 'OWNER_HOME' || tab === 'HOME') setCurrentScreen('OWNER_HOME');
      else if (tab === 'Properties' || tab === 'OWNER_PROPERTIES') setCurrentScreen('OWNER_PROPERTIES');
      else if (tab === 'Requests' || tab === 'OWNER_REQUESTS') setCurrentScreen('OWNER_REQUESTS');
      else if (tab === 'Profile' || tab === 'PROFILE' || tab === 'OwnerProfile' || tab === 'OWNER_PROFILE') setCurrentScreen('OWNER_PROFILE');
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

  const handleLogout = () => {
    setUserRole('SEEKER');
    setCurrentScreen('LOGIN');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Central Screen Router */}
      {currentScreen === 'REGISTER' ? (
        <RegisterScreen
          onNavigateToLogin={() => setCurrentScreen('LOGIN')}
          onRegisterSuccess={(role) => {
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
          onLoginSuccess={(role) => {
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
          onNavigateTab={handleNavigateTab}
          onOpenNotifications={handleOpenNotifications}
          onViewAllRequests={() => setCurrentScreen('OWNER_REQUESTS')}
          onReviewRequest={() => setCurrentScreen('OWNER_REQUESTS')}
          onViewPropertyDetails={() => setCurrentScreen('OWNER_PROPERTIES')}
        />
      ) : currentScreen === 'OWNER_PROPERTIES' ? (
        <OwnerPropertiesScreen
          activeTab="Properties"
          onNavigateTab={handleNavigateTab}
          onAddNewProperty={() => setCurrentScreen('ADD_PROPERTY')}
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
        />
      ) : currentScreen === 'ROOM_MANAGEMENT' ? (
        <RoomManagementScreen
          propertyName={selectedOwnerProperty?.title || 'Green Valley Boarding'}
          onBack={() => setCurrentScreen('OWNER_PROPERTY_DETAIL')}
          onAddRoom={() => setCurrentScreen('ADD_ROOM')}
        />
      ) : currentScreen === 'ADD_ROOM' ? (
        <AddRoomScreen
          onBack={() => setCurrentScreen('ROOM_MANAGEMENT')}
          onSaveRoom={() => setCurrentScreen('ROOM_MANAGEMENT')}
        />
      ) : currentScreen === 'OWNER_REQUESTS' ? (
        <OwnerRequestsScreen
          activeTab="Requests"
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
          onAccept={() => setCurrentScreen('OWNER_REQUESTS')}
          onReject={() => setCurrentScreen('OWNER_REQUESTS')}
        />
      ) : currentScreen === 'OWNER_PROFILE' ? (
        <OwnerProfileScreen
          activeTab="Profile"
          onNavigateTab={handleNavigateTab}
          onSwitchToSeeker={handleSwitchToSeeker}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'ADD_PROPERTY' ? (
        <AddPropertyScreen
          onBack={() => setCurrentScreen('OWNER_PROPERTIES')}
          onSaveProperty={() => setCurrentScreen('OWNER_PROPERTIES')}
        />
      ) : currentScreen === 'ADMIN_DASHBOARD' ? (
        <AdminDashboardScreen
          activeTab="Dashboard"
          onNavigateTab={handleNavigateTab}
          onOpenPendingReview={() => setCurrentScreen('ADMIN_PROPERTY_REVIEW')}
        />
      ) : currentScreen === 'ADMIN_PROPERTY_REVIEW' ? (
        <AdminPropertyReviewScreen
          onBack={() => setCurrentScreen('ADMIN_DASHBOARD')}
          onApprove={() => setCurrentScreen('ADMIN_DASHBOARD')}
          onReject={() => setCurrentScreen('ADMIN_DASHBOARD')}
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
          activeTab="Bookings"
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'ADMIN_ANALYTICS' ? (
        <AdminAnalyticsScreen
          activeTab="Analytics"
          onNavigateTab={handleNavigateTab}
          onOpenNotifications={handleOpenNotifications}
        />
      ) : currentScreen === 'SEARCH' ? (
        <SearchScreen
          onSelectBoarding={(b) => handleSelectBoarding(b, 'SEARCH')}
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'FAVORITES' ? (
        <FavoritesScreen
          onSelectBoarding={(b) => handleSelectBoarding(b, 'FAVORITES')}
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'BOOKINGS' ? (
        <BookingsScreen
          bookings={userBookings}
          onSelectBoarding={(b) => handleSelectBoarding(b, 'BOOKINGS')}
          onViewBookingDetails={handleViewBookingDetails}
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'PROFILE' ? (
        <ProfileScreen
          onLogout={handleLogout}
          onNavigateTab={handleNavigateTab}
          onOpenNotifications={handleOpenNotifications}
          onOpenReviews={() => handleOpenReviews(selectedBoarding)}
        />
      ) : currentScreen === 'DETAILS' && selectedBoarding ? (
        <DetailsScreen
          boarding={selectedBoarding}
          onBack={() => setCurrentScreen(previousScreen || 'HOME')}
          onBookSuccess={handleAddBooking}
          onOpenGallery={() => handleOpenGallery(selectedBoarding)}
          onOpenReviews={() => handleOpenReviews(selectedBoarding)}
          onOpenMap={() => handleOpenMap(selectedBoarding)}
        />
      ) : currentScreen === 'IMAGE_GALLERY' ? (
        <ImageGalleryScreen
          boarding={selectedBoarding || {}}
          onBack={() => setCurrentScreen(previousScreen || 'DETAILS')}
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
          onBack={() => setCurrentScreen(previousScreen || 'DETAILS')}
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
          onSelectBoarding={(b) => handleSelectBoarding(b, 'HOME')}
          onNavigateTab={handleNavigateTab}
          onOpenNotifications={handleOpenNotifications}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
