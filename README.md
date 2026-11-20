# 🏋️‍♂️ BebanKu — Flexible Gym & Workout Tracker

**BebanKu** adalah aplikasi mobile Android pencatat aktivitas latihan gym (*workout tracker*) yang dibangun dengan **React Native (Expo)**. Aplikasi ini dirancang dengan prinsip **fleksibilitas penuh** dan **offline-first**, memungkinkan pengguna untuk membuat daftar gerakan kustom, menyusun jadwal latihan sendiri, memantau grafik perkembangan kekuatan & berat badan, serta berkonsultasi dengan **AI Coach** pribadi.

---

## ✨ Fitur Utama (Key Features)

* **🛠️ Manajemen Gerakan 100% Kustom (Custom Exercises):** Tambah, edit, dan hapus daftar gerakan sesuai peralatan yang tersedia di gym Anda (lengkap dengan kategori otot dan jenis alat).
* **📋 Pembuat Program & Rutinitas (Custom Routines):** Rancang template jadwal latihan harian sendiri (seperti *Push/Pull/Legs* atau *Upper/Lower*) atau mulai sesi latihan spontan kapan saja.
* **⏱️ Pencatat Sesi Aktif & Smart Rest Timer:** Catat beban (`kg`/`lbs`), repetisi, dan catatan per gerakan dengan referensi beban sesi sebelumnya, dilengkapi *rest timer* otomatis dengan notifikasi getar (*haptics*).
* **📈 Grafik Progres & Berat Badan (Progress Analytics):**
  * Grafik garis kenaikan beban maksimal (*Personal Record* / estimasi 1RM) per gerakan.
  * Pencatat & grafik perkembangan berat badan mingguan (*Body Weight Tracker*).
  * Grafik batang konsistensi volume latihan mingguan.
* **🤖 AI Coach (BYOK — Bring Your Own Key):** Asisten pelatih gym berbasis AI yang menganalisis riwayat latihan dan berat badan Anda secara kontekstual. Mendukung API Key gratis dari **Google Gemini** maupun **OpenAI** (disertai mode analisis lokal jika tanpa API Key).
* **🌐 Dwibahasa (Bilingual ID / EN):** Beralih antara Bahasa Indonesia dan Bahasa Inggris secara instan tanpa perlu memulai ulang aplikasi.
* **💾 Offline-First & Backup JSON:** Seluruh data tersimpan aman secara lokal di perangkat (`AsyncStorage`) tanpa memerlukan akun/login, dilengkapi fitur **Export & Import JSON** untuk pencadangan data.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Framework:** [React Native](https://reactnative.dev) & [Expo](https://expo.dev) (Expo Router)
* **Bahasa:** TypeScript
* **Penyimpanan Lokal:** `@react-native-async-storage/async-storage`
* **Visualisasi Grafik:** `react-native-svg` (Custom Line & Bar Charts)
* **AI Integration:** Google Gemini API & OpenAI API (BYOK Architecture)
* **Build & Distribution:** Expo Application Services (EAS Build)

---

## 🚀 Cara Menjalankan di Lokal (Local Development)

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com
   cd bebanku
   ```

2. **Instal seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan Expo:**
   ```bash
   npx expo start
   ```
   Pindai kode QR yang muncul di terminal menggunakan aplikasi **Expo Go** di perangkat Android Anda.

---

## 📦 Build Aplikasi Android (`.apk` / `.aab`)

Proyek ini sudah dikonfigurasi untuk menggunakan **EAS Build**:

* **Build file `.apk` (untuk pengujian / instalasi langsung):**
  ```bash
  eas build -p android --profile preview
  ```

* **Build file `.aab` (untuk rilis Google Play Store):**
  ```bash
  eas build -p android --profile production
  ```

---

## 🔒 Privasi Data

**BebanKu** menjunjung tinggi privasi pengguna. Seluruh riwayat latihan, catatan berat badan, dan API Key disimpan sepenuhnya di penyimpanan lokal perangkat pengguna dan tidak dikirim ke server pihak ketiga mana pun (kecuali saat pengguna secara sadar mengirimkan pertanyaan ke penyedia AI pilihan mereka).

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT License](LICENSE).
