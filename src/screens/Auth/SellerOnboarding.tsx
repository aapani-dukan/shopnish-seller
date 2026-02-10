import React, { useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Feather from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import * as Location from 'expo-location';
// 📦 Schema: deliveryRadius को number रखा है
const sellerSchema = z.object({
  businessName: z.string().min(3, "Business name too short"),
  description: z.string().min(10, "Describe your shop better"),
  businessAddress: z.string().min(10, "Full address required"),
  city: z.string().min(2, "City required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid Pincode"),
  businessPhone: z.string().regex(/^\d{10}$/, "10 digit phone required"),
  bankAccountNumber: z.string().min(9, "Invalid Account Number"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  deliveryRadius: z.number().min(1, "Radius required").max(100), 
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type SellerFormData = z.infer<typeof sellerSchema>;

export default function SellerOnboarding() {
  const { refreshUserStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
const [isLocating, setIsLocating] = React.useState(false);
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: { 
      businessName: '', 
      city: '', 
      description: '',
      businessAddress: '',
      pincode: '',
      businessPhone: '',
      bankAccountNumber: '',
      ifscCode: '',
      deliveryRadius: 5, 
    }
  });

  
 const detectLocation = async () => {
    try {
      setIsLocating(true);
      
      // 1. परमिशन मांगें
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Shop की लोकेशन के लिए परमिशन ज़रूरी है।");
        setIsLocating(false);
        return;
      }

      // 2. कोऑर्डिनेट्स लें
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { latitude, longitude } = location.coords;
      setValue('latitude', latitude);
      setValue('longitude', longitude);

      // 3. रिवर्स जियोकोडिंग (Coordinates से एड्रेस बनाना)
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        // ऑटो-फिल फॉर्म फील्ड्स
        const autoAddress = `${place.name || ''}, ${place.street || ''}, ${place.district || ''}`;
        setValue('businessAddress', autoAddress);
        setValue('city', place.city || place.subregion || '');
        setValue('pincode', place.postalCode || '');
        
        Alert.alert("Location Detected", "Aapka address auto-fill kar diya gaya hai.");
      }
    } catch (error) {
      Alert.alert("Error", "Location track nahi ho paayi. Kripya manually bharein.");
    } finally {
      setIsLocating(false);
    }
  };

  const onSubmit = async (data: SellerFormData) => {
    // 🛡️ सेफ्टी चेक: अगर अब भी Lat/Lng नहीं है
    if (!data.latitude || !data.longitude) {
      Alert.alert("Location Missing", "Kripya 'Use Current Location' बटन दबाएं या एड्रेस सही से लिखें।");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/sellers/apply', data);
      Alert.alert("Success", "Application submitted! Verification pending.");
      await refreshUserStatus();
    } catch (err) {
      Alert.alert("Error", "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Seller Registration</Text>
      <Text style={styles.headerSub}>Shopnish Premium Seller Portal</Text>

      <View style={styles.formCard}>
        <CustomInput control={control} name="businessName" label="Business Name" icon="shopping-bag" error={errors.businessName} />
        <CustomInput control={control} name="description" label="Shop Description" icon="info" error={errors.description} />
        <CustomInput control={control} name="businessAddress" label="Full Address" icon="map-pin" error={errors.businessAddress} />
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
                <CustomInput control={control} name="city" label="City" icon="map" error={errors.city} />
            </View>
            <View style={{ flex: 1 }}>
                <CustomInput control={control} name="pincode" label="Pincode" icon="hash" keyboardType="numeric" error={errors.pincode} />
            </View>
        </View>

        <CustomInput control={control} name="businessPhone" label="Contact Number" icon="phone" keyboardType="phone-pad" error={errors.businessPhone} />
        <CustomInput control={control} name="bankAccountNumber" label="Bank Account Number" icon="credit-card" keyboardType="numeric" error={errors.bankAccountNumber} />
        <CustomInput control={control} name="ifscCode" label="IFSC Code" icon="info" error={errors.ifscCode} />
        
        {/* Important: deliveryRadius input handled as number */}
        <CustomInput 
          control={control} 
          name="deliveryRadius" 
          label="Delivery Radius (KM)" 
          icon="target" 
          keyboardType="numeric" 
          error={errors.deliveryRadius} 
          isNumber={true} 
        />

        <View style={[styles.locationTag, { backgroundColor: watch('latitude') ? '#dcfce7' : '#fee2e2' }]}>
          <Feather name="crosshair" size={14} color={watch('latitude') ? '#166534' : '#991b1b'} />
          <Text style={{ fontSize: 12, marginLeft: 5, color: watch('latitude') ? '#166534' : '#991b1b' }}>
            {watch('latitude') ? "Location Locked" : "Location Pending (Check Address)"}
          </Text>
        </View>
<TouchableOpacity 
        onPress={detectLocation}
        disabled={isLocating}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F0F9FF',
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#BAE6FD',
          marginBottom: 20,
          justifyContent: 'center'
        }}
      >
        {isLocating ? (
          <ActivityIndicator color="#0369A1" />
        ) : (
          <>
            <Feather name="map-pin" size={18} color="#0369A1" style={{ marginRight: 8 }} />
            <Text style={{ color: '#0369A1', fontWeight: '700' }}>
              Use Current Shop Location
            </Text>
          </>
        )}
      </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#D4AF37" /> : <Text style={styles.btnText}>Register Now</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ✅ Updated CustomInput to handle number conversion safely
const CustomInput = ({ control, name, label, icon, error, isNumber, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, error && { borderColor: '#ef4444' }]}>
      <Feather name={icon} size={18} color="#64748b" style={{ marginRight: 10 }} />
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput 
            style={styles.input} 
            value={value?.toString()} 
            onChangeText={(text) => onChange(isNumber ? (parseFloat(text) || 0) : text)} 
            placeholder={`Enter ${label}`} 
            placeholderTextColor="#cbd5e1" 
            {...props} 
          />
        )}
      />
    </View>
    {error && <Text style={styles.errorText}>{error.message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001B3A' },
  content: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#D4AF37' },
  headerSub: { color: '#fff', fontSize: 14, marginBottom: 30, opacity: 0.8 },
  formCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 10 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15 },
  input: { flex: 1, height: 50, color: '#0f172a', fontSize: 15 },
  submitBtn: { backgroundColor: '#001B3A', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 18 },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 3, marginLeft: 5 },
  locationTag: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10, marginTop: 10 }
});