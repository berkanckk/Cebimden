-- isAdmin sütunu ekle
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- firebaseAccessToken sütunu ekle
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "firebaseAccessToken" TEXT;

-- Admin kullanıcıyı ayarla
UPDATE "Users" SET "isAdmin" = true WHERE "email" = 'welceyn@gmail.com';

-- Değişiklikleri onayla
COMMIT; 