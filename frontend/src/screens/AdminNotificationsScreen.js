import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import adminService from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';

const AdminNotificationsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);
  
  // Firebase Token bilgisini getir
  const fetchTokenInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getFirebaseAccessToken();
      setTokenInfo(data);
    } catch (err) {
      setError('Token alınamadı: ' + (err.response?.data?.message || err.message));
      Alert.alert('Hata', 'Firebase token alınamadı: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Sayfa yüklendiğinde token bilgisini getir
    if (user?.isAdmin) {
      fetchTokenInfo();
    }
  }, [user]);
  
  if (!user?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Bu sayfa sadece admin kullanıcılar içindir.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Bildirim Yönetimi</Text>
      
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Firebase Access Token</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : tokenInfo ? (
          <View>
            <Text style={styles.tokenStatus}>
              <Text style={styles.label}>Durum: </Text>
              <Text style={styles.successText}>Token Aktif</Text>
            </Text>
            
            <Text style={styles.tokenInfo}>
              <Text style={styles.label}>Kalan Süre: </Text>
              {tokenInfo.expiresInMinutes} dakika
            </Text>
            
            <Text style={styles.tokenLabel}>Token (ilk 10 karakter):</Text>
            <Text style={styles.tokenPreview}>
              {tokenInfo.accessToken.substring(0, 10)}...
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={fetchTokenInfo}>
              <Text style={styles.buttonText}>Yenile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text>Token bilgisi yok</Text>
            )}
            
            <TouchableOpacity style={styles.button} onPress={fetchTokenInfo}>
              <Text style={styles.buttonText}>Token Al</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
      
      <Text style={styles.infoText}>
        ⚠️ Not: Firebase Access Token hassas bilgidir, sadece admin panelinde kullanın!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tokenStatus: {
    fontSize: 16,
    marginBottom: 8,
  },
  tokenInfo: {
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  tokenPreview: {
    fontSize: 14,
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: {
    color: '#D32F2F',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AdminNotificationsScreen; 