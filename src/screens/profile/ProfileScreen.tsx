import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import Header from '../../components/Header';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../../navigation/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authService } from '../../services/api';

const { width } = Dimensions.get('window');

// İkon karakterleri
const ICONS = {
  edit: '✏️',
  lock: '🔒',
  notification: '🔔',
  email: '📧',
  help: '❓',
  security: '🛡️',
  logout: '🚪',
  close: '✖️',
  camera: '📷',
};

const ProfileScreen = () => {
  const { user, logout, isLoading, updateUserProfile } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isPrivacyPolicyModalVisible, setIsPrivacyPolicyModalVisible] = useState(false);
  const [isHelpSupportModalVisible, setIsHelpSupportModalVisible] = useState(false);
  const navigation = useNavigation<StackNavigationProp<MainTabParamList>>();
  
  // Profil bilgileri
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Çıkış yapılıyor...');
              await logout();
              console.log('Çıkış yapıldı.');
              // AuthContext içinde yapılacak çıkış işlemini bekleyin
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Hata', 'Çıkış yaparken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Hata', 'İsim alanı boş olamaz.');
        return;
      }

      if (!email.trim()) {
        Alert.alert('Hata', 'E-posta alanı boş olamaz.');
        return;
      }

      // API ile profil bilgilerini güncelle
      await authService.updateProfile({ name, email, phone });
      
      setIsEditProfileModalVisible(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz başarıyla güncellendi.');
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      // API'den gelen hata mesajını kullanıcıya göster
      const errorMessage = error.response?.data?.message || 'Profil güncellenirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword) {
        Alert.alert('Hata', 'Mevcut şifrenizi girmelisiniz.');
        return;
      }

      if (!newPassword) {
        Alert.alert('Hata', 'Yeni şifre alanı boş olamaz.');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
        return;
      }

      // API ile şifre değiştirme işlemi
      const response = await authService.changePassword(currentPassword, newPassword);
      
      setIsChangePasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi. Lütfen yeni şifrenizle tekrar giriş yapın.');

      // Şifre değiştirdikten sonra kullanıcıyı güvenlik amacıyla çıkış yaptıralım
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      console.error('Change password error:', error);
      
      // API'den gelen hata mesajını kullanıcıya göster
      const errorMessage = error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
      
      // Mevcut şifre yanlışsa ilgili alanı temizle
      if (error.response?.status === 401) {
        setCurrentPassword('');
      }
    }
  };

  const navigateToHelpSupport = () => {
    setIsHelpSupportModalVisible(true);
    // Alternatif olarak diğer bir sayfaya yönlendirilebilir
    // navigation.navigate('HelpSupport');
  };

  const navigateToPrivacyPolicy = () => {
    setIsPrivacyPolicyModalVisible(true);
    // Alternatif olarak diğer bir sayfaya yönlendirilebilir
    // navigation.navigate('PrivacyPolicy');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Profil menü öğesi renderlama fonksiyonu (icon ve yön oku ile)
  const renderMenuItem = (title: string, action: () => void, iconChar: string = '', iconRight: string = '›') => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={action}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {iconChar && (
          <Text style={styles.menuItemLeftIcon}>{iconChar}</Text>
        )}
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <Text style={styles.menuItemIcon}>{iconRight}</Text>
    </TouchableOpacity>
  );

  // Profil düzenleme modalı
  const renderEditProfileModal = () => (
    <Modal
      visible={isEditProfileModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsEditProfileModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profil Bilgilerini Düzenle</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsEditProfileModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{ICONS.close}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>İsim</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="İsminiz"
              placeholderTextColor={COLORS.grey400}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta adresiniz"
              placeholderTextColor={COLORS.grey400}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Telefon numaranız"
              placeholderTextColor={COLORS.grey400}
              keyboardType="phone-pad"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdateProfile}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Şifre değiştirme modalı
  const renderChangePasswordModal = () => (
    <Modal
      visible={isChangePasswordModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsChangePasswordModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsChangePasswordModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{ICONS.close}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mevcut Şifre</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mevcut şifreniz"
              placeholderTextColor={COLORS.grey400}
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Yeni şifreniz"
              placeholderTextColor={COLORS.grey400}
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
            <TextInput
              style={styles.input}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Yeni şifrenizi tekrar girin"
              placeholderTextColor={COLORS.grey400}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Gizlilik Politikası modalı
  const renderPrivacyPolicyModal = () => (
    <Modal
      visible={isPrivacyPolicyModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsPrivacyPolicyModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gizlilik Politikası</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsPrivacyPolicyModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{ICONS.close}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContentContainer}
          >
            <Text style={styles.policyTitle}>Cebimde Uygulaması Gizlilik Politikası</Text>
            <Text style={styles.policyText}>
              Cebimde uygulaması olarak, kişisel gizliliğinize saygı duyuyoruz. Bu gizlilik politikası, uygulamamızı kullanırken toplanan, kullanılan ve paylaşılan verileri açıklamaktadır.
            </Text>
            
            <Text style={styles.policySubtitle}>1. Toplanan Bilgiler</Text>
            <Text style={styles.policyText}>
              Uygulamamızı kullanabilmeniz için gerekli olan bilgileri (ad, e-posta adresi, telefon numarası vb.) toplarız. Ayrıca, uygulamayı kullanımınızla ilgili analitik verileri de toplayabiliriz.
            </Text>
            
            <Text style={styles.policySubtitle}>2. Bilgilerin Kullanımı</Text>
            <Text style={styles.policyText}>
              Topladığımız bilgileri hesabınızı yönetmek, hizmetlerimizi iyileştirmek ve size özel teklifler sunmak için kullanırız.
            </Text>
            
            <Text style={styles.policySubtitle}>3. Bilgi Paylaşımı</Text>
            <Text style={styles.policyText}>
              Kişisel bilgilerinizi yasal zorunluluklar dışında üçüncü taraflarla paylaşmayız. Hizmet sağlayıcılarımızla paylaşılan bilgiler, yalnızca size hizmet sağlamak amacıyla kullanılır.
            </Text>
            
            <Text style={styles.policySubtitle}>4. Güvenlik</Text>
            <Text style={styles.policyText}>
              Kişisel bilgilerinizi korumak için uygun güvenlik önlemlerini alırız. Ancak, internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olmadığını unutmayın.
            </Text>
            
            <Text style={styles.policySubtitle}>5. Değişiklikler</Text>
            <Text style={styles.policyText}>
              Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Değişiklikler yapıldığında, güncellenmiş politikayı uygulamamızda yayınlayacağız.
            </Text>
            
            <Text style={styles.policySubtitle}>6. İletişim</Text>
            <Text style={styles.policyText}>
              Gizlilik politikamızla ilgili sorularınız varsa, lütfen support@cebimde.com adresinden bizimle iletişime geçin.
            </Text>
            
            <Text style={styles.policyText}>
              Son güncelleme: 1 Kasım 2023
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Yardım ve Destek modalı
  const renderHelpSupportModal = () => (
    <Modal
      visible={isHelpSupportModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsHelpSupportModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yardım ve Destek</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsHelpSupportModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{ICONS.close}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContentContainer}
          >
            <Text style={styles.helpTitle}>Sıkça Sorulan Sorular</Text>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Şifremi unuttum, ne yapmalıyım?</Text>
              <Text style={styles.faqAnswer}>
                Giriş ekranındaki "Şifremi Unuttum" bağlantısına tıklayarak şifre sıfırlama adımlarını izleyebilirsiniz.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Hesabımı nasıl güncelleyebilirim?</Text>
              <Text style={styles.faqAnswer}>
                Profil sayfasındaki "Profil Bilgilerini Düzenle" seçeneğine tıklayarak hesap bilgilerinizi güncelleyebilirsiniz.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Bildirim ayarlarını nasıl değiştirebilirim?</Text>
              <Text style={styles.faqAnswer}>
                Profil sayfasındaki "Bildirim Ayarları" bölümünden bildirim tercihlerinizi yönetebilirsiniz.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Uygulama ile ilgili bir sorun bildirmek istiyorum?</Text>
              <Text style={styles.faqAnswer}>
                Aşağıdaki iletişim bilgilerinden bize ulaşabilirsiniz. Sorunun detaylarını ve mümkünse ekran görüntülerini eklemeyi unutmayın.
              </Text>
            </View>
            
            <Text style={styles.helpTitle}>Bize Ulaşın</Text>
            <Text style={styles.contactInfo}>E-posta: support@cebimde.com</Text>
            <Text style={styles.contactInfo}>Telefon: +90 212 123 45 67</Text>
            <Text style={styles.contactInfo}>Çalışma Saatleri: Hafta içi 09:00 - 18:00</Text>
            
            <TouchableOpacity 
              style={styles.supportButton}
              activeOpacity={0.8}
              onPress={() => {
                // E-posta gönderme işlevi veya destek talebi formu açılabilir
                Alert.alert('Bilgi', 'Destek talebiniz için teşekkür ederiz. En kısa sürede sizinle iletişime geçeceğiz.');
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.supportButtonGradient}
              >
                <Text style={styles.supportButtonText}>Destek Talebi Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Profil" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Animasyonlu Profil Kartı */}
        <Animated.View 
          style={styles.profileCard}
          entering={FadeInDown.duration(800).springify()}
        >
          <View style={styles.avatarWrapper}>
            {user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.avatarImage} 
                resizeMode="cover" 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Logo size={60} withBackground={true} withText={false} />
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={() => {
                    // Fotoğraf değiştirme işlevi eklenebilir
                    Alert.alert('Bilgi', 'Profil fotoğrafı değiştirme özelliği yakında eklenecektir.');
                  }}
                >
                  <Text style={styles.cameraIcon}>{ICONS.camera}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </Animated.View>
      
        {/* Ana Menu Bölümleri */}
        <Animated.View 
          style={styles.menuSection}
          entering={FadeInUp.duration(800).delay(200)}
        >
          <Text style={styles.sectionLabel}>Hesap Bilgileri</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('Profil Bilgilerini Düzenle', () => setIsEditProfileModalVisible(true), ICONS.edit)}
            <View style={styles.divider} />
            {renderMenuItem('Şifre Değiştir', () => setIsChangePasswordModalVisible(true), ICONS.lock)}
          </View>
        </Animated.View>
        
        <Animated.View 
          style={styles.menuSection}
          entering={FadeInUp.duration(800).delay(300)}
        >
          <Text style={styles.sectionLabel}>Bildirim Ayarları</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('Bildirim Tercihlerini Yönet', () => {
              navigation.navigate('Home', { screen: 'NotificationSettings' });
            }, ICONS.notification)}
          </View>
        </Animated.View>
        
        <Animated.View 
          style={styles.menuSection}
          entering={FadeInUp.duration(800).delay(400)}
        >
          <Text style={styles.sectionLabel}>Uygulama</Text>
          <View style={styles.menuCard}>
            {renderMenuItem('Yardım ve Destek', navigateToHelpSupport, ICONS.help)}
            <View style={styles.divider} />
            {renderMenuItem('Gizlilik Politikası', navigateToPrivacyPolicy, ICONS.security)}
          </View>
        </Animated.View>
        
        {/* Çıkış Butonu ve Versiyon */}
        <Animated.View 
          style={styles.logoutSection}
          entering={FadeInUp.duration(800).delay(500)}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.danger, '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutButtonGradient}
            >
              <Text style={{...styles.logoutIcon, marginRight: 8}}>{ICONS.logout}</Text>
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Cebimde v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Modallar */}
      {renderEditProfileModal()}
      {renderChangePasswordModal()}
      {renderPrivacyPolicyModal()}
      {renderHelpSupportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarWrapper: {
    marginBottom: 16,
    padding: 4,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarPlaceholder: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.grey600,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 0,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLeftIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  switchMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemIcon: {
    fontSize: 20,
    color: COLORS.grey400,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginHorizontal: 16,
  },
  logoutSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: 'rgba(244, 67, 54, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
    color: COLORS.grey400,
    marginTop: 5,
  },
  // Modal Stilleri
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollContent: {
    flexGrow: 0,
    maxHeight: '100%',
    paddingHorizontal: 16,
  },
  modalScrollContentContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  bottomPadding: {
    height: 40,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.grey100,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  saveButton: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: 'rgba(0, 123, 255, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Gizlilik Politikası Stilleri
  policyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  policySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  // Yardım ve Destek Stilleri
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  supportButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: 'rgba(0, 123, 255, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  supportButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonText: {
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  cameraIcon: {
    fontSize: 14,
    color: COLORS.white,
  },
  logoutIcon: {
    fontSize: 18,
    color: COLORS.white,
  },
});

export default ProfileScreen; 