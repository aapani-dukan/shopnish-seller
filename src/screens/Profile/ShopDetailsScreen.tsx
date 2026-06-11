import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { 
  Store, 
  MapPin, 
  Clock, 
  Tag, 
  ChevronLeft, 
  Save, 
  Phone,
  Info, 
  Utensils,
  ShoppingBag
} from 'lucide-react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
        <Icon color="#64748b" size={20} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#cbd5e1"
          multiline={multiline}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );

const ShopDetailsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // --- States ---
  const [pincodeInput, setPincodeInput] = useState('');
  const [deliveryPincodes, setDeliveryPincodes] = useState<string[]>([]);
  const [isAutoAccept, setIsAutoAccept] = useState(false);
// --- States Section mein ye add karein ---
const [isDistanceBased, setIsDistanceBased] = useState(false); // Ye error solve karega
const [radius, setRadius] = useState(''); // Radius store karne ke liye
// --- States Section mein ye dono add karein bhai sahab ---
const [businessPhone, setBusinessPhone] = useState('');
// --- States Section mein purani list hata kar ye add karein bhai sahab ---
const [isModalVisible, setIsModalVisible] = useState(false);
const [categoriesList, setCategoriesList] = useState<any[]>([]); // 🚀 100% लाइव लिस्ट के लिए खाली एर्रे
const [catLoading, setCatLoading] = useState(false); // कैटेगरी लोड होने का स्पिनर
const [categoryId, setCategoryId] = useState<number | null>(null);
  const [shopInfo, setShopInfo] = useState({
    id:null,
    businessName: '',
    description: '',
    businessAddress: '',
    pincode: '',
    openTime: '09:00 AM',
    closeTime: '10:00 PM',
  });
const fetchLiveCategories = async () => {
  setCatLoading(true);
  try {
    // आपके बैकएंड का कैटेगरी लिस्ट निकालने का एंडपॉइंट (पक्का कर लें कि यही राउट हो भाई)
    const res = await api.get('/api/categories'); 
    
    // अगर बैकएंड रिपॉन्स में { success: true, categories: [...] } भेजता है:
    if (res.data && res.data.categories) {
      setCategoriesList(res.data.categories);
    } else if (Array.isArray(res.data)) {
      // अगर बैकएंड सीधे एर्रे भेजता है:
      setCategoriesList(res.data);
    }
    console.log(`🎉 [Live Async Sync]: Successfully loaded ${res.data.categories?.length || 0} categories from backend!`);
  } catch (err) {
    console.error("⚠️ Categories fetch failed from backend:", err);
    // अगर सर्वर डाउन हो तो सेफ्टी के लिए पुराना फॉलबैक ढांचा रेडी रहेगा ताकि ऐप क्रैश न हो भाई साहब
    setCategoriesList([
      { id: 1, name: "Grocery & FMCG (किराना)" },
      { id: 2, name: "Restaurant & Cafes (होटल/कैफ़े)" },
      { id: 3, name: "Fruits & Vegetables (फल-सब्ज़ी)" }
    ]);
  } finally {
    setCatLoading(false);
  }
};
  // 1. Load Data on Mount
  useEffect(() => {
  // ✅ Logs ke mutabiq data direct 'user' mein hai, 'sellerProfile' mein nahi
  if (user) {
    setShopInfo({
      id: user.id || null, 
      businessName: user.business_name || user.businessName || '',
      description: user.description || '',
      businessAddress: user.business_address || user.businessAddress || '',
      pincode: user.pincode || '',
      openTime: user.open_time || '09:00 AM',
      closeTime: user.close_time || '10:00 PM',
    });
let rawPhone = user.business_phone || user.businessPhone || user.phone || '';

// अगर नंबर में +91 लगा है, तो आगे के ३ अक्षर (+91) काट दो
if (rawPhone.startsWith('+91')) {
  rawPhone = rawPhone.slice(3);
} 
// अगर सिर्फ 91 लगा है (१२ अंक का नंबर है), तो आगे के २ अक्षर (91) काट दो
else if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
  rawPhone = rawPhone.slice(2);
}

setBusinessPhone(rawPhone.trim());
    setCategoryId(user.category_id || user.categoryId || null);
    setIsDistanceBased(user.is_distance_based_delivery || user.isDistanceBasedDelivery || false);
    setRadius(user.delivery_radius ? String(user.delivery_radius) : String(user.deliveryRadius || ''));
    
    // ✅ Pincodes check karein (Snake case vs Camel case dono handle karein)
    const pincodes = user.delivery_pincodes || user.deliveryPincodes;
    if (pincodes) {
      setDeliveryPincodes(pincodes);
    }
    
    setIsAutoAccept(user.is_auto_accept || user.isAutoAccept || false);
    fetchLiveCategories();
    
    // 🚩 Sabse zaroori: Loading yahan false hogi
    setInitialLoading(false);
  }
}, [user]);

  // 2. Pincode Handlers
  const addPincode = () => {
    const code = pincodeInput.trim();
    if (code.length === 6 && !isNaN(Number(code))) {
      if (!deliveryPincodes.includes(code)) {
        setDeliveryPincodes([...deliveryPincodes, code]);
        setPincodeInput('');
      } else {
        Alert.alert("Error", "Ye pincode pehle se juda hua hai.");
      }
    } else {
      Alert.alert("Invalid", "Kripya 6-digit ka sahi pincode dalein.");
    }
  };

  const removePincode = (code: string) => {
    setDeliveryPincodes(deliveryPincodes.filter(item => item !== code));
  };

 // 3. Save Handler (🎯 बिना जबरदस्ती के डायनामिक स्टेटस और कैमलकेस फिक्स भाई साहब)
  const handleSave = async () => {
    console.log("FULL USER =", JSON.stringify(user, null, 2));
    // सबसे पहले टोकन/यूजर स्टेट से असली आईडी निकालकर वैरिएबल बनाया भाई
    const currentSellerId = user?.sellerId || user?.id;

    if (!currentSellerId) {
      Alert.alert("Error ⚠️", "Authentication Error: Id missing on frontend भाई साहब।");
      return;
    }
let cleanedPhone = businessPhone.trim().replace(/\s+/g, ''); // स्पेस हटाओ

if (cleanedPhone.startsWith('+91')) {
  cleanedPhone = cleanedPhone.slice(3);
} else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
  cleanedPhone = cleanedPhone.slice(2);
}

