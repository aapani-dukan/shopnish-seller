import 'react-native-gesture-handler'; // सबसे ऊपर होना चाहिए
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { queryClient } from './src/lib/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';

// 1️⃣ FOREGROUND NOTIFICATION BEHAVIOUR (Khule app ke liye)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

LogBox.ignoreLogs([
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
  'Method called was `getIdToken`'
]);

// एक छोटा सा Inner Component ताकि हम useAuth का इस्तेमाल कर सकें
function RootApp() {
  const { isLoadingAuth } = useAuth();

  // 2️⃣ 🚨 NATIVE ANDROID BACKGROUND CHANNEL REGISTRATION
  useEffect(() => {
    async function configureNotificationChannel() {
      if (Platform.OS === 'android') {
        // Strict channel configuration jo background/killed state mein siren bajayega
        await Notifications.setNotificationChannelAsync('orders_siren_v10', {
          name: 'Urgent Order Siren',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'siren.mp3', // 🎯 Native resource se custom sound link karne ke liye
         enableVibrate: true,
          lightColor: '#FF0000',
        });
        console.log("🚀 [NATIVE]: Background Siren Channel (orders_siren_v10) Locked & Registered!");
      }
    }
    
    configureNotificationChannel();
  }, []);

  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <RootApp />
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});