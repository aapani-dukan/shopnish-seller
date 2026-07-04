import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../hooks/useAuth'; // अपने useAuth का सही पाथ चेक करें

export default function NotASellerScreen({ navigation }: any) {
  const { logout } = useAuth(); 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 50 }}>🛒</Text>
        </View>
        
        <Text style={styles.title}>You are not a seller yet</Text>
        <Text style={styles.sub}>Apply to start your business on Shopnish today.</Text>
        
        <TouchableOpacity 
          style={styles.applyBtn} 
          onPress={() => navigation.navigate("SellerApply")}
        >
          <Text style={styles.btnText}>Go to Seller Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  iconBox: { 
    marginBottom: 20, 
    backgroundColor: '#e2e8f0', 
    padding: 20, 
    borderRadius: 50 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#001B3A', 
    marginBottom: 10 
  },
  sub: { 
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 40,
    paddingHorizontal: 20
  },
  applyBtn: { 
    backgroundColor: '#001B3A', 
    paddingVertical: 16, 
    paddingHorizontal: 30, 
    borderRadius: 14, 
    width: '100%', 
    alignItems: 'center',
    marginBottom: 15
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16 
  },
  logoutBtn: { 
    padding: 15 
  },
  logoutText: { 
    color: '#ef4444', 
    fontWeight: '600' 
  }
});