// अब वैलिडेशन चेक बिल्कुल १० अंक पर कड़क काम करेगा!
if (cleanedPhone.length !== 10 || isNaN(Number(cleanedPhone))) {
  Alert.alert("Invalid Phone ⚠️", "Kripya 10-digit ka sahi mobile number dalein.");
  return;
}
    setLoading(true);
    try {
      const isDistance = Boolean(isDistanceBased);
      const radiusNum = Number(radius || 0);

      // 🚀 जादुई चाबी: जो स्टेटस यूजर का अभी ऐप में लाइव है, वही उठाओ भाई साहब!
      const currentIsOpenStatus = user?.is_open || user?.isOpen || false;

      // आपके बैकएंड के 'sellerUpdateSchema' वैलिडेटर की डिमांड के अनुसार सटीक पेलोड
      const payload = {
        businessName: shopInfo.businessName?.trim(),
        description: shopInfo.description?.trim(),
        businessAddress: shopInfo.businessAddress?.trim(),
        pincode: shopInfo.pincode?.trim(),
        openTime: shopInfo.openTime,
        closeTime: shopInfo.closeTime,
        isAutoAccept: isAutoAccept,
        
        // ✅ बिल्कुल परफेक्ट: कोई जबरदस्ती नहीं, करंट स्टेटस ही जाएगा भाई
        isOpen: currentIsOpenStatus, 
businessPhone: cleanedPhone, // असली फोन नंबर
      categoryId: categoryId,
        // 🚀 कैमलकेस फिक्स: बैकएंड वैलिडेटर स्कीमा के हुबहू नाम ताकि डेटाबेस में null न हो!
        isDistanceBasedDelivery: isDistance,
        deliveryRadius: isDistance ? radiusNum : null,
        deliveryPincodes: isDistance ? [] : deliveryPincodes, // Pure string array []
      };

      console.log(`🚀 [PATCH Sync Hit]: Blasting data to: /api/sellers/profile/${currentSellerId}`);

      // =====================================================================
      // 🔥 मास्टरस्ट्रोक: रास्ता और चाबी अब बैकएंड राउट से 100% मैच हैं भाई!
      // =====================================================================
      await api.patch(`/api/sellers/profile/${currentSellerId}`, payload);

      Alert.alert("Success ✅", "Shop details updated successfully!", [
        { text: "Congratulation!", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error("Save Error:", error);
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        
        // Agar description mein error hai
        if (serverErrors.description) {
          Alert.alert("Dhyan Dein ⚠️", `Description: ${serverErrors.description[0]}`);
        } 
        // Agar pincode mein error hai
        else if (serverErrors.pincode) {
          Alert.alert("Dhyan Dein ⚠️", "Pincode sahi format mein nahi hai.");
        }
        else {
          Alert.alert("Validation Error", "Kripya saari details sahi se bharein.");
        }
      } else {
        // General error
        Alert.alert("Error", error.response?.data?.message || "Update fail ho gaya.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Reusable Input Component
  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#001B3A" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Loading Shop Data...</Text>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#001B3A" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. BASIC INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InputField 
              label="BUSINESS NAME" 
              icon={Store} 
              value={shopInfo.businessName}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, businessName: txt})}
              placeholder="e.g. Royal Fresh Mart"
            />
            {/* 🚀 कड़क फिक्स १: दुकान का लाइव फोन नंबर (जो stores टेबल में phone बनकर जाएगा) */}
  <InputField 
    label="SHOP PHONE NUMBER (MANDATORY)" 
    icon={Phone} // पक्का कर लें कि Phone आइकॉन ऊपर lucide-react-native से इम्पोर्ट हो भाई
    value={businessPhone}
    onChangeText={setBusinessPhone}
    placeholder="e.g. 98290XXXXX"
    keyboardType="numeric"
    maxLength={10}
  />
{/* 🚀 पुराने ३ बटनों को हटाकर यह शानदार लाइव ड्रापडाउन बटन लगाओ भाई साहब */}
<View style={styles.inputContainer}>
  <Text style={styles.label}>SHOP CATEGORY (दुकान की कैटेगरी)</Text>
  <TouchableOpacity 
    style={styles.dropdownButton} 
    onPress={() => setIsModalVisible(true)} // इसे दबाते ही नीचे से लिस्ट खुलेगी
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Store size={20} color="#001B3A" style={{ marginRight: 12 }} />
      <Text style={styles.dropdownButtonText}>
        {categoryId 
          ? categoriesList.find(c => c.id === categoryId)?.name || "Category Selected"
          : "👉 अपनी दुकान की कैटेगरी चुनें"}
      </Text>
    </View>
    {/* chevron-down आइकॉन के लिए Feather इम्पोर्ट कर लेना या इसकी जगह ChevronDown यूज़ कर लेना भाई साहब */}
    <ChevronLeft size={20} color="#64748b" style={{ transform: [{ rotate: '-90deg' }] }} /> 
  </TouchableOpacity>
</View>

            <InputField 
              label="SHOP DESCRIPTION" 
              icon={Info} 
              value={shopInfo.description}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, description: txt})}
              placeholder="Tell customers about your items..."
              multiline={true}
            />
          </View>

          {/* 2. LOCATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            <InputField 
              label="FULL ADDRESS" 
              icon={MapPin} 
              value={shopInfo.businessAddress}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, businessAddress: txt})}
              placeholder="Shop No, Street, Landmark..."
              multiline={true}
            />
            <InputField 
              label="MY PINCODE" 
              icon={MapPin} 
              value={shopInfo.pincode}
              onChangeText={(txt: string) => setShopInfo({...shopInfo, pincode: txt})}
              placeholder="323001"
              keyboardType="numeric"
            />
          </View>

          {/* 3. DELIVERY PINCODES (Tag System) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Areas (Pincodes)</Text>
            <View style={styles.pincodeInputRow}>
              <TextInput
                style={styles.pincodeInput}
                value={pincodeInput}
                onChangeText={setPincodeInput}
                placeholder="Type Pincode"
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addPincode}>
                <Text style={styles.addBtnText}>Add Area</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {deliveryPincodes.map((code) => (
                <View key={code} style={styles.tag}>
                  <Text style={styles.tagText}>{code}</Text>
                  <TouchableOpacity onPress={() => removePincode(code)}>
                    <Feather name="x" size={14} color="#1e40af" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
{/* DELIVERY METHOD SELECTION */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Delivery Strategy</Text>
  
  <View style={styles.settingCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.settingTitle}>Radius Based Delivery</Text>
      <Text style={styles.settingSub}>Distance ke hisaab se delivery karein</Text>
    </View>
    <Switch 
      value={isDistanceBased} // Ye state aapko banani hogi
      onValueChange={(val) => setIsDistanceBased(val)}
      trackColor={{ false: '#cbd5e1', true: '#10b981' }}
    />
  </View>

  {isDistanceBased ? (
    <InputField 
      label="DELIVERY RADIUS (IN KM)" 
      icon={MapPin} 
      value={radius} // Ye state bhi banani hogi
      onChangeText={setRadius}
      placeholder="e.g. 5"
      keyboardType="numeric"
    />
  ) : (
    <Text style={styles.infoText}>Abhi aap Pincode ke aadhar par delivery kar rahe hain.</Text>
  )}
</View>
          {/* 4. TIMINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <InputField label="OPENING" icon={Clock} value={shopInfo.openTime} placeholder="09:00 AM" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <InputField label="CLOSING" icon={Clock} value={shopInfo.closeTime} placeholder="10:00 PM" />
              </View>
            </View>
          </View>

          {/* 5. SHOP SETTINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Settings</Text>
            <View style={styles.settingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Auto-Accept Orders</Text>
                <Text style={styles.settingSub}>Accept orders without manual review</Text>
              </View>
              <Switch 
                value={isAutoAccept} 
                onValueChange={setIsAutoAccept}
                trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              />
            </View>
          </View>

          {/* 6. SAVE BUTTON */}
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save color="white" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.saveBtnText}>Save All Changes</Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={{ height: 60 }} />
        </ScrollView>
        {/* 🎯 यहाँ आएगी आपकी FlatList जो पॉप-अप (Modal) के अंदर पूरी २५+ लाइव कैटेगरीज को स्क्रॉल कराएगी */}
