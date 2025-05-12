import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Image 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../styles/colors';
import { PaymentType } from '../../types';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/Header';

// Yardımcı fonksiyonlar
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

const getBankColor = (bankName: string) => {
  const banks = {
    'Ziraat Bankası': ['#00784B', '#00A86B'],
    'Garanti BBVA': ['#009640', '#74BE43'],
    'Yapı Kredi': ['#9700DD', '#BA55D3'],
    'İş Bankası': ['#003B95', '#1C7ED6'],
    'Akbank': ['#E52428', '#FF5C5C'],
    'Vakıfbank': ['#F7B600', '#FFC72C'],
    'QNB Finansbank': ['#3A1D72', '#7353BA'],
    'Enpara': ['#FA8100', '#FFA744'],
    'Denizbank': ['#0163A4', '#018DE4'],
    'TEB': ['#6D298F', '#9845BE'],
    'Halkbank': ['#005EB8', '#007BFF']
  };
  
  return banks[bankName as keyof typeof banks] || [COLORS.primaryDark, COLORS.primary];
};

// Banka ikon yollarını belirleyen fonksiyon
const getBankIconPath = (bankName: string) => {
  const bankIcons: Record<string, any> = {
    'Akbank': require('../../assets/banka/akbankicon.png'),
    'Garanti BBVA': require('../../assets/banka/garantibbvaicon.png'),
    'Halkbank': require('../../assets/banka/halkbankicon.png'),
    'İş Bankası': require('../../assets/banka/isbankasiicon.png'),
    'QNB Finansbank': require('../../assets/banka/qnbicon.png'),
    'TEB': require('../../assets/banka/tebicon.png'),
    'Vakıfbank': require('../../assets/banka/vakifbankicon.jpg'),
    'Yapı Kredi': require('../../assets/banka/yapikrediicon.jpeg'),
    'Ziraat Bankası': require('../../assets/banka/ziraaticon.png'),
  };
  
  // Eğer tam eşleşme yoksa, içeren banka adını kontrol et
  if (!bankIcons[bankName]) {
    for (const [key, value] of Object.entries(bankIcons)) {
      if (bankName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  
  return bankIcons[bankName] || null;
};

const AllPaymentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { type, payments } = route.params;

  const title = type === 'upcoming' ? 'Yaklaşan Ödemeler' : 'Geçmiş Ödemeler';

  const handlePaymentPress = (payment: PaymentType) => {
    navigation.navigate('PaymentDetails' as never, { payment } as never);
  };

  const PaymentItem = ({ payment }: { payment: PaymentType }) => {
    const bankColors = getBankColor(payment.cardName);
    const bankIcon = getBankIconPath(payment.cardName);
    
    return (
      <TouchableOpacity
        style={styles.paymentCardWrapper}
        onPress={() => handlePaymentPress(payment)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={bankColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentCard}
        >
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          }}>
            {bankIcon ? (
              <Image
                source={bankIcon}
                style={{ width: 30, height: 30, borderRadius: 15 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ color: COLORS.white, fontSize: 18 }}>💳</Text>
            )}
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.paymentInfo}>
              <Text style={styles.cardName}>{payment.cardName}</Text>
              <Text style={styles.paymentDate}>{formatDate(payment.date)}</Text>
              {payment.note && (
                <Text style={styles.paymentNote} numberOfLines={1}>{payment.note}</Text>
              )}
              {payment.ownerName && payment.ownerName.trim() !== '' && (
                <Text style={styles.ownerName}>{payment.ownerName}</Text>
              )}
            </View>
            
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>
                {formatCurrency(payment.amount, payment.currency)}
              </Text>
              
              <View style={styles.badgeContainer}>
                {payment.isRecurring && (
                  <View style={[styles.badge, styles.recurringBadge]}>
                    <Text style={styles.badgeText}>Tekrarlanan</Text>
                  </View>
                )}
                
                {payment.isAutoPayment && (
                  <View style={[styles.badge, styles.autoBadge]}>
                    <Text style={styles.badgeText}>Otomatik</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={title} />
      
      {payments && payments.length > 0 ? (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PaymentItem payment={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ödeme bulunmamaktadır.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  paymentCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    paddingRight: 68, // İkon için alan
  },
  paymentInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  paymentDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  paymentNote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    maxWidth: '90%',
  },
  ownerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  recurringBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  autoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AllPaymentsScreen; 