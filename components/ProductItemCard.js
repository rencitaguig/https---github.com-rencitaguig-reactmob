import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductItemCard = memo(({ item, onPress, onAddToCart, getBannerColor }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        {item.banner && item.banner !== 'none' && getBannerColor(item.banner) && (
          <View style={[styles.bannerTag, { backgroundColor: getBannerColor(item.banner).color }]}>
            <Ionicons 
              name={getBannerColor(item.banner).icon}
              size={14} 
              color="#FFF" 
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerTagText}>{item.banner.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>₱{item.price}</Text>
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          onAddToCart(item);
        }} 
        style={styles.addToCartButton}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "700",
    marginVertical: 8,
    color: '#3E2723',
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
});

export default ProductItemCard;
