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
    <View style={styles.container}>
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Your Cart is Empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.details}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.price}>${item.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item._id)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>

          {/* Checkout Modal */}
          <Modal animationType="slide" transparent={true} visible={modalVisible}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Order Summary</Text>
                <Text style={styles.modalText}>Total: ${totalPrice.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCheckout} // Use handleCheckout function
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f8f8" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" }, // Center the empty cart text
  text: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 10, marginVertical: 5, borderRadius: 8 },
  image: { width: 60, height: 60, resizeMode: "contain", marginRight: 10 },
  details: { flex: 1 },
  title: { fontSize: 14, fontWeight: "bold" },
  price: { fontSize: 16, color: "green" },
  removeButton: { backgroundColor: "#FF6347", padding: 8, borderRadius: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
  checkoutButton: { backgroundColor: "#008CBA", padding: 15, borderRadius: 8, marginTop: 20, alignItems: "center" },
  checkoutText: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 20 },
  confirmButton: { backgroundColor: "#008CBA", padding: 10, borderRadius: 5, marginBottom: 10 },
  confirmText: { color: "white", fontSize: 16, fontWeight: "bold" },
  cancelButton: { backgroundColor: "gray", padding: 10, borderRadius: 5 },
  cancelText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
