import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { submitStoreApplication } from '../../services/storeService';
import { PartnerTier } from '../../types';
import { X, Store, CheckCircle, Upload } from 'lucide-react';

interface RegisterStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterStoreModal: React.FC<RegisterStoreModalProps> = ({ isOpen, onClose }) => {
  const { partnerStores } = useApp();

  const [storeName, setStoreName] = useState('');
  const [storeOwner, setStoreOwner] = useState('');
  const [storeWaNumber, setStoreWaNumber] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [partnerTier, setPartnerTier] = useState<PartnerTier>('reseller');
  const [recommenderDistributor, setRecommenderDistributor] = useState('');
  const [storeAdminPin, setStoreAdminPin] = useState('1234');
  const [nikNumber, setNikNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !storeOwner.trim() || !storeWaNumber.trim()) {
      alert('Nama Toko, Nama Pemilik, dan Nomor WhatsApp wajib diisi!');
      return;
    }

    if (storeAdminPin.length < 4) {
      alert('PIN Admin Toko minimal 4 angka!');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await submitStoreApplication({
        storeName: storeName.trim(),
        slug,
        storeOwner: storeOwner.trim(),
        storeWaNumber: storeWaNumber.trim(),
        storeCity: storeCity.trim() || 'Indonesia',
        partnerTier,
        recommenderDistributor: recommenderDistributor || undefined,
        storeAdminPin,
        nikNumber
      });

      if (res.success) {
        setSubmittedSuccess(true);
      } else {
        alert(res.message);
      }
    } catch {
      alert('Gagal mengirim pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} color="#fde68a" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              Pendaftaran Toko Online Mitra SR12
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
                Pengajuan Toko Berhasil Dikirim!
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 20px' }}>
                Data toko Anda telah masuk ke antrean verifikasi cloud Supabase. Setelah disetujui oleh Distributor perujuk atau Super Admin, toko Anda langsung aktif!
              </p>
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
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nama Pemilik Toko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pemilik"
                    value={storeOwner}
                    onChange={(e) => setStoreOwner(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nomor WhatsApp Toko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={storeWaNumber}
                    onChange={(e) => setStoreWaNumber(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Kota / Wilayah *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Distributor Perujuk
                  </label>
                  <select
                    value={recommenderDistributor}
                    onChange={(e) => setRecommenderDistributor(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="">-- Tanpa Perujuk (Pusat) --</option>
                    {partnerStores.filter(s => s.partnerTier === 'distributor').map(d => (
                      <option key={d.slug} value={d.storeName}>{d.storeName} ({d.storeCity})</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Buat PIN Admin Toko (4 Angka) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="1234"
                    value={storeAdminPin}
                    onChange={(e) => setStoreAdminPin(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  NIK KTP Pemilik (Untuk Verifikasi SK Kemitraan)
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
                  boxShadow: '0 4px 12px rgba(5,150,105,0.35)'
                }}
              >
                {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Toko'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