<Modal
  visible={isModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setIsModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      
      {/* मॉडल का हेडर */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>सभी लाइव कैटेगरीज की लिस्ट</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalBtn}>
          <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 16 }}>बंद करें</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 अगर बैकएंड से लाइव लोड हो रहा है तो स्पिनर दिखेगा, नहीं तो लिस्ट */}
      {catLoading ? (
        <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#001B3A" />
          <Text style={{ marginTop: 10, color: '#64748b', fontWeight: '600' }}>लाइव कैटेगरीज लोड हो रही हैं...</Text>
        </View>
      ) : (
        <FlatList
          data={categoriesList}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryListItem,
                categoryId === item.id && styles.selectedListItem
              ]}
              onPress={() => {
                setCategoryId(item.id);   // लाला जी के टच करते ही असली ID सेट हो जाएगी भाई साहब
                setIsModalVisible(false); // चुनते ही पॉप-अप बंद!
              }}
            >
              <Text style={[
                styles.categoryListItemText,
                categoryId === item.id && styles.selectedListItemText
              ]}>
                {item.name} {/* 🎯 बैकएंड के कॉलम नाम के हिसाब से यहाँ item.name आ जाएगा */}
              </Text>
              {categoryId === item.id && <ChevronLeft size={18} color="#001B3A" style={{ transform: [{ rotate: '180deg' }] }} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  </View>
</Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#001B3A' },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#64748b', letterSpacing: 1.2, marginBottom: 18, textTransform: 'uppercase' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 15,
    height: 58,
  },
  textAreaWrapper: { height: 110, alignItems: 'flex-start', paddingTop: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1e293b' },
  textArea: { height: '100%' },
  row: { flexDirection: 'row' },
  pincodeInputRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    paddingRight: 8,
    alignItems: 'center',
    height: 58
  },
  pincodeInput: { flex: 1, height: '100%', paddingHorizontal: 15, fontWeight: '700', fontSize: 16 },
  addBtn: { backgroundColor: '#001B3A', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    marginRight: 10, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  tagText: { color: '#1e40af', fontWeight: '800', fontSize: 14 },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
// 🎯 styles ऑब्जेक्ट के अंदर नीचे ये डिज़ाइन्स जोड़ दो भाई साहब (VS Code की एरर तुरंत उड़ जाएगी):

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 18,
    height: 58,
    marginTop: 5,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 27, 58, 0.4)', // स्क्रीन धुंधली करने के लिए कड़क ओवरले भाई साहब
    justifyContent: 'flex-end', // लिस्ट नीचे से खुलेगी
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '65%', // २५ कैटेगरीज मस्त स्क्रॉल होंगी ६५% स्क्रीन पर
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 15,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#001B3A',
  },
  closeModalBtn: {
    padding: 5,
  },
  categoryListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  selectedListItem: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  categoryListItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  selectedListItemText: {
    color: '#001B3A',
    fontWeight: '900',
  },
  settingCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 22, 
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  settingTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  settingSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  saveBtn: { 
    backgroundColor: '#001B3A', 
    height: 65, 
    borderRadius: 20, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
    shadowColor: '#001B3A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 19, fontWeight: '900' }
});

export default ShopDetailsScreen;