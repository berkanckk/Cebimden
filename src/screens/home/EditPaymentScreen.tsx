import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import GradientButton from '../../components/GradientButton';
import LinearGradient from 'react-native-linear-gradient';
import { schedulePaymentNotification, cancelPaymentNotification } from '../../utils/notifications';

type EditPaymentScreenRouteProp = RouteProp<HomeStackParamList, 'EditPayment'>;
type EditPaymentScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'EditPayment'
>;

interface EditPaymentScreenProps {
  route: EditPaymentScreenRouteProp;
  navigation: EditPaymentScreenNavigationProp;
}

const EditPaymentScreen: React.FC<EditPaymentScreenProps> = ({ route, navigation }) => {
  const { payment } = route.params;

  const [cardName, setCardName] = useState(payment.cardName);
  const [amount, setAmount] = useState(payment.amount.toString());
  const [currency, setCurrency] = useState(payment.currency);
  const [paymentDate, setPaymentDate] = useState(new Date(payment.date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState(payment.note || '');
  const [ownerName, setOwnerName] = useState(payment.ownerName || '');
  const [isRecurring, setIsRecurring] = useState(payment.isRecurring);
  const [recurringType, setRecurringType] = useState(payment.recurringType || 'monthly');
  const [isAutoPayment, setIsAutoPayment] = useState(payment.isAutoPayment);
  const [enableNotification, setEnableNotification] = useState(payment.notificationEnabled !== false);
  const [dayBeforeReminder, setDayBeforeReminder] = useState(payment.dayBeforeReminder !== false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!cardName.trim()) {
      newErrors.cardName = 'Kart adı gerekli';
      isValid = false;
    }

    if (!amount.trim()) {
      newErrors.amount = 'Tutar gerekli';
      isValid = false;
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Geçerli bir tutar girin';
      isValid = false;
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Ödeme tarihi gerekli';
      isValid = false;
    }

    if (isRecurring && !recurringType) {
      newErrors.recurringType = 'Tekrarlama türü gerekli';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const updatedPaymentData = {
        title: cardName,
        amount: parseFloat(amount),
        currency,
        paymentDate: paymentDate.toISOString(),
        description: note || '',
        recurringType: isRecurring ? recurringType.toUpperCase() : 'ONCE',
        status: payment.completed ? 'PAID' : 'PENDING',
        notificationEnabled: enableNotification,
        dayBeforeReminder: dayBeforeReminder,
        updateNotification: true
      };

      console.log('Sending updated payment data to backend:', updatedPaymentData);
      
      await paymentService.updatePaymentWithNotification(payment.id, updatedPaymentData);
      
      if (enableNotification) {
        await cancelPaymentNotification(payment.id);
        
        const title = `${cardName} Ödeme Hatırlatıcısı`;
        const body = `${amount} ${currency} tutarında ödemeniz bugün`;
        
        await schedulePaymentNotification(
          payment.id, 
          title, 
          body, 
          paymentDate,
          dayBeforeReminder
        );
      } else {
        await cancelPaymentNotification(payment.id);
      }

      Alert.alert(
        'Başarılı',
        'Ödeme başarıyla güncellendi',
        [
          {
            text: 'Tamam',
            onPress: () => {
              navigation.navigate('Dashboard');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Hata', 'Ödeme güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.headerTitle}>Ödemeyi Düzenle</Text>
        </LinearGradient>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Kart/Banka Adı</Text>
          <TextInput
            style={[globalStyles.input, errors.cardName ? styles.inputError : null]}
            placeholder="Örn: Akbank Kredi Kartı"
            value={cardName}
            onChangeText={setCardName}
          />
          {errors.cardName && <Text style={globalStyles.errorText}>{errors.cardName}</Text>}

          <Text style={styles.label}>Tutar</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.amountInput, errors.amount ? styles.inputError : null]}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.currencyContainer}>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  currency === 'TRY' && styles.selectedCurrency,
                ]}
                onPress={() => setCurrency('TRY')}
              >
                <Text style={currency === 'TRY' ? styles.selectedCurrencyText : styles.currencyText}>₺</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  currency === 'USD' && styles.selectedCurrency,
                ]}
                onPress={() => setCurrency('USD')}
              >
                <Text style={currency === 'USD' ? styles.selectedCurrencyText : styles.currencyText}>$</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  currency === 'EUR' && styles.selectedCurrency,
                ]}
                onPress={() => setCurrency('EUR')}
              >
                <Text style={currency === 'EUR' ? styles.selectedCurrencyText : styles.currencyText}>€</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errors.amount && <Text style={globalStyles.errorText}>{errors.amount}</Text>}

          <Text style={styles.label}>Ödeme Tarihi</Text>
          <TouchableOpacity
            style={[
              globalStyles.input,
              styles.datePickerButton,
              errors.paymentDate ? styles.inputError : null,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(paymentDate)}</Text>
          </TouchableOpacity>
          {errors.paymentDate && <Text style={globalStyles.errorText}>{errors.paymentDate}</Text>}

          <Text style={styles.label}>Not (İsteğe Bağlı)</Text>
          <TextInput
            style={[globalStyles.input, styles.textArea]}
            placeholder="Ödeme hakkında not ekleyin"
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />

          <Text style={styles.label}>Ödeme Sahibi (İsteğe Bağlı)</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Ödeme sizden başkası adına ise"
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Tekrarlanan Ödeme</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurringContainer}>
              <Text style={styles.label}>Tekrarlama Türü</Text>
              <View style={styles.recurringOptions}>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringType === 'weekly' && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringType('weekly')}
                >
                  <Text style={recurringType === 'weekly' ? styles.selectedRecurringText : styles.recurringText}>Haftalık</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringType === 'monthly' && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringType('monthly')}
                >
                  <Text style={recurringType === 'monthly' ? styles.selectedRecurringText : styles.recurringText}>Aylık</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recurringButton,
                    recurringType === 'yearly' && styles.selectedRecurring,
                  ]}
                  onPress={() => setRecurringType('yearly')}
                >
                  <Text style={recurringType === 'yearly' ? styles.selectedRecurringText : styles.recurringText}>Yıllık</Text>
                </TouchableOpacity>
              </View>
              {errors.recurringType && (
                <Text style={globalStyles.errorText}>{errors.recurringType}</Text>
              )}
            </View>
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Otomatik Ödeme</Text>
            <Switch
              value={isAutoPayment}
              onValueChange={setIsAutoPayment}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Bildirim seçenekleri */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Bildirim Seçenekleri</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Ödeme bildirimi al</Text>
              <Switch
                value={enableNotification}
                onValueChange={setEnableNotification}
                trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
            
            {enableNotification && (
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Bir gün önce hatırlatma</Text>
                <Switch
                  value={dayBeforeReminder}
                  onValueChange={setDayBeforeReminder}
                  trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            )}
          </View>

          <GradientButton
            title="Değişiklikleri Kaydet"
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  amountContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  amountInput: {
    flex: 3,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  currencyContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 8,
    height: 50,
  },
  currencyButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  currencyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  selectedCurrency: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectedCurrencyText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  recurringContainer: {
    marginBottom: 16,
  },
  recurringOptions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recurringButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  recurringText: {
    color: COLORS.textPrimary,
  },
  selectedRecurring: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectedRecurringText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  notificationSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default EditPaymentScreen; 