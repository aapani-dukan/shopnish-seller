import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// आपकी Render वाली URL
const SOCKET_URL = "https://shopnish-seprate.onrender.com";

export const useSocket = (orderId?: number) => {
  const socketRef = useRef<Socket | null>(null);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Socket Initialize करें
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });

    // 2. Connection Events
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to Shopnish Live Tracking');
      setIsConnected(true);
      
      // अगर orderId मौजूद है, तो उस रूम में जुड़ें
      if (orderId) {
        socketRef.current?.emit('join-order-room', { orderId });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from tracking server');
      setIsConnected(false);
    });

    // 3. Rider Movement Listeners
    // 'location_update' इवेंट का नाम आपके बैकएंड के हिसाब से होना चाहिए
    socketRef.current.on('order:delivery_location', (data) => {
      if (data.lat && data.lng) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
      }
    });

    // 4. Cleanup on Unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId]);

  return { riderLocation, isConnected };
};