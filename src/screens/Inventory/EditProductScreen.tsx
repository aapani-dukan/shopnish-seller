import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';

export default function EditProductScreen({ route, navigation }: any) {
  // 🎯 इन्वेंट्री स्क्रीन से भेजे गए दोनों पैरामीटर्स को सेफ़ली निकालें भाई
  const { productId, variantId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedSubCatId, setSelectedSubCatId] = useState('');
const [initialPrice, setInitialPrice] = useState('');
const [existingVariants, setExistingVariants] = useState<any[]>([]);
  const fetchData = useCallback(async () => {
    if (!productId) {
      Alert.alert("Error", "Product ID missing hai bhai!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. बैकएंड से प्रोडक्ट का फ्रेश डेटा लाओ भाई
      const response = await api.get(`/api/products/${productId}`);
      const productData = response.data.product ? response.data.product : response.data;
if (productData?.variants) {
  setExistingVariants(productData.variants); // 👈 बैकअप यहाँ सुरक्षित हो गया भाई!
}
      if (!productData) {
        throw new Error("Product data not found on server");
      }

      // 2. नए वैरिएंट आर्किटेक्चर के हिसाब से सही वैरिएंट को फिल्टर करो भाई
      let selectedVariant = null;
      if (productData.variants && Array.isArray(productData.variants)) {
        if (variantId) {
          selectedVariant = productData.variants.find((v: any) => String(v.id) === String(variantId));
        }
        // फॉलबैक: अगर विशिष्ट वैरिएंट आईडी न मिले या मैच न हो, तो पहला वैरिएंट उठा लो भाई
        if (!selectedVariant && productData.variants.length > 0) {
          selectedVariant = productData.variants[0];
        }
      }

      // 3. फॉर्म डेटा स्टेट को नए अलाइनमेंट के साथ लॉक करें ताकि यूआई ब्लैंक न हो भाई
      setFormData({
        ...productData,
        variantId: selectedVariant ? selectedVariant.id : null,
        price: selectedVariant ? String(selectedVariant.price) : '',
        originalPrice: selectedVariant ? String(selectedVariant.originalPrice || '') : '',
        stock: selectedVariant ? String(selectedVariant.stock ?? 0) : '0',
        quantityValue: selectedVariant ? String(selectedVariant.quantityValue || '') : '',
        unit: selectedVariant ? selectedVariant.unit : '',
      });

    } catch (err: any) {
      console.error("📋 Fetch Data Error Logs:", err?.response?.data || err?.message);
      
      const status = err.response?.status;
      if (status === 404) {
        Alert.alert("Product Not Found (404)", "Ya toh ID galat hai, ya product abhi Approved nahi hai bhai.");
      } else {
        Alert.alert("Data Load Failed ❌", err.message || "Server se sampark nahi ho paya.");
      }
    } finally {
      // 😎 चाहे सक्सेस हो या एरर—स्पिनर को हर हाल में यहाँ शांत होना ही पड़ेगा भाई!
      setLoading(false);
    }
  }, [productId, variantId]);

  // ⏳ स्क्रीन खुलते ही डेटा लोड ट्रिगर करें भाई
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    const fetchSubCats = async () => {
      if (!formData?.categoryId) return;
      try {
        const res = await api.get(`/api/categories/${formData.categoryId}/subcategories`);
        setSubCategories(res.data || []);
      } catch (err) {
        console.log("Edit Screen Subcategory load error:", err);
      }
    };
    fetchSubCats();
  }, [formData?.categoryId]);
 // 🎯 फिक्स 2: नए वैरिएंट-अवेयर पैच एंडपॉइंट के हिसाब से पेलोड पैक करना भाई
