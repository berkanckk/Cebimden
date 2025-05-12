import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../styles/colors';
import { notificationService } from '../../services/api';
import { NotificationType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Hata', 'Bildirimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(
        notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Hata', 'Bildirim silinirken bir hata oluştu.');
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationType }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
        onPress={() => !item.read && markAsRead(item.id)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationDate}>{formattedDate}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Bildirimi Sil',
              'Bu bildirimi silmek istediğinizden emin misiniz?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', onPress: () => deleteNotification(item.id), style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={styles.deleteText}>Sil</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Bildirimler" />
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz bildiriminiz bulunmamaktadır</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  unreadNotification: {
    backgroundColor: COLORS.white,
    borderLeftColor: COLORS.primary,
  },
  readNotification: {
    backgroundColor: COLORS.lightGrey,
    borderLeftColor: COLORS.grey,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  deleteText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
});

export default NotificationsScreen; 