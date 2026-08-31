import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('REGISTER'); // 'REGISTER' | 'LOGIN' | 'HOME' | 'DETAILS'
  const [selectedBoarding, setSelectedBoarding] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F6" />

      {/* Render Active Screen */}
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
      ) : currentScreen === 'DETAILS' && selectedBoarding ? (
        <DetailsScreen
          boarding={selectedBoarding}
          onBack={() => setCurrentScreen('HOME')}
        />
      ) : (
        <HomeScreen
          onSelectBoarding={(boarding) => {
            setSelectedBoarding(boarding);
            setCurrentScreen('DETAILS');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
});
