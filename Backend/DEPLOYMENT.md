# Deployment Guide - Vercel Serverless

## 📋 Persiapan

Aplikasi telah dikonversi menjadi serverless dan siap deploy ke Vercel.

### File yang Dibuat:
- ✅ `api/index.js` - Entry point serverless function
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `.vercelignore` - File yang diabaikan saat deploy
- ✅ `config/db.js` - Database connection dengan pooling

## 🚀 Cara Deploy ke Vercel

### 1. Install Vercel CLI (jika belum)
```bash
npm install -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

### 3. Deploy Project

#### Dari folder Backend:
```bash
cd Backend
vercel
```

Atau langsung production:
```bash
vercel --prod
```

### 4. Set Environment Variables di Vercel

Setelah deploy, tambahkan environment variables di dashboard Vercel:

**Required Variables:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key untuk JWT
- `NODE_ENV` - production

**Optional Variables (jika digunakan):**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GOOGLE_API_KEY`
- Dan lainnya sesuai kebutuhan

#### Cara set environment variables:
1. Buka dashboard Vercel project Anda
2. Pergi ke **Settings** > **Environment Variables**
3. Tambahkan semua variable yang diperlukan
4. Redeploy project dengan `vercel --prod`

## 📝 Perubahan Penting

### 1. Database Connection
Database connection sekarang menggunakan connection pooling dan caching untuk optimal performance di serverless environment.

### 2. API Endpoints
Semua endpoint tetap sama, hanya prefix dengan domain Vercel:
```
https://your-project.vercel.app/api/warga
https://your-project.vercel.app/api/laporan
https://your-project.vercel.app/api/admin
https://your-project.vercel.app/api/petugas
https://your-project.vercel.app/api/notifications
```

### 3. Development vs Production
- **Development lokal**: Tetap gunakan `npm run dev` dengan server.js
- **Production Vercel**: Menggunakan `api/index.js` otomatis

## 🔧 Testing Lokal (Vercel CLI)

Test fungsi serverless di lokal:
```bash
vercel dev
```

Ini akan menjalankan environment yang mirip dengan production.

## ⚠️ Catatan Penting

1. **File Upload**: Jika menggunakan file upload dengan Multer, pertimbangkan menggunakan cloud storage (Cloudinary, AWS S3) karena Vercel serverless memiliki batasan storage ephemeral.

2. **Timeout**: Default timeout adalah 10 detik. Jika ada operasi yang lebih lama, sesuaikan di `vercel.json`:
   ```json
   "functions": {
     "api/index.js": {
       "maxDuration": 60
     }
   }
   ```

3. **Cold Start**: First request mungkin lebih lambat karena cold start. Ini normal untuk serverless.

4. **Database Connection**: MongoDB connection akan di-cache antar requests untuk performance.

## 📊 Monitoring

Lihat logs dan metrics di:
- Dashboard Vercel > Your Project > Deployments
- Real-time logs: `vercel logs --follow`

## 🔄 Update Aplikasi

Setelah ada perubahan code:
```bash
git add .
git commit -m "your message"
git push
vercel --prod
```

Atau jika terhubung dengan GitHub, Vercel akan auto-deploy setiap push ke main branch.

## 🆘 Troubleshooting

### Connection Timeout
Pastikan MongoDB Atlas whitelist IP `0.0.0.0/0` untuk akses dari serverless functions.

### Environment Variables Not Working
Redeploy setelah menambah/mengubah environment variables.

### 404 Error
Periksa routes di `vercel.json` dan pastikan semua endpoint ada.

---

**Status**: ✅ Ready to Deploy
**Last Updated**: January 4, 2026
