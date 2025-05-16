import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Button, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/api';
import messaging from '@react-native-firebase/messaging';

const TestNotificationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Test Bildirimi');
  const [body, setBody] = useState('Bu bir test bildirimidir');
  const [fcmToken, setFcmToken] = useState('');
  const [additionalData, setAdditionalData] = useState('{"type": "test", "priority": "high"}');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Component yüklendiğinde FCM token'ı alıp state'e atayalım
    const getFcmToken = async () => {
      try {
        const token = await AsyncStorage.getItem('fcmToken');
        if (token) {
          setFcmToken(token);
        } else {
          const newToken = await messaging().getToken();
          setFcmToken(newToken);
          await AsyncStorage.setItem('fcmToken', newToken);
        }
      } catch (error) {
        console.error('FCM token alınırken hata:', error);
        addTestResult('Hata', `FCM token alınırken hata: ${error.message}`);
      }
    };

    getFcmToken();
  }, []);

  const addTestResult = (title, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [{
      id: Date.now().toString(),
      title,
      message,
      timestamp
    }, ...prev]);
  };

  const handleSendLocalNotification = async () => {
    try {
      setLoading(true);
      addTestResult('Bilgi', 'Yerel bildirim gönderiliyor...');
      
      // Normalde burada Notifee kullanarak yerel bildirim göndeririz
      // Ancak bu özellik şu an firebase.ts içinde 
      
      import('../utils/firebase').then(async (firebase) => {
        // Notifee metodu çağrılır
        const notifee = await import('@notifee/react-native').then(m => m.default);
        const channelId = await notifee.createChannel({
          id: 'test_channel',
          name: 'Test Kanal',
          importance: 4, // AndroidImportance.HIGH
        });

        await notifee.displayNotification({
          title: title,
          body: body,
          android: {
            channelId,
            importance: 4, // AndroidImportance.HIGH
            pressAction: {
              id: 'default',
            },
          },
          data: JSON.parse(additionalData || '{}'),
        });
        
        addTestResult('Başarılı', 'Yerel bildirim gönderildi');
      }).catch(error => {
        console.error('Yerel bildirim gönderilirken hata:', error);
        addTestResult('Hata', `Yerel bildirim gönderilirken hata: ${error.message}`);
      }).finally(() => {
        setLoading(false);
      });
    } catch (error) {
      console.error('Yerel bildirim gönderilirken hata:', error);
      addTestResult('Hata', `Yerel bildirim gönderilirken hata: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSendFCMNotification = async () => {
    if (!fcmToken) {
      Alert.alert('Hata', 'FCM token bulunamadı');
      return;
    }

    try {
      setLoading(true);
      addTestResult('Bilgi', 'FCM bildirimi gönderiliyor...');
      
      // Backend'e bildirim isteği gönder
      const dataObj = additionalData ? JSON.parse(additionalData) : {};
      const response = await notificationService.sendDirectNotification(
        fcmToken,
        title,
        body,
        dataObj
      );
      
      console.log('Bildirim yanıtı:', response);
      addTestResult('Başarılı', 'FCM bildirimi gönderildi. Yanıt: ' + JSON.stringify(response));
    } catch (error) {
      console.error('FCM bildirimi gönderilirken hata:', error);
      addTestResult('Hata', `FCM bildirimi gönderilirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setLoading(true);
      const newToken = await messaging().getToken();
      setFcmToken(newToken);
      await AsyncStorage.setItem('fcmToken', newToken);
      addTestResult('Bilgi', `FCM token yenilendi: ${newToken}`);
    } catch (error) {
      console.error('Token yenilenirken hata:', error);
      addTestResult('Hata', `Token yenilenirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Bildirim Test Ekranı</Text>
        
        <View style={styles.tokenContainer}>
          <Text style={styles.label}>FCM Token:</Text>
          <Text style={styles.tokenText} selectable>{fcmToken}</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshToken}
          >
            <Text style={styles.refreshButtonText}>Yenile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Başlık:</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Bildirim başlığı"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>İçerik:</Text>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Bildirim içeriği"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ek Veri (JSON):</Text>
          <TextInput
            style={[styles.input, styles.dataInput]}
            value={additionalData}
            onChangeText={setAdditionalData}
            placeholder='{"key": "value"}'
            multiline
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.localButton]}
            onPress={handleSendLocalNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Yerel Bildirim Gönder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.fcmButton]}
            onPress={handleSendFCMNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>FCM Bildirimi Gönder</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
        )}
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Sonuçları:</Text>
          {testResults.map((result) => (
            <View key={result.id} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={[
                  styles.resultType, 
                  result.title === 'Hata' ? styles.resultError : 
                  result.title === 'Başarılı' ? styles.resultSuccess : 
                  styles.resultInfo
                ]}>
                  {result.title}
                </Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
          
          {testResults.length === 0 && (
            <Text style={styles.noResults}>Henüz test sonucu yok.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginLeft: 4,
  },
  refreshButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  dataInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  localButton: {
    backgroundColor: '#4CAF50',
  },
  fcmButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  resultType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultInfo: {
    color: '#0066cc',
  },
  resultSuccess: {
    color: '#4CAF50',
  },
  resultError: {
    color: '#F44336',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default TestNotificationScreen; 