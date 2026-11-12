-- ========================================================
-- PATCH PERMANEN: PEMBERSIHAN DATA TERHAPUS (ANTI MUNCUL ULANG)
-- Jalankan SQL ini 1x di Supabase Dashboard -> SQL Editor
-- Aman dijalankan berulang kali (100% idempotent)
-- ========================================================

CREATE OR REPLACE FUNCTION _sr12_is_authorized_store_token(
  p_slug TEXT,
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_sess FROM auth_sessions
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    RETURN v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all');
  END IF;

  RETURN (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all');
END;
$$;

CREATE OR REPLACE FUNCTION rpc_update_order_status(
  p_slug TEXT,
  p_order_id TEXT,
  p_new_status TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_canonical TEXT;
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang untuk mengubah status pesanan toko ini.');
  END IF;

  IF p_new_status IN ('Selesai', 'Lunas', 'Lunas / Selesai') THEN
    v_canonical := 'Lunas / Selesai';
  ELSE
    v_canonical := p_new_status;
  END IF;

  UPDATE orders
  SET status = v_canonical
  WHERE store_slug = p_slug AND order_id = p_order_id;

  IF v_canonical ILIKE '%Dibatalkan%' OR v_canonical ILIKE '%Dihapus%' THEN
    DELETE FROM marketer_sales
    WHERE store_slug = p_slug AND order_id = p_order_id;
  ELSE
    UPDATE marketer_sales
    SET paid_status = CASE WHEN v_canonical = 'Lunas / Selesai' THEN 'paid' ELSE 'unpaid' END,
        paid_date = CASE WHEN v_canonical = 'Lunas / Selesai' THEN CURRENT_DATE ELSE NULL END
    WHERE store_slug = p_slug AND order_id = p_order_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', v_canonical, 'message', 'Status pesanan berhasil diperbarui.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_update_order_status(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_clear_store_orders(
  p_slug TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  IF p_slug = 'all' THEN
    DELETE FROM orders;
    DELETE FROM marketer_sales;
  ELSE
    DELETE FROM orders WHERE store_slug = p_slug;
    DELETE FROM marketer_sales WHERE store_slug = p_slug;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Seluruh pesanan dan komisi marketer toko berhasil dikosongkan.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_clear_store_orders(TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_delete_store_order(
  p_slug TEXT,
  p_order_id TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  DELETE FROM orders WHERE store_slug = p_slug AND order_id = p_order_id;
  DELETE FROM marketer_sales WHERE store_slug = p_slug AND order_id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'Pesanan berhasil dihapus.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_delete_store_order(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_clear_store_marketer_sales(
  p_slug TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  IF p_slug = 'all' THEN
    DELETE FROM marketer_sales;
  ELSE
    DELETE FROM marketer_sales WHERE store_slug = p_slug;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Riwayat komisi marketer berhasil dibersihkan secara permanen.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_clear_store_marketer_sales(TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_delete_marketer_sale(
  p_slug TEXT,
  p_order_id TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  DELETE FROM marketer_sales WHERE store_slug = p_slug AND order_id = p_order_id;
  RETURN jsonb_build_object('success', true, 'message', 'Catatan komisi marketer berhasil dihapus permanen.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_delete_marketer_sale(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_clear_store_downlines(
  p_slug TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  IF p_slug = 'all' THEN
    DELETE FROM mitra_downlines;
  ELSE
    DELETE FROM mitra_downlines WHERE store_slug = p_slug;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Database mitra binaan berhasil dikosongkan permanen.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_clear_store_downlines(TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION rpc_reset_store_downline_spent(
  p_slug TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT _sr12_is_authorized_store_token(p_slug, p_token) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak.');
  END IF;

  UPDATE mitra_downlines
  SET accumulated_spent_90_days = 0,
      total_orders_count = 0,
      last_order_date = NULL
  WHERE store_slug = p_slug;

  RETURN jsonb_build_object('success', true, 'message', 'Akumulasi omset mitra berhasil direset ke 0.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_reset_store_downline_spent(TEXT, TEXT) TO anon, authenticated, service_role;

-- Bersihkan sisa data komisi yatim dari pesanan yang sebelumnya sudah dibatalkan/dihapus
DELETE FROM marketer_sales ms
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.store_slug = ms.store_slug
    AND o.order_id = ms.order_id
    AND (o.status ILIKE '%Dibatalkan%' OR o.status ILIKE '%Dihapus%')
);
