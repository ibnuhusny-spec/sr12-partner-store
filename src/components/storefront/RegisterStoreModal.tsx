import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { submitStoreApplication } from '../../services/storeService';
import { seedNewStoreCatalog } from '../../services/catalogService';
import { PartnerTier } from '../../types';
import {
  X,
  Store,
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface RegisterStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterStoreModal: React.FC<RegisterStoreModalProps> = ({ isOpen, onClose }) => {
  const { partnerStores } = useApp();

  const [storeName, setStoreName] = useState('');
  const [storeOwner, setStoreOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeWaNumber, setStoreWaNumber] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [partnerTier, setPartnerTier] = useState<PartnerTier>('reseller');
  const [recommenderDistributor, setRecommenderDistributor] = useState('');
  const [nikNumber, setNikNumber] = useState('');

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 5
  };

  const strengthScore = getPasswordStrength(adminPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!storeName.trim() || !storeOwner.trim() || !ownerEmail.trim() || !storeWaNumber.trim()) {
      setValidationError('Nama Toko, Nama Pemilik, Email Aktif, dan Nomor WhatsApp wajib diisi!');
      return;
    }

    if (!ownerEmail.includes('@') || !ownerEmail.includes('.')) {
      setValidationError('Format email aktif tidak valid!');
      return;
    }

    if (adminPassword.length < 8) {
      setValidationError('Password minimal 8 karakter demi keamanan toko Anda!');
      return;
    }

    if (strengthScore < 3) {
      setValidationError('Password terlalu lemah! Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol khusus.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setValidationError('Konfirmasi password tidak cocok dengan password yang dimasukkan!');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await submitStoreApplication({
        storeName: storeName.trim(),
        slug,
        storeOwner: storeOwner.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        adminPassword: adminPassword.trim(),
        storeAdminPin: '1234',
        storeWaNumber: storeWaNumber.trim(),
        storeCity: storeCity.trim() || 'Indonesia',
        partnerTier,
        recommenderDistributor: recommenderDistributor || undefined,
        nikNumber
      });

      if (res.success) {
        seedNewStoreCatalog(slug);
        setSubmittedSuccess(true);
      } else {
        setValidationError(res.message);
      }
    } catch {
      setValidationError('Gagal mengirim pendaftaran toko ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} color="#fde68a" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              Pendaftaran Toko Online Mitra SR12 (Aman &amp; Terverifikasi)
            </h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {submittedSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <CheckCircle size={56} color="#059669" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Pengajuan Toko Berhasil Terdaftar!
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 16px' }}>
                Akun toko <b>{storeName}</b> telah diamankan dengan Email <b>{ownerEmail}</b> dan password kuat terenkripsi. Seluruh 160+ produk resmi SR12 telah disiapkan di katalog toko Anda!
              </p>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.78rem',
                color: '#334155',
                marginBottom: '20px'
              }}>
                Setelah diverifikasi oleh Super Admin / Distributor, Anda dapat masuk ke Olsera POS menggunakan email dan password yang baru saja dibuat.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSuccess(false);
                  onClose();
                }}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                Tutup &amp; Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validationError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Security Badge */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.74rem',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  <b>Mode Paling Aman:</b> Akun toko diproteksi dengan email aktif pemilik dan password terenkripsi untuk mengamankan data kasir Olsera POS.
                </span>
              </div>

              {/* Nama Toko */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Nama Toko Online *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Cantik Herbal SR12"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Pemilik & WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nama Pemilik Toko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap"
                    value={storeOwner}
                    onChange={(e) => setStoreOwner(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nomor WhatsApp Pemilik *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxx (untuk OTP)"
                    value={storeWaNumber}
                    onChange={(e) => setStoreWaNumber(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Email Aktif Pemilik */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Email Aktif Pemilik Toko * (Wajib untuk Login &amp; Pemulihan Akun)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="email"
                    required
                    placeholder="nama@gmail.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Password Kuat */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Password Toko yang Kuat * (Min. 8 karakter: huruf besar/kecil, angka, simbol)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Kombinasi huruf, angka, simbol (contoh: TokoSR12#2026)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 38px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {adminPassword && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ flex: 1, background: strengthScore >= 1 ? '#ef4444' : '#e2e8f0' }} />
                      <div style={{ flex: 1, background: strengthScore >= 2 ? '#f59e0b' : '#e2e8f0' }} />
                      <div style={{ flex: 1, background: strengthScore >= 3 ? '#eab308' : '#e2e8f0' }} />
                      <div style={{ flex: 1, background: strengthScore >= 4 ? '#10b981' : '#e2e8f0' }} />
                      <div style={{ flex: 1, background: strengthScore >= 5 ? '#059669' : '#e2e8f0' }} />
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: strengthScore < 3 ? '#ef4444' : strengthScore < 5 ? '#d97706' : '#059669'
                    }}>
                      Kekuatan: {strengthScore < 3 ? 'Lemah (tambahkan simbol seperti @/#/! & angka)' : strengthScore < 5 ? 'Sedang' : 'Sangat Kuat (Sesuai Standar Keamanan)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Konfirmasi Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ketik ulang password di atas"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Kota & Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Kota Domisili *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Level Kemitraan *
                  </label>
                  <select
                    value={partnerTier}
                    onChange={(e) => setPartnerTier(e.target.value as PartnerTier)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="reseller">Reseller Resmi (20%)</option>
                    <option value="sub_agen">Sub Agen (30%)</option>
                    <option value="agen">Agen Resmi (40%)</option>
                    <option value="distributor">Distributor Utama (50%)</option>
                  </select>
                </div>
              </div>

              {/* Distributor Perujuk */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Distributor Perujuk (Opsional)
                </label>
                <select
                  value={recommenderDistributor}
                  onChange={(e) => setRecommenderDistributor(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="">-- Tanpa Perujuk (Pusat PT SR12) --</option>
                  {partnerStores.filter(s => s.partnerTier === 'distributor').map(d => (
                    <option key={d.slug} value={d.storeName}>{d.storeName} ({d.storeCity})</option>
                  ))}
                </select>
              </div>

              {/* NIK KTP */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  NIK KTP Pemilik (Untuk SK Kemitraan Resmi)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="3201xxxxxxxxxxxx"
                  value={nikNumber}
                  onChange={(e) => setNikNumber(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '10px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Store size={16} />
                <span>{isSubmitting ? 'Mendaftarkan Toko...' : 'Buka Toko & Kloning 160+ Produk'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
