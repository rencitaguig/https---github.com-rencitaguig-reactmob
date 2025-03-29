import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from "react-native";
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchOrders, updateOrderStatus } from "../store/orderSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config";
import { LinearGradient } from 'expo-linear-gradient';

const windowHeight = Dimensions.get('window').height;

export default function AdminScreen() {
  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem("token");
      dispatch(fetchOrders(token));
    };
    fetchData();
  }, [dispatch]);

  const handleImagePick = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImage(result);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setMessage("Failed to pick image.");
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    if (image) {
      formData.append("image", {
        uri: image.uri,
        type: 'image/jpeg',
        name: image.uri.split('/').pop(),
      });
    }

    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        setMessage("No token found. Please log in again.");
        return;
      }
      const res = await axios.post(`${BASE_URL}/api/products`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${storedToken}`
        },
      });
      setMessage("Product created successfully!");
    } catch (error) {
      console.error("Error creating product:", error.response ? error.response.data : error.message);
      setMessage("Error creating product.");
    }
  };

  const handleUpdateOrderStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await dispatch(updateOrderStatus({ orderId: selectedOrder, status, token }));
      setUpdateMessage("Order status updated successfully!");
      setSelectedOrder(null); // Clear selection after update
      setTimeout(() => setUpdateMessage(""), 3000); // Clear message after 3 seconds
    } catch (error) {
      setUpdateMessage("Failed to update order status.");
      console.error("Error updating order:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#FFA000';
      case 'Shipped':
        return '#1E88E5';
      case 'Delivered':
        return '#43A047';
      case 'Cancelled':
        return '#E53935';
      default:
        return '#757575';
    }
  };

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
       

        <View style={styles.orderStatusContainer}>
          <Text style={styles.sectionTitle}>Manage Orders</Text>
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => setSelectedOrder(item._id)}
                style={[
                  styles.orderCard,
                  selectedOrder === item._id && styles.selectedOrderCard
                ]}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderIdText}>Order #{item._id.slice(-6)}</Text>
                  <View style={[styles.statusBadge, 
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.orderAmount}>
                  ₱{item.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.ordersList}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />
          
          {selectedOrder && (
            <View style={styles.updateStatusSection}>
              <Text style={styles.updateTitle}>Update Order Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={status}
                  onValueChange={(itemValue) => setStatus(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#8B4513"
                  mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
                  itemStyle={{ 
                    fontSize: 16,
                    height: 120,
                    color: '#3E2723'
                  }}
                >
                  <Picker.Item label="Pending" value="Pending" color="#3E2723" />
                  <Picker.Item label="Shipped" value="Shipped" color="#3E2723" />
                  <Picker.Item label="Delivered" value="Delivered" color="#3E2723" />
                  <Picker.Item label="Cancelled" value="Cancelled" color="#3E2723" />
                </Picker>
              </View>
              <TouchableOpacity 
                style={styles.updateButton} 
                onPress={handleUpdateOrderStatus}
              >
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>
              {updateMessage ? (
                <Text style={[styles.message, { marginTop: 10 }]}>{updateMessage}</Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30, // Reduced padding
  },
  formContainer: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    margin: 10,
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 20,
  },
  input: {
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#8D6E63',
    padding: 12,
    borderRadius: 24,
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#5D4037',
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: '#5D4037',
    marginTop: 10,
    fontSize: 16,
  },
  orderStatusContainer: {
    flex: 1, // Add flex
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    margin: 10,
    marginTop: 5,
  },
  ordersList: {
    flexGrow: 1, // Allow list to grow
    marginBottom: 10,
    height: windowHeight * 0.6, // Set height to 60% of screen height
  },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8D6E63',
  },
  selectedOrderCard: {
    backgroundColor: '#D7CCC8',
    borderLeftColor: '#5D4037',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  orderDate: {
    color: '#8D6E63',
    fontSize: 14,
  },
  orderAmount: {
    color: '#3E2723',
    fontSize: 14,
    fontWeight: '600',
  },
  updateStatusSection: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: '100%',
    backgroundColor: 'transparent',
    color: '#3E2723',
  },
  updateButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
