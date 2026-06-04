import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl,Dimensions 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';
const BASE_URL = 'https://api.shopnish.com';
const { width } = Dimensions.get('window');
export default function InventoryScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

 // 🎯 फिक्स: वैरिएंट्स एरे को सेफ़ली सिंक करने वाला डेटा फेचर भाई
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/api/products/seller'); 
      const data = response.data.products || response.data || [];
      
      // डेटाबेस से आने वाले हर प्रोडक्ट के वैरिएंट्स को सेफ़ली चेक कर लेते हैं भाई
      const normalizedData = data.map((prod: any) => {
        const variantsList = prod.variants || [];
        
        // सबसे पहला वैरिएंट हमारा बेस वैरिएंट होगा भाई
        const baseVariant = variantsList[0] || { price: 0, stock: 0, id: null };
        
        // दुकान की टोटल यूनिट्स निकालने के लिए सारे वैरिएंट्स का स्टॉक जोड़ लो भाई
        const totalStock = variantsList.reduce((sum: number, v: any) => sum + Number(v.stock || 0), 0);

        return {
          ...prod,
          // फ्लैट कीज बना दी भाई ताकि नीचे यूआई रेंडरर को ज्यादा मेहनत न करनी पड़े
          baseVariantId: baseVariant.id, 
          displayPrice: baseVariant.price || prod.price || 0,
          calculatedStock: totalStock,
          baseVariantQty: `${baseVariant.quantityValue || '1'} ${baseVariant.unit || 'piece'}`
        };
      });

      setProducts(normalizedData);
    } catch (err: any) {
      console.error("Inventory Fetch Error:", err.response?.status);
      if(err.response?.status === 404) {
         Alert.alert("Error", "Backend path nahi mila. Please /api check karein.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
// 🎯 फिक्स: प्रोडक्ट आईडी के साथ बेस वैरिएंट आईडी को भी सिंक किया भाई ताकि स्टॉक सही जगह अपडेट हो!
  const toggleStock = async (id: string, variantId: string | null, currentName: string, currentStock: number) => {
    const targetId = variantId || id; // अगर वैरिएंट आईडी न हो तो सेफ़्टी के लिए प्रोडक्ट आईडी भाई
    
    Alert.prompt(
      "Update Stock",
      `${currentName} ka naya stock likhein:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async (newStockValue) => {
            const stockNum = Number(newStockValue);
            
            if (isNaN(stockNum) || stockNum < 0) {
              Alert.alert("Error", "Kripya sahi number daalein");
              return;
            }

            try {
              // ✅ बैकएंड के नए वैरिएंट-अवेयर पैच एंडपॉइंट पर हिट मारो भाई
              await api.patch(`/api/products/${id}`, { 
                variantId: targetId,
                stock: stockNum 
              });
              
              Alert.alert("Success", "Stock update ho gaya hai भाई");
              fetchProducts(); 
              
            } catch (err) {
              Alert.alert("Error", "Stock update nahi ho paya");
            }
          }
        }
      ],
      "plain-text",
      currentStock.toString()
    );
  };
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const deleteProduct = (id: string) => {
    Alert.alert(
      "Confirm Delete", 
      "Kya aap is product ko hatana chahte hain?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await api.delete(`/api/products/${id}`);
            fetchProducts();
          } 
        }
      ]
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
// 🎯 फिक्स: नए फ्लैट कीज के आधार पर यूआई मैपिंग भाई!
const renderProduct = ({ item }: any) => {
  const itemStock = Number(item.calculatedStock ?? 0);
  const isOutOfStock = itemStock <= 0;
  const isLowStock = itemStock > 0 && itemStock <= 5;
  const stockColor = isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981';

  return (
    <View style={[styles.card, isOutOfStock && { backgroundColor: '#fdf2f2' }]}>
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image 
            key={`prod-img-${item.id}`}
            source={{ uri: item.image }} 
            style={styles.prodImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackView}>
            <Text style={{fontSize: 10, color: '#94a3b8'}}>No Image</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>SOLD OUT</Text>
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {/* 🎯 बेस वैरिएंट की साइज/यूनिट स्क्रीन पर छोटी सी चमकेगी भाई (जैसे: 1 kg) */}
        <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>({item.baseVariantQty})</Text>
        <Text style={styles.price}>₹{Number(item.displayPrice).toLocaleString()}</Text>
        <View style={styles.stockRow}>
           <View style={[styles.modernBadge, { borderColor: stockColor + '40' }]}>
              <View style={[styles.dot, { backgroundColor: stockColor }]} />
              <Text style={styles.stockText}>{isOutOfStock ? 'Out of Stock' : `${itemStock} Units`}</Text>
           </View>
        </View>
      </View>

      <View style={styles.actionsColumn}>
        {/* Quick Stock Refill Button */}
        <TouchableOpacity 
          style={styles.iconCircle} 
          onPress={() => toggleStock(item.id, item.baseVariantId, item.name, itemStock)}
        >
          <Feather name="refresh-cw" size={16} color="#1e40af" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconCircle} 
          onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
        >
          <Feather name="edit-2" size={16} color="#1e40af" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconCircle, { backgroundColor: isLowStock ? '#fff7ed' : '#f0fdf4' }]} 
          onPress={() => toggleStock(item.id, item.baseVariantId, item.name, itemStock)} 
        >
          <Feather 
            name="plus-circle" 
            size={18} 
            color={isLowStock ? '#ea580c' : '#16a34a'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]} 
          onPress={() => deleteProduct(item.id)}
        >
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;
  }
  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Dukaan Ka Stock</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Product ka naam khojein..." 
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList 
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>Koi product nahi mila</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#fff' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  addBtn: { 
    backgroundColor: '#1e40af', 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  addBtnText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    margin: 15, 
    paddingHorizontal: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  searchInput: { flex: 1, height: 45, marginLeft: 10 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 12, 
    marginBottom: 15, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05 
  },
imageContainer: { 
  width: 90, 
  height: 90, 
  borderRadius: 15, 
  overflow: 'hidden', 
  backgroundColor: '#f8fafc', // Ek halka gray color, koi icon nahi!
  justifyContent: 'center', 
  alignItems: 'center',
  position: 'relative',
},
prodImage: { 
  width: '100%', 
  height: '100%',
  backgroundColor: '#f8fafc' // Agar image load nahi hota toh bhi background dikhega, koi icon nahi!
  // Yahan se absolute, top, left sab hata dein
},
fallbackView: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
outOfStockOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10, // Image ke upar overlay
},
  outOfStockText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modernBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginRight: 6 
  },
  statusBadgeModern: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusTextModern: { 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  actionsColumn: { 
    gap: 10, 
    paddingLeft: 10, 
    borderLeftWidth: 1, 
    borderLeftColor: '#f1f5f9',
    justifyContent: 'center'
  },
  iconCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#eff6ff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // styles mein niche ise badal dein

  info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  price: { fontSize: 15, color: '#1e40af', fontWeight: '700', marginTop: 4 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  stockText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  actions: { justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#f1f5f9', paddingLeft: 12 },
  actionBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 16 }
});