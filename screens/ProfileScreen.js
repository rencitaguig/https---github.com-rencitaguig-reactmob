import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../config"; // Import BASE_URL
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { CartContext } from "../context/CartContext"; // Import CartContext
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as ImageManipulator from "expo-image-manipulator"; // Import ImageManipulator
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-facebook';
import * as Google from 'expo-auth-session/providers/google';
import { storeSecureItem, getSecureItem, removeSecureItem } from '../utils/secureStorage';

WebBrowser.maybeCompleteAuthSession();

const FB_APP_ID = 'your_facebook_app_id';
const GOOGLE_CLIENT_ID = 'your_google_client_id';
const GOOGLE_ANDROID_CLIENT_ID = 'your_android_client_id';

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
  const [showOrders, setShowOrders] = useState(true); // Toggle orders visibility
  const [userOrders, setUserOrders] = useState([]); // User-specific orders
  const [selectedOrder, setSelectedOrder] = useState(null); // Selected order for review
  const [reviewModalVisible, setReviewModalVisible] = useState(false); // Review modal visibility
  const [rating, setRating] = useState(0); // Rating state
  const [comment, setComment] = useState(""); // Comment state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [type, setType] = useState('back'); // Use string directly instead of CameraType.back

  const { setOnOrderPlaced } = useContext(CartContext); // Access CartContext
  const { setUserRole } = useContext(AuthContext); // Access AuthContext

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await getSecureItem('token');
      const userId = await getSecureItem('userId');
      if (token && userId) {
        console.log('User is logged in with token:', token); // Add this line
        setLoggedIn(true);
        try {
          const userRes = await axios.get(`${BASE_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserName(userRes.data.name);
          setProfileImage(userRes.data.profileImage);
          fetchUserOrders(userId, token); // Fetch orders for the logged-in user
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    checkLoginStatus();

    // Set the callback to refresh orders when a new order is placed
    setOnOrderPlaced(() => async () => {
      const token = await getSecureItem('token');
      const userId = await getSecureItem('userId');
      if (token && userId) {
        fetchUserOrders(userId, token);
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshOrders = async () => {
        const token = await getSecureItem('token');
        const userId = await getSecureItem('userId');
        if (token && userId) {
          fetchUserOrders(userId, token); // Fetch updated orders when screen is focused
        }
      };
      refreshOrders();
    }, [])
  );

  const fetchUserOrders = async (userId, token) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredOrders = response.data.filter(
        (order) => order.userId._id === userId
      );
      setUserOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = res.data;
      
      console.log('Login successful, token:', token); // Add this line
      
      await storeSecureItem('token', token);
      await storeSecureItem('userId', user._id);
      await storeSecureItem('userRole', user.role);
      setUserRole(user.role);
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
      fetchUserOrders(user._id, token);
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

  const handleFacebookLogin = async () => {
    try {
      await Facebook.initializeAsync({ appId: FB_APP_ID });
      const { type, token } = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });

      if (type === 'success') {
        const response = await fetch(`${BASE_URL}/api/auth/facebook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        await storeSecureItem('token', data.token);
        await storeSecureItem('userId', data.user._id);
        await storeSecureItem('userRole', data.user.role);
        
        setUserRole(data.user.role);
        setProfileImage(data.user.profileImage);
        setUserName(data.user.name);
        setLoggedIn(true);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in with Facebook! 👋',
          visibilityTime: 3000,
          position: 'top',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Facebook login failed',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const response = await fetch(`${BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: result.authentication.accessToken }),
        });
        
        const data = await response.json();
        await storeSecureItem('token', data.token);
        await storeSecureItem('userId', data.user._id);
        await storeSecureItem('userRole', data.user.role);
        
        setUserRole(data.user.role);
        setProfileImage(data.user.profileImage);
        setUserName(data.user.name);
        setLoggedIn(true);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged in with Google! 👋',
          visibilityTime: 3000,
          position: 'top',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Google login failed',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const compressAndResizeImage = async (imageUri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 600 } }], // Resize to smaller width
        { 
          compress: 0.5, // Reduce quality to 50%
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
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setMessage("Failed to pick image.");
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera permission is required',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        cameraType: type, // Use the string value directly
      });

      if (!result.canceled) {
        try {
          const processedImage = await compressAndResizeImage(result.assets[0].uri);
          setImage({
            uri: processedImage.uri,
            base64: processedImage.base64
          });
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to process image',
          });
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take picture',
      });
    }
  };

  const takeEditPicture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera permission is required',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        try {
          const processedImage = await compressAndResizeImage(result.assets[0].uri);
          setEditImage({
            uri: processedImage.uri,
            base64: processedImage.base64
          });
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to process image',
          });
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take picture',
      });
    }
  };

  const handleRegister = async () => {
    try {
      if (!name || !email || !password) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill in all fields',
        });
        return;
      }

      const formData = {
        name,
        email,
        password,
      };

      if (image?.base64) {
        // Ensure the base64 string isn't too long
        if (image.base64.length > 1000000) { // If larger than ~1MB
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Image size too large. Please choose a smaller image.',
          });
          return;
        }
        formData.profileImage = `data:image/jpeg;base64,${image.base64}`;
      }

      const response = await axios.post(`${BASE_URL}/api/auth/register`, formData, {
        headers: { 
          "Content-Type": "application/json"
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Registration successful! Please login.',
        });
        setIsLogin(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      console.error("Registration error:", error.response?.data || error.message);
    }
  };

  const handleLogout = async () => {
    await removeSecureItem('token');
    await removeSecureItem('userId');
    await removeSecureItem('userRole');
    setUserRole(null);
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

  const handleReviewSubmit = async () => {
    try {
      const token = await getSecureItem('token');
      const userId = await getSecureItem('userId');
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

  const handleEditProfile = () => {
    setEditName(userName);
    setEditEmail(email);
    setIsEditing(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await getSecureItem('token');
      const userId = await getSecureItem('userId');
      
      const updateData = {
        name: editName,
        email: editEmail,
      };

      if (editImage) {
        updateData.profileImage = `data:image/jpeg;base64,${editImage.base64}`;
      }

      const response = await axios.put(
        `${BASE_URL}/api/auth/profile`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUserName(response.data.name);
      setEmail(response.data.email);
      if (response.data.profileImage) {
        setProfileImage(response.data.profileImage);
      }
      
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully! 👋',
        visibilityTime: 3000,
        position: 'top',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile',
        visibilityTime: 3000,
        position: 'top',
      });
    }
  };

  const pickEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        setEditImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
        visibilityTime: 3000,
      });
    }
  };

  const renderEditProfile = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEditing}
      onRequestClose={() => setIsEditing(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          
          {/* Preview current image */}
          {editImage ? (
            <Image source={{ uri: editImage.uri }} style={styles.editImagePreview} />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.editImagePreview} />
          ) : null}

          {/* Image selection buttons */}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={pickEditImage}>
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={takeEditPicture}>
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={editName}
            onChangeText={setEditName}
            placeholderTextColor="#8D6E63"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editEmail}
            onChangeText={setEditEmail}
            keyboardType="email-address"
            placeholderTextColor="#8D6E63"
          />
          
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setIsEditing(false)}
          >
            <Text style={[styles.buttonText, { color: '#3E2723' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderRegistrationForm = () => (
    <>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <View style={styles.imageButtonsContainer}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={takePicture}>
          <Text style={styles.imageButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      {image && (
        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
      )}
      <Button title="Register" onPress={handleRegister} />
      <Button title="Switch to Login" onPress={() => setIsLogin(true)} />
    </>
  );

  const renderOrders = () => {
    if (!userOrders || userOrders.length === 0) {
      return <Text>No orders found.</Text>;
    }

    return (
      <>
        <Text style={styles.text}>Your Orders:</Text>
        <FlatList
          data={userOrders}
          keyExtractor={(item) => (item._id ? item._id.toString() : "undefined")}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>Order ID: {item._id}</Text>
              <Text style={styles.orderText}>Total Price: ${item.totalPrice}</Text>
              <Text style={styles.orderText}>Status: {item.status}</Text>
              <FlatList
                data={item.items}
                keyExtractor={(item) => (item.productId ? item.productId.toString() : "undefined")}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Text style={styles.itemText}>Quantity: {item.quantity}</Text>
                    <Text style={styles.itemText}>Price: ${item.price}</Text>
                  </View>
                )}
              />
              {item.status === "Delivered" && (
                <Button
                  title="Write a Review"
                  onPress={() => {
                    setSelectedOrder(item);
                    setReviewModalVisible(true);
                  }}
                />
              )}
            </View>
          )}
        />
      </>
    );
  };

  return (
    <LinearGradient 
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.gradientBackground}
    >
      <View style={styles.container}>
        {loggedIn ? (
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.text}>Welcome, {userName}</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
            {profileImage && <Image source={{ uri: profileImage }} style={styles.profileImage} />}
            <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <Button title={showOrders ? "Hide Orders" : "Show Orders"} onPress={() => setShowOrders(!showOrders)} />
            {showOrders && renderOrders()}
            {renderEditProfile()}
          </>
        ) : (
          <View style={styles.authContainer}>
            {/* Social Login/Register Buttons First */}
            <View style={styles.socialButtonsContainer}>
              <Text style={styles.authTitle}>Welcome to Our App</Text>
              <Text style={styles.authSubtitle}>Continue with</Text>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]} 
                onPress={handleGoogleLogin}
              >
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]} 
                onPress={handleFacebookLogin}
              >
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>

            {/* Email Login/Register Form */}
            {isLogin ? (
              <View style={styles.formContainer}>
                <TextInput 
                  placeholder="Email" 
                  value={email} 
                  onChangeText={setEmail} 
                  style={styles.input}
                  placeholderTextColor="#8D6E63"
                />
                <TextInput 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  style={styles.input}
                  placeholderTextColor="#8D6E63"
                />
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.switchButton} 
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={styles.switchButtonText}>Don't have an account? Register</Text>
                </TouchableOpacity>
              </View>
            ) : (
              renderRegistrationForm()
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  gradientBackground: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    color: '#3E2723',
    marginBottom: 10,
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
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginVertical: 20,
    alignSelf: 'center',
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
  orderText: {
    fontSize: 16,
    color: '#3E2723',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
  },
  itemText: {
    fontSize: 15,
    color: '#5D4037',
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
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  editImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#8B4513',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    marginVertical: 10,
    alignSelf: 'center',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  imageButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 25,
    flex: 0.48,
    elevation: 2,
  },
  imageButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cancelButton: {
    backgroundColor: '#D7CCC8',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  socialButtonsContainer: {
    marginVertical: 20,
    width: '100%',
  },
  socialButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  socialButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchButton: {
    paddingVertical: 10,
  },
  switchButtonText: {
    color: '#8B4513',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 10,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#5D4037',
    marginBottom: 20,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#8D6E63',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#8D6E63',
  },
  formContainer: {
    width: '100%',
  },
});
