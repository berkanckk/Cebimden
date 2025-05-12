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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { paymentService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../../components/Header';
import GradientButton from '../../components/GradientButton';
import { schedulePaymentNotification } from '../../utils/notifications';

// Banka listesi
const BANKS = [
  { label: 'Seçiniz...', value: '' },
  { label: 'Akbank', value: 'Akbank' },
  { label: 'Garanti BBVA', value: 'Garanti BBVA' },
  { label: 'Halkbank', value: 'Halkbank' },
  { label: 'İş Bankası', value: 'İş Bankası' },
  { label: 'QNB Finansbank', value: 'QNB Finansbank' },
  { label: 'TEB', value: 'TEB' },
  { label: 'Vakıfbank', value: 'Vakıfbank' },
  { label: 'Yapı Kredi', value: 'Yapı Kredi' },
  { label: 'Ziraat Bankası', value: 'Ziraat Bankası' },
];

const AddPaymentScreen = () => {
  const [cardName, setCardName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('monthly');
  const [isAutoPayment, setIsAutoPayment] = useState(false);
  const [enableNotification, setEnableNotification] = useState(true);
  const [dayBeforeReminder, setDayBeforeReminder] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!cardName.trim()) {
      newErrors.cardName = 'Banka seçimi gerekli';
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

      const paymentData = {
        userId: user?.id,
        cardName,
        amount: parseFloat(amount),
        currency,
        date: paymentDate.toISOString(),
        note: note || undefined,
        ownerName: ownerName || undefined,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
        isAutoPayment,
        completed: false,
        enableNotification,
        dayBeforeReminder,
      };

      // Ödemeyi ekle
      const response = await paymentService.addPaymentWithNotification(paymentData);
      
      // Kullanıcı bildirim istiyorsa yerel bildirim oluştur
      if (enableNotification && response.data && response.data.id) {
        const paymentId = response.data.id;
        const title = `${cardName} Ödeme Hatırlatıcısı`;
        const body = `${amount} ${currency} tutarında ödemeniz bugün`;
        
        await schedulePaymentNotification(
          paymentId, 
          title, 
          body, 
          paymentDate,
          dayBeforeReminder
        );
      }

      Alert.alert(
        'Başarılı',
        'Ödeme başarıyla eklendi',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Hata', 'Ödeme eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || paymentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setPaymentDate(currentDate);
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
      <Header title="Ödeme Ekle" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Banka Seçimi</Text>
          <View style={[globalStyles.input, styles.pickerContainer, errors.cardName ? styles.inputError : null]}>
            <Picker
              selectedValue={cardName}
              onValueChange={(itemValue) => setCardName(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              {BANKS.map((bank) => (
                <Picker.Item key={bank.value} label={bank.label} value={bank.value} />
              ))}
            </Picker>
          </View>
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
          
          {showDatePicker && (
            <DateTimePicker
              value={paymentDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

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

          <View style={styles.buttonContainer}>
          <GradientButton
              title={isLoading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            onPress={handleSubmit}
            disabled={isLoading}
          />
          </View>
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
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  formContainer: {
    width: '100%',
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
  pickerContainer: {
    padding: 0,
    backgroundColor: COLORS.white,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
  },
  picker: {
    height: 50,
    width: '100%',
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
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default AddPaymentScreen; 