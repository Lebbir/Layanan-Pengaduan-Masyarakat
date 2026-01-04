# Frontend Deployment Guide

## ✅ Perubahan yang Sudah Dilakukan

### 1. File Baru:
- ✅ `js/config.js` - Konfigurasi API URL
- ✅ `vercel.json` - Konfigurasi Vercel untuk Frontend

### 2. File yang Diupdate:
- ✅ `js/script.js` - Import config dan set global API_BASE_URL
- ✅ `js/profile.js` - Menggunakan API_BASE_URL dari config
- ✅ `js/reports.js` - Menggunakan API_BASE_URL dari config
- ✅ `js/login.js` - Menggunakan API_BASE_URL dari window
- ✅ `js/signup.js` - Menggunakan API_BASE_URL dari window
- ✅ `js/form.js` - Menggunakan API_BASE_URL dari window
- ✅ `index.html` - Script tag menggunakan type="module"
- ✅ `pages/profile.html` - Script tag menggunakan type="module"
- ✅ `pages/reports.html` - Script tag menggunakan type="module"

### 3. API URL:
Backend deployed di: **https://lapordesa.vercel.app**

---

## 🚀 Deploy Frontend ke Vercel

### Langkah 1: Deploy dari Terminal

```bash
cd "c:\Kuliah\Semester 7\Computing Project\LaporDesa\Layanan-Pengaduan-Masyarakat\Frontend"
npx vercel --prod
```

### Langkah 2: Jawab Pertanyaan Vercel

```
? Set up and deploy? → Yes
? Which scope? → Pilih account Anda
? Link to existing project? → No
? Project name? → lapordesa-frontend (atau nama lain)
? Directory? → ./ (current directory)
```

### Langkah 3: Tunggu Deploy Selesai

Anda akan mendapat URL seperti:
```
https://lapordesa-frontend.vercel.app
```

---

## 🔄 Update Admin Panel

Jangan lupa update Admin panel juga! File yang perlu diupdate:

```javascript
// admin/js/admin-login.js
const API_BASE_URL = 'https://lapordesa.vercel.app';

// admin/js/dashboard-reports.js
const API_BASE_URL = 'https://lapordesa.vercel.app';

// admin/js/task-management.js
const API_BASE_URL = 'https://lapordesa.vercel.app';
```

Lalu deploy admin:
```bash
cd "c:\Kuliah\Semester 7\Computing Project\LaporDesa\Layanan-Pengaduan-Masyarakat\admin"
npx vercel --prod
```

---

## ✅ Verifikasi Setelah Deploy

1. **Test Frontend**:
   - Buka https://lapordesa-frontend.vercel.app
   - Test login/register
   - Test submit laporan
   - Test view reports

2. **Check Console Errors**:
   - Buka Developer Tools (F12)
   - Lihat tab Console untuk error
   - Pastikan API calls berhasil

3. **Test CORS**:
   - Jika ada error CORS, update Backend CORS settings

---

## 🔧 Troubleshooting

### Error: CORS Policy
Update Backend `server.js` atau `api/index.js`:
```javascript
app.use(cors({
  origin: [
    'https://lapordesa-frontend.vercel.app',
    'http://localhost:3000'
  ]
}));
```

### Error: Module not found
Pastikan semua import menggunakan file extension `.js`:
```javascript
import { API_BASE_URL } from './config.js'; // ✅ Benar
import { API_BASE_URL } from './config';    // ❌ Salah
```

### Error: 404 on Page Refresh
Sudah ditangani oleh `vercel.json` routes configuration.

---

## 📊 Summary

| Component | URL | Status |
|-----------|-----|--------|
| Backend API | https://lapordesa.vercel.app | ✅ Deployed |
| Frontend | Deploy sekarang! | ⏳ Pending |
| Admin Panel | Deploy setelah Frontend | ⏳ Pending |

---

**Next Steps:**
1. Deploy Frontend: `npx vercel --prod`
2. Test semua fitur
3. Update & Deploy Admin panel
4. Done! 🎉
