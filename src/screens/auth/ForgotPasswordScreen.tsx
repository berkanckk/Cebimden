import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import Logo from '../../components/Logo';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { resetPassword, isLoading, error } = useAuth();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const validateForm = () => {
    let isValid = true;
    
    // Validate email
    if (!email.trim()) {
      setEmailError('E-posta gerekli');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    return isValid;
  };

  const handleResetPassword = async () => {
    if (validateForm()) {
      try {
        await resetPassword(email);
        setSuccess(true);
        Alert.alert(
          'Başarılı',
          'Şifre sıfırlama talimatları e-posta adresinize gönderildi.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } catch (error) {
        console.error('Reset password error:', error);
      }
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Logo size={200} withBackground={false} withText={false} />
          <Text style={styles.tagline}>Ödemelerinizi takip etmenin kolay yolu</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Şifre Sıfırlama</Text>
          <Text style={styles.instructionText}>
            Lütfen hesabınızla ilişkili e-posta adresini girin. Şifrenizi sıfırlamak için bir bağlantı gönderilecektir.
          </Text>
          
          {error && <Text style={globalStyles.errorText}>{error}</Text>}
          
          <TextInput
            style={[globalStyles.input, emailError ? styles.inputError : null]}
            placeholder="E-posta adresiniz"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {emailError ? <Text style={globalStyles.errorText}>{emailError}</Text> : null}
          
          <TouchableOpacity
            style={[globalStyles.button, styles.resetButton]}
            onPress={handleResetPassword}
            disabled={isLoading || success}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={globalStyles.buttonText}>Şifre Sıfırlama Bağlantısı Gönder</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backToLogin} onPress={goToLogin}>
            <Text style={styles.backToLoginText}>Giriş Ekranına Dön</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  resetButton: {
    marginTop: 10,
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  backToLoginText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen; 