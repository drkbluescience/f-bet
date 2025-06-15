# F-bet Otomatik Veri Senkronizasyon Sistemi

## 🎯 Genel Bakış

F-bet uygulaması, API-Football'dan günlük otomatik veri çekme ve Supabase veritabanı güncelleme sistemi ile donatılmıştır. Bu sistem, kullanıcı müdahalesi olmadan sürekli güncel verileri sağlar.

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API-Football  │────│  Scheduler       │────│   Supabase DB   │
│   (Data Source) │    │  Service         │    │   (Storage)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Notification    │
                       │  Service         │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Dashboard UI    │
                       │  (Ana Sayfa)     │
                       └──────────────────┘
```

## 📋 Ana Bileşenler

### 1. **SchedulerService** (`src/services/schedulerService.ts`)
- **Görev**: Otomatik senkronizasyon işlerini yönetir
- **Özellikler**:
  - Cron-benzeri zamanlama sistemi
  - Job prioritesi ve retry mekanizması
  - Timeout koruması
  - Dinamik job yönetimi

### 2. **DataSyncService** (`src/services/dataSyncService.ts`)
- **Görev**: API-Football'dan veri çeker ve Supabase'e aktarır
- **Desteklenen Veriler**:
  - Ülkeler (Countries)
  - Ligler (Leagues)
  - Takımlar (Teams)
  - Maçlar (Fixtures)
  - Canlı Maçlar (Live Fixtures)
  - Lig Sıralamaları (Standings)

### 3. **NotificationService** (`src/services/notificationService.ts`)
- **Görev**: Senkronizasyon durumunu takip eder ve bildirimler gönderir
- **Özellikler**:
  - Başarı/hata bildirimleri
  - Günlük özet raporları
  - Web push notifications
  - Bildirim geçmişi

### 4. **SyncDashboard** (`src/components/SyncDashboard.tsx`)
- **Görev**: Ana sayfada senkronizasyon durumunu görüntüler
- **Özellikler**:
  - Gerçek zamanlı job durumu
  - İstatistikler ve metrikler
  - Manuel job çalıştırma
  - Bildirim yönetimi

## ⏰ Senkronizasyon Programı

| Job | Sıklık | Açıklama | Öncelik |
|-----|--------|----------|---------|
| **Countries** | Günlük 02:00 | Ülke listesi güncelleme | Düşük |
| **Leagues** | Günlük 03:00 | Lig bilgileri güncelleme | Orta |
| **Teams** | Günlük 04:00 | Takım bilgileri güncelleme | Orta |
| **Fixtures** | Saatlik | Maç programı güncelleme | Yüksek |
| **Live Fixtures** | 2 dakikada bir | Canlı maç durumu | Yüksek |
| **Standings** | Günlük 05:00 | Lig sıralamaları | Orta |

## 🚀 Kurulum ve Başlatma

### Otomatik Başlatma
Uygulama başladığında scheduler otomatik olarak çalışmaya başlar:

```typescript
// App.tsx içinde
useEffect(() => {
  schedulerService.start();
  return () => schedulerService.stop();
}, []);
```

### Manuel Komutlar

```bash
# Scheduler'ı başlat
npm run scheduler:start

# Scheduler'ı durdur
npm run scheduler:stop

# Job durumlarını görüntüle
npm run scheduler:status

# Tüm verileri manuel senkronize et
npm run sync:all

