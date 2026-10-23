import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStoredCashflow,
  fetchStoreCashflow,
  saveCashflowEntry,
  deleteCashflowEntry,
  clearAllCashflow
} from '../../services/posService';
import { CashflowEntry } from '../../types';
import { TrendingUp, TrendingDown, Plus, Wallet, Trash2, Coins, RefreshCw } from 'lucide-react';

export const PosCashflowView: React.FC = () => {
  const { currentStore } = useApp();
  const [entries, setEntries] = useState<CashflowEntry[]>(() => getStoredCashflow(currentStore.slug));
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [flowType, setFlowType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  const loadData = async () => {
    // 1. Instan dari cache lokal
    setEntries(getStoredCashflow(currentStore.slug));

    // 2. Sinkronkan dengan Supabase Cloud Storage
    try {
      setIsLoading(true);
      const cloud = await fetchStoreCashflow(currentStore.slug);
      setEntries(cloud);
    } catch (e) {
      console.warn('Gagal sinkronisasi cloud cashflow:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      fetchStoreCashflow(currentStore.slug).then(setEntries).catch(console.error);
    };

    window.addEventListener('sr12:cloud_sync_cashflow', handleSync);
    window.addEventListener('sr12:cloud_sync_orders', handleSync);

    return () => {
      window.removeEventListener('sr12:cloud_sync_cashflow', handleSync);
      window.removeEventListener('sr12:cloud_sync_orders', handleSync);
    };
  }, [currentStore.slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !category.trim()) {
      alert('Mohon isi kategori dan nominal kas!');
      return;
    }

    const newEntry: CashflowEntry = {
      id: 'CSH-' + Date.now(),
      storeSlug: currentStore.slug,
      date: new Date().toISOString(),
      type: flowType,
      category: category.trim(),
      amount,
      description: description.trim(),
      operator: 'Kasir Utama'
    };

    const updated = await saveCashflowEntry(newEntry, currentStore.slug);
    setEntries(updated);
    setShowAddModal(false);
    setAmount(0);
    setDescription('');
    setCategory('');
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Hapus catatan mutasi kas ini?')) {
      const updated = await deleteCashflowEntry(id, currentStore.slug);
      setEntries(updated);
    }
  };

  const handleClearAll = async () => {
    if (entries.length === 0) {
      alert('Buku kas sudah kosong.');
      return;
    }
    if (window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${entries.length}) mutasi buku kas toko ini untuk mulai simulasi baru?`)) {
      await clearAllCashflow(currentStore.slug);
      setEntries([]);
    }
  };

  const handleOpenBukaKasModal = () => {
    setFlowType('in');
    setCategory('Modal Awal Kasir (Buka Kas)');
    setAmount(100000);
    setDescription('Modal awal uang kembalian buka kasir hari ini');
    setShowAddModal(true);
  };

  const totalIn = entries.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  const netCash = totalIn - totalOut;

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Buku Kas &amp; Buka Kasir</h3>
            {isLoading && <RefreshCw size={14} className="spin-animate" color="#38bdf8" />}
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
            Sinkronisasi otomatis modal awal buka kas, penjualan kasir, dan pengeluaran operasional toko
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Sinkronkan ulang data kas dari cloud"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-animate' : ''} />
            <span className="hide-on-mobile">Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Kosongkan seluruh mutasi buku kas"
          >
            <Trash2 size={14} />
            <span className="hide-on-mobile">Reset Kas</span>
          </button>
          <button
            type="button"
            onClick={handleOpenBukaKasModal}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff',
              border: 'none',
              padding: '8px 13px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
            title="Catat uang modal kas awal buka kasir hari ini"
          >
            <Wallet size={15} />
            <span>+ Buka Kas (Modal Awal)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFlowType('in');
              setCategory('');
              setAmount(0);
              setDescription('');
              setShowAddModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>Tambah Arus Kas</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
            <TrendingUp size={14} />
            <span>Total Kas Masuk</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            Rp {totalIn.toLocaleString('id-ID')}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#f87171', fontWeight: 700 }}>
            <TrendingDown size={14} />
            <span>Total Kas Keluar</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171', marginTop: '4px' }}>
            Rp {totalOut.toLocaleString('id-ID')}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #38bdf8', padding: '14px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>
            <Wallet size={14} />
            <span>Saldo Bersih Kasir</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            Rp {netCash.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 14px' }}>Tanggal &amp; Waktu</th>
                <th style={{ padding: '10px 14px' }}>Tipe</th>
                <th style={{ padding: '10px 14px' }}>Kategori</th>
                <th style={{ padding: '10px 14px' }}>Keterangan</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Nominal</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: '50px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <Wallet size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>Belum ada mutasi buku kas untuk toko ini.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.74rem' }}>
                      Klik tombol <b>"+ Buka Kas (Modal Awal)"</b> atau lakukan transaksi di Kasir POS.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(e.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} {new Date(e.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: e.type === 'in' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: e.type === 'in' ? '#34d399' : '#f87171',
                          border: `1px solid ${e.type === 'in' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                      >
                        {e.type === 'in' ? '🟢 Kas Masuk' : '🔴 Kas Keluar'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>
                      {e.category}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                      {e.description || '-'}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        textAlign: 'right',
                        fontWeight: 800,
                        color: e.type === 'in' ? '#34d399' : '#f87171'
                      }}
                    >
                      {e.type === 'in' ? '+' : '-'} Rp {e.amount.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(e.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Hapus baris mutasi kas ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', background: '#1e293b', color: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                {category.includes('Buka Kas') ? '🟢 Buka Kasir (Modal Awal)' : 'Catat Arus Kas Toko'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFlowType('in')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    background: flowType === 'in' ? '#059669' : '#0f172a',
                    color: '#fff',
                    border: '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Kas Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setFlowType('out')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    background: flowType === 'out' ? '#dc2626' : '#0f172a',
                    color: '#fff',
                    border: '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  🔴 Kas Keluar
                </button>
              </div>

              {/* Quick Preset Pills */}
              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Pilihan Cepat Kategori:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('in');
                      setCategory('Modal Awal Kasir (Buka Kas)');
                      if (!amount) setAmount(100000);
                      setDescription('Modal awal uang kembalian buka kasir');
                    }}
                    style={{
                      background: category.includes('Buka Kas') ? '#0284c7' : '#0f172a',
                      color: '#fff',
                      border: '1px solid #334155',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Buka Kas (Modal Awal)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('in');
                      setCategory('Penjualan Kasir Offline');
                      setDescription('Penjualan langsung produk di toko');
                    }}
                    style={{
                      background: category.includes('Penjualan') ? '#059669' : '#0f172a',
                      color: '#fff',
                      border: '1px solid #334155',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Penjualan Offline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('out');
                      setCategory('Biaya Operasional Toko');
                      setDescription('Biaya operasional harian / plastik / pulsa');
                    }}
                    style={{
                      background: category.includes('Operasional') ? '#dc2626' : '#0f172a',
                      color: '#fff',
                      border: '1px solid #334155',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Operasional / Perlengkapan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('out');
                      setCategory('Tarik Kas (Setor Owner)');
                      setDescription('Setoran uang kas ke pemilik toko');
                    }}
                    style={{
                      background: category.includes('Tarik Kas') ? '#ea580c' : '#0f172a',
                      color: '#fff',
                      border: '1px solid #334155',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Setor Kas ke Owner
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Kategori:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modal Awal Kasir / Pembayaran Offline / Listrik"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nominal (Rp):</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Keterangan Catatan:</label>
                <textarea
                  rows={2}
                  placeholder="Catatan rincian pengeluaran/pemasukan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Simpan Catatan Kas
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
