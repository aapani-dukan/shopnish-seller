import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Image, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../../services/api';

export default function InventoryScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async () => {
  try {
    // 1. पाथ को सही किया (/api जोड़ा)
    const response = await api.get('/api/products/seller'); 
    
    // 2. डेटा हैंडलिंग (चेक करें कि रिस्पॉन्स में products है या सीधा एरे)
    const data = response.data.products || response.data;
    setProducts(data);
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
// 3. टॉगल स्टॉक फंक्शन (Zomato जैसा "Quick Stock Update")
const toggleStock = async (id: string, currentName: string, currentStock: number) => {
  // Hum Alert.prompt use kar sakte hain (iOS/Android custom logic) 
  // ya fir ek simple prompt
  Alert.prompt(
    "Update Stock",
    `${currentName} ka naya stock likhein:`,
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Update",
        onPress: async (newStockValue) => {
          const stockNum = Number(newStockValue);
          
          if (isNaN(stockNum) || stockNum < 0) {
            Alert.alert("Error", "Kripya sahi number daalein");
            return;
          }

          try {
            // Backend call jo humne pehle fix ki thi
            await api.patch(`/api/products/${id}`, { stock: stockNum });
            
            // ✅ SUCCESS FEEDBACK
            Alert.alert("Success", "Stock update ho gaya hai");
            fetchProducts(); // List refresh
            
          } catch (err) {
            Alert.alert("Error", "Stock update nahi ho paya");
          }
        }
      }
    ],
    "plain-text",
    currentStock.toString() // Default value purana stock dikhayega
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
// renderProduct function ke andar ye badlav karein:

const renderProduct = ({ item }: any) => {
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5; // ✅ High-Class Alert
  
  const statusColor = item.approvalStatus === 'approved' ? '#10b981' : '#f59e0b';
  // Stock text color logic
  const stockColor = isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981';

  return (
    <View style={[styles.card, isOutOfStock && { backgroundColor: '#fdf2f2' }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.img} />
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>SOLD OUT</Text>
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>₹{Number(item.price).toLocaleString()}</Text>
        
        <View style={styles.stockRow}>
          {/* ✅ Improved Stock Badge */}
          <View style={[styles.modernBadge, { borderColor: stockColor + '40' }]}>
            <View style={[styles.dot, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: '#1e293b' }]}>
              {isOutOfStock ? 'Out of Stock' : `${item.stock} Units`}
              {isLowStock && ' (Low)'} 
            </Text>
          </View>

          <View style={[styles.statusBadgeModern, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusTextModern, { color: statusColor }]}>
              {item.approvalStatus === 'approved' ? 'LIVE' : 'PENDING'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsColumn}>
        {/* Quick Stock Refill Button (Zomato Style) */}
        <TouchableOpacity 
          style={styles.iconCircle} 
         onPress={() => toggleStock(item.id, item.name, item.stock)}
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
  onPress={() => toggleStock(item.id, item.name, item.stock)} // ✅ Updated call
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
    position: 'relative',
    width: 90,
    height: 90,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // हल्का काला पर्दा
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
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
  img: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9' },
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