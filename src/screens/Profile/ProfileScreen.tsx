import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Alert, Switch, Linking 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [isVacationMode, setIsVacationMode] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Kya aap login se bahar nikalna chahte hain?", [
      { text: "Nahi", style: "cancel" },
      { text: "Haan", style: "destructive", onPress: () => logout() }
    ]);
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, color = "#1e293b", showArrow = true }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Feather name="chevron-right" size={18} color="#cbd5e1" />}
    </TouchableOpacity>
  );
const handleHelpCenter = () => {
  // अपना असली WhatsApp नंबर यहाँ डालें (बिना + के, जैसे 918619358117)
  const phoneNumber = "919928305966"; 
  const message = "Hello Shopnish Support, I am a seller and I need help with my account.";
  
  // WhatsApp का यूनिवर्सल लिंक
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(whatsappUrl)
    .then((supported) => {
      if (supported) {
        // अगर WhatsApp ऐप इंस्टॉल है तो ऐप खुलेगी
        return Linking.openURL(whatsappUrl);
      } else {
        // अगर ऐप नहीं है तो ब्राउज़र में WhatsApp वेब खुलेगा (404 कभी नहीं आएगा)
        return Linking.openURL(`https://wa.me/${phoneNumber}`);
      }
    })
    .catch((err) => Alert.alert("Error", "Support link open nahi ho raha hai."));
};
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Upper Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: user?.sellerProfile?.logo || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Feather name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.sellerProfile?.businessName || 'Store Name'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        <View style={styles.badgeRow}>
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={20} color="#10b981" />
            <Text style={styles.verifiedText}>Verified Seller</Text>
          </View>
        </View>
      </View>

      {/* Shop Quick Toggle */}
      <View style={styles.section}>
        <View style={styles.vacationCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vacationTitle}>Vacation Mode</Text>
            <Text style={styles.vacationDesc}>Isko on karne par aapka store temporary close ho jayega.</Text>
          </View>
          <Switch 
            value={isVacationMode} 
            onValueChange={setIsVacationMode}
            trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
            thumbColor={isVacationMode ? "#1e40af" : "#f4f3f4"}
          />
        </View>
      </View>

    {/* Business Settings */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Business Management</Text>
  <View style={styles.card}>
    <ProfileItem 
      icon="home" 
      title="Shop Details" 
      subtitle="Address, Timings, Category"
      // ✅ नेविगेशन जोड़ें (पक्का करें कि ये नाम आपके Navigator में हों)
      onPress={() => navigation.navigate('ShopDetails')} 
      color="#3b82f6"
    />
    <View style={styles.divider} />
    <ProfileItem 
      icon="credit-card" 
      title="Bank Account" 
      subtitle="Payouts & Settlement details"
      // ✅ अब यह आपकी BankDetails screen खोलेगा
      onPress={() => navigation.navigate('BankDetails')} 
      color="#10b981"
    />
    <View style={styles.divider} />
    <ProfileItem 
      icon="file-text" 
      title="Tax & GST Info" 
      subtitle="Manage business compliance"
      onPress={() => navigation.navigate('TaxInfo')} 
      color="#f59e0b"
    />
  </View>
</View>

{/* Support & Others */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Support & Legal</Text>
  <View style={styles.card}>
    <ProfileItem 
      icon="help-circle" 
      title="Help Center" 
      // ✅ हेल्प सेंटर के लिए WhatsApp या अपनी वेबसाइट का सही लिंक
      onPress={() => Linking.openURL('https://shopnish.com/support').catch(() => Alert.alert("Error", "Link nahi khul raha"))} 
    />
    <View style={styles.divider} />
   <ProfileItem 
  icon="help-circle" 
  title="Help Center" 
  // ❌ पुराना वाला: onPress={() => Linking.openURL('...')} 
  // ✅ नया वाला:
  onPress={handleHelpCenter} 
/>
    <View style={styles.divider} />
    <ProfileItem 
      icon="log-out" 
      title="Logout" 
      onPress={handleLogout} 
      color="#ef4444"
      showArrow={false}
    />
  </View>
</View>
      <Text style={styles.versionText}>Shopnish Seller v1.0.24 (Beta)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1e40af', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  userEmail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  badgeRow: { marginTop: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  verifiedText: { fontSize: 12, color: '#1e40af', fontWeight: 'bold', marginLeft: 5 },
  
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
  card: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 5, elevation: 1 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  itemSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 15 },
  
  vacationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 1 },
  vacationTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  vacationDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  versionText: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginVertical: 30 }
});