import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getStoredCashflow, saveCashflowEntry, deleteCashflowEntry, clearAllCashflow } from '../../services/posService';
import { CashflowEntry } from '../../types';
import { TrendingUp, TrendingDown, Plus, Wallet, Trash2 } from 'lucide-react';

export const PosCashflowView: React.FC = () => {
  const { currentStore } = useApp();
  const [entries, setEntries] = useState<CashflowEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [flowType, setFlowType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    setEntries(getStoredCashflow(currentStore.slug));
  }, [currentStore.slug]);

  const handleSave = (e: React.FormEvent) => {
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

    saveCashflowEntry(newEntry, currentStore.slug);
    setEntries(getStoredCashflow(currentStore.slug));
    setShowAddModal(false);
    setAmount(0);
    setDescription('');
    setCategory('');
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Hapus catatan mutasi kas ini?')) {
      const updated = deleteCashflowEntry(id, currentStore.slug);
      setEntries(updated);
    }
  };

  const handleClearAll = () => {
    if (entries.length === 0) {
      alert('Buku kas sudah kosong.');
      return;
    }
    if (window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${entries.length}) mutasi buku kas toko ini untuk mulai simulasi baru?`)) {
      clearAllCashflow(currentStore.slug);
      setEntries([]);
    }
  };

  const totalIn = entries.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  const netCash = totalIn - totalOut;

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Buku Kas Masuk / Keluar (Arus Kas Toko)</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Catat arus pemasukan dan pengeluaran operasional toko harian</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            <span className="hide-on-mobile">Kosongkan Buku Kas</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Tambah Catatan Mutasi Kas Baru"
          >
            <Plus size={15} />
            <span className="hide-on-mobile">Tambah Kas</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
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
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada catatan mutasi kas untuk toko ini.
                  </td>
                </tr>
              ) : (
                entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{new Date(e.date).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: e.type === 'in' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                          color: e.type === 'in' ? '#34d399' : '#f87171'
                        }}
                      >
                        {e.type === 'in' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{e.category}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{e.description || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: e.type === 'in' ? '#34d399' : '#f87171' }}>
                      {e.type === 'in' ? '+' : '-'}Rp {e.amount.toLocaleString('id-ID')}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#1e293b', color: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Tambah Arus Kas</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8' }}>X</button>
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
                    border: '1px solid #334155'
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
                    border: '1px solid #334155'
                  }}
                >
                  🔴 Kas Keluar
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Kategori:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran Offline / Biaya Listrik / Bensin"
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
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
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
