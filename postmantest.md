1. FCM Token Gönderimi Testi:
 http://localhost:5000/api/users/fcm-token
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{jwt_token}}

BODY:
{
  "fcmToken": "FCM_TOKEN_BURAYA"
}



2. Bildirim Ayarları Testi:
Endpoint: http://localhost:5000/api/users/notification-preferences
Method: GET (tercihleri almak için)
Headers:
Authorization: Bearer {{jwt_token}}
Endpoint: /api/users/notification-preferences
Method: PUT (tercihleri güncellemek için)

BODY:

{
  "enableNotifications": true,
  "enableFirebaseNotifications": true, 
  "dayBeforeReminder": true,
  "notificationTime": "09:00"
}

3. Doğrudan Bildirim Gönderme Testi:
Endpoint:   http://localhost:5000/api/notifications/send           
Method: POST

BODY:

{
  "userId": "KULLANICI_ID",
  "title": "Test Bildirimi",
  "body": "Bu bir test bildirimidir",
  "data": {
    "type": "payment",
    "paymentId": "123"
  }
}