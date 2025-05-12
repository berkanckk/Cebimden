const { GoogleAuth } = require("google-auth-library");

// Hizmet Hesabı JSON Anahtarının Yolu
const SERVICE_ACCOUNT_KEY_FILE = "./cebimde-ra.json"; // JSON dosyanızın doğru yolu

async function getAccessToken() {
    try {
        // GoogleAuth ile kimlik doğrulama
        const auth = new GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY_FILE,
            scopes: ["https://www.googleapis.com/auth/cloud-platform"], // Gerekli kapsam
        });

        // Client oluştur ve erişim jetonunu al
        const client = await auth.getClient();
        const token = await client.getAccessToken();

        console.log("Access Token:", token);
        return token;
    } catch (error) {
        console.error("Error getting access token:", error);
        throw error;
    }
}

// Örnek Kullanım
getAccessToken();
