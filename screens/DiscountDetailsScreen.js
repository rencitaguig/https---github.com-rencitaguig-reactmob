import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BASE_URL from '../config';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscountById } from '../store/discountSlice';

export default function DiscountDetailsScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const { discountId } = route.params;
  
  // Get discount from Redux store
  const discount = useSelector(state => 
    state.discounts.discounts.find(d => d._id === discountId)
  );

  useEffect(() => {
    const loadDiscount = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Authentication required'
          });
          navigation.goBack();
          return;
        }

        // Dispatch action to fetch discount details
        await dispatch(fetchDiscountById({ id: discountId, token })).unwrap();
        setLoading(false);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load discount details'
        });
        navigation.goBack();
      }
    };

    loadDiscount();
  }, [discountId, dispatch]);

  // Update the copy function to show success message
  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(discount.code);
      Toast.show({
        type: 'success',
        text1: 'Code Copied!',
        text2: 'Discount code has been copied to clipboard',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to copy code',
      });
    }
  };

  const shareDiscount = async () => {
    try {
      await Share.share({
        message: `Get ${discount.percentage}% off with code: ${discount.code}\nValid until ${new Date(discount.expiryDate).toLocaleDateString()}`,
      });
    } catch (error) {
      console.error('Error sharing discount:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']} style={styles.container}>
        <ActivityIndicator size="large" color="#8B4513" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Discount Details</Text>
          <TouchableOpacity onPress={shareDiscount}>
            <FontAwesome name="share-alt" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.codeContainer} onPress={copyCode}>
          <View>
            <Text style={styles.label}>Tap to copy discount code</Text>
            <Text style={styles.codeText}>{discount?.code}</Text>
          </View>
          <FontAwesome name="copy" size={24} color="#8B4513" />
        </TouchableOpacity>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Discount Amount</Text>
          <Text style={styles.valueText}>{discount?.percentage}% OFF</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Valid Until</Text>
          <Text style={styles.valueText}>
            {new Date(discount?.expiryDate).toLocaleDateString()}
          </Text>
        </View>

        {!discount?.isActive && (
          <View style={styles.inactiveContainer}>
            <FontAwesome name="exclamation-triangle" size={20} color="#F44336" />
            <Text style={styles.inactiveText}>This discount is no longer active</Text>
          </View>
        )}
      </View>
      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#5D4037',
    marginBottom: 5,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  detailRow: {
    marginBottom: 15,
  },
  valueText: {
    fontSize: 18,
    color: '#3E2723',
    fontWeight: '500',
  },
  inactiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  inactiveText: {
    color: '#F44336',
    marginLeft: 10,
    fontSize: 16,
  },
});
