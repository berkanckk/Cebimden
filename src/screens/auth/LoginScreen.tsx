import React, { useState, useEffect } from 'react';
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
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  const { login, isLoading, error } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    // FCM token'ı yükle
    const loadFcmToken = async () => {
      try {
        const token = await AsyncStorage.getItem('fcmToken');
        setFcmToken(token);
        console.log('LoginScreen - FCM token yüklendi:', token);
      } catch (error) {
        console.error('FCM token yüklenirken hata:', error);
      }
    };
    
    loadFcmToken();
  }, []);

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
    
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      console.log('Login yapılıyor, FCM token:', fcmToken);
      await login(email, password, fcmToken);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };
  
  const goToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const getEmailInputStyle = () => {
    if (emailError) return [styles.input, styles.inputError];
    if (emailFocused) return [styles.input, styles.inputFocused];
    return styles.input;
  };

  const getPasswordInputStyle = () => {
    if (passwordError) return [styles.input, styles.inputError];
    if (passwordFocused) return [styles.input, styles.inputFocused];
    return styles.input;
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
            <Text style={styles.welcomeText}>Tekrar Hoşgeldiniz!</Text>
            <Text style={styles.title}>Giriş Yap</Text>
            
            {error && <Text style={globalStyles.errorText}>{error}</Text>}
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <TextInput
                style={getEmailInputStyle()}
                placeholder="E-posta adresinizi girin"
                placeholderTextColor={COLORS.grey400}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <TextInput
                style={getPasswordInputStyle()}
                placeholder="Şifrenizi girin"
                placeholderTextColor={COLORS.grey400}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
            
            <TouchableOpacity style={styles.forgotPassword} onPress={goToForgotPassword}>
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
            </TouchableOpacity>
            
            <GradientButton
              title="Giriş Yap"
              onPress={handleLogin}
              disabled={isLoading}
              loading={isLoading}
              style={styles.loginButton}
            />
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Hesabınız yok mu? </Text>
              <TouchableOpacity onPress={goToRegister}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.grey800,
    marginBottom: 8,
    marginLeft: 4,
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
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  registerText: {
    color: COLORS.grey600,
    fontSize: 15,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default LoginScreen; 