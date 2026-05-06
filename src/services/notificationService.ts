import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

export const registerForPushNotificationsAsync = async (userId: number) => {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    // Expo token ya FCM token nikalna
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'cdd5f700-e77b-40d3-bd9b-e7e48f6b3725', // Expo dashboard se milega
    })).data;
    
    console.log("🔥 FCM Token:", token);

    // ✅ Token ko backend mein save karein taaki hum baad mein bhej sakein
    try {
      await api.patch(`/api/sellers/update-fcm-token`, { 
        userId, 
        fcmToken: token 
      });
    } catch (err) {
      console.error("Token Save Error:", err);
    }
  }

  if (Platform.OS === 'android') {
    // 🚨 1. Naya Order Channel (Siren ke liye)
    Notifications.setNotificationChannelAsync('orders_channel', {
      name: 'New Order Alerts',
      importance: Notifications.AndroidImportance.MAX, // Sabse high priority
      sound: 'siren.mp3', // 👈 Yeh file res/raw/siren.mp3 mein honi chahiye
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      showBadge: true,
    });

    // 2. Default Channel (Normal notifications ke liye)
    Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};