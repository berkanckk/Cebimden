import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { paymentService } from '../../services/api';
import { PaymentType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from '../../components/GradientButton';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
// @ts-ignore
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const { width } = Dimensions.get('window');

type DashboardScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'Dashboard'
>;

type ItemData = { type: string } | { type: string; payment: PaymentType };

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
  
  // Eğer bankanın rengi tanımlıysa onu döndür, değilse varsayılan renkleri döndür
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

// Özel ikon bileşeni
const Icon = ({ name, size = 20, color = '#FFFFFF', style }: { name: string, size?: number, color?: string, style?: any }) => {
  // Yaygın simgeler için Unicode karakterleri
  const icons: Record<string, string> = {
    'clock': '⏱️',
    'money': '₺',
    'bank': '🏦',
    'credit-card': '💳',
    'tv': '📺',
    'check': '✅',
    'times': '❌',
    'refresh': '🔄',
    'flash': '⚡',
    'chevron-right': '▶️',
    'history': '🕒',
    'bell': '🔔',
  };

  return (
    <Text style={[{ fontSize: size * 1.1, color, textAlign: 'center', fontWeight: 'bold' }, style]}>
      {icons[name] || '•'}
    </Text>
  );
};

const DashboardScreen = () => {
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentType[]>([]);
  const [pastPayments, setPastPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();

  // Sayfa her odaklandığında (görüntülendiğinde) ödemeleri yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPayments();
    });

    return unsubscribe;
  }, [navigation]);

  // İlk yükleme için
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPayments();
      const fetchedPayments = response.data;
      
      console.log('Received payments from server:', fetchedPayments);
      
      // Backend'den dönen verileri frontend'in beklediği şekle dönüştürme
      const transformedPayments = fetchedPayments.map((payment: any) => ({
        id: payment.id,
        userId: payment.userId,
        cardName: payment.title, // backend'de title, frontend'de cardName
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        date: payment.paymentDate, // backend'de paymentDate, frontend'de date
        note: payment.description, // backend'de description, frontend'de note
        ownerName: '', // backend'de karşılığı yok
        isRecurring: payment.recurringType !== 'ONCE',
        recurringType: payment.recurringType.toLowerCase(), // küçük harfe çevir
        isAutoPayment: false, // backend'de karşılığı yok
        completed: payment.status === 'PAID'
      }));
      
      console.log('Transformed payments for frontend:', transformedPayments);
      
      setPayments(transformedPayments);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter upcoming payments (today and future, not completed)
      const upcoming = transformedPayments.filter((payment: PaymentType) => {
        // Tamamlanmış ödemeler yaklaşan ödemelerde gösterilmeyecek
        if (payment.completed) {
          return false;
        }
        
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate >= today;
      }).sort((a: PaymentType, b: PaymentType) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Filter past payments (past date OR completed)
      const past = transformedPayments.filter((payment: PaymentType) => {
        // Tamamlanmış ödemeler her zaman geçmiş ödemelerde gösterilecek
        if (payment.completed) {
          return true;
        }
        
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate < today;
      }).sort((a: PaymentType, b: PaymentType) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setUpcomingPayments(upcoming);
      setPastPayments(past);
    } catch (err: any) {
      setError('Ödemeler yüklenirken bir hata oluştu.');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handlePaymentPress = (payment: PaymentType) => {
    navigation.navigate('PaymentDetails', { payment });
  };

  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const paymentDate = new Date(dateString);
    paymentDate.setHours(0, 0, 0, 0);
    
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    return `${diffDays} gün sonra`;
  };

  const renderHeader = () => {
    // Burada bu ay ödenen toplam tutarı hesaplayalım
    const totalThisMonth = upcomingPayments.reduce((acc, payment) => {
      const date = new Date(payment.date);
      const thisMonth = new Date().getMonth();
      if (date.getMonth() === thisMonth) {
        return acc + payment.amount;
      }
      return acc;
    }, 0);
    
    // Bu ay toplam ödemeler (gelecek + geçmiş)
    const allMonthlyPayments = payments.filter(payment => {
      const date = new Date(payment.date);
      return date.getMonth() === new Date().getMonth();
    });
    
    const totalMonthlyAmount = allMonthlyPayments.reduce((acc, payment) => acc + payment.amount, 0);
    const paidMonthlyAmount = allMonthlyPayments
      .filter(payment => payment.completed)
      .reduce((acc, payment) => acc + payment.amount, 0);
    
    // Ödeme tamamlanma yüzdesi
    const completionPercentage = totalMonthlyAmount > 0 
      ? Math.round((paidMonthlyAmount / totalMonthlyAmount) * 100) 
      : 0;
    
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Merhaba,</Text>
              <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <View style={styles.headerRightIcons}>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => navigation.navigate('Notifications' as any)}
              >
                <Icon name="bell" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => navigation.navigate('Profile' as any)}
              >
                <View style={styles.profileIconContainer}>
                  <Text style={styles.profileIconText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'K'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.dashboardTitle}>Ödeme Takip</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statContainer}>
              <View style={styles.statBox}>
                <View style={{
                  width: 36, 
                  height: 36, 
                  borderRadius: 18, 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 10
                }}>
                  <Icon name="clock" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.statTitle}>Yaklaşan</Text>
                  <Text style={styles.statValue}>{upcomingPayments.length}</Text>
                </View>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <View style={{
                  width: 36, 
                  height: 36, 
                  borderRadius: 18, 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 10
                }}>
                  <Icon name="money" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.statTitle}>Bu Ay</Text>
                  <Text style={styles.statValue}>{totalThisMonth.toFixed(0)} ₺</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <AnimatedCircularProgress
                size={80}
                width={8}
                fill={completionPercentage}
                tintColor="#FFFFFF"
                backgroundColor="rgba(255, 255, 255, 0.3)"
                rotation={0}
                lineCap="round"
              >
                {(fill: number) => (
                  <Text style={styles.progressText}>{Math.round(fill)}%</Text>
                )}
              </AnimatedCircularProgress>
              <Text style={styles.progressLabel}>Tamamlanan</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  // Tümünü Gör butonları için fonksiyonlar ekle
  const handleSeeAllUpcoming = () => {
    navigation.navigate('AllPayments', { type: 'upcoming', payments: upcomingPayments });
  };

  const handleSeeAllPast = () => {
    navigation.navigate('AllPayments', { type: 'past', payments: pastPayments });
  };

  const renderSectionHeader = (title: string, onSeeAllPress: () => void) => {
    return (
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionTitleContainer}>
          <View style={{
            width: 28, 
            height: 28, 
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          }}>
            <Icon name="clock" size={18} color={COLORS.primary} />
          </View>
        <Text style={styles.sectionHeader}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPastPaymentHeader = () => {
      return (
      <View style={styles.pastHeaderContainer}>
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pastHeaderGradient}
        >
          <View style={styles.pastHeaderContent}>
            <View style={styles.sectionTitleContainer}>
              <View style={{
                width: 28, 
                height: 28, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8
              }}>
                <Icon name="history" size={18} color={COLORS.white} />
              </View>
              <Text style={styles.pastHeaderTitle}>Geçmiş Ödemeler</Text>
            </View>
            <TouchableOpacity onPress={handleSeeAllPast} style={styles.pastSeeAllButton}>
              <Text style={styles.pastHeaderSeeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        </View>
      );
  };

  const renderEmptyState = () => {
      return (
      <View style={styles.container}>
        {/* Header Gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyStateHeader}
        >
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent
          />
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Merhaba,</Text>
              <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
        </View>
            <Text style={styles.dashboardTitle}>Ödeme Takip Paneli</Text>
          </View>
        </LinearGradient>

        {/* Empty State Content */}
        <View style={styles.emptyStateContent}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              <Text style={styles.emptyIconText}>₺</Text>
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Ödeme Bulunamadı</Text>
          <Text style={styles.emptyText}>Henüz hiç ödeme eklemediniz. İlk ödemenizi eklemek için aşağıdaki butona tıklayın.</Text>
          
          <GradientButton
            title="Ödeme Ekle"
            onPress={() => navigation.navigate('AddPayment' as any)}
            style={styles.emptyActionButton}
          />
        </View>

        {/* Floating Button */}
        <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddPayment' as any)}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingButtonGradient}
          >
            <Text style={styles.floatingButtonText}>+</Text>
          </LinearGradient>
          </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <GradientButton
            title="Tekrar Dene"
            onPress={fetchPayments}
            style={styles.errorActionButton}
          />
        </View>
      );
    }

    if (payments.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={[
          { type: 'upcomingHeader' },
          ...upcomingPayments.map(payment => ({ type: 'payment', payment })),
          { type: 'pastHeader' },
        ] as ItemData[]}
        keyExtractor={(item, index) => {
          if (item.type === 'upcomingHeader' || item.type === 'pastHeader') {
            return `header-${index}`;
          }
          // Type guard to check if payment exists
          if ('payment' in item) {
            return `payment-${item.payment.id}`;
          }
          return `item-${index}`;
        }}
        renderItem={({ item }) => {
          if (item.type === 'upcomingHeader') {
            return renderSectionHeader('Yaklaşan Ödemeler', handleSeeAllUpcoming);
          } else if (item.type === 'pastHeader') {
            return (
              <>
                {renderPastPaymentHeader()}
                {renderPastPayments()}
              </>
            );
          } else if ('payment' in item) {
            return <PaymentItem payment={item.payment} />;
          }
          return null;
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderPastPayments = () => {
    if (pastPayments.length === 0) {
  return (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Geçmiş ödeme bulunmamaktadır.</Text>
        </View>
      );
    }

    // Toplam ödenen miktar hesaplama
    const totalPaid = pastPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Son aydaki ödeme sayısını hesaplama
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    
    const lastMonthPayments = pastPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= lastMonthDate;
    });

    return (
      <View style={styles.pastPaymentsSection}>
        <View style={styles.pastPaymentsContainer}>
          <FlatList
            horizontal
            data={[
              { type: 'summary' }, 
              ...pastPayments.slice(0, 10).map(payment => ({ type: 'payment', payment }))
            ]}
            keyExtractor={(item: any, index) => 
              item.type === 'summary' 
                ? 'payment-summary'
                : `past-payment-${item.payment.id}`
            }
            renderItem={({ item }: any) => {
              if (item.type === 'summary') {
                return (
                  <View style={styles.summaryCardWrapper}>
                    <LinearGradient
                      colors={[COLORS.secondary, COLORS.secondaryLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.summaryCard}
                    >
                      <View style={styles.summaryCardContent}>
                        <Text style={styles.summaryTitle}>Ödeme Özeti</Text>
                        
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Toplam Ödenen:</Text>
                          <Text style={styles.summaryValue}>{totalPaid.toFixed(2)} ₺</Text>
                        </View>
                        
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Son Ay Ödeme:</Text>
                          <Text style={styles.summaryValue}>{lastMonthPayments.length} adet</Text>
                        </View>
                        
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryLabel}>Son Ödeme:</Text>
                          <Text style={styles.summaryValue}>
                            {pastPayments.length > 0 ? formatDate(pastPayments[0].date) : '-'}
                          </Text>
                        </View>
      
      <TouchableOpacity 
                          style={styles.summaryButton}
                          onPress={handleSeeAllPast}
                        >
                          <Text style={styles.summaryButtonText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                );
              } else {
                return <PastPaymentItem payment={item.payment} />;
              }
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pastPaymentsList}
          />
        </View>
      </View>
    );
  };

  const PaymentItem = ({ payment }: { payment: PaymentType }) => {
    const bankColors = getBankColor(payment.cardName);
    const isUpcoming = new Date(payment.date) >= new Date();
    const daysRemaining = isUpcoming ? getDaysRemaining(payment.date) : '';
    const bankIcon = getBankIconPath(payment.cardName);
    
    // Ödeme tarihinin kalan gün sayısına göre renk belirleme
    const getDaysBadgeColor = () => {
      const date = new Date(payment.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) return ['#F45E5E', '#FF7676'];  // Kırmızı tonda (yakın tarih)
      if (diffDays <= 7) return ['#FF9500', '#FFC107'];  // Turuncu tonda (1 hafta)
      return ['#2AC769', '#54D98C'];  // Yeşil tonda (uzak tarih)
    };
    
    const daysBadgeColors = getDaysBadgeColor();
    
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
              <Icon name="credit-card" size={22} color="#FFFFFF" />
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
                {isUpcoming && (
                  <LinearGradient
                    colors={daysBadgeColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.daysBadge}
                  >
                    <Icon 
                      name="clock" 
                      size={14} 
                      color={COLORS.white}
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={styles.daysText}>{daysRemaining}</Text>
                  </LinearGradient>
                )}
                
                {payment.isRecurring && (
                  <View style={[styles.badge, styles.recurringBadge]}>
                    <Icon 
                      name="refresh" 
                      size={14} 
                      color={COLORS.white}
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={styles.badgeText}>Tekrarlanan</Text>
                  </View>
                )}
                
                {payment.isAutoPayment && (
                  <View style={[styles.badge, styles.autoBadge]}>
                    <Icon 
                      name="flash" 
                      size={14} 
                      color={COLORS.white}
                      style={{ marginRight: 4 }} 
                    />
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

  const PastPaymentItem = ({ payment }: { payment: PaymentType }) => {
    const bankColors = getBankColor(payment.cardName);
    const bankIcon = getBankIconPath(payment.cardName);
    
    return (
      <TouchableOpacity
        style={styles.pastPaymentCardWrapper}
        onPress={() => handlePaymentPress(payment)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={bankColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pastPaymentCard}
        >
          <View style={styles.pastCardContent}>
            <View style={styles.pastCardHeader}>
              {payment.completed ? (
                <LinearGradient
                  colors={['rgba(42, 199, 105, 0.7)', 'rgba(42, 199, 105, 0.4)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completedBadge}
                >
                  <Icon name="check" size={12} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.completedText}>Ödendi</Text>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['rgba(244, 94, 94, 0.7)', 'rgba(244, 94, 94, 0.4)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dueBadge}
                >
                  <Icon name="times" size={12} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.dueText}>Ödenmedi</Text>
                </LinearGradient>
              )}
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {bankIcon ? (
                  <Image
                    source={bankIcon}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon name="credit-card" size={16} color="#FFFFFF" />
                )}
              </View>
            </View>
            <Text style={styles.pastCardName} numberOfLines={1}>{payment.cardName}</Text>
            <Text style={styles.pastAmount}>{formatCurrency(payment.amount, payment.currency)}</Text>
            <Text style={styles.pastPaymentDate}>{formatDate(payment.date)}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={globalStyles.container}>
      {renderContent()}
      
      {/* Yeni Ödeme Ekleme Butonu */}
      {payments.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddPayment' as any)}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          style={styles.floatingButtonGradient}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingBottom: 24,
    marginBottom: 8,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    padding: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '400',
  },
  userName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 18,
  },
  profileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  dashboardTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statContainer: {
    flex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16,
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
    opacity: 0.9,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 2,
  },
  pastSeeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardContent: {
    padding: 16,
    paddingRight: 68, // ikon için daha fazla yer
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
  },
  daysText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  pastHeaderContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  pastHeaderGradient: {
    borderRadius: 12,
  },
  pastHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pastHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  pastHeaderSeeAll: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 2,
  },
  pastPaymentCardWrapper: {
    width: 160,
    height: 170,
    marginRight: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pastCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastPaymentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  pastCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  pastCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pastCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
  },
  pastAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 8,
  },
  pastPaymentDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dueText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorActionButton: {
    width: '60%',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyStateHeader: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    paddingBottom: 24,
  },
  emptyStateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 0,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconText: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyActionButton: {
    width: '80%',
    marginTop: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...globalStyles.shadow,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pastPaymentsSection: {
    marginBottom: 20,
  },
  pastPaymentsContainer: {
    marginBottom: 5,
  },
  pastPaymentsList: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 5,
  },
  summaryCardWrapper: {
    width: 200,
    height: 170,
    marginRight: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  summaryCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 10,
  },
  summaryItem: {
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 8,
  },
  summaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen; 