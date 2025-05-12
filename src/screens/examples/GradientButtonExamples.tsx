import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../../styles/colors';
import { globalStyles } from '../../styles/globalStyles';
import Header from '../../components/Header';
import GradientButton from '../../components/GradientButton';

const GradientButtonExamples = () => {
  const showAlert = (message: string) => {
    Alert.alert('Bilgi', message);
  };

  return (
    <View style={styles.container}>
      <Header title="Gradient Butonlar" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Standart Gradient Butonlar</Text>
        <View style={styles.exampleContainer}>
          <GradientButton
            title="Ana Buton"
            onPress={() => showAlert('Ana buton tıklandı')}
          />
          
          <GradientButton
            title="İkincil Buton"
            onPress={() => showAlert('İkincil buton tıklandı')}
            variant="secondary"
          />
          
          <GradientButton
            title="Başarı Butonu"
            onPress={() => showAlert('Başarı butonu tıklandı')}
            variant="success"
          />
          
          <GradientButton
            title="Tehlike Butonu"
            onPress={() => showAlert('Tehlike butonu tıklandı')}
            variant="danger"
          />
          
          <GradientButton
            title="Anahat Butonu"
            onPress={() => showAlert('Anahat butonu tıklandı')}
            variant="outline"
          />
        </View>

        <Text style={styles.sectionTitle}>Yükleme Durumları</Text>
        <View style={styles.exampleContainer}>
          <GradientButton
            title="Yükleniyor..."
            onPress={() => {}}
            loading={true}
          />
          
          <GradientButton
            title="Yükleniyor..."
            onPress={() => {}}
            loading={true}
            variant="secondary"
          />
          
          <GradientButton
            title="Yükleniyor..."
            onPress={() => {}}
            loading={true}
            variant="outline"
          />
        </View>

        <Text style={styles.sectionTitle}>Devre Dışı Butonlar</Text>
        <View style={styles.exampleContainer}>
          <GradientButton
            title="Devre Dışı"
            onPress={() => {}}
            disabled={true}
          />
          
          <GradientButton
            title="Devre Dışı"
            onPress={() => {}}
            disabled={true}
            variant="secondary"
          />
          
          <GradientButton
            title="Devre Dışı"
            onPress={() => {}}
            disabled={true}
            variant="outline"
          />
        </View>

        <Text style={styles.sectionTitle}>Özel Renkli Butonlar</Text>
        <View style={styles.exampleContainer}>
          <GradientButton
            title="Özel Renkler"
            onPress={() => showAlert('Özel renkli buton tıklandı')}
            colors={['#FF9800', '#F44336']}
          />
          
          <GradientButton
            title="Farklı Yön"
            onPress={() => showAlert('Farklı yönlü buton tıklandı')}
            colors={['#4CAF50', '#8BC34A']}
            startPosition={{ x: 0, y: 1 }}
            endPosition={{ x: 1, y: 0 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 24,
  },
  exampleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...globalStyles.shadow,
  },
});

export default GradientButtonExamples; 