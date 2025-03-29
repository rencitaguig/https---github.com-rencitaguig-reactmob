import React, { useContext, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { CartContext } from "../context/CartContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartScreen() {
  const { cart, removeFromCart, checkout } = useContext(CartContext);
  const [modalVisible, setModalVisible] = useState(false);

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    const userId = await AsyncStorage.getItem('userId'); // Get user ID from async storage
    if (!userId) {
      console.error("No user ID found");
      return;
    }
    checkout(userId);
    setModalVisible(false);
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
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.checkoutText}>
                Checkout • ₱{totalPrice.toFixed(2)}
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
                <Text style={styles.modalPrice}>
                  Total: ${totalPrice.toFixed(2)}
                </Text>
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
  modalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 25,
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
