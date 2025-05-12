import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from './colors';

// Ekran boyutları için sabitleri tanımla
const { width, height } = Dimensions.get('window');
const screenWidth = width;
const screenHeight = height;

// Fontlar için
const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const globalStyles = StyleSheet.create({
  // Ana konteynırlar
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
  },
  
  // Kartlar
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(228, 231, 237, 0.6)', // Hafif görünür sınır
  },
  cardElevated: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  cardHighlight: {
    backgroundColor: COLORS.surfaceAccent,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Metin stilleri
  title: {
    fontFamily,
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 24,
  },
  text: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  textSecondary: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.grey600,
    letterSpacing: 0.2,
  },
  
  // Form elementleri
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.grey200,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.surfaceAccent,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  inputLabel: {
    fontFamily,
    fontSize: 14,
    color: COLORS.grey600,
    marginBottom: 6,
    marginLeft: 4,
  },
  
  // Butonlar
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
    letterSpacing: 0.2,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surfaceAccent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    minHeight: 56,
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.grey200,
    minHeight: 56,
  },
  buttonOutlineText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily,
  },
  
  // Düzenler
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Hata & Durum mesajları
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
    fontFamily,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    marginBottom: 8,
    fontFamily,
  },
  
  // Diğer genel stiller
  divider: {
    height: 1,
    backgroundColor: COLORS.grey200,
    width: '100%',
    marginVertical: 20,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    fontFamily,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.grey200,
  },
  shadow: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
}); 