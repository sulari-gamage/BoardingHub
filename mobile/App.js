import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';

export default function App() {
  const [selectedBoarding, setSelectedBoarding] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {selectedBoarding ? (
        <DetailsScreen
          boarding={selectedBoarding}
          onBack={() => setSelectedBoarding(null)}
        />
      ) : (
        <HomeScreen
          onSelectBoarding={(boarding) => setSelectedBoarding(boarding)}
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
