import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import BookingsScreen from './src/screens/BookingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('REGISTER'); // 'REGISTER' | 'LOGIN' | 'HOME' | 'SEARCH' | 'BOOKINGS' | 'DETAILS'
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('HOME');
  const [userBookings, setUserBookings] = useState([]);

  const handleSelectBoarding = (boarding, origin = 'HOME') => {
    setSelectedBoarding(boarding);
    setPreviousScreen(origin);
    setCurrentScreen('DETAILS');
  };

  const handleAddBooking = (newBooking) => {
    setUserBookings((prev) => [newBooking, ...prev]);
    setCurrentScreen('BOOKINGS');
  };

  const handleNavigateTab = (tab) => {
    if (tab === 'HOME') setCurrentScreen('HOME');
    else if (tab === 'SEARCH') setCurrentScreen('SEARCH');
    else if (tab === 'BOOKINGS') setCurrentScreen('BOOKINGS');
    else if (tab === 'PROFILE') {
      Alert.alert("User Profile", "Profile settings and account management coming soon!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Router */}
      {currentScreen === 'REGISTER' ? (
        <RegisterScreen
          onNavigateToLogin={() => setCurrentScreen('LOGIN')}
          onRegisterSuccess={() => setCurrentScreen('HOME')}
        />
      ) : currentScreen === 'LOGIN' ? (
        <LoginScreen
          onLoginSuccess={() => setCurrentScreen('HOME')}
          onNavigateToRegister={() => setCurrentScreen('REGISTER')}
        />
      ) : currentScreen === 'SEARCH' ? (
        <SearchScreen
          onSelectBoarding={(b) => handleSelectBoarding(b, 'SEARCH')}
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'BOOKINGS' ? (
        <BookingsScreen
          bookings={userBookings}
          onSelectBoarding={(b) => handleSelectBoarding(b, 'BOOKINGS')}
          onNavigateTab={handleNavigateTab}
        />
      ) : currentScreen === 'DETAILS' && selectedBoarding ? (
        <DetailsScreen
          boarding={selectedBoarding}
          onBack={() => setCurrentScreen(previousScreen || 'HOME')}
          onBookSuccess={handleAddBooking}
        />
      ) : (
        <HomeScreen
          onSelectBoarding={(b) => handleSelectBoarding(b, 'HOME')}
          onNavigateTab={handleNavigateTab}
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
