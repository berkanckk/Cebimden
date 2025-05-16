const path = require('path');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');
const tokenStore = require('../utils/tokenStore');

/**
 * Firebase Access Token alma işlemi
 * Service account kullanarak Google Cloud API için Access Token üretir
 */
const getFirebaseAccessToken = async () => {
  try {
    // Önce token store'dan token'ı kontrol et
    const storedToken = tokenStore.getFirebaseAccessToken();
    if (storedToken) {
      console.log('Token store\'dan geçerli token alındı. Kalan süre:', 
        Math.round(tokenStore.getTokenRemainingTime() / 1000 / 60), 'dakika');
      return storedToken;
    }

    // Service Account dosyasını bul
    const firebaseAuthPath = path.resolve(process.cwd(), '../../firebaseauth/cebimde-ra.json');
    const altPath = path.resolve(process.cwd(), '../firebaseauth/cebimde-ra.json');
    const thirdPath = 'C:/Cebimde/firebaseauth/cebimde-ra.json';
    
    let serviceAccountFile = null;
    let usedPath = '';
    
    if (fs.existsSync(firebaseAuthPath)) {
      usedPath = firebaseAuthPath;
      serviceAccountFile = JSON.parse(fs.readFileSync(firebaseAuthPath, 'utf8'));
    } else if (fs.existsSync(altPath)) {
      usedPath = altPath;
      serviceAccountFile = JSON.parse(fs.readFileSync(altPath, 'utf8'));
    } else if (fs.existsSync(thirdPath)) {
      usedPath = thirdPath;
      serviceAccountFile = JSON.parse(fs.readFileSync(thirdPath, 'utf8'));
    }
    
    if (!serviceAccountFile) {
      console.error('Firebase Service Account dosyası bulunamadı.');
      return null;
    }
    
    console.log(`Firebase Service Account bulundu: ${usedPath}`);
    
    // GoogleAuth ile token al
    const auth = new GoogleAuth({
      credentials: serviceAccountFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
    
    const client = await auth.getClient();
    const tokenData = await client.getAccessToken();
    
    if (!tokenData || !tokenData.token) {
      console.error('Token alınamadı');
      return null;
    }
    
    // Token'ı token store'a kaydet (55 dakika geçerli)
    tokenStore.storeFirebaseAccessToken(tokenData.token, 55 * 60 * 1000);
    
    console.log('Firebase Access Token başarıyla alındı');
    return tokenData.token;
  } catch (error) {
    console.error('Firebase Access Token alma hatası:', error);
    return null;
  }
};

module.exports = {
  getFirebaseAccessToken
}; 