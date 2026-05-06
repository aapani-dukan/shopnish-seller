import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Sound from 'react-native-sound';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import auth from '@react-native-firebase/auth';

const SOCKET_URL = "https://api.shopnish.com";

// Sound Setup
Sound.setCategory('Playback');
const siren = new Sound('siren.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('🔔 [SOUND ERROR]: Siren load nahi ho saki. Check res/raw folder.', error);
  } else {
    console.log('✅ [SOUND READY]: Siren file successfully load ho chuki hai.');
  }
});

export const useSocket = (orderId?: number) => {
  const socketRef = useRef<Socket | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
const stopSiren = () => {
  try {
    if (siren && siren.isLoaded()) {
      // Android crash se bachne ke liye direct stop ke bajaye pause use karna zyada safe hai
      siren.pause(); 
      siren.setCurrentTime(0);
      console.log('✅ Siren Shanti: Stopped and Reset');
    }
  } catch (err) {
    console.log('❌ Stop Error bypassed:', err);
  }
};

 useEffect(() => {
    const initSocket = async () => {
      try {
        const token = await auth().currentUser?.getIdToken(true);
        if (!token) return;

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        socketRef.current = io(SOCKET_URL, {
          transports: ['polling', 'websocket'], // Polling focus deliver karega
          secure: true,
          reconnection: true,
          auth: { token: `Bearer ${token}` },
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('✅ [SOCKET CONNECTED]: ID ->', socket.id);
          setIsConnected(true);

          if (user?.id) {
            const uRoom = `user_room_${user.id}`;
            socket.emit('join-room', uRoom);
            console.log(`🏠 Joined Room: ${uRoom}`);

            // 🚨 NEW UNIQUE LISTENER (Direct Hit Logic)
            // Hum user id ke base par unique event name listen kar rahe hain
            const userSpecificEvent = `new-order-user-${user.id}`;
            
            // Purane listeners ko saaf karein taaki multiple siren na baje
            socket.off(userSpecificEvent);
            socket.off('new-order');

           // 2. Alert handling logic
const handleOrderAlert = (data: any) => {
  console.log('🔥 [EVENT RECEIVED]:', data);

  // CRITICAL FIX: Direct stop/play se crash hota hai. 
  // Isliye pehle pause karo, fir check karo, fir play karo.
  if (siren && siren.isLoaded()) {
    try {
      siren.pause();
      siren.setCurrentTime(0);
      
      // Chhota sa delay (50ms) taaki Android OS handle kar sake
      setTimeout(() => {
        siren.setNumberOfLoops(-1);
        siren.setVolume(1.0);
        siren.play((success) => {
          if (!success) siren.reset();
        });
      }, 50);
    } catch (e) {
      console.log("Siren Play Error:", e);
    }
  }

  Alert.alert(
    "Naya Order Mila! 🔥",
    `Order #${data.orderNumber || 'New'} mila hai.`,
    [
      { 
        text: "View Order", 
        onPress: () => {
          stopSiren(); // Button dabate hi band
        } 
      }
    ],
    { cancelable: false }
  );
};
            // Dono tariko se listen karein (Room + Direct Hit)
            socket.on(userSpecificEvent, handleOrderAlert);
            socket.on('new-order', handleOrderAlert); 
          }
        });

        socket.on('order:delivery_location', (data) => {
          if (data.lat && data.lng) setRiderLocation({ lat: data.lat, lng: data.lng });
        });

        socket.on('connect_error', (err) => {
          console.log('❌ [CONNECTION ERROR]:', err.message);
          setIsConnected(false);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          stopSiren();
        });

      } catch (err) {
        console.log('❌ [INIT ERROR]:', err);
      }
    };

    if (user?.id) {
      initSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-order'); // Listener remove karein
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]); // orderId ko dependency se hata diya hai stable connection ke liye

  return { riderLocation, isConnected, stopSiren };
};