import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar
} from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from "../../context/AuthContext";
import { registerForPushNotificationsAsync } from "../../services/notificationService";
export default function LoginScreen() {
  // नोट: सुनिश्चित करें कि आपके AuthContext में sendOtp और verifyOtp Seller के लिए कॉन्फ़िगर हैं
  const { sendOtp, verifyOtp } = useAuth() as any; 

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert("Invalid Number", "Kripya 10 अंकों का मोबाइल नंबर डालें।");
      return;
    }
    setIsLoading(true);
    try {
      await sendOtp(`+91${phoneNumber}`);
      setIsOtpSent(true);
      setTimer(30);
      setCanResend(false);
   } catch (err: any) {
    // असली एरर देखने के लिए इसे ऐसे बदलें
    console.log("Firebase Error:", err.code, err.message);
    Alert.alert("Error", `OTP भेजने में समस्या हुई। [${err.code}]`);
  } finally {
    setIsLoading(false);
  }
}; 

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setIsLoading(true);
    try {
      await verifyOtp(otpCode);
      // सफलता के बाद AuthContext अपने आप redirect कर देगा
    } catch (err: any) {
      Alert.alert("Verification Failed", "गलत OTP, कृपया दोबारा जांचें।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#001B3A" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Feather name="shopping-bag" size={40} color="#D4AF37" />
          </View>
          <Text style={styles.brandName}>SHOPNISH</Text>
          <Text style={styles.sellerPortal}>SELLER PORTAL</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {!isOtpSent ? "Welcome Back" : "Verify Identity"}
          </Text>
          <Text style={styles.cardSubtitle}>
            {!isOtpSent 
              ? "Apne business account mein login karein" 
              : `Humne +91 ${phoneNumber} par OTP bheja hai`}
          </Text>

          {!isOtpSent ? (
            <View>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#94a3b8" style={styles.inputIcon} />
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="00000 00000"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <TouchableOpacity 
                style={[styles.mainButton, isLoading && { opacity: 0.7 }]} 
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Verification Code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
              <View style={styles.inputContainer}>
                <Feather name="shield" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { letterSpacing: 8, fontWeight: 'bold' }]}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text);
                    if (text.length === 6) handleVerifyOtp();
                  }}
                  autoFocus
                />
              </View>

              <TouchableOpacity 
                style={styles.mainButton} 
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                {canResend ? (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>Resend in {timer}s</Text>
                )}
                <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                  <Text style={styles.changeNumber}>Change Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>Shopnish Business © 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001B3A" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#D4AF37' },
  brandName: { fontSize: 32, fontWeight: "900", color: "#D4AF37", letterSpacing: 2 },
  sellerPortal: { fontSize: 12, color: "#fff", letterSpacing: 4, fontWeight: '600', opacity: 0.8 },
  
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 25, lineHeight: 20 },
  
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  prefix: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginRight: 5 },
  input: { flex: 1, height: 55, fontSize: 16, color: '#1e293b' },
  
  mainButton: {
    backgroundColor: "#001B3A",
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: "#D4AF37", fontWeight: 'bold', fontSize: 16 },
  
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  resendLink: { color: '#001B3A', fontWeight: 'bold', fontSize: 14 },
  timerText: { color: '#94a3b8', fontSize: 14 },
  changeNumber: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' },
  footerText: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 30, fontSize: 12 }
});