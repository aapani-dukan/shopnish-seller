import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, Dimensions 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/useAuth'; // आपका Custom Auth Hook

const { width } = Dimensions.get('window');

export default function SellerStatusScreen({ navigation }: any) {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  // Logic to determine UI content based on status
  let config = {
    title: "Checking Status...",
    desc: "Please wait while we fetch your profile.",
    icon: "clock",
    color: "#64748b",
    btnText: "",
    action: () => {}
  };

  const status = user?.sellerProfile?.approvalStatus;
  const role = user?.role;

  if (!isAuthenticated) {
    config = {
      title: "Login Required",
      desc: "Please log in to check your seller application status.",
      icon: "lock",
      color: "#3b82f6",
      btnText: "Go to Login",
      action: () => navigation.navigate('Login')
    };
  } else if (role === "seller" && status === "approved") {
    config = {
      title: "Account Approved!",
      desc: "Congratulations! Your seller account is active. Start managing your store now.",
      icon: "check-circle",
      color: "#10b981",
      btnText: "Go to Dashboard",
      action: () => navigation.replace('SellerTabStack') // Main Dashboard पर भेजें
    };
  } else if (role === "seller" && status === "pending") {
    config = {
      title: "Under Review",
      desc: "Our team is reviewing your shop details. This usually takes 24-48 hours.",
      icon: "clock",
      color: "#f59e0b",
      btnText: "Contact Support",
      action: () => {} // WhatsApp या Call Support
    };
  } else if (role === "seller" && status === "rejected") {
    config = {
      title: "Application Rejected",
      desc: `Reason: ${user?.sellerProfile?.rejectionReason || 'Criteria not met.'}`,
      icon: "x-circle",
      color: "#ef4444",
      btnText: "Re-apply Now",
      action: () => navigation.navigate('SellerApply')
    };
  } else {
    config = {
      title: "Become a Seller",
      desc: "Start your business journey with us today and reach thousands of customers.",
      icon: "shopping-bag",
      color: "#8b5cf6",
      btnText: "Apply to be a Seller",
      action: () => navigation.navigate('SellerApply')
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '15' }]}>
          <Feather name={config.icon} size={60} color={config.color} />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.desc}>{config.desc}</Text>

        {config.btnText !== "" && (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: config.color }]} 
            onPress={config.action}
          >
            <Text style={styles.btnText}>{config.btnText}</Text>
            <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        )}

        {status === 'pending' && (
          <TouchableOpacity style={styles.logoutBtn} onPress={() => {/* Logout Logic */}}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 15 },
  desc: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  btn: { 
    width: '100%', height: 55, borderRadius: 15, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { marginTop: 20, padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: '600' }
});