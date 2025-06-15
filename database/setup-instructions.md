# F-Bet Database Setup Instructions

## 1. Supabase Dashboard'da RPC Fonksiyonlarını Oluşturma

### Adım 1: Supabase Dashboard'a Giriş
1. https://supabase.com adresine gidin
2. Projenize giriş yapın
3. Sol menüden **SQL Editor**'ı seçin

### Adım 2: RPC Fonksiyonlarını Oluşturma
1. SQL Editor'da **New Query** butonuna tıklayın
2. `database/rpc-functions.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

Bu işlem şu fonksiyonları oluşturacak:
- `exec_sql()` - SQL komutlarını çalıştırmak için
- `get_table_info()` - Tablo bilgilerini almak için
- `get_live_fixtures()` - Canlı maçları almak için
- `get_today_fixtures()` - Bugünkü maçları almak için
- `get_high_confidence_predictions()` - Yüksek güvenilirlik tahminleri için
- `get_team_stats()` - Takım istatistikleri için
- `search_fixtures()` - Maç arama için

## 2. Tabloları Oluşturma

### Yöntem 1: Script ile (Önerilen)
```bash
npm run db:create
```

### Yöntem 2: Manuel olarak
1. SQL Editor'da yeni bir query oluşturun
2. `database/supabase-schema.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın

## 3. Verileri Senkronize Etme

### Tüm verileri senkronize etmek için:
```bash
npm run db:sync
```

### Sadece tabloları oluşturup verileri senkronize etmek için:
```bash
npm run db:setup
```

## 4. Oluşturulacak Tablolar

### Ana Tablolar:
- **countries** - Ülkeler
- **leagues** - Ligler
- **seasons** - Sezonlar
- **venues** - Stadyumlar
- **teams** - Takımlar
- **players** - Oyuncular
- **coaches** - Antrenörler

### Maç Tabloları:
- **fixtures** - Maçlar
- **fixture_events** - Maç olayları (gol, kart, vb.)
- **fixture_lineups** - Maç kadroları
- **fixture_lineup_players** - Kadro oyuncuları
- **fixture_statistics** - Maç istatistikleri

### İstatistik Tabloları:
- **league_standings** - Puan durumu
- **team_statistics** - Takım istatistikleri
- **player_statistics** - Oyuncu istatistikleri

### Bahis ve Tahmin Tabloları:
- **bookmakers** - Bahis siteleri
- **odds** - Oranlar
- **predictions** - Tahminler
- **prediction_comparison** - Tahmin karşılaştırmaları

### İlişki Tabloları:
- **team_squads** - Takım kadroları
- **team_coaches** - Takım antrenörleri
- **transfers** - Transferler
- **injuries** - Sakatlıklar

## 5. API-Football'dan Çekilecek Veriler

### Popüler Ligler:
- **Premier League** (İngiltere) - ID: 39
- **La Liga** (İspanya) - ID: 140
- **Bundesliga** (Almanya) - ID: 78
- **Serie A** (İtalya) - ID: 135
- **Ligue 1** (Fransa) - ID: 61
- **Champions League** (UEFA) - ID: 2
- **Süper Lig** (Türkiye) - ID: 203

### Veri Tipleri:
- Ülkeler ve ligler
- Takımlar ve stadyumlar
- Son 30 günün maçları
- Puan durumları
- Tahminler (mevcut maçlar için)

## 6. Doğrulama

### Tabloların oluşturulduğunu kontrol etmek için:
1. Supabase Dashboard > Table Editor
2. Tüm tabloların listelendiğini kontrol edin

### Verilerin yüklendiğini kontrol etmek için:
```sql
-- Ülke sayısını kontrol et
SELECT COUNT(*) FROM countries;

-- Liga sayısını kontrol et
SELECT COUNT(*) FROM leagues;

-- Takım sayısını kontrol et
SELECT COUNT(*) FROM teams;

-- Maç sayısını kontrol et
SELECT COUNT(*) FROM fixtures;
```

## 7. Hata Giderme

### Eğer RPC fonksiyonları çalışmıyorsa:
1. Supabase Dashboard > Settings > API
2. **Service Role Key**'i kontrol edin
3. `.env` dosyasındaki anahtarları güncelleyin

### Eğer API-Football bağlantısı çalışmıyorsa:
1. API-Football dashboard'da kota kontrolü yapın
2. API anahtarının doğru olduğunu kontrol edin
3. `.env` dosyasındaki `EXPO_PUBLIC_API_FOOTBALL_KEY`'i kontrol edin

### Eğer tablolar oluşturulmuyorsa:
1. SQL Editor'da hata mesajlarını kontrol edin
2. Supabase projesinin aktif olduğunu kontrol edin
3. Database bağlantısının çalıştığını kontrol edin

## 8. Sonraki Adımlar

Tablolar ve veriler oluşturulduktan sonra:
1. Mobil uygulamada veri görüntülemeyi test edin
2. Real-time güncellemeleri aktifleştirin
3. Cron job'lar ile otomatik veri senkronizasyonu kurun
4. Performans optimizasyonları yapın
