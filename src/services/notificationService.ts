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
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'cdd5f700-e77b-40d3-bd9b-e7e48f6b3725',
    })).data;
    
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
    // 🚨 1. ID badal kar 'v10' kiya (Purani settings reset karne ke liye)
    await Notifications.setNotificationChannelAsync('orders_siren_v10', {
      name: 'Urgent Order Siren', // Settings mein ab ye naam dikhega
      importance: Notifications.AndroidImportance.MAX, 
      sound: 'siren.mp3', // 👈 Pakka karein file assets folder mein hai
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, 
      // 🚨 Audio Attributes zaroori hain background sound ke liye
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    });

    Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
};