const handleUpdate = async () => {
  // ⛔ वैलिडेशन चेक: प्राइस और स्टॉक खाली नहीं होना चाहिए भाई
  if (!formData?.price || !formData?.stock) {
    Alert.alert("Rukiye!", "Price aur Stock bharna zaroori hai bhai.");
    return;
  }

  // अगर नया वैरिएंट है, तो मात्रा और यूनिट भी डालना जरूरी है भाई
  if (route.params?.isNewVariant && (!formData?.quantityValue || !formData?.unit)) {
    Alert.alert("Rukiye!", "Naye variant ke liye Maatra (Quantity) aur Unit bharna zaroori hai.");
    return;
  }

  setSaving(true);
  try {
    // 1️⃣ [यहाँ सेट हुआ] नया वेरिएंट ढांचा जो वेंडर ने अभी फॉर्म में भरा है भाई
    const newVariantObj = {
      quantityValue: String(formData.quantityValue || '1'),
      unit: formData.unit || 'g',
      originalPrice: String(formData.originalPrice || formData.price), // 💰 MRP लॉक
      discountType: 'percentage',
      discountValue: formData.originalPrice && formData.price 
        ? String(Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100))
        : '0',
      price: Number(formData.price), // फाइनल सेलिंग प्राइस
      stock: Number(formData.stock),
      minOrderQty: 1,
      maxOrderQty: 100
    };

    let finalVariantsArray = [];

    // 2️⃣ [यहाँ सेट हुआ] कंडीशन चेक—नया वैरिएंट जोड़ना है या पुराना एडिट करना है
    if (formData.isNewVariantFlag || route.params?.isNewVariant) {
      // ➕ नया वेरिएंट जोड़ रहे हैं: पुराने जितने भी वेरिएंट थे, उन्हें रखो और नया वाला भी उसमें जोड़ दो भाई!
      const mappedExisting = (existingVariants || []).map((v: any) => ({
        quantityValue: String(v.quantityValue),
        unit: v.unit,
        originalPrice: String(v.originalPrice),
        discountType: v.discountType || 'percentage',
        discountValue: String(v.discountValue || 0),
        price: Number(v.price),
        stock: Number(v.stock),
      }));
      
      finalVariantsArray = [...mappedExisting, newVariantObj];
    } else {
      // ✏️ पुराना ही एडिट कर रहे हैं: सिर्फ इसी विशिष्ट वेरिएंट को अपडेट करो (बाकी को वैसा ही रहने दो)
      finalVariantsArray = (existingVariants || []).map((v: any) => {
        if (String(v.id) === String(formData.variantId)) {
          return newVariantObj; // अपडेटेड डेटा भाई
        }
        return {
          quantityValue: String(v.quantityValue),
          unit: v.unit,
          originalPrice: String(v.originalPrice),
          discountType: v.discountType || 'percentage',
          discountValue: String(v.discountValue || 0),
          price: Number(v.price),
          stock: Number(v.stock),
        };
      });
    }

    // 3️⃣ बैकएंड की मांग के अनुसार क्लीन पेलोड तैयार करो भाई
    const updatePayload = {
      name: formData.name?.trim(),
      description: formData.description || '',
      categoryId: parseInt(String(formData.categoryId)),
      subCategoryId: formData.subCategoryId ? parseInt(String(formData.subCategoryId)) : null,
      brand: formData.brand || null,
      estimatedDeliveryTime: formData.estimatedDeliveryTime || "1-2 hours",
      imageUrl: formData.image,
      variants: finalVariantsArray // 🔥 पुराने + नए सभी वैरिएंट्स का पूरा एरे यहाँ चला गया भाई!
    };

    // वर्जनिंग चेंज रीजन ट्रेकिंग भाई
    if (String(formData.price) !== initialPrice && !route.params?.isNewVariant) {
      (updatePayload as any).changeReason = "Price updated via Seller App";
    }

    console.log("🚀 Sending Correct Variant-Aware Payload to Backend:", JSON.stringify(updatePayload));

    // 🎯 असली यूआरएल जहाँ बैकएंड 'PATCH' एक्सेप्ट करता है: /api/sellers/products/:id
    const response = await api.patch(`/api/sellers/products/${productId}`, updatePayload);
    
    if (response.data.success || response.data.message) {
      Alert.alert("Success ✅", "Product aur Variants update ho gaye bhai!", [
        { text: "Mast!", onPress: () => navigation.goBack() }
      ]);
    }
  } catch (err: any) {
    console.error("Update Error Details:", err.response?.data || err.message);
    const errorMsg = err.response?.data?.error || "Server ne data nahi liya. Paths check karein.";
    Alert.alert("Update Failed ❌", errorMsg);
  } finally {
    setSaving(false);
  }
};
  // Agar loading ho rahi hai YA formData abhi tak null hai, toh gola dikhao
if (loading || !formData) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={{ marginTop: 10 }}>Data load ho raha hai...</Text>
    </View>
  );
}
return (
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
    style={{ flex: 1 }}
  >
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Product Image Preview - Safety added with formData && */}
      <View style={styles.imageContainer}>
        {formData && (
          <Image 
            source={{ 
              uri: formData?.image 
                ? encodeURI(formData?.image.trim()) 
                : 'https://via.placeholder.com/150.png' 
            }} 
            style={styles.productImg} 
          />
        )}
        <View style={styles.imageOverlay}>
          <Text style={styles.imageHint}>Web dashboard se photo badlein</Text>
        </View>
      </View>
   
      {/* 🎯 साफ़ सुथरा इनपुट फॉर्म भाई */}
      <View style={styles.form}>
        <Text style={styles.label}>Product Ka Naam</Text>
        <TextInput 
          style={[styles.input, route.params?.isNewVariant && { backgroundColor: '#f3f4f6' }]}
          value={formData?.name}
          editable={!route.params?.isNewVariant} // अगर नया वैरिएंट है, तो नाम लॉक रखें ताकि पैरेंट नाम न बदले भाई
          onChangeText={(v) => setFormData({...formData, name: v})}
        />

        {/* 🌟 नया सेक्शन: MRP (Original Price) का डिब्बा जो गायब था भाई */}
        <Text style={styles.label}>MRP / Original Price (₹)</Text>
        <TextInput 
          style={styles.input}
          keyboardType="numeric"
          placeholder="उदा. 50"
          value={String(formData?.originalPrice || '')}
          onChangeText={(v) => setFormData({...formData, originalPrice: v})}
        />

        <View style={styles.row}>
          {/* प्राइस इनपुट ब्लॉक (वर्जनिंग बॉर्डर इंडिकेटर के साथ भाई) */}
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Selling Price (₹)</Text>
            <TextInput 
              style={[
                styles.input, 
                String(formData?.price) !== initialPrice && { borderColor: '#1e40af', borderWidth: 2 }
              ]}
              keyboardType="numeric"
              placeholder="उदा. 45"
              value={String(formData?.price || '')}
              onChangeText={(v) => setFormData({...formData, price: v})}
            />
          </View>
          
          {/* स्टॉक इनपुट ब्लॉक */}
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Stock</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              placeholder="उदा. 10"
              value={String(formData?.stock ?? '0')}
              onChangeText={(v) => setFormData({...formData, stock: v})}
            />
          </View>
        </View>

        {/* Price Change Warning Message */}
        {String(formData?.price) !== initialPrice && (
          <Text style={{ fontSize: 11, color: '#1e40af', marginTop: -10, marginBottom: 15, fontWeight: '700' }}>
            ⚠️ Price change detect hua hai (Versioning ON भाई)
          </Text>
        )}

        {/* 🌟 नया सेक्शन: वजन/मात्रा (Quantity) और यूनिट (Unit) के डिब्बे - वैरिएंट के लिए सबसे जरूरी भाई */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>मात्रा / Quantity Value</Text>
            <TextInput 
              style={styles.input}
              placeholder="उदा. 500 या 1"
              value={String(formData?.quantityValue || '')}
              onChangeText={(v) => setFormData({...formData, quantityValue: v})}
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>यूनिट / Unit</Text>
            <TextInput 
              style={styles.input}
              placeholder="उदा. g, kg, piece"
              autoCapitalize="none"
              value={String(formData?.unit || '')}
              onChangeText={(v) => setFormData({...formData, unit: v})}
            />
          </View>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
          value={formData?.description}
          onChangeText={(v) => setFormData({...formData, description: v})}
        />
{/* 🎛️ नया कड़क सुधार: एडिट फॉर्म के अंदर सब-कैटेगरीज का स्क्रॉल बार लाइव भाई साहब! */}
        {formData?.categoryId && subCategories.length > 0 && (
          <View style={{ marginVertical: 10, backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
              सब-श्रेणी बदलें / Select Subcategory (अनिवार्य):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {subCategories.map((sub: any) => {
                const isSubSelected = String(formData?.subCategoryId) === String(sub.id);
                return (
                  <TouchableOpacity 
                    key={sub.id} 
                    style={[{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, 
                      backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center'
                    }, isSubSelected && { backgroundColor: '#1e40af', borderColor: '#1e40af' }]}
                    onPress={() => setFormData({ ...formData, subCategoryId: sub.id.toString() })}
                  >
                    <Text style={[{ fontSize: 12, fontWeight: '700', color: '#475569' }, isSubSelected && { color: '#ffffff' }]}>
                      {sub.name} {sub.nameHindi ? `/ ${sub.nameHindi}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        {/* Status Toggle */}
        <View style={styles.statusBox}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.statusTitle}>Dukaan mein dikhayein?</Text>
            <Text style={styles.statusSub}>{formData?.isActive ? 'Abhi Customer ko dikh raha hai' : 'Abhi chupa hua hai'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setFormData({...formData, isActive: !formData?.isActive})}
            style={[styles.toggle, { backgroundColor: formData?.isActive ? '#10b981' : '#cbd5e1' }]}
          >
            <View style={[styles.toggleCircle, { alignSelf: formData?.isActive ? 'flex-end' : 'flex-start' }]} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

    {/* Action Footer */}
    <View style={styles.footer}>
      <TouchableOpacity 
        style={styles.saveBtn} 
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* यहाँ Feather आइकॉन काम कर रहा है, तो ठीक वरना सिंपल टेक्स्ट दिखेगा भाई */}
            <Text style={styles.saveBtnText}>💾 Save Changes</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 250, backgroundColor: '#f1f5f9' },
  productImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  imageOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 5 },
  imageHint: { color: '#fff', fontSize: 10 },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    marginBottom: 20,
    color: '#1e293b'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 12,
    marginTop: 10 
  },
  statusTitle: { fontWeight: 'bold', color: '#1e293b' },
  statusSub: { fontSize: 12, color: '#64748b' },
  toggle: { width: 50, height: 28, borderRadius: 14, padding: 4 },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  saveBtn: { 
    backgroundColor: '#1e40af', 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});