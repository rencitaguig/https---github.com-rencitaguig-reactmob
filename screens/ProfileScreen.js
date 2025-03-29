import React, { useState, useEffect, useContext } from "react";
import { View, TextInput, Button, Text, Image, StyleSheet, FlatList, Modal, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config"; // Import BASE_URL
import { OrderContext } from "../context/OrderContext"; // Import OrderContext
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showOrders, setShowOrders] = useState(true); // State to toggle orders visibility
  const { orders, fetchOrders } = useContext(OrderContext); // Use OrderContext
  const [selectedOrder, setSelectedOrder] = useState(null); // State for selected order
  const [reviewModalVisible, setReviewModalVisible] = useState(false); // State for review modal visibility
  const [rating, setRating] = useState(0); // State for rating
  const [comment, setComment] = useState(""); // State for comment

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (token && userId) {
        setLoggedIn(true);
        const user = await axios.get(`${BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(user.data.name);
        setProfileImage(user.data.profileImage);
        fetchOrders(); // Fetch orders
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user._id);
      setProfileImage(user.profileImage);
      setUserName(user.name);
      setLoggedIn(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged in successfully! 👋',
        visibilityTime: 3000,
        position: 'top',
      });
      fetchOrders();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to login. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const handleRegister = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (image) {
      const imageData = new FormData();
      imageData.append("file", {
        uri: image.uri ? image.uri.replace("file://", "") : "",
        type: 'image/jpeg',
        name: image.uri ? image.uri.split('/').pop() : 'image.jpg',
      });
      imageData.append("upload_preset", "ml_default");

      try {
        const res = await axios.post("https://api.cloudinary.com/v1_1/dv4vzq7pv/image/upload", imageData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        formData.append("profileImage", res.data.secure_url);
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.response ? error.response.data : error.message);
        setMessage("Error uploading image.");
        return;
      }
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registration successful! Please login.',
        visibilityTime: 3000,
        position: 'top',
      });
      setIsLogin(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to register. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    setLoggedIn(false);
    setUserName("");
    setProfileImage(null);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Logged out successfully! 👋',
      visibilityTime: 3000,
      position: 'top',
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images, // Updated from MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) { // Note: changed from 'cancelled' to 'canceled'
        setImage(result.assets[0]); // Updated to use assets array
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setMessage("Failed to pick image.");
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const reviewData = {
        userId,
        productId: selectedOrder.items[0].productId,
        rating,
        comment,
      };
      await axios.post(`${BASE_URL}/api/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Review submitted successfully! 🌟',
        visibilityTime: 3000,
        position: 'top',
      });
      setReviewModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit review. Please try again.',
        visibilityTime: 3000,
        position: 'top',
      });
      console.error("Error submitting review:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
        style={styles.gradientBackground}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')} // Make sure to add your logo file
            style={styles.logo}
          />
        </View>
        
        {loggedIn ? (
          <View style={styles.profileContainer}>
            {profileImage && (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage} 
              />
            )}
            <Text style={styles.welcomeText}>Welcome, {userName}</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setShowOrders(!showOrders)}
            >
              <Text style={styles.buttonText}>
                {showOrders ? "Hide Orders" : "Show Orders"}
              </Text>
            </TouchableOpacity>
            
            {showOrders && (
              <>
                <Text style={styles.sectionTitle}>Your Orders</Text>
                <FlatList
                  data={orders}
                  keyExtractor={(item) => item._id ? item._id.toString() : "undefined"}
                  renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
                        <View style={[styles.statusBadge, 
                          { backgroundColor: item.status === "Delivered" ? "#8D6E63" : "#BCAAA4" }
                        ]}>
                          <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.totalPrice}>₱{item.totalPrice.toFixed(2)}</Text>
                      </View>

                      <View style={styles.itemsList}>
                        {item.items.map((orderItem) => (
                          <View 
                            key={orderItem.productId} 
                            style={styles.itemCard}
                          >
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{orderItem.name}</Text>
                              <Text style={styles.itemQuantity}>Qty: {orderItem.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₱{orderItem.price}</Text>
                          </View>
                        ))}
                      </View>

                      {item.status === "Delivered" && (
                        <TouchableOpacity
                          style={styles.reviewButton}
                          onPress={() => {
                            setSelectedOrder(item);
                            setReviewModalVisible(true);
                          }}
                        >
                          <Text style={styles.reviewButtonText}>Write a Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              </>
            )}
          </View>
        ) : (
          <View style={styles.profileContainer}>
            {isLogin ? (
              <>
                <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
                <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setIsLogin(false)}>
                  <Text style={styles.buttonText}>Switch to Register</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
                <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
                <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                  <Text style={styles.buttonText}>Choose Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                  <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setIsLogin(true)}>
                  <Text style={styles.buttonText}>Switch to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        {message ? <Text>{message}</Text> : null}

        {/* Review Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reviewModalVisible}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <TextInput
                  placeholder="Rating (1-5)"
                  value={rating.toString()}
                  onChangeText={setRating}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#3E2723"
                />
                <TextInput
                  placeholder="Comment"
                  value={comment}
                  onChangeText={setComment}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#3E2723"
                />
                <TouchableOpacity style={styles.button} onPress={handleReviewSubmit}>
                  <Text style={styles.buttonText}>Submit Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { marginBottom: 20 }]} onPress={() => setReviewModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
        <Toast />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    marginBottom: 1,
  },
  logo: {
    width: 350,
    height: 190,
    resizeMode: 'contain',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginTop: 40,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E2723',
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'rgba(62, 39, 35, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
  },
  orderDate: {
    color: '#8D6E63',
    fontSize: 14,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E2723',
  },
  itemsList: {
    marginTop: 12,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#5D4037',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#8D6E63',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3E2723',
  },
  reviewButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 15,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '100%',
    height: 55,
    borderRadius: 30,
    paddingHorizontal: 25,
    marginBottom: 15,
    fontSize: 16,
    color: '#3E2723',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 25,
    textAlign: 'center',
  },
});
