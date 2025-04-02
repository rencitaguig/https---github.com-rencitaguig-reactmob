import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Platform,
  RefreshControl,
  Image
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { OrderContext } from "../context/OrderContext";
import { ProductContext } from "../context/ProductContext";
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from 'react-redux';
import { fetchProducts as fetchHomeProducts } from '../store/productSlice';
import { Camera } from 'expo-camera';

const windowHeight = Dimensions.get('window').height;

export default function AdminScreen() {
  const dispatch = useDispatch();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("Pending");
  const { orders, updateOrderStatus, fetchOrders } = useContext(OrderContext);
  const [message, setMessage] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSection, setShowSection] = useState('orders'); // 'orders' or 'products'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { products, fetchProducts, createProduct, updateProduct, deleteProduct } = useContext(ProductContext);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [createProductMessage, setCreateProductMessage] = useState("");
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    fetchProducts();
    (async () => {
      // Request permissions for both camera and media library
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      
      if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
        alert('Sorry, we need camera and media library permissions!');
      }
      setCameraPermission(cameraStatus === 'granted');
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(); // Fetch updated orders
    setRefreshing(false);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) {
      setMessage("Please select an order.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setMessage("No token found. Please log in again.");
        return;
      }
      await updateOrderStatus(selectedOrder, status, token);
      setUpdateMessage("Order status updated successfully!");
      setSelectedOrder(null); // Clear selection after update
      setTimeout(() => setUpdateMessage(""), 3000); // Clear message after 3 seconds
    } catch (error) {
      setUpdateMessage("Failed to update order status.");
      console.error("Error updating order:", error);
    }
  };

  const compressAndResizeImage = async (imageUri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 500 } }], // Reduced width to 500
        { 
          compress: 0.5, // Increased compression (50%)
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      return manipulatedImage;
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduced quality
      });

      if (!result.canceled) {
        const compressedImage = await compressAndResizeImage(result.assets[0].uri);
        
        // Check file size before setting
        const base64Length = compressedImage.base64.length;
        const fileSizeInMB = (base64Length * (3/4)) / (1024*1024);
        
        if (fileSizeInMB > 1) { // If larger than 1MB
          throw new Error('Image size too large. Please choose a smaller image.');
        }

        setProductImage({
          uri: compressedImage.uri,
          base64: compressedImage.base64
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      // Show error message to user
      setCreateProductMessage(error.message || "Failed to pick image. Please try again.");
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        const compressedImage = await compressAndResizeImage(result.assets[0].uri);
        
        // Check file size before setting
        const base64Length = compressedImage.base64.length;
        const fileSizeInMB = (base64Length * (3/4)) / (1024*1024);
        
        if (fileSizeInMB > 1) {
          throw new Error('Image size too large. Please choose a smaller image.');
        }

        setProductImage({
          uri: compressedImage.uri,
          base64: compressedImage.base64
        });
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      setCreateProductMessage(error.message || "Failed to take picture. Please try again.");
    }
  };

  const handleProductAction = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setCreateProductMessage("No token found. Please log in again.");
        return;
      }

      // Validate inputs
      if (!productName || !productPrice || !productCategory) {
        setCreateProductMessage("Name, price, and category are required.");
        return;
      }

      const productData = {
        name: productName,
        description: productDescription,
        price: productPrice,
        category: productCategory,
      };

      // Check image size before adding to request
      if (productImage?.base64) {
        const base64Length = productImage.base64.length;
        const fileSizeInMB = (base64Length * (3/4)) / (1024*1024);
        
        if (fileSizeInMB > 1) {
          setCreateProductMessage("Image size too large. Please choose a smaller image.");
          return;
        }
        productData.image = `data:image/jpeg;base64,${productImage.base64}`;
      }

      if (isEditing) {
        await updateProduct(selectedProduct._id, productData, token);
        setCreateProductMessage("Product updated successfully!");
      } else {
        await createProduct(productData, token);
        setCreateProductMessage("Product created successfully!");
      }

      // Clear form and refresh
      setProductName("");
      setProductDescription("");
      setProductPrice("");
      setProductCategory("");
      setProductImage(null);
      setSelectedProduct(null);
      setIsEditing(false);
      setTimeout(() => setCreateProductMessage(""), 3000);
      await fetchProducts();
      dispatch(fetchHomeProducts());

    } catch (error) {
      const errorMessage = error.response?.status === 413 
        ? "Image size too large. Please choose a smaller image."
        : isEditing ? "Failed to update product." : "Failed to create product.";
      setCreateProductMessage(errorMessage);
      console.error("Error with product:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await deleteProduct(productId, token);
      setCreateProductMessage("Product deleted successfully!");
      setTimeout(() => setCreateProductMessage(""), 3000);
      dispatch(fetchHomeProducts()); // Refresh products in HomeScreen
    } catch (error) {
      setCreateProductMessage("Failed to delete product.");
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || '');
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setIsEditing(true);
  };

  const getStatusColor = (orderStatus) => {
    switch (orderStatus) {
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

  const renderProductsList = () => {
    return (
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {item.image && (
              <Image 
                source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }} 
                style={styles.productImage} 
              />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>₱{item.price}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleEditProduct(item)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => handleDeleteProduct(item._id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  const renderProductForm = () => (
    <View style={styles.createProductSection}>
      <Text style={styles.sectionTitle}>
        {isEditing ? 'Edit Product' : 'Create New Product'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
      />
      <TextInput
        style={styles.input}
        placeholder="Product Description"
        value={productDescription}
        onChangeText={setProductDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Product Price"
        value={productPrice}
        onChangeText={setProductPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Product Category"
        value={productCategory}
        onChangeText={setProductCategory}
      />
      <View style={styles.imageButtonsContainer}>
        <TouchableOpacity 
          style={[styles.imageButton, { marginRight: 5 }]} 
          onPress={pickImage}
        >
          <Text style={styles.imageButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.imageButton, { marginLeft: 5 }]} 
          onPress={takePicture}
        >
          <Text style={styles.imageButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      {productImage && (
        <Image
          source={{ uri: productImage.uri }}
          style={styles.imagePreview}
        />
      )}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleProductAction}
      >
        <Text style={styles.buttonText}>
          {isEditing ? 'Update Product' : 'Create Product'}
        </Text>
      </TouchableOpacity>
      {createProductMessage ? (
        <Text style={[styles.message, { marginTop: 10 }]}>{createProductMessage}</Text>
      ) : null}
    </View>
  );

  const renderContent = () => {
    return (
      <LinearGradient
        colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
        style={styles.container}
      >
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              showSection === 'orders' && styles.segmentButtonActive
            ]}
            onPress={() => setShowSection('orders')}
          >
            <Text style={[
              styles.segmentButtonText,
              showSection === 'orders' && { color: '#FFF' }
            ]}>Manage Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              showSection === 'products' && styles.segmentButtonActive
            ]}
            onPress={() => setShowSection('products')}
          >
            <Text style={[
              styles.segmentButtonText,
              showSection === 'products' && { color: '#FFF' }
            ]}>Manage Products</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={['#8B4513']}
              tintColor="#8B4513"
            />
          }
        >
          {showSection === 'orders' ? (
            <View style={styles.orderStatusContainer}>
              <Text style={styles.sectionTitle}>Manage Orders</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Text style={styles.refreshButtonText}>Refresh Orders</Text>
              </TouchableOpacity>
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
                      <View style={[
                        styles.statusBadge, 
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
                nestedScrollEnabled={true}
                scrollEnabled={false} // Disable FlatList scroll
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
          ) : (
            <View style={styles.productsContainer}>
              <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.productCard}>
                    {item.image && (
                      <Image 
                        source={{ uri: item.image.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}` }} 
                        style={styles.productImage} 
                      />
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>₱{item.price}</Text>
                      <Text style={styles.productCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleEditProduct(item)}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleDeleteProduct(item._id)}
                      >
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                scrollEnabled={false} // Disable FlatList scroll
                nestedScrollEnabled={true}
              />
              {renderProductForm()}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    );
  };

  return <View style={{ flex: 1 }}>{renderContent()}</View>;
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
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 20,
  },
  ordersList: {
    marginBottom: 10,
    height: 'auto',
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
  orderStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    margin: 10,
    marginTop: 5,
    padding: 15,
    paddingBottom: 30,
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
  refreshButton: {
    backgroundColor: '#8B4513',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    margin: 15,
    marginBottom: 5,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 5,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
  },
  segmentButtonText: {
    color: '#3E2723',
    fontWeight: '600',
  },
  productsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    margin: 10,
    marginTop: 5,
    padding: 15,
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
  },
  productPrice: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  productCategory: {
    fontSize: 12,
    color: '#5D4037',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  createProductSection: {
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
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  createButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  imagePickerButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
    resizeMode: 'cover',
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
