// Firebase ve diğer tokenları saklamak için basit bir in-memory store
let firebaseAccessToken = null;
let tokenExpiryTime = null;

/**
 * Firebase Access Token'ı sakla
 * @param {string} token - Firebase Access Token
 * @param {number} expiryInMs - Token'ın geçerlilik süresi (ms cinsinden)
 */
const storeFirebaseAccessToken = (token, expiryInMs = 3600000) => { // Varsayılan olarak 1 saat
  firebaseAccessToken = token;
  tokenExpiryTime = Date.now() + expiryInMs;
  console.log(`Firebase Access Token güncellendi. Geçerlilik süresi: ${new Date(tokenExpiryTime)}`);
  return true;
};

/**
 * Firebase Access Token'ı al
 * @returns {string|null} - Saklanan token veya token geçersizse null
 */
const getFirebaseAccessToken = () => {
  if (!firebaseAccessToken || !tokenExpiryTime) {
    return null;
  }
  
  // Token'ın süresi dolmuş mu kontrol et
  if (Date.now() > tokenExpiryTime) {
    console.log('Firebase Access Token süresi dolmuş.');
    return null;
  }
  
  return firebaseAccessToken;
};

/**
 * Token'ın geçerli olup olmadığını kontrol et
 * @returns {boolean} - Token geçerli mi
 */
const isTokenValid = () => {
  if (!firebaseAccessToken || !tokenExpiryTime) {
    return false;
  }
  
  return Date.now() < tokenExpiryTime;
};

/**
 * Token'ın kalan süresini hesapla
 * @returns {number} - Kalan süre (ms cinsinden)
 */
const getTokenRemainingTime = () => {
  if (!tokenExpiryTime) {
    return 0;
  }
  
  const remaining = tokenExpiryTime - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Token'ı temizle
 */
const clearToken = () => {
  firebaseAccessToken = null;
  tokenExpiryTime = null;
  console.log('Firebase Access Token temizlendi.');
  return true;
};

module.exports = {
  storeFirebaseAccessToken,
  getFirebaseAccessToken,
  isTokenValid,
  getTokenRemainingTime,
  clearToken
}; 