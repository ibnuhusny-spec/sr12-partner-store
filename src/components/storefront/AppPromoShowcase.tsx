import React, { useState, useRef } from 'react';
import {
  Sparkles,
  MessageCircle,
  CheckCircle2,
  X,
  ShoppingBag,
  Smartphone,
  ShieldCheck,
  BarChart3,
  HeartHandshake,
  MonitorPlay
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../services/orderService';

const SALES_WA_RAW = '085342743763';

interface AppPromoShowcaseProps {
  variant?: 'top' | 'bottom';
  onEnterDemoPos?: () => void;
}

const FEATURE_HIGHLIGHTS = [
  {
    icon: Smartphone,
    title: 'Tampilan Toko Rapi di HP & Laptop',
    desc: 'Katalog produk tertata bersih dengan pencarian cepat, kategori, dan link bagikan produk ke WhatsApp.'
  },
  {
    icon: ShoppingBag,
    title: 'Checkout Pesanan Langsung ke WhatsApp',
    desc: 'Pembeli cukup isi keranjang dan alamat, lalu rincian pesanan otomatis rapi terkirim ke WhatsApp toko Anda.'
  },
  {
    icon: ShieldCheck,
    title: 'Harga Otomatis per Level Kemitraan',
    desc: 'Mendukung harga Konsumen, Marketer, Reseller, Sub Agen, hingga Agen/Distributor secara otomatis.'
  },
  {
    icon: BarChart3,
    title: 'Dilengkapi Kasir & Pencatatan Cloud',
    desc: 'Di balik layar tersedia pengelolaan stok, buku kas, laporan laba/rugi, mitra binaan, serta rekap komisi Marketer.'
  }
];

function buildSalesWhatsAppUrl(): string {
  const waPhone = normalizeWhatsAppNumber(SALES_WA_RAW);
  const message =
    'Halo Kak, saya baru saja melihat web contoh toko online & POS ini. Jika berkenan, boleh tanya-tanya informasi harga dan cara pembuatannya untuk usaha saya? Terima kasih.';
  return `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(message)}`;
}

export const AppPromoShowcase: React.FC<AppPromoShowcaseProps> = ({ variant = 'top', onEnterDemoPos }) => {
  const [showDetails, setShowDetails] = useState(false);
  const backdropMouseDown = useRef(false);
  const waUrl = buildSalesWhatsAppUrl();

  const renderDetailsModal = () => {
    if (!showDetails) return null;
    return (
      <div
        onMouseDown={(e) => {
          backdropMouseDown.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && backdropMouseDown.current) {
            setShowDetails(false);
          }
          backdropMouseDown.current = false;
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(2, 6, 23, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '20px',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  marginBottom: '8px'
                }}
              >
                <HeartHandshake size={13} />
                <span>Dibuat dengan Niat Membantu Usaha Anda</span>
              </span>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, lineHeight: 1.35, color: '#ffffff' }}>
                Web Toko Online &amp; Pencatatan Usaha Siap Pakai
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '6px',
                cursor: 'pointer'
              }}
              aria-label="Tutup rincian penawaran"
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ margin: '0 0 16px', fontSize: '0.86rem', lineHeight: 1.65, color: '#cbd5e1' }}>
            Mohon izin memperkenalkan web contoh ini. Sistem ini kami rancang secara sederhana agar sesama mitra dan
            pelaku usaha bisa memiliki etalase toko online sendiri yang rapi, mudah diakses pembeli lewat HP, serta
            terhubung langsung ke WhatsApp dan database pribadi toko Anda.
          </p>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
            {FEATURE_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      borderRadius: '10px',
                      padding: '8px',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: '#94a3b8' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '0.8rem',
              lineHeight: 1.55,
              color: '#a7f3d0',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
              <CheckCircle2 size={15} />
              <span>Konsultasi &amp; Info Harga via WhatsApp</span>
            </div>
            Silakan tanya-tanya santai terlebih dahulu tanpa sungkan—dengan senang hati kami jelaskan kecocokan fitur,
            estimasi biaya, serta dibantu penyiapan sampai web toko atas nama Anda siap digunakan.
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onEnterDemoPos && (
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  onEnterDemoPos();
                }}
                style={{
                  flex: 1,
                  minWidth: '175px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <MonitorPlay size={17} />
                <span>Coba Demo POS</span>
              </button>
            )}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                minWidth: '210px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.86rem',
                padding: '12px 18px',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <MessageCircle size={17} />
              <span>Tanya Harga via WhatsApp (0853-4274-3763)</span>
            </a>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              style={{
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '12px 16px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Lanjut Lihat Etalase
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'top') {
    return (
      <>
        <div style={{ margin: '0 auto 14px', maxWidth: '1380px', padding: '0 16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: '0 10px 25px -10px rgba(6, 78, 59, 0.45)'
            }}
          >
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '4px' }}>
                <Sparkles size={13} color="#fde68a" />
                <span>Web Contoh Resmi &bull; Bisa Dibuatkan Khusus untuk Toko Anda</span>
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
                Tertarik punya web toko online seperti ini untuk usaha Anda?
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#d1fae5', lineHeight: 1.45 }}>
                Silakan lihat-lihat tampilan tokonya terlebih dahulu. Bila cocok, mari ngobrol santai &amp; tanya harga via WhatsApp—dengan senang hati kami bantu siapkan.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {onEnterDemoPos && (
                <button
                  type="button"
                  onClick={onEnterDemoPos}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <MonitorPlay size={15} />
                  <span>Coba Demo POS</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ecfdf5',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Lihat Keunggulan
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '9px 15px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <MessageCircle size={15} />
                <span>Tanya Harga via WA</span>
              </a>
            </div>
          </div>
        </div>
        {renderDetailsModal()}
      </>
    );
  }

  return (
    <>
      <section style={{ margin: '10px auto 34px', maxWidth: '1380px', padding: '0 16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #064e3b 100%)',
            border: '1px solid rgba(52, 211, 153, 0.28)',
            borderRadius: '20px',
            padding: '26px 24px',
            boxShadow: '0 18px 40px -18px rgba(2, 6, 23, 0.65)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 420px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  marginBottom: '10px'
                }}
              >
                <HeartHandshake size={14} />
                <span>Penawaran Pembuatan Web Toko &amp; POS</span>
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.35 }}>
                Ingin Memiliki Web Toko Online Rapi Seperti Ini Atas Nama Usaha Anda Sendiri?
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.65 }}>
                Semoga contoh tampilan toko di atas bisa memberi gambaran nyata bagaimana pelanggan Anda nanti berbelanja dengan nyaman. Kami siap membantu menyiapkan versi khusus toko Anda sendiri—lengkap dengan nama toko, nomor WhatsApp, dan pencatatan kasir di belakang layar—dibantu perlahan dari awal sampai siap pakai.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', fontSize: '0.78rem', color: '#a7f3d0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} /> Domain &amp; Database Toko Pribadi
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} /> Harga Bertingkat &amp; Checkout WA
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} /> Konsultasi Ramah Sebelum Pesan
                </span>
              </div>
            </div>

            <div
              style={{
                flex: '0 1 310px',
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '16px',
                padding: '18px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px' }}>
                Biaya Pembuatan &amp; Info Paket
              </div>
              <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                Konsultasi &amp; Tanya Harga via WA
              </div>
              {onEnterDemoPos && (
                <button
                  type="button"
                  onClick={onEnterDemoPos}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginBottom: '8px',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.28)'
                  }}
                >
                  <MonitorPlay size={16} />
                  <span>Coba Demo POS Sekarang</span>
                </button>
              )}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.28)',
                  marginBottom: '8px'
                }}
              >
                <MessageCircle size={17} />
                <span>Chat WA: 0853-4274-3763</span>
              </a>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.28)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Lihat Daftar Fitur Lengkap
              </button>
            </div>
          </div>
        </div>
      </section>
      {renderDetailsModal()}
    </>
  );
};
