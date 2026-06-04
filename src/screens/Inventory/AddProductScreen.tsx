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
  
  // Manual Mode State
  const [manualData, setManualData] = useState({
    name: '', price: '', stock: '', description: '', categoryId: '', image: '',quantityValue: '1',
    unit: 'piece'
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
  // 5. Submit Handler (वैरिएंट-अवेयर इंडस्ट्रियल ग्रेड भाई)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'catalog') {
        const selectedArray = Object.values(selectedItems);
        if (selectedArray.length === 0) {
          throw new Error("Kripya kam se kam ek product select karein.");
        }

        const payload = selectedArray.map((item: any) => {
          const price = Number(item.variantPrice);
          const stock = Number(item.variantStock);

          if (!price || price <= 0) {
            throw new Error(`${item.name} ka price sahi nahi hai.`);
          }

          return {
            masterProductId: item.id,
            name: item.name,
            image: item.image, 
            categoryId: item.categoryId,
            isActive: true,
            approvalStatus: 'approved', 
            // 🎯 फिक्स: बैकएंड के नए आर्किटेक्चर के लिए वैरिएंट्स एरे बंडल भाई!
            variants: [{
              quantityValue: String(item.variantQty || "1"),
              unit: item.variantUnit || "piece",
              price: price,
              stock: stock || 0
            }]
          };
        });

        // यह सीधे आपके सुधरे हुए bulkCreateProducts एंडपॉइंट पर हिट करेगा भाई!
        await api.post('/api/products/bulk', { products: payload });

      } else {
        // --- MANUAL MODE (दाल मखनी लॉजिक अपग्रेड भाई) ---
        if (!manualData.name || manualData.name.length < 3) throw new Error("Naam chota hai.");
        if (!manualData.image || manualData.image.includes('no-image-icon')) {
          throw new Error("Kripya asli photo upload karein, camera icon nahi.");
        }
        if (!manualData.categoryId) throw new Error("Category chunna zaroori hai.");
        
        const price = Number(manualData.price);
        const stock = Number(manualData.stock);

        if (isNaN(price) || price <= 0) throw new Error("Sahi Price likhein.");

        // 🎯 फिक्स: मैनुअल प्रोडक्ट क्रिएशन एंडपॉइंट के लिए भी बेस वैरिएंट का बंडल अनिवार्य है भाई!
        const finalManualData = {
          name: manualData.name,
          description: manualData.description || "",
          categoryId: Number(manualData.categoryId),
          image: manualData.image,
          isActive: true,
          approvalStatus: 'approved',
          variants: [{
            quantityValue: "1", // मैनुअल सिंगल प्रोडक्ट के लिए डिफ़ॉल्ट 1 piece भाई
            unit: "piece",
            price: price,
            stock: stock || 0
          }]
        };

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
  const renderMasterItem = ({ item }: any) => {
    const isSelected = !!selectedItems[item.id];
    return (
      <View style={[styles.itemCard, isSelected && styles.selectedCard]}>
        <View style={styles.itemMain}>
       <Image 
  source={{ 
    uri: item.image?.includes('placehold.co') 
      ? `${item.image}.png` // SVG fix
      : (item.image || 'https://via.placeholder.com/150.png')
  }} 
  style={styles.img} 
  resizeMode="contain"
  // ❌ defaultSource wali line delete kar do agar error aa raha hai
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
        
       
        {isSelected && (
          <View style={styles.selectionInputs}>
            <View style={styles.miniInputGroup}>
              <Text style={styles.miniLabel}>Price (₹)</Text>
              <TextInput 
                style={styles.miniInput} 
                placeholder="0.00" 
                keyboardType="numeric" 
                value={selectedItems[item.id]?.variantPrice}
                onChangeText={(v) => setSelectedItems({
                  ...selectedItems, 
                  [item.id]: { ...selectedItems[item.id], variantPrice: v }
                })}
              />
            </View>
            <View style={styles.miniInputGroup}>
              <Text style={styles.miniLabel}>Stock</Text>
              <TextInput 
                style={styles.miniInput} 
                placeholder="10" 
                keyboardType="numeric"
                value={selectedItems[item.id]?.variantStock}
                onChangeText={(v) => setSelectedItems({
                  ...selectedItems, 
                  [item.id]: { ...selectedItems[item.id], variantStock: v }
                })}
              />
            </View>
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
          <TextInput style={styles.fullInput} placeholder="e.g. Fresh Organic Apples" onChangeText={(v) => setManualData({...manualData, name: v})} />
          
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput style={[styles.fullInput, { height: 100 }]} multiline placeholder="Tell buyers about this product..." onChangeText={(v) => setManualData({...manualData, description: v})} />

          {/* 🎯 फिक्स: प्राइस और स्टॉक इनपुट रो भाई */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={styles.fieldLabel}>PRICE (₹)</Text>
              <TextInput style={styles.fullInput} keyboardType="numeric" placeholder="0" onChangeText={(v) => setManualData({...manualData, price: v})} />
            </View>
            <View style={{ width: '48%' }}>
              <Text style={styles.fieldLabel}>STOCK</Text>
              <TextInput style={styles.fullInput} keyboardType="numeric" placeholder="0" onChangeText={(v) => setManualData({...manualData, stock: v})} />
            </View>
          </View>

          {/* 🎯 फिक्स: न्यू वैरिएंट सपोर्ट के लिए क्वांटिटी और यूनिट इनपुट भाई */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={styles.fieldLabel}>QUANTITY VALUE</Text>
              <TextInput 
                style={styles.fullInput} 
                placeholder="e.g. 1, 250, 500" 
                defaultValue="1"
                onChangeText={(v) => setManualData({...manualData, quantityValue: v})} 
              />
            </View>
            <View style={{ width: '48%' }}>
              <Text style={styles.fieldLabel}>UNIT (e.g. kg, gm, piece)</Text>
              <TextInput 
                style={styles.fullInput} 
                placeholder="e.g. piece" 
                defaultValue="piece"
                autoCapitalize="none"
                onChangeText={(v) => setManualData({...manualData, unit: v})} 
              />
            </View>
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