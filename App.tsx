import 'react-native-gesture-handler'; // सबसे ऊपर होना चाहिए
import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { queryClient } from './src/lib/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // 👈 Isse khule app mein bhi banner dikhega
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
    // GestureHandlerRootView स्वाइप और जेस्चर के लिए ज़रूरी है
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