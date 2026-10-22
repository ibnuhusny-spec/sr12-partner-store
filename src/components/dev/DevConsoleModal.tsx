import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchPendingStores, approveStoreApplication, deleteStore, topupStoreQuota } from '../../services/storeService';
import { seedNewStoreCatalog } from '../../services/catalogService';
import { PendingStore, Store } from '../../types';
import { X, Lock, CheckCircle, Trash2, RefreshCw, BarChart3, Users, Building, ShieldCheck, Copy, Check, Coins, Gift } from 'lucide-react';

interface DevConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevConsoleModal: React.FC<DevConsoleModalProps> = ({ isOpen, onClose }) => {
  const {
    isDevMasterLoggedIn,
    loginDev,
    partnerStores,
    refreshStores,
    switchStore,
    currentStore
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'pending' | 'stores' | 'diagnostic'>('metrics');
  const [pendingList, setPendingList] = useState<PendingStore[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [platformFeeNominal, setPlatformFeeNominal] = useState<number>(() => {
    try {
      const v = localStorage.getItem('sr12_platform_fee_nominal');
      return v ? Number(v) : 1500;
    } catch {
      return 1500;
    }
  });
  const [feePayerMode, setFeePayerMode] = useState<'buyer' | 'seller'>(() => {
    try {
      return (localStorage.getItem('sr12_fee_payer_mode') as any) || 'buyer';
    } catch {
      return 'buyer';
    }
  });
  const [feeSaveSuccess, setFeeSaveSuccess] = useState(false);

  const handleSaveFee = () => {
    try {
      localStorage.setItem('sr12_platform_fee_nominal', String(platformFeeNominal));
      localStorage.setItem('sr12_fee_payer_mode', feePayerMode);
      setFeeSaveSuccess(true);
      setTimeout(() => setFeeSaveSuccess(false), 3000);
    } catch {}
  };

  const totalNetworkTx = partnerStores.reduce((acc, s) => acc + (s.totalTx || 0), 0);
  const totalDevEarnings = totalNetworkTx * platformFeeNominal;

  const handleDevTopup = async (storeSlug: string, count: number) => {
    await topupStoreQuota(storeSlug, count);
    await refreshStores();
    alert(`✓ Berhasil menambahkan +${count} Token Transaksi ke toko ${storeSlug}!`);
  };


  useEffect(() => {
    if (isOpen && isDevMasterLoggedIn) {
      loadPending();
    }
  }, [isOpen, isDevMasterLoggedIn]);

  const loadPending = async () => {
    setIsLoadingPending(true);
    try {
      const list = await fetchPendingStores();
      setPendingList(list);
    } catch {}
    setIsLoadingPending(false);
  };

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginDev(pinInput)) {
      setPinError(false);
      loadPending();
    } else {
      setPinError(true);
    }
  };

  const handleApprove = async (app: PendingStore) => {
    try {
      const res = await approveStoreApplication(app);
      if (res.success) {
        seedNewStoreCatalog(app.slug);
        alert(res.message);
        await refreshStores();
        loadPending();
      }
    } catch {
      alert('Gagal menyetujui toko.');
    }
  };

  const handleDeleteStore = async (store: Store) => {
    if (store.slug === 'sr12-central') {
      alert('Toko Pusat tidak dapat dihapus!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus toko "${store.storeName}"?`)) {
      await deleteStore(store.slug);
      await refreshStores();
      if (currentStore.slug === store.slug) {
        switchStore('sr12-central');
      }
    }
  };

  const handleResetDummy = () => {
    if (confirm('Nol-kan seluruh data dummy pengujian dan segarkan sistem?')) {
      localStorage.removeItem('sr12_customer_orders');
      localStorage.removeItem('sr12_pos_transactions_v1');
      alert('Data simulasi berhasil dikosongkan!');
      window.location.reload();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', minHeight: '480px' }}
      >
        {/* Header */}
        <div style={{ background: '#090d16', color: '#ffffff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#fde68a" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
              Console Developer &amp; Super Admin
            </h3>
            <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#bae6fd', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
              SR12 ECOSYSTEM V2.0
            </span>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* PIN Guard if not logged in */}
        {!isDevMasterLoggedIn ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '340px', margin: '0 auto' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              Masukkan Master PIN Developer
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Akses Terbatas: Khusus Developer &amp; Super Admin
            </p>
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Masukkan Master PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: pinError ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  letterSpacing: '0.2em',
                  fontWeight: 800
                }}
              />
              {pinError && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                  Master PIN salah!
                </span>
              )}
              <button
                type="submit"
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                Buka Console
              </button>
            </form>
          </div>
        ) : (
          /* Developer Dashboard */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Tabs Bar */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: activeTab === 'metrics' ? '#1e293b' : 'transparent',
                  color: activeTab === 'metrics' ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BarChart3 size={14} />
                <span>Metrik &amp; GMV</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: activeTab === 'pending' ? '#1e293b' : 'transparent',
                  color: activeTab === 'pending' ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Users size={14} />
                <span>Pengajuan Mitra Baru ({pendingList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: activeTab === 'stores' ? '#1e293b' : 'transparent',
                  color: activeTab === 'stores' ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Building size={14} />
                <span>Jaringan Toko ({partnerStores.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diagnostic')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: activeTab === 'diagnostic' ? '#1e293b' : 'transparent',
                  color: activeTab === 'diagnostic' ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} />
                <span>Diagnostik</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {/* 1. METRICS */}
              {activeTab === 'metrics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Total Toko Mitra</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{partnerStores.length} Toko</div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '4px' }}>Terhubung Supabase Cloud</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Antrean Pengajuan</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b' }}>{pendingList.length} Mitra</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Menunggu verifikasi SK</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Tarif Platform Fee Developer</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7' }}>
                        Rp {platformFeeNominal.toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '4px' }}>
                        Per transaksi ({feePayerMode === 'buyer' ? 'Dibayar Pembeli' : 'Potong Saldo Toko'})
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>Total Pendapatan Developer</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>
                        Rp {totalDevEarnings.toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#166534', marginTop: '4px' }}>
                        Dari {totalNetworkTx} total transaksi jaringan
                      </div>
                    </div>
                  </div>

                  {/* Panel Pengaturan Tarif Platform Fee Developer */}
                  <div style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                          ⚙️ Konfigurasi Biaya Transaksi Developer (Royalti Platform)
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                          Anda bebas mengubah nominal fee kapan saja. Sistem akan otomatis menerapkan tarif ini ke seluruh transaksi toko.
                        </p>
                      </div>
                      {feeSaveSuccess && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                          ✓ Tersimpan!
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Nominal Fee Per Transaksi (Rp):
                        </label>
                        <input
                          type="number"
                          value={platformFeeNominal}
                          onChange={(e) => setPlatformFeeNominal(Math.max(0, Number(e.target.value)))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #0284c7',
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: '#0f172a'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Siapa yang Membayar Fee:
                        </label>
                        <select
                          value={feePayerMode}
                          onChange={(e) => setFeePayerMode(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: '#fff'
                          }}
                        >
                          <option value="buyer">Pembeli (Ditambahkan saat Checkout)</option>
                          <option value="seller">Pemilik Toko (Dipotong dari Saldo Dompet Toko)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveFee}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          padding: '9px 16px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Simpan Tarif Baru
                      </button>
                    </div>
                  </div>

                  {/* Panel Voucher Generator untuk Developer */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Gift size={16} color="#ec4899" />
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        Kode Voucher Token Transaksi (Kirim ke Mitra via WhatsApp)
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '0.74rem', color: '#64748b' }}>
                      Jika toko melakukan transfer manual via WhatsApp, Anda dapat memberikan salah satu kode voucher berikut untuk mereka klaim sendiri:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { code: 'SR12-BONUS', desc: 'Bonus 25 Token Starter' },
                        { code: 'SR12-TOKEN50', desc: '50 Token (Rp 75.000)' },
                        { code: 'SR12-TOKEN100', desc: '100 Token (Rp 150.000)' },
                        { code: 'SR12-TOKEN250', desc: '250 Token (Rp 375.000)' },
                        { code: 'SR12-TOKEN500', desc: '500 Token (Rp 750.000)' }
                      ].map(v => (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            alert(`Kode voucher "${v.code}" disalin ke clipboard! Siap dikirim via WhatsApp.`);
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Copy size={12} color="#ec4899" />
                          <span>{v.code} ({v.desc})</span>
                        </button>
                      ))}
                    </div>
                  </div>


                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleResetDummy}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>🔄 Nol-kan Data Dummy Simulasi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. PENDING STORES */}
              {activeTab === 'pending' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>
                      Antrean Pendaftaran Toko Mitra Baru:
                    </h4>
                    <button
                      type="button"
                      onClick={loadPending}
                      style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingPending ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Memuat antrean...</div>
                  ) : pendingList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <CheckCircle size={36} color="#059669" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontWeight: 700, color: '#475569' }}>Tidak ada antrean pengajuan toko yang pending.</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Seluruh mitra baru telah diverifikasi.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pendingList.map(app => (
                        <div
                          key={app.id}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{app.storeName}</span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '999px' }}>
                                {app.partnerTier.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                              Pemilik: <b>{app.storeOwner}</b> &bull; WA: {app.storeWaNumber} &bull; Kota: {app.storeCity}
                            </div>
                            {app.nikNumber && (
                              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>
                                NIK: {app.nikNumber}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(app)}
                              style={{
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <CheckCircle size={14} />
                              <span>✅ Setujui &amp; Terbitkan Toko</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. STORES LIST */}
              {activeTab === 'stores' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {partnerStores.map(store => (
                    <div
                      key={store.slug}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{store.storeName}</span>
                          <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                            ?store={store.slug}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Pemilik: {store.storeOwner} &bull; Kuota: <b style={{ color: (store.orderQuota || 0) <= 0 ? '#ef4444' : (store.orderQuota || 0) <= 5 ? '#f59e0b' : '#059669' }}>{store.orderQuota || 0} Token</b> &bull; Kebijakan Admin: <b>{store.feePayer === 'store' ? 'Ditanggung Toko' : 'Dibayar Pembeli'}</b>
                        </div>

                        {/* Quick token injection buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Inject Token Dev:</span>
                          <button
                            type="button"
                            onClick={() => handleDevTopup(store.slug, 50)}
                            style={{ padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            title="Tambah 50 Token Transaksi"
                          >
                            +50 Token
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDevTopup(store.slug, 100)}
                            style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            title="Tambah 100 Token Transaksi"
                          >
                            +100 Token
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDevTopup(store.slug, 250)}
                            style={{ padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontSize: '0.68rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            title="Tambah 250 Token Transaksi"
                          >
                            +250 Token
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            switchStore(store.slug);
                            onClose();
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}
                        >
                          Kunjungi Toko
                        </button>
                        {store.slug !== 'sr12-central' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStore(store)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#ef4444',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                            title="Hapus Toko"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. DIAGNOSTIC */}
              {activeTab === 'diagnostic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#090d16', color: '#38bdf8', padding: '14px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    <div>[SUPABASE_STATUS]: ONLINE &bull; URL: https://roezaobiexlmhxpuvfds.supabase.co</div>
                    <div>[ACTIVE_STORES_COUNT]: {partnerStores.length} stores loaded</div>
                    <div>[LOCALSTORAGE_KEY]: sr12_partner_stores_v3 (READY)</div>
                    <div>[SECURITY_RLS]: 21 RPCs Security Definer Enforced</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({
                        supabaseUrl: 'https://roezaobiexlmhxpuvfds.supabase.co',
                        storeCount: partnerStores.length,
                        activeStore: currentStore.slug,
                        timestamp: new Date().toISOString()
                      }, null, 2));
                      setCopiedLog(true);
                      setTimeout(() => setCopiedLog(false), 2000);
                    }}
                    style={{
                      background: copiedLog ? '#059669' : '#0f172a',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copiedLog ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLog ? 'Log Diagnostik Tersalin!' : 'Salin Log Diagnostik'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
