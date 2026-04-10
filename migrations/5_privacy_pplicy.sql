-- Gizlilik politikasi icerigini veritabaninda tutmak icin tablo ve varsayilan TR metin.
-- Ekranlar `legal_documents` tablosundan `type = 'privacy_policy'` kaydini okur.

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  language text NOT NULL DEFAULT 'tr',
  version text NOT NULL DEFAULT '1.0',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Anon ve authenticated kullanicilar politikayi okuyabilsin
DROP POLICY IF EXISTS "legal_documents_select_all" ON public.legal_documents;
CREATE POLICY "legal_documents_select_all"
ON public.legal_documents
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Yalnizca servis rolu (backend/migration) yazsin
DROP POLICY IF EXISTS "legal_documents_insert_service_role" ON public.legal_documents;
CREATE POLICY "legal_documents_insert_service_role"
ON public.legal_documents
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "legal_documents_update_service_role" ON public.legal_documents;
CREATE POLICY "legal_documents_update_service_role"
ON public.legal_documents
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "legal_documents_delete_service_role" ON public.legal_documents;
CREATE POLICY "legal_documents_delete_service_role"
ON public.legal_documents
FOR DELETE
TO service_role
USING (true);

INSERT INTO public.legal_documents (type, title, content, language, version, is_active)
VALUES (
  'privacy_policy',
  'Gizlilik Politikasi',
  $policy$
ForLovers Gizlilik Politikasi

Yururluk Tarihi: 08.04.2026

ForLovers uygulamasi olarak, kullanicilarimizin gizliligine onem veriyoruz. Bu politika; hangi verileri topladigimizi, neden kullandigimizi ve nasil korudugumuzu aciklar.

1) Toplanan Veriler
- Hesap bilgileri: ad, soyad, e-posta adresi.
- Profil bilgileri: dogum tarihi, profil fotografi, eslesme bilgileri.
- Icerik verileri: yuklediginiz anilar, aciklamalar, konumlar ve fotograflar.
- Teknik veriler: uygulama hata kayitlari, performans ve temel cihaz bilgileri.

2) Verileri Kullanim Amaclari
- Hesap olusturma, kimlik dogrulama ve oturum yonetimi.
- Partner eslesme ve ortak icerik deneyimi sunma.
- Uygulama guvenligi, hata tespiti ve performans iyilestirmesi.
- Yasal yukumluluklerin yerine getirilmesi.

3) Veri Paylasimi
Kisisel verileriniz, acik rizaniz olmadan ucuncu taraflarla satilmaz. Yalnizca:
- Altyapi/hizmet saglayicilar (or. barindirma, veritabani),
- Yasal zorunluluklar,
- Guvenlik ve dolandiricilik onleme durumlarinda paylasilabilir.

4) Veri Saklama
Verileriniz, hizmeti sunmak icin gerekli oldugu surece veya yasal saklama sureleri boyunca tutulur. Hesabinizi sildiginizde, yasal zorunluluklar disinda kalan veriler makul surede silinir veya anonimlestirilir.

5) Guvenlik
Verilerinizin gizliligi ve butunlugu icin teknik ve idari guvenlik onlemleri uygulariz. Ancak internet uzerinden iletimin %100 guvenli oldugu garanti edilemez.

6) Kullanici Haklari
Yururlukteki mevzuata gore:
- Verilerinize erisim talep etme,
- Duzeltme isteme,
- Silme talep etme,
- Islemeye itiraz etme
haklarina sahip olabilirsiniz.

7) Cocuklarin Gizliligi
Uygulama, ilgili mevzuatin izin vermedigi yas gruplarina yonelik degildir. Bu kapsamdaki veriler tespit edilirse silinmesi icin gerekli adimlar atilir.

8) Politika Degisiklikleri
Bu gizlilik politikasi zaman zaman guncellenebilir. Onemli degisiklikler uygulama icinde veya uygun kanallar uzerinden bildirilebilir.

9) Iletisim
Gizlilikle ilgili sorulariniz icin uygulama destek kanallari uzerinden bizimle iletisime gecebilirsiniz.
$policy$,
  'tr',
  '1.0',
  true
)
ON CONFLICT (type) DO UPDATE
SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  language = EXCLUDED.language,
  version = EXCLUDED.version,
  is_active = EXCLUDED.is_active,
  updated_at = now();
