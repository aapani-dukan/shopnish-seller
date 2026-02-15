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
      projectId: 'your-expo-project-id', // Expo dashboard se milega
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
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};