# Sadece bugünün maçlarını senkronize et
npm run sync:today
```

## 📊 Dashboard Özellikleri

### İstatistik Kartları
- **Başarı Oranı**: Son 7 günün senkronizasyon başarı yüzdesi
- **Günlük API Çağrıları**: Bugün yapılan API çağrı sayısı
- **Günlük Kayıtlar**: Bugün işlenen kayıt sayısı
- **Okunmamış Uyarılar**: Bekleyen bildirim sayısı

### Job Yönetimi
- **Durum Görüntüleme**: Her job'un anlık durumu
- **Manuel Çalıştırma**: İsteğe bağlı job başlatma
- **Aktif/Pasif**: Job'ları etkinleştirme/devre dışı bırakma
- **Öncelik Gösterimi**: Job öncelik seviyesi

### Bildirim Sistemi
- **Gerçek Zamanlı Uyarılar**: Başarı/hata bildirimleri
- **Geçmiş Görüntüleme**: Son aktiviteler listesi
- **Okundu İşaretleme**: Bildirim durumu yönetimi
- **Web Push**: Tarayıcı bildirimleri (web platformu)

## 🔧 Konfigürasyon

### Job Ayarları
```typescript
interface ScheduleConfig {
  id: string;
  name: string;
  cronExpression: string;  // Zamanlama
  enabled: boolean;        // Aktif/pasif
  priority: 'high' | 'medium' | 'low';
  maxRetries: number;      // Yeniden deneme sayısı
  retryDelay: number;      // Yeniden deneme gecikmesi
  timeout: number;         // Zaman aşımı süresi
}
```

### Bildirim Ayarları
```typescript
interface NotificationConfig {
  enabled: boolean;        // Genel bildirim durumu
  syncAlerts: boolean;     // Senkronizasyon uyarıları
  errorAlerts: boolean;    // Hata bildirimleri
  dailySummary: boolean;   // Günlük özet
  liveMatchAlerts: boolean; // Canlı maç uyarıları
}
```

## 📈 Performans ve Optimizasyon

### API Rate Limiting
- **Günlük Limit**: 100 çağrı (Free tier)
- **Dakika Limiti**: 100 çağrı
- **Otomatik Throttling**: Limit aşımı koruması

### Veri Optimizasyonu
- **Incremental Sync**: Sadece değişen veriler
- **Batch Processing**: Toplu veri işleme
- **Error Recovery**: Hata durumunda otomatik kurtarma
- **Data Deduplication**: Tekrar eden veri kontrolü

### Bellek Yönetimi
- **Notification Limit**: Son 100 bildirim
- **Log Rotation**: Otomatik log temizleme
- **Cache Management**: Bellek kullanım optimizasyonu

## 🛠️ Sorun Giderme

### Yaygın Sorunlar

1. **Scheduler Çalışmıyor**
   ```bash
   # Durumu kontrol et
   npm run scheduler:status
   
   # Yeniden başlat
   npm run scheduler:stop
   npm run scheduler:start
   ```

2. **API Limit Aşımı**
   - Dashboard'da günlük API kullanımını kontrol edin
   - Job sıklığını azaltın
   - Öncelikli job'ları belirleyin

3. **Senkronizasyon Hataları**
   - Notification panel'den hata detaylarını inceleyin
   - Network bağlantısını kontrol edin
   - Supabase bağlantısını test edin

### Debug Modu
```typescript
// Detaylı log için
console.log('Debug mode enabled');
schedulerService.enableDebugMode();
```

## 🔒 Güvenlik

### API Key Yönetimi
- Environment variables kullanımı
- Key rotation desteği
- Rate limiting koruması

### Veri Güvenliği
- Supabase RLS (Row Level Security)
- Encrypted connections
- Data validation

## 📱 Platform Desteği

| Platform | Scheduler | Notifications | Dashboard |
|----------|-----------|---------------|-----------|
| **React Native** | ✅ | ✅ | ✅ |
| **Web** | ✅ | ✅ (Push) | ✅ |
| **iOS** | ✅ | ✅ (Local) | ✅ |
| **Android** | ✅ | ✅ (Local) | ✅ |

## 🚀 Gelecek Geliştirmeler

- [ ] Machine Learning tabanlı tahmin sistemi
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Real-time WebSocket connections
- [ ] Advanced filtering and search
- [ ] Export/Import functionality
- [ ] Custom webhook integrations
- [ ] Advanced notification channels (Email, SMS)

## 📞 Destek

Sistem ile ilgili sorunlar için:
1. Dashboard'daki hata loglarını kontrol edin
2. Console output'unu inceleyin
3. Notification geçmişini gözden geçirin
4. Manuel sync testleri yapın

---

**Not**: Bu sistem sürekli geliştirilmekte olup, yeni özellikler ve optimizasyonlar düzenli olarak eklenmektedir.
