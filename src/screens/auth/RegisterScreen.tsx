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
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import Logo from '../../components/Logo';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from '../../components/GradientButton';

const { width, height } = Dimensions.get('window');

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordConfirmFocused, setPasswordConfirmFocused] = useState(false);
  
  const { register, isLoading, error } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Ad-Soyad gerekli');
      isValid = false;
    } else {
      setNameError('');
    }
    
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
    
    // Validate password
    if (!password.trim()) {
      setPasswordError('Şifre gerekli');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Şifreler eşleşmiyor');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      await register(email, password, name, phone);
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
      </LinearGradient>
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Logo size={200} withBackground={true} withText={true} />
          <Text style={styles.tagline}></Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Yeni Hesap</Text>
            <Text style={styles.title}>Kayıt Ol</Text>
          
          {error && <Text style={globalStyles.errorText}>{error}</Text>}
          
          <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="Ad Soyad"
              value={name}
              onChangeText={setName}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="E-posta adresiniz"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
            <TextInput
              style={styles.input}
              placeholder="Telefon (isteğe bağlı)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          
          <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Şifreniz"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <TextInput
              style={[
                styles.input,
                passwordConfirmFocused && styles.inputFocused,
                confirmPasswordError && styles.inputError,
              ]}
            placeholder="Şifrenizi tekrar girin"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
              onFocus={() => setPasswordConfirmFocused(true)}
              onBlur={() => setPasswordConfirmFocused(false)}
          />
            {confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
          
            <GradientButton
              title="Kayıt Ol"
            onPress={handleRegister}
            disabled={isLoading}
              loading={isLoading}
              style={styles.registerButton}
            />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
            </View>
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  decorationCircle1: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -width * 0.2,
    left: -width * 0.1,
  },
  decorationCircle2: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -width * 0.1,
    right: -width * 0.05,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    marginTop: 12,
    marginBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.grey600,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.textPrimary,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.grey200,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceAccent,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  loginText: {
    color: COLORS.grey600,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default RegisterScreen; 