import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, StatusBar, SafeAreaView
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import SellerOnboarding from './SellerOnboarding';

export default function SellerApplyScreen() {
  // नोट: navigation prop हटा दी है क्योंकि AppNavigator खुद स्टेट हैंडल कर रहा है।
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* 1. Custom Minimal Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopnish Business</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 2. Hero Section (Premium Look) */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Feather name="trending-up" size={35} color="#D4AF37" />
          </View>
          <Text style={styles.heroTitle}>Grow Your Business Online</Text>
          <Text style={styles.heroSub}>
            Join India's most unique multi-seller platform. 
            Bas kuch basic details bharein aur setup shuru karein.
          </Text>
        </View>

        {/* 3. The Actual Form Component */}
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Fill Application Form</Text>
          {/* Props हटा दी गई हैं क्योंकि SellerOnboarding खुद refreshUserStatus() कॉल करेगा */}
          <SellerOnboarding />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#001B3A', letterSpacing: 1 },
  heroSection: { 
    alignItems: 'center', 
    padding: 35, 
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  iconCircle: { 
    width: 70, height: 70, borderRadius: 35, 
    backgroundColor: '#001B3A', justifyContent: 'center', 
    alignItems: 'center', marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#001B3A', textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 22, paddingHorizontal: 10 },
  formContainer: { padding: 20, marginTop: 10 },
  formLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: 20,
    marginLeft: 5
  }
});