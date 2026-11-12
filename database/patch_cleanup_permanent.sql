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

-- ========================================================
-- PATCH AFFILIATE MARKETER: AKUMULASI OMSET HET OTOMATIS
-- Saat pembeli check out via link ?ref=KODE_MARKETER, omset HET otomatis
-- menambah accumulated_spent_90_days milik Marketer (Rules 2026 naik ke Reseller).
-- ========================================================
CREATE OR REPLACE FUNCTION rpc_create_store_order(
  p_slug TEXT,
  p_order JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id TEXT;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_customer_address TEXT;
  v_tier TEXT;
  v_tier_label TEXT;
  v_items JSONB;
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_grand_total NUMERIC(12,2);
  v_payment_method TEXT;
  v_status TEXT;
  v_order_source TEXT;
  v_marketer_id TEXT;
  v_remaining_quota INT := -1;
  v_existing_id UUID;
  v_date_only DATE := CURRENT_DATE;
  v_month_period VARCHAR(7) := to_char(CURRENT_DATE, 'YYYY-MM');
  v_comm_pct NUMERIC(5,2) := 0;
  v_comm_amount NUMERIC(12,2) := 0;
BEGIN
  IF p_slug IS NULL OR TRIM(p_slug) = '' THEN
    p_slug := 'sr12-central';
  END IF;

  IF p_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Payload data pesanan kosong.');
  END IF;

  v_order_id := COALESCE(p_order->>'id', p_order->>'order_id', 'ORD-' || floor(extract(epoch from now()))::text);
  v_customer_name := COALESCE(p_order->>'customerName', p_order->>'customer_name', 'Pelanggan');
  v_customer_phone := COALESCE(p_order->>'customerPhone', p_order->>'customer_phone', '-');
  v_customer_address := COALESCE(p_order->>'customerAddress', p_order->>'customer_address', '-');
  v_tier := COALESCE(p_order->>'tier', 'konsumen');
  v_tier_label := COALESCE(p_order->>'tierLabel', p_order->>'tier_label', 'Konsumen Retail');
  v_items := COALESCE(p_order->'items', p_order->'items_json', '[]'::jsonb);
  v_subtotal := COALESCE((p_order->>'subtotalHet')::NUMERIC, (p_order->>'subtotal_het')::NUMERIC, (p_order->>'grandTotal')::NUMERIC, 0.00);
  v_discount := COALESCE((p_order->>'discountAmount')::NUMERIC, (p_order->>'discount_amount')::NUMERIC, 0.00);
  v_grand_total := COALESCE((p_order->>'grandTotal')::NUMERIC, (p_order->>'grand_total')::NUMERIC, 0.00);
  v_payment_method := COALESCE(p_order->>'paymentMethod', p_order->>'payment_method', 'Ekspedisi Pengiriman');
  v_status := COALESCE(p_order->>'status', 'Menunggu Konfirmasi');
  v_order_source := COALESCE(p_order->>'orderSource', p_order->>'order_source', 'Online Web Store');

  SELECT id INTO v_existing_id FROM orders WHERE store_slug = p_slug AND order_id = v_order_id LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE orders
    SET customer_name = v_customer_name,
        customer_phone = v_customer_phone,
        customer_address = v_customer_address,
        tier = v_tier,
        tier_label = v_tier_label,
        items_json = v_items,
        subtotal_het = v_subtotal,
        discount_amount = v_discount,
        grand_total = v_grand_total,
        payment_method = v_payment_method,
        status = v_status,
        order_source = v_order_source
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO orders (
      store_slug, order_id, order_date, customer_name, customer_phone, customer_address,
      tier, tier_label, items_json, subtotal_het, discount_amount, grand_total,
      payment_method, status, order_source
    ) VALUES (
      p_slug, v_order_id, NOW(), v_customer_name, v_customer_phone, v_customer_address,
      v_tier, v_tier_label, v_items, v_subtotal, v_discount, v_grand_total,
      v_payment_method, v_status, v_order_source
    );

    UPDATE stores
    SET order_quota = GREATEST(0, order_quota - 1),
        total_tx = COALESCE(total_tx, 0) + 1,
        updated_at = NOW()
    WHERE slug = p_slug
    RETURNING order_quota INTO v_remaining_quota;
  END IF;

  v_marketer_id := NULLIF(TRIM(COALESCE(p_order->>'marketerId', p_order->>'marketer_id', '')), '');
  DELETE FROM marketer_sales WHERE store_slug = p_slug AND order_id = v_order_id;

  IF v_tier = 'marketer' OR v_marketer_id IS NOT NULL THEN
    v_marketer_id := COALESCE(v_marketer_id, COALESCE(NULLIF(TRIM(p_order->>'partnerCode'), ''), 'MKT-WEB'));
    v_comm_pct := 15.00;
    v_comm_amount := ROUND(v_subtotal * 0.15);

    INSERT INTO marketer_sales (
      store_slug, order_id, marketer_id, order_date, month_period, customer_name,
      customer_phone, customer_address, fulfillment_type, items_desc, omset_het,
      commission_pct, commission_amount, paid_status, paid_date
    ) VALUES (
      p_slug, v_order_id, v_marketer_id, v_date_only, v_month_period, v_customer_name,
      v_customer_phone, v_customer_address,
      CASE WHEN v_payment_method ILIKE '%ambil%' THEN 'pickup' ELSE 'delivery' END,
      COALESCE(
        (SELECT STRING_AGG((it->>'quantity') || 'x ' || (it->>'name'), ', ') FROM jsonb_array_elements(v_items) AS it),
        'Pesanan Produk SR12'
      ),
      v_subtotal,
      v_comm_pct,
      v_comm_amount,
      CASE WHEN v_status IN ('Selesai', 'Lunas / Selesai', 'Lunas') THEN 'paid' ELSE 'unpaid' END,
      CASE WHEN v_status IN ('Selesai', 'Lunas / Selesai', 'Lunas') THEN v_date_only ELSE NULL END
    );

    IF v_existing_id IS NULL AND v_marketer_id <> 'MKT-WEB' THEN
      UPDATE mitra_downlines
      SET accumulated_spent_90_days = COALESCE(accumulated_spent_90_days, 0) + v_subtotal,
          total_orders_count = COALESCE(total_orders_count, 0) + 1,
          last_order_date = v_date_only
      WHERE store_slug = p_slug
        AND UPPER(partner_code) = UPPER(v_marketer_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'remaining_quota', v_remaining_quota,
    'message', 'Pesanan berhasil diamankan di cloud dan kuota diperbarui.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_create_store_order(TEXT, JSONB) TO anon, authenticated, service_role;

-- ========================================================
-- PATCH PORTAL CEK GAJI REAL-TIME MARKETER (KOMISI 15%)
-- Verifikasi aman Kode Marketer + No. WA terdaftar (tanpa membocorkan data pembeli/bank lengkap)
-- ========================================================
CREATE OR REPLACE FUNCTION rpc_get_my_marketer_commission(
  p_slug TEXT,
  p_code TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := UPPER(TRIM(COALESCE(p_code, '')));
  v_digits TEXT := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_mitra RECORD;
  v_month_now VARCHAR(7) := to_char(CURRENT_DATE, 'YYYY-MM');
  v_total_comm NUMERIC(12,2) := 0;
  v_unpaid_comm NUMERIC(12,2) := 0;
  v_paid_comm NUMERIC(12,2) := 0;
  v_month_comm NUMERIC(12,2) := 0;
  v_sales_het NUMERIC(12,2) := 0;
  v_max_order_het NUMERIC(12,2) := 0;
  v_total_orders INT := 0;
  v_sales_json JSONB := '[]'::jsonb;
BEGIN
  IF p_slug IS NULL OR TRIM(p_slug) = '' THEN
    p_slug := 'sr12-central';
  END IF;

  IF v_code = '' OR length(v_digits) < 6 THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'Masukkan Kode Marketer dan minimal 6 digit akhir Nomor WhatsApp terdaftar.'
    );
  END IF;

  SELECT * INTO v_mitra FROM mitra_downlines
  WHERE store_slug = p_slug
    AND (UPPER(partner_code) = v_code OR UPPER(partner_code) = regexp_replace(v_code, '[^A-Z0-9]', '', 'g'))
    AND length(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) >= 6
    AND right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 6) = right(v_digits, 6)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'Kombinasi Kode Marketer dan Nomor WhatsApp tidak cocok atau belum terdaftar di toko ini.'
    );
  END IF;

  SELECT
    COALESCE(SUM(commission_amount), 0),
    COALESCE(SUM(CASE WHEN paid_status <> 'paid' THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN paid_status = 'paid' THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN month_period = v_month_now THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(omset_het), 0),
    COALESCE(MAX(omset_het), 0),
    COUNT(*)::INT
  INTO v_total_comm, v_unpaid_comm, v_paid_comm, v_month_comm, v_sales_het, v_max_order_het, v_total_orders
  FROM marketer_sales
  WHERE store_slug = p_slug
    AND UPPER(marketer_id) = UPPER(v_mitra.partner_code);

  SELECT COALESCE(jsonb_agg(row_item), '[]'::jsonb)
  INTO v_sales_json
  FROM (
    SELECT jsonb_build_object(
      'orderId', s.order_id,
      'orderDate', s.order_date,
      'monthPeriod', s.month_period,
      'customerInitials', CASE
        WHEN length(TRIM(COALESCE(s.customer_name, ''))) > 2
        THEN left(TRIM(s.customer_name), 2) || '***'
        ELSE 'Pelanggan'
      END,
      'itemsDesc', COALESCE(s.items_desc, 'Produk SR12'),
      'omsetHet', s.omset_het,
      'commissionPct', s.commission_pct,
      'commissionAmount', s.commission_amount,
      'paidStatus', s.paid_status,
      'paidDate', s.paid_date
    ) AS row_item
    FROM marketer_sales s
    WHERE s.store_slug = p_slug
      AND UPPER(s.marketer_id) = UPPER(v_mitra.partner_code)
    ORDER BY s.order_date DESC, s.created_at DESC
    LIMIT 100
  ) sub;

  RETURN jsonb_build_object(
    'found', true,
    'mitra', jsonb_build_object(
      'partnerCode', v_mitra.partner_code,
      'name', v_mitra.name,
      'city', v_mitra.city,
      'tier', v_mitra.tier,
      'bankName', v_mitra.bank_name,
      'bankAccountMasked', CASE
        WHEN length(COALESCE(v_mitra.bank_account, '')) > 4
        THEN '****' || right(v_mitra.bank_account, 4)
        ELSE v_mitra.bank_account
      END
    ),
    'summary', jsonb_build_object(
      'totalCommissionEarned', v_total_comm,
      'unpaidCommission', v_unpaid_comm,
      'paidCommission', v_paid_comm,
      'currentMonthCommission', v_month_comm,
      'totalOmsetHet', GREATEST(COALESCE(v_mitra.accumulated_spent_90_days, 0), v_sales_het),
      'maxSingleOrderHet', v_max_order_het,
      'totalOrders', v_total_orders,
      'currentMonth', v_month_now
    ),
    'sales', v_sales_json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_my_marketer_commission(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

