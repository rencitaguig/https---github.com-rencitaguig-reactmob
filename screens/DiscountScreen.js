import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../store/discountSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import BASE_URL from '../config'; // Add this import
import * as Notifications from 'expo-notifications';

export default function DiscountScreen() {
  const dispatch = useDispatch();
  const { discounts, status } = useSelector((state) => state.discounts);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  
  // Form states
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setMessage('Please login first');
        return;
      }

      await dispatch(fetchDiscounts(token)).unwrap();
    } catch (error) {
      console.error('Failed to load discounts:', error);
      setMessage('Failed to load discounts. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscounts();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setMessage('Please login first');
        return;
      }

      // Input validation
      if (!code.trim()) {
        setMessage('Discount code is required');
        return;
      }

      const percentageNum = Number(percentage);
      if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
        setMessage('Percentage must be between 1 and 100');
        return;
      }

      if (!expiryDate || expiryDate < new Date()) {
        setMessage('Please set a valid future expiry date');
        return;
      }

      const discountData = {
        code: code.trim().toUpperCase(),
        percentage: percentageNum,
        expiryDate: expiryDate.toISOString(),
        isActive: true,
      };

      if (isEditing && selectedDiscount) {
        await dispatch(updateDiscount({ 
          id: selectedDiscount._id, 
          data: discountData,
          token 
        })).unwrap();
        setMessage('Discount updated successfully');
      } else {
        const result = await dispatch(createDiscount({ 
          data: discountData,
          token 
        })).unwrap();
        
        // Store notification with correct data
        try {
          const pendingNotifs = await SecureStore.getItemAsync('pendingDiscountNotifications');
          const notifications = pendingNotifs ? JSON.parse(pendingNotifs) : [];
          
          const notificationData = {
            id: result._id,
            title: '🎉 New Discount Available!',
            body: `Get ${result.percentage}% off with code: ${result.code}`,
            data: {
              screen: 'DiscountDetailsScreen',
              discountId: result._id,
            },
            code: result.code,
            percentage: result.percentage,
            expiryDate: result.expiryDate
          };
          
          notifications.push(notificationData);
          await SecureStore.setItemAsync('pendingDiscountNotifications', JSON.stringify(notifications));
          console.log('Stored notification:', notificationData); // Debug log
        } catch (error) {
          console.error('Failed to store notification:', error);
        }
        
        setMessage('Discount created successfully');
      }

      // Reset form
      resetForm();
      await loadDiscounts();
    } catch (error) {
      console.error('Discount operation failed:', error);
      setMessage(error.response?.data?.message || 'Server error occurred. Please try again.');
    }
  };

  const handleEdit = (discount) => {
    setSelectedDiscount(discount);
    setCode(discount.code);
    setPercentage(discount.percentage.toString());
    setExpiryDate(new Date(discount.expiryDate));
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setMessage('Please login first');
        return;
      }

      await dispatch(deleteDiscount({ id, token })).unwrap();
      setMessage('Discount deleted successfully');
      await loadDiscounts();
    } catch (error) {
      console.error('Delete operation failed:', error);
      setMessage(error.response?.data?.message || 'Failed to delete discount');
    }
  };

  const resetForm = () => {
    setCode('');
    setPercentage('');
    setExpiryDate(new Date());
    setIsEditing(false);
    setSelectedDiscount(null);
  };

  const renderDiscountItem = ({ item }) => (
    <View style={styles.discountCard}>
      <View style={styles.discountInfo}>
        <Text style={styles.codeText}>Code: {item.code}</Text>
        <Text style={styles.percentageText}>{item.percentage}% OFF</Text>
        <Text style={styles.dateText}>
          Expires: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
        <Text style={[styles.statusText, { color: item.isActive ? '#4CAF50' : '#F44336' }]}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDatePicker = () => {
    return (
      <>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            Set Expiry Date: {expiryDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={expiryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setExpiryDate(selectedDate);
            }}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>{isEditing ? 'Edit Discount' : 'Create Discount'}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Discount Code"
            value={code}
            onChangeText={setCode}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Percentage"
            value={percentage}
            onChangeText={setPercentage}
            keyboardType="numeric"
          />
          
          {renderDatePicker()}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update Discount' : 'Create Discount'}
            </Text>
          </TouchableOpacity>

          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.title}>Available Discounts</Text>
          <FlatList
            data={discounts}
            renderItem={renderDiscountItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 15,
    padding: 15,
    borderRadius: 15,
  },
  listContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 15,
    padding: 15,
    borderRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  dateButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    color: '#3E2723',
  },
  discountCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  percentageText: {
    fontSize: 20,
    color: '#8B4513',
    marginVertical: 5,
  },
  dateText: {
    color: '#5D4037',
  },
  statusText: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});