import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Sound from 'react-native-sound';
import { Alert } from 'react-native';

const SOCKET_URL = "https://api.shopnish.com";

// Sound Setup
Sound.setCategory('Playback');
const siren = new Sound('siren.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('🔔 [Sound Error]: Siren file load nahi ho saki. Check res/raw folder.', error);
});

export const useSocket = (orderId?: number) => {
  const socketRef = useRef<Socket | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🔊 Siren Rokne ka Function
  const stopSiren = () => {
    if (siren) {
      siren.stop(() => {
        console.log('✅ Siren stopped by user');
      });
    }
  };

  useEffect(() => {
    // 1. Socket Initialize
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    // 2. Connection Events
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Shopnish Live Server');
      setIsConnected(true);
      if (orderId) {
        socketRef.current?.emit('join-order-room', { orderId });
      }
    });

    // 🔥 NEW ORDER ALERT (Tring Tring Logic)
    socketRef.current.on('new-order', (data) => {
      console.log('🔥 Naya Order Aaya Hai:', data);

      // 1. Siren Bajao (Infinite Loop)
      siren.setNumberOfLoops(-1); 
      siren.play((success) => {
        if (!success) console.log('🔔 [Playback Error]: Sound bajne mein galti hui.');
      });

      // 2. Screen par Popup dikhao
      Alert.alert(
        "Naya Order Mila! 🔥",
        `Order #${data.orderNumber || 'New'} mil gaya hai.`,
        [
          {
            text: "View Order",
            onPress: () => stopSiren(), // View karte hi siren band
          }
        ],
        { cancelable: false }
      );
    });

    // 3. Rider Movement Listeners
    socketRef.current.on('order:delivery_location', (data) => {
      if (data.lat && data.lng) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
      stopSiren(); // Disconnect hone par shor band
    });

    // 4. Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      stopSiren();
    };
  }, [orderId]);

  return { riderLocation, isConnected, stopSiren };
};