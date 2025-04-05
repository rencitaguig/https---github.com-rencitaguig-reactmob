import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView, RefreshControl, Animated, Dimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts } from "../store/productSlice";
import { fetchReviews, updateReview, deleteReview } from "../store/reviewSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext } from "../context/CartContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '../components/StarRating';
import Toast from 'react-native-toast-message';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { reviews, loading: reviewsLoading, updateLoading, deleteLoading } = useSelector((state) => state.reviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const { addToCart } = useContext(CartContext);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-300)).current;
  const [user, setUser] = useState(null);

  const handleAddToCart = async (item) => {
    await addToCart(item);
  };

  const handleProductSelect = (product) => {
    if (!product._id) {
      console.warn('Product missing ID:', product);
      return;
    }
    setSelectedProduct(product);
    dispatch(fetchReviews(product._id));
    setModalVisible(true);
  };

  const handleEditReview = async (review) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('Current userId:', userId);
      console.log('Review userId:', review.userId._id);
      
      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Please log in to edit reviews'
        });
        return;
      }

      if (userId !== review.userId._id) {
        Toast.show({
          type: 'error',
          text1: 'You can only edit your own reviews'
        });
        return;
      }

      setSelectedReview(review);
      setEditRating(review.rating.toString());
      setEditComment(review.comment);
      setEditModalVisible(true);
      setModalVisible(false);
    } catch (error) {
      console.error('Edit review error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error editing review',
        text2: error.message
      });
    }
  };

  const handleUpdateReview = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        Toast.show({
          type: 'error',
          text1: 'Please log in to update reviews'
        });
        return;
      }

      const updatedData = {
        rating: parseInt(editRating),
        comment: editComment
      };

      await dispatch(updateReview({
        reviewId: selectedReview._id,
        updatedData,
        token
      })).unwrap();

      // Refresh reviews and update UI
      if (selectedProduct?._id) {
        await dispatch(fetchReviews(selectedProduct._id));
      }

      setEditModalVisible(false);
      setModalVisible(true);

      Toast.show({
        type: 'success',
        text1: 'Review updated successfully'
      });
    } catch (error) {
      console.error('Update review error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update review',
        text2: error.message
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        Toast.show({
          type: 'error',
          text1: 'Please log in to delete reviews'
        });
        return;
      }

      const reviewToDelete = reviews.find(review => review._id === reviewId);
      
      if (!reviewToDelete) {
        Toast.show({
          type: 'error',
          text1: 'Review not found'
        });
        return;
      }

      if (userId !== reviewToDelete.userId._id) {
        Toast.show({
          type: 'error',
          text1: 'You can only delete your own reviews'
        });
        return;
      }

      await dispatch(deleteReview({ reviewId, token })).unwrap();
      
      // Refresh reviews
      if (selectedProduct?._id) {
        dispatch(fetchReviews(selectedProduct._id));
      }

      Toast.show({
        type: 'success',
        text1: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Delete review error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete review',
        text2: error.message
      });
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = ['All', ...new Set(products.map(product => product.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.price.toString().includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesPrice = (!minPrice || product.price >= Number(minPrice)) && 
      (!maxPrice || product.price <= Number(maxPrice));
    return matchesSearch && matchesCategory && matchesPrice;
  });

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchProducts());
    }, [dispatch])
  );

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchProducts());
    setRefreshing(false);
  }, [dispatch]);

  const toggleDrawer = () => {
    const toValue = drawerVisible ? -300 : 0;
    
    // Cancel any running animations
    drawerAnim.stopAnimation();
    
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
      isInteraction: true,
    }).start(() => {
      setDrawerVisible(!drawerVisible);
    });
  };

  const getBannerColor = (banner) => {
    switch (banner) {
      case 'new':
        return '#4CAF50';
      case 'sale':
        return '#F44336';
      case 'top':
        return '#2196F3';
      default:
        return '#E0E0E0';
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        console.log('Current logged in userId:', userId); // Debug log
        if (userId) {
          setUser({ userId: userId }); // Store just the ID string
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={toggleDrawer}
        >
          <Ionicons name="menu" size={24} color="#8B4513" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#8D6E63"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Drawer */}
      <Animated.View style={[
        styles.drawer,
        {
          transform: [{
            translateX: drawerAnim
          }]
        }
      ]}>
        <Text style={styles.drawerTitle}>Filters</Text>
        
        <Text style={styles.drawerSectionTitle}>Categories</Text>
        <ScrollView>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.drawerCategoryButton,
                selectedCategory === category && styles.drawerCategoryButtonActive
              ]}
              onPress={() => {
                setSelectedCategory(category);
                toggleDrawer();
              }}
            >
              <Text style={[
                styles.drawerCategoryText,
                selectedCategory === category && styles.drawerCategoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.drawerSectionTitle}>Price Range</Text>
          <View style={styles.drawerPriceContainer}>
            <TextInput
              style={styles.drawerPriceInput}
              placeholder="Min Price"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholderTextColor="#8D6E63"
            />
            <Text style={styles.drawerPriceSeparator}>-</Text>
            <TextInput
              style={styles.drawerPriceInput}
              placeholder="Max Price"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              placeholderTextColor="#8D6E63"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.drawerClearButton}
            onPress={() => {
              setMinPrice('');
              setMaxPrice('');
              setSelectedCategory('All');
              toggleDrawer();
            }}
          >
            <Text style={styles.drawerClearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Backdrop */}
      {drawerVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => `product-${item._id}`}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B4513']}
            tintColor="#8B4513"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleProductSelect(item)}
          >
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image }} style={styles.image} />
              {item.banner && item.banner !== 'none' && (
                <View style={[styles.bannerTag, { backgroundColor: getBannerColor(item.banner) }]}>
                  <Text style={styles.bannerTagText}>{item.banner.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.price}>₱{item.price}</Text>
            <TouchableOpacity 
              onPress={() => handleAddToCart(item)} 
              style={styles.addToCartButton}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      {selectedProduct && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.image }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
              <Text style={styles.modalPrice}>₱{selectedProduct.price}</Text>
              <Text style={styles.modalTitle}>Reviews:</Text>
              <FlatList
                data={reviews}
                keyExtractor={(item) => `review-${item._id}`}
                renderItem={({ item }) => {
                  // Debug logs
                  console.log('Review userId:', item.userId._id);
                  console.log('Current user:', user?.userId);
                  console.log('Do they match?', user?.userId === item.userId._id);
                  
                  return (
                    <View key={`item-${item._id}`} style={styles.reviewCard}>
                      <StarRating rating={Number(item.rating)} size={16} />
                      <Text style={styles.reviewText}>Comment: {item.comment}</Text>
                      <Text style={styles.reviewText}>By: {item.userId.name}</Text>
                      {/* Show buttons for all reviews while debugging */}
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          onPress={() => handleEditReview(item)} 
                          style={styles.editButton}
                          disabled={updateLoading}
                        >
                          <Text style={styles.editButtonText}>
                            Edit ({user?.userId === item.userId._id ? 'Owner' : 'Not Owner'})
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDeleteReview(item._id)} 
                          style={styles.deleteButton}
                          disabled={deleteLoading}
                        >
                          <Text style={styles.deleteButtonText}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Your Review</Text>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <StarRating 
                rating={Number(editRating)} 
                size={30}
                readonly={false}
                onRatingChange={(value) => setEditRating(value.toString())}
              />
              <TextInput
                placeholder="Comment"
                value={editComment}
                onChangeText={setEditComment}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholderTextColor="#3E2723"
              />
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateReview}>
                <Text style={styles.updateButtonText}>Submit Update</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cancelButton, { marginBottom: 20 }]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: "#EFEBE9" // Light brown background
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  menuButton: {
    padding: 10,
    marginRight: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: { 
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#FFF',
    zIndex: 1000,
    paddingTop: 50,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    left: 0,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 20,
    textAlign: 'center',
  },
  drawerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4037',
    marginTop: 20,
    marginBottom: 10,
  },
  drawerCategoryButton: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  drawerCategoryButtonActive: {
    backgroundColor: '#8B4513',
  },
  drawerCategoryText: {
    fontSize: 16,
    color: '#5D4037',
    fontWeight: '500',
  },
  drawerCategoryTextActive: {
    color: '#FFF',
  },
  drawerPriceContainer: {
    marginVertical: 15,
  },
  drawerPriceInput: {
    backgroundColor: '#F5F5F5',
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    color: '#3E2723',
  },
  drawerPriceSeparator: {
    textAlign: 'center',
    fontSize: 18,
    color: '#8B4513',
    marginVertical: 5,
  },
  drawerClearButton: {
    backgroundColor: '#D7CCC8',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 30,
  },
  drawerClearButtonText: {
    color: '#3E2723',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  categoryContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
    height: 44, // Added fixed height
  },
  categoryButton: {
    paddingHorizontal: 20,
    height: 36, // Fixed height for all states
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
    minWidth: 80, // Minimum width to prevent squishing
  },
  categoryButtonActive: {
    backgroundColor: '#8B4513',
    height: 36, // Same height as inactive state
  },
  categoryButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', // Center text
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  filterButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  priceFilterContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    width: '45%',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  priceSeparator: {
    color: '#8B4513',
    fontSize: 18,
    fontWeight: '600',
  },
  clearFilterButton: {
    backgroundColor: '#D7CCC8',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearFilterText: {
    color: '#3E2723',
    fontSize: 12,
    fontWeight: '600',
  },
  card: { 
    flex: 1, 
    margin: 8,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: { 
    width: "100%", 
    height: 150, 
    resizeMode: "cover",
    borderRadius: 10,
  },
  bannerTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  bannerTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: { 
    fontSize: 16, 
    fontWeight: "700",
    marginVertical: 8,
    color: '#3E2723' // Dark brown text
  },
  price: { 
    fontSize: 18, 
    color: "#8B4513",
    fontWeight: "600"
  },
  addToCartButton: { 
    marginTop: 10, 
    backgroundColor: "#6B4423", 
    padding: 12,
    borderRadius: 25,
    elevation: 2
  },
  addToCartText: { 
    color: "#FFF", 
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "flex-end", // Makes modal slide from bottom
    backgroundColor: "rgba(0,0,0,0.5)", 
    margin: 0, // Add this
    padding: 0, // Add this
  },
  modalScrollView: {
    maxHeight: '80%',
    width: '100%', // Add this
  },
  modalContent: { 
    backgroundColor: "#FFF",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    width: '100%', // Add this
    minHeight: 300, // Add this to ensure minimum height
  },
  modalImage: { 
    width: "100%", 
    height: 250,
    resizeMode: "cover",
    borderRadius: 15,
    marginBottom: 15
  },
  modalTitle: { 
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 10,
    color: '#3E2723'
  },
  modalDescription: { 
    fontSize: 16,
    marginVertical: 10,
    color: '#5D4037',
    lineHeight: 24
  },
  modalPrice: { 
    fontSize: 22,
    color: "#8B4513",
    marginVertical: 10,
    fontWeight: "700"
  },
  reviewCard: { 
    backgroundColor: "#FBF7F4",
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    width: "100%",
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513'
  },
  reviewText: { 
    fontSize: 15,
    color: '#5D4037',
    marginBottom: 5
  },
  actionButtons: { 
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10
  },
  editButton: { 
    backgroundColor: "#8B4513",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  editButtonText: { 
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  deleteButton: { 
    backgroundColor: "#D7CCC8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  deleteButtonText: { 
    color: "#3E2723",
    fontSize: 14,
    fontWeight: "600"
  },
  closeButton: { 
    backgroundColor: "#6B4423",
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    width: '100%'
  },
  closeButtonText: { 
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: 'center'
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
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  updateButton: { 
    backgroundColor: "#8B4513",
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    width: '100%',
    elevation: 3,
  },
  updateButtonText: { 
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16
  },
  cancelButton: { 
    backgroundColor: "#D7CCC8",
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
    width: '100%'
  },
  cancelButtonText: { 
    color: "#3E2723",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 10,
  }
});
