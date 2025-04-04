import React, { useContext, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { CartContext } from "../context/CartContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import * as SecureStore from "expo-secure-store"; // Import Secure Store

export default function CartScreen() {
  const { cart, removeFromCart, checkout } = useContext(CartContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const { discounts } = useSelector((state) => state.discounts);

  const handleCheckout = async () => {
    const userId = await SecureStore.getItemAsync('userId'); // Use Secure Store to get userId
    if (!userId) {
      Alert.alert("Error", "No user ID found. Please log in again.");
      return; // Exit if userId is not found
    }
    checkout();
    setModalVisible(false);
  };

  const applyDiscount = () => {
    const discount = discounts.find(
      d => d.code === discountCode.trim().toUpperCase() && 
      d.isActive && 
      new Date(d.expiryDate) > new Date()
    );

    if (discount) {
      setAppliedDiscount(discount);
      setDiscountCode('');
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid discount code');
    }
  };

  const calculateFinalPrice = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    if (appliedDiscount) {
      const discountAmount = (subtotal * appliedDiscount.percentage) / 100;
      return subtotal - discountAmount;
    }
    return subtotal;
  };

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your Cart is Empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.details}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.price}>₱{item.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item._id)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.checkoutContainer}>
            <View style={styles.discountSection}>
              <TextInput
                style={styles.discountInput}
                placeholder="Enter discount code"
                value={discountCode}
                onChangeText={setDiscountCode}
                placeholderTextColor="#8D6E63"
              />
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyDiscount}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {appliedDiscount && (
              <View style={styles.discountInfo}>
                <Text style={styles.discountText}>
                  Discount applied: {appliedDiscount.percentage}% OFF
                </Text>
                <TouchableOpacity 
                  style={styles.removeDiscountButton}
                  onPress={() => setAppliedDiscount(null)}
                >
                  <Text style={styles.removeDiscountText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.checkoutText}>
                Checkout • ₱{calculateFinalPrice().toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal 
            animationType="slide" 
            transparent={true} 
            visible={modalVisible}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>
                    ₱{cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </Text>
                </View>
                {appliedDiscount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount ({appliedDiscount.percentage}%):</Text>
                    <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                      -₱{((cart.reduce((sum, item) => sum + item.price, 0) * appliedDiscount.percentage) / 100).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>₱{calculateFinalPrice().toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.confirmText}>Confirm Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100, // Space for checkout button
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3E2723',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 12,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
  },
  removeButton: {
    backgroundColor: '#D7CCC8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: '#3E2723',
    fontWeight: '600',
    fontSize: 14,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  discountSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    color: '#3E2723',
  },
  applyButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  discountText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  removeDiscountButton: {
    padding: 8,
  },
  removeDiscountText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#8B4513',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#5D4037',
  },
  summaryValue: {
    fontSize: 16,
    color: '#3E2723',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#D7CCC8',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E2723',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    marginBottom: 12,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#D7CCC8',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  cancelText: {
    color: '#3E2723',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
