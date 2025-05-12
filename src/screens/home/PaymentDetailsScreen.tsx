import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { paymentService } from '../../services/api';
import { PaymentType } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from '../../components/GradientButton';

type PaymentDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'PaymentDetails'>;
type PaymentDetailsScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'PaymentDetails'
>;

interface PaymentDetailsScreenProps {
  route: PaymentDetailsScreenRouteProp;
  navigation: PaymentDetailsScreenNavigationProp;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number, currency: string) => {
  const currencySymbol =
    currency === 'TRY' ? '₺' :
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' : '';
  
  return `${amount.toFixed(2)} ${currencySymbol}`;
};

const PaymentDetailsScreen: React.FC<PaymentDetailsScreenProps> = ({ route, navigation }) => {
  const { payment } = route.params;

  const handleEdit = () => {
    navigation.navigate('EditPayment', { payment });
  };

  const handleDelete = () => {
    Alert.alert(
      'Ödemeyi Sil',
      'Bu ödemeyi silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deletePayment(payment.id);
              Alert.alert('Başarılı', 'Ödeme başarıyla silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting payment:', error);
              Alert.alert('Hata', 'Ödeme silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async () => {
    try {
      if (!payment.completed) {
        console.log('Attempting to mark payment as completed, ID:', payment.id);
        
        // API'nin /payments/{id}/complete endpoint'i çalışmıyorsa
        // normal update işlemi yaparak statüyü güncelleyelim
        const updatedPaymentData = {
          title: payment.cardName,
          amount: payment.amount,
          currency: payment.currency,
          paymentDate: new Date(payment.date).toISOString(),
          description: payment.note || '',
          recurringType: payment.isRecurring ? 
            (payment.recurringType?.toUpperCase() || 'MONTHLY') : 
            'ONCE',
          status: 'PAID' // Önemli olan bu kısım
        };
        
        console.log('Sending payment update with status PAID:', updatedPaymentData);
        
        // Doğrudan güncelleme yapalım
        await paymentService.updatePayment(payment.id, updatedPaymentData);
        
        Alert.alert(
          'Başarılı',
          'Ödeme tamamlandı olarak işaretlendi',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Ana sayfaya geri dönelim ki yeniden veri yüklensin
                navigation.navigate('Dashboard');
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error updating payment:', error);
      // Hata detaylarını görelim
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      Alert.alert('Hata', 'Ödeme durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const getRecurringText = () => {
    if (!payment.isRecurring) return 'Hayır';

    switch (payment.recurringType) {
      case 'weekly':
        return 'Evet (Haftalık)';
      case 'monthly':
        return 'Evet (Aylık)';
      case 'yearly':
        return 'Evet (Yıllık)';
      default:
        return 'Evet';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ödeme Detayları</Text>
        <Text style={styles.amount}>{formatCurrency(payment.amount, payment.currency)}</Text>
        <Text style={styles.cardName}>{payment.cardName}</Text>
        <Text style={styles.date}>{formatDate(payment.date)}</Text>
        {payment.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Tamamlandı</Text>
          </View>
        )}
        </LinearGradient>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tarih</Text>
          <Text style={styles.detailValue}>{formatDate(payment.date)}</Text>
        </View>

        {payment.ownerName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ödeme Sahibi</Text>
            <Text style={styles.detailValue}>{payment.ownerName}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tekrarlanan Ödeme</Text>
          <Text style={styles.detailValue}>{getRecurringText()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Otomatik Ödeme</Text>
          <Text style={styles.detailValue}>{payment.isAutoPayment ? 'Evet' : 'Hayır'}</Text>
        </View>

        {payment.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Not</Text>
            <Text style={styles.noteText}>{payment.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {!payment.completed && (
            <GradientButton
              title="Ödemeyi Tamamla"
            onPress={handleToggleComplete}
              variant="success"
              style={styles.actionButton}
            />
        )}

          <GradientButton
            title="Düzenle"
            onPress={handleEdit}
            style={styles.actionButton}
          />

          <GradientButton
            title="Sil"
            onPress={handleDelete}
            variant="danger"
            style={styles.actionButton}
          />
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  headerContainer: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 20,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  completedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  completedText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    ...globalStyles.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  noteContainer: {
    marginTop: 16,
  },
  noteLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionButton: {
    marginBottom: 16,
  },
});

export default PaymentDetailsScreen; 