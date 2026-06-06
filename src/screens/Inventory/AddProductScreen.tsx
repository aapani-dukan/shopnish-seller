import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, Image, ActivityIndicator, Alert, ScrollView, Dimensions, KeyboardAvoidingView,Platform
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../../services/api';
const BASE_URL = 'https://api.shopnish.com';
const { width } = Dimensions.get('window');

export default function AddProductScreen({ navigation }: any) {
  const [mode, setMode] = useState<'catalog' | 'manual'>('catalog');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Search & Categories
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [masterProducts, setMasterProducts] = useState([]);
  
  // Selection States
  const [selectedItems, setSelectedItems] = useState<any>({});
  
  // 🎯 फिक्स: <any> टाइप जोड़ दिया भाई ताकि टाइपस्क्रिप्ट 'variants' एरे को सेफ़ली एक्सेप्ट कर ले
const [manualData, setManualData] = useState<any>({
  name: '',
  description: '',
  categoryId: '',
  image: null,
  // 📦 डिफ़ॉल्ट रूप से पहला खाली वैरिएंट रो हमेशा तैयार रहेगा भाई
  variants: [{ quantityValue: '1', unit: 'piece', price: '', originalPrice: '', stock: '' }]
});

  // 1. Fetch Categories (Web logic)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/api/categories');
        setCategories(res.data);
      } catch (err) { console.log("Category error", err); }
    };
    fetchCats();
  }, []);

  // 2. Master Search with Debounce (Optimized)
  useEffect(() => {
    const fetchMasterData = async () => {
      if (mode !== 'catalog') return;
      if (!selectedCat && searchTerm.length < 2) {
        setMasterProducts([]);
        return;
      }
      try {
        let url = `/api/products/master-search?q=${searchTerm}`;
        if (selectedCat !== "all") url += `&categoryId=${selectedCat}`;
        const res = await api.get(url);
        setMasterProducts(res.data);
      } catch (err) { console.log("Search failed", err); }
    };
    const timer = setTimeout(fetchMasterData, 400);
    return () => clearTimeout(timer);
  }, [selectedCat, searchTerm, mode]);

  // 3. Catalog Selection Toggle (वैरिएंट-अवेयर मोड भाई)
  const toggleItem = (item: any) => {
    const newItems = { ...selectedItems };
    if (newItems[item.id]) {
      delete newItems[item.id];
    } else {
      // 🎯 फिक्स: फ्लैट प्राइस/स्टॉक के बजाय अंदर एक वैरिएंट की शुरुआती वैल्यू सेट कर दी भाई
      newItems[item.id] = { 
        ...item, 
        variantPrice: '', 
        variantStock: '10',
        variantUnit: item.unit || 'piece',
        variantQty: '1'
      };
    }
    setSelectedItems(newItems);
  };

  // 4. Cloudinary Image Upload (जैसा वेब में था)
 const handleImagePick = async () => {
  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6 });
  if (result.assets && result.assets[0]) {
    setImageUploading(true);
    const file = result.assets[0];
    
    const formData = new FormData();
    formData.append('file', {
     uri: Platform.OS === 'android' ? file.uri! : file.uri!.replace('file://', ''),
      type: file.type || 'image/jpeg',
      name: file.fileName || 'product.jpg',
    } as any);
    formData.append('upload_preset', 'shopnish_products');

    try {
      // Axios is more stable for large file uploads on mobile
      const res = await api.post('https://api.cloudinary.com/v1_1/dcah0b2jy/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setManualData({ ...manualData, image: res.data.secure_url });
    } catch (err) {
      Alert.alert("Upload Failed", "Network check karein aur dobara koshish karein.");
    } finally {
      setImageUploading(false);
    }
  }
};
 // 🎯 5. Submit Handler (100% वैरिएंट-सिंक और नंबर-सुरक्षित इंडस्ट्रियल ग्रेड भाई)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'catalog') {
        const selectedArray = Object.values(selectedItems);
        if (selectedArray.length === 0) {
          throw new Error("Kripya kam se kam ek product select karein.");
        }
const payload = selectedArray.map((item: any) => {
          if (!item.variants || item.variants.length === 0) {
            throw new Error(`${item.name} ka size/variant bharna zaroori hai.`);
          }

          const cleanedVariants = item.variants.map((v: any, idx: number) => {
            const priceNum = Number(v.price);
            const originalPriceNum = Number(v.originalPrice || v.price);
            const stockNum = Number(v.stock);

            if (isNaN(priceNum) || priceNum <= 0) {
              throw new Error(`${item.name} के वैरिएंट #${idx + 1} का Rate सही नहीं है भाई।`);
            }
            if (priceNum > originalPriceNum) {
              throw new Error(`${item.name} के वैरिएंट #${idx + 1} का Rate उसके MRP से ज़्यादा नहीं हो सकता भाई।`);
            }

            return {
              quantityValue: String(v.quantityValue || "1"),
              unit: String(v.unit || "piece"),
              price: priceNum,
              originalPrice: originalPriceNum, 
              stock: stockNum || 0
            };
          });

          // 🎯 पहले वैरिएंट की कीमत और स्टॉक को बेस मान लेते हैं भाई ताकि बैकएंड क्रैश न हो
          const basePrice = cleanedVariants[0]?.price || 0;
          const baseStock = cleanedVariants[0]?.stock || 0;

          return {
            masterProductId: item.id ? Number(item.id) : 0, 
            name: String(item.name || "Unnamed Product"),
            image: String(item.image || ""), 
            categoryId: item.categoryId ? Number(item.categoryId) : 0,
            
            // 🔥 जुड़ाव: ये दोनों फ़ील्ड्स बैकएंड के .toString() लॉजिक को क्रैश होने से बचाएंगे भाई!
            price: basePrice, 
            stock: baseStock,
            
            isActive: true,
            approvalStatus: 'approved', 
            variants: cleanedVariants 
          };
        });
             console.log("🚀 Catalog Bulk Payload:", JSON.stringify(payload, null, 2));
        await api.post('/api/products/bulk', { products: payload });

      } else {
        // --- MANUAL MODE (100% मल्टी-वैरिएंट्स अपग्रेड भाई) ---
        if (!manualData.name || manualData.name.length < 3) throw new Error("Naam chota hai.");
        if (!manualData.image || manualData.image.includes('no-image-icon')) {
          throw new Error("Kripya asli photo upload karein, camera icon nahi.");
        }
        if (!manualData.categoryId) throw new Error("Category chunna zaroori hai.");
        if (!manualData.variants || manualData.variants.length === 0) {
          throw new Error("Kam se kam ek variant add karna zaroori hai.");
        }

        // 🎯 फिक्स 2: मैनुअल के सारे वैरिएंट्स को साफ़ करके नंबर फॉर्मेट में बदला भाई
        const cleanedManualVariants = manualData.variants.map((v: any, idx: number) => {
          const priceNum = Number(v.price);
          const originalPriceNum = Number(v.originalPrice || v.price);
          const stockNum = Number(v.stock);

          if (isNaN(priceNum) || priceNum <= 0) {
            throw new Error(`मैनुअल प्रोडक्ट के वैरिएंट #${idx + 1} का Rate सही लिखें भाई।`);
          }
          if (priceNum > originalPriceNum) {
            throw new Error(`मैनुअल प्रोडक्ट के वैरिएंट #${idx + 1} का Rate उसके MRP से ज़्यादा नहीं हो सकता भाई।`);
          }

          return {
            quantityValue: String(v.quantityValue || "1"),
            unit: String(v.unit || "piece"), // 🎯 फिक्स 1: स्ट्रिंग सेफ़्टी भाई
            price: priceNum,
            originalPrice: originalPriceNum,
            stock: stockNum || 0
          };
        });

        const finalManualData = {
          name: manualData.name,
          description: manualData.description || "",
          categoryId: Number(manualData.categoryId),
          image: manualData.image,
          isActive: true,
          approvalStatus: 'approved',
          variants: cleanedManualVariants // 🎯 मैनुअल की भी पूरी लिस्ट बैकएंड पर लॉक भाई!
        };

        console.log("🚀 Manual Single Payload:", JSON.stringify(finalManualData, null, 2));
        await api.post('/api/products', finalManualData);
      }

      Alert.alert(
        "Success 🎉", 
        mode === 'catalog' ? "Inventory Update Ho Gayi!" : "Product Live Ho Gaya!",
        [{ text: "Theek Hai", onPress: () => navigation.goBack() }]
      );

    } catch (err: any) {
      console.error("Submit Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Submit fail ho gaya.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };
 // =====================================================================
  // 🏪 1. QUICK CATALOG ITEM RENDERING WITH MULTI-VARIANTS SUPPORT
  // =====================================================================
  const renderMasterItem = ({ item }: any) => {
    const isSelected = !!selectedItems[item.id];
    const targetItem = selectedItems[item.id];

    return (
      <View style={[styles.itemCard, isSelected && styles.selectedCard]}>
        <View style={styles.itemMain}>
          <Image 
            source={{ 
              uri: item.image?.includes('placehold.co') 
                ? `${item.image}.png` 
                : (item.image || 'https://via.placeholder.com/150.png')
            }} 
            style={styles.img} 
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.itemBrand}>{item.brand || 'No Brand'}</Text>
              {item.unit && <Text style={styles.unitBadge}>{item.unit}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleItem(item)}>
            <Feather 
              name={isSelected ? "check-circle" : "plus-circle"} 
              size={26} 
              color={isSelected ? "#001B3A" : "#94a3b8"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* 🎯 फिक्स: कैटलॉग आइटम सेलेक्ट होते ही उसके अंदर मात्रा/वैरिएंट्स जोड़ने का इनपुट भाई */}
        {isSelected && targetItem && (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>📋 इस आइटम के साइज/वैरिएंट्स भरें:</Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                onPress={() => {
                  const currentVars = targetItem.variants || [];
                  setSelectedItems({
                    ...selectedItems,
                    [item.id]: {
                      ...targetItem,
                      variants: [...currentVars, { quantityValue: '', unit: item.unit || 'piece', price: '', originalPrice: '', stock: '' }]
                    }
                  });
                }}
              >
                <Text style={{ color: '#4338ca', fontSize: 11, fontWeight: 'bold' }}>+ Add Size</Text>
              </TouchableOpacity>
            </View>

          {/* 🎯 कैटलॉग वैरिएंट्स लूप भाई - दो लाइन का खुला-खुला प्रीमियम लेआउट */}
            {(targetItem.variants || []).map((v: any, vIndex: number) => {
              const updateCatalogField = (field: string, val: string) => {
                const updatedVars = [...targetItem.variants];
                updatedVars[vIndex][field] = val;
                setSelectedItems({
                  ...selectedItems,
                  [item.id]: { ...targetItem, variants: updatedVars }
                });
              };

              return (
                <View key={vIndex} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                  
                  {/* 🔥 लाइन 1: मात्रा और यूनिट (आधा-आधा स्क्रीन स्पेस भाई) */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>मात्रा (नंबर लिखो)</Text>
                      <TextInput 
                        style={[styles.miniInput, { height: 44, width: '100%', fontSize: 14, textAlign: 'center' }]} 
                        placeholder="e.g. 100, 1, 5" 
                        keyboardType="numeric"
                        value={v.quantityValue}
                        onChangeText={(text) => updateCatalogField('quantityValue', text)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Unit (इकाई लिखें)</Text>
                     <TextInput 
  style={[styles.miniInput, { height: 44, width: '100%', fontSize: 14, textAlign: 'center' }]} 
  placeholder="e.g. gm, kg, ml, piece" 
  autoCapitalize="none"
  
  // 🎯 जादुई क्लीनर: अगर यूनिट के अंदर नंबर और टेक्स्ट मिक्स आ रहा है (जैसे 110g), तो डिब्बे को एकदम खाली दिखाओ भाई!
  value={(v.unit && /\d/.test(v.unit)) ? '' : v.unit} 
  
  onChangeText={(text) => updateCatalogField('unit', text)}
/>
                    </View>
                  </View>

                  {/* 🔥 लाइन 2: MRP, Rate, और Stock (तीन बराबर और बड़े डिब्बे भाई) */}
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>₹ MRP</Text>
                      <TextInput 
                        style={[styles.miniInput, { height: 44, width: '100%', fontSize: 14, fontWeight: '600', textAlign: 'center' }]} 
                        placeholder="MRP" 
                        keyboardType="numeric"
                        value={v.originalPrice || ''}
                        onChangeText={(text) => updateCatalogField('originalPrice', text)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>₹ Rate (Selling)</Text>
                      <TextInput 
                        style={[styles.miniInput, { height: 44, width: '100%', fontSize: 14, fontWeight: '600', color: '#1e293b', textAlign: 'center' }]} 
                        placeholder="Rate" 
                        keyboardType="numeric"
                        value={v.price}
                        onChangeText={(text) => updateCatalogField('price', text)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Stock</Text>
                      <TextInput 
                        style={[styles.miniInput, { height: 44, width: '100%', fontSize: 14, textAlign: 'center' }]} 
                        placeholder="Stock" 
                        keyboardType="numeric"
                        value={v.stock}
                        onChangeText={(text) => updateCatalogField('stock', text)}
                      />
                    </View>
                  </View>

                  {/* 🔥 लाइव डिस्काउंट पट्टी (सुंदर बैकग्राउंड के साथ भाई) */}
                  {Number(v.originalPrice) > Number(v.price) && Number(v.price) > 0 && (
                    <View style={{ backgroundColor: '#f0fdf4', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold' }}>
                        🏷️ Live Discount: {(((Number(v.originalPrice) - Number(v.price)) / Number(v.originalPrice)) * 100).toFixed(0)}% OFF (₹{Number(v.originalPrice) - Number(v.price)} की बचत)
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View> 
        )} 
      </View> 
    );
  };
  return (
    <View style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.headerTabs}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'catalog' && styles.activeTab]} 
          onPress={() => setMode('catalog')}
        >
          <Text style={[styles.tabText, mode === 'catalog' && styles.activeTabText]}>Quick Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, mode === 'manual' && styles.activeTab]} 
          onPress={() => setMode('manual')}
        >
          <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual Add</Text>
        </TouchableOpacity>
      </View>

      {mode === 'catalog' ? (
        <View style={{ flex: 1 }}>
          {/* Catalog Filters */}
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#94a3b8" />
              <TextInput 
                placeholder="Product name..." 
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <TouchableOpacity 
                style={[styles.catPill, selectedCat === 'all' && styles.activeCatPill]}
                onPress={() => setSelectedCat('all')}
              >
                <Text style={[styles.catPillText, selectedCat === 'all' && styles.activeCatPillText]}>All</Text>
              </TouchableOpacity>
              {categories.map((c: any) => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.catPill, selectedCat === c.id.toString() && styles.activeCatPill]}
                  onPress={() => setSelectedCat(c.id.toString())}
                >
                  <Text style={[styles.catPillText, selectedCat === c.id.toString() && styles.activeCatPillText]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList 
            data={masterProducts}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={renderMasterItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="package" size={50} color="#e2e8f0" />
                <Text style={styles.emptyText}>Items dhoondne ke liye type karein ya category chunein</Text>
              </View>
            }
          />
        </View>
      ) : (
        // =====================================================================
        // 🛍️ 2. MANUAL ADD FORM WITH REWORKED DYNAMIC VARIANTS ENGINE
        // =====================================================================
        <ScrollView style={styles.manualForm} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <TouchableOpacity style={styles.imageUpload} onPress={handleImagePick}>
            {manualData.image ? (
              <Image source={{ uri: manualData.image }} style={styles.uploadedImg} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                {imageUploading ? <ActivityIndicator color="#001B3A" /> : <Feather name="camera" size={40} color="#94a3b8" />}
                <Text style={styles.uploadLabel}>Upload High Quality Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>PRODUCT NAME</Text>
          <TextInput style={styles.fullInput} placeholder="e.g. Fresh Organic Apples" value={manualData.name} onChangeText={(v) => setManualData({...manualData, name: v})} />
          
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput style={[styles.fullInput, { height: 80 }]} multiline placeholder="Tell buyers about this product..." value={manualData.description} onChangeText={(v) => setManualData({...manualData, description: v})} />

          {/* 🎯 जादुई बदलाव: मैनुअल फॉर्म के लिए कस्टमाइज्ड फुल-वैरिएंट ग्रिड बॉक्स भाई */}
          <View style={{ marginVertical: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, backgroundColor: '#f8fafc' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#001B3A' }}>📦 Product Variants (मात्रा/रेट सूची)</Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#001B3A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => {
                  const currentVariants = manualData.variants || [];
                  setManualData({
                    ...manualData,
                    variants: [...currentVariants, { quantityValue: '', unit: 'piece', price: '', originalPrice: '', stock: '' }]
                  });
                }}
              >
                <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 11 }}>+ Add Variant</Text>
              </TouchableOpacity>
            </View>

            {(manualData.variants || []).map((variant: any, index: number) => {
              const updateVariantField = (field: string, value: string) => {
                const currentVariants = [...manualData.variants];
                currentVariants[index][field] = value;
                setManualData({ ...manualData, variants: currentVariants });
              };

              const removeVariant = () => {
                const currentVariants = [...manualData.variants];
                if (currentVariants.length > 1) {
                  currentVariants.splice(index, 1);
                  setManualData({ ...manualData, variants: currentVariants });
                }
              };

              return (
                <View key={index} style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b' }}>वैरिएंट #{index + 1}</Text>
                    {index > 0 && (
                      <TouchableOpacity onPress={removeVariant}>
                        <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ width: '48%' }}>
                      <TextInput style={[styles.miniInput, {width: '100%'}]} keyboardType="numeric" placeholder="मात्रा (e.g. 1, 250)" value={variant.quantityValue} onChangeText={(v) => updateVariantField('quantityValue', v)} />
                    </View>
                    <View style={{ width: '48%' }}>
                      <TextInput style={[styles.miniInput, {width: '100%'}]} placeholder="यूनिट (e.g. kg, gm)" autoCapitalize="none" value={variant.unit} onChangeText={(v) => updateVariantField('unit', v)} />
                    </View>
                  </View>

                  {/* 🎯 फिक्स: मैनुअल फॉर्म के इनपुट बॉक्स और लाइव डिस्काउंट इंजन भाई */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
                    <TextInput 
                      style={[styles.miniInput, { flex: 1 }]} 
                      keyboardType="numeric" 
                      placeholder="₹ Rate" 
                      value={variant.price} 
                      onChangeText={(v) => updateVariantField('price', v)} 
                    />
                    <TextInput 
                      style={[styles.miniInput, { flex: 1 }]} 
                      keyboardType="numeric" 
                      placeholder="₹ MRP" 
                      value={variant.originalPrice} 
                      onChangeText={(v) => updateVariantField('originalPrice', v)} 
                    />
                    <TextInput 
                      style={[styles.miniInput, { flex: 1 }]} 
                      keyboardType="numeric" 
                      placeholder="Stock" 
                      value={variant.stock} 
                      onChangeText={(v) => updateVariantField('stock', v)} 
                    />
                  </View>

                  {/* 🔥 जादुई लाइव डिस्काउंट: रेट और एमआरपी भरते ही वेंडर को लाइव बचत दिखेगी भाई */}
                  {Number(variant.originalPrice) > Number(variant.price) && Number(variant.price) > 0 && (
                    <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold', marginTop: 4, paddingLeft: 2 }}>
                      🎉 Auto-Calculated Discount: {(((Number(variant.originalPrice) - Number(variant.price)) / Number(variant.originalPrice)) * 100).toFixed(0)}% OFF (₹{Number(variant.originalPrice) - Number(variant.price)} की बचत)
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScrollManual}>
            {categories.map((c: any) => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.catPill, manualData.categoryId === c.id.toString() && styles.activeCatPill]}
                onPress={() => setManualData({...manualData, categoryId: c.id.toString()})}
              >
                <Text style={[styles.catPillText, manualData.categoryId === c.id.toString() && styles.activeCatPillText]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.mainBtn, (mode === 'catalog' && Object.keys(selectedItems).length === 0) && { opacity: 0.5 }]} 
          onPress={handleSubmit}
          disabled={loading || imageUploading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainBtnText}>
              {mode === 'catalog' 
                ? `Add ${Object.keys(selectedItems).length} Products` 
                : 'Publish Product'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
   img: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerTabs: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 6, margin: 16, borderRadius: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#001B3A', elevation: 4, shadowColor: '#001B3A', shadowOpacity: 0.3, shadowRadius: 5 },
  tabText: { fontWeight: '800', color: '#64748B', fontSize: 13 },
  activeTabText: { color: '#FFFFFF' },
  
  filterSection: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 16, paddingHorizontal: 15, borderRadius: 14, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '600', color: '#1E293B' },
  catScroll: { marginTop: 12, paddingLeft: 16 },
  catScrollManual:{marginTop: 5, marginBottom: 15,
},
  catPill: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  activeCatPill: { backgroundColor: '#001B3A', borderColor: '#001B3A' },
  catPillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  activeCatPillText: { color: '#FFF' },

  itemCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  selectedCard: { borderColor: '#001B3A', backgroundColor: '#F8FAFC' },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  itemImg: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#F1F5F9' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemBrand: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  unitBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontSize: 10, fontWeight: '800', marginLeft: 8, color: '#475569' },
  
  selectionInputs: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  miniInputGroup: { flex: 1, marginRight: 10 },
  miniLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 5 },
  miniInput: { backgroundColor: '#FFF', height: 45, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, fontWeight: '700' },

  manualForm: { padding: 16 },
  imageUpload: { height: 200, backgroundColor: '#F8FAFC', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  uploadedImg: { width: '100%', height: '100%', borderRadius: 24 },
  uploadLabel: { color: '#94A3B8', marginTop: 12, fontWeight: '700', fontSize: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 8, marginTop: 15 },
  fullInput: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', fontSize: 15, fontWeight: '600', color: '#1E293B' },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(255,255,255,0.9)' },
  mainBtn: { backgroundColor: '#001B3A', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#001B3A', shadowOpacity: 0.3, shadowRadius: 10 },
  mainBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 15, paddingHorizontal: 40, fontWeight: '500' }
});