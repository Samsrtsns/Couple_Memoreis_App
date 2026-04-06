-- ==============================================================================
-- PROFILE & ACCOUNT MANAGEMENT MIGRATION
-- ==============================================================================

-- 1. CASCADE DELETE AYARLARI (Veri Temizliği Güvenliği)
-- Bir profil silindiğinde ona bağlı tüm verilerin otomatik silinmesini sağlar.

-- Memories için:
ALTER TABLE public.memories
DROP CONSTRAINT IF EXISTS memories_created_by_fkey,
ADD CONSTRAINT memories_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Shared Places için:
ALTER TABLE public.shared_places
DROP CONSTRAINT IF EXISTS shared_places_created_by_fkey,
ADD CONSTRAINT shared_places_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Comments için:
ALTER TABLE public.place_comments
DROP CONSTRAINT IF EXISTS place_comments_user_id_fkey,
ADD CONSTRAINT place_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. PROFİL GÜNCELLEME İÇİN RLS (Row Level Security) KURALLARI
-- Kullanıcıların sadece kendi satırlarını güncelleyebileceğinden emin oluyoruz.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. HESAP SİLME FONKSİYONU (RPC)
-- Kullanıcı uygulamadan "Hesabımı Sil" dediğinde çağrılacak güvenli fonksiyon.
-- Not: Bu fonksiyon SECURITY DEFINER ile çalışır, yani tetikleyen kullanıcın yetkisiyle 
-- hem public verilerini hem de auth tablosundaki kaydını temizler.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Fonksiyonu çağıran kullanıcının ID'sini al
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Public.profiles tablosundan sil (Cascade sayesinde anılar, yerler, yorumlar da silinir)
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- 2. Auth.users tablosundan sil (Supabase Auth kaydını tamamen kapatır)
  -- Not: Supabase üzerinde Auth silme işlemi genellikle 'delete from auth.users' ile yapılır.
  DELETE FROM auth.users WHERE id = v_user_id;

END;
$$;

-- 4. PARTNER EŞLEŞMESİNİ KALDIRMA (Unpair) FONKSİYONU
-- Sadece partnerlik bağını koparmak ama hesabı silmemek için.

CREATE OR REPLACE FUNCTION public.unpair_partner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_partner_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Partner id'yi bul
  SELECT partner_id INTO v_partner_id FROM public.profiles WHERE id = v_user_id;
  
  IF v_partner_id IS NOT NULL THEN
    -- Kendi alanını temizle
    UPDATE public.profiles 
    SET partner_id = NULL, matched_at = NULL 
    WHERE id = v_user_id;
    
    -- Partnerin alanını temizle
    UPDATE public.profiles 
    SET partner_id = NULL, matched_at = NULL 
    WHERE id = v_partner_id;
  END IF;
END;
$$;
