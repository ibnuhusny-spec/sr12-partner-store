import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchStoreDownlines, saveStoreDownline, fetchStoreMarketerSales } from '../../services/mitraService';
import { MitraDownline, MarketerSale, PartnerTier } from '../../types';
import { Users, UserPlus, DollarSign, Award, Check } from 'lucide-react';

export const PosDownlinesView: React.FC = () => {
  const { currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'downlines' | 'payroll'>('downlines');
  const [downlines, setDownlines] = useState<MitraDownline[]>([]);
  const [sales, setSales] = useState<MarketerSale[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New downline form state
  const [partnerCode, setPartnerCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tier, setTier] = useState<PartnerTier>('reseller');
  const [bankName, setBankName] = useState('BCA');
  const [bankAccount, setBankAccount] = useState('');

  useEffect(() => {
    loadData();
  }, [currentStore.slug]);

  const loadData = async () => {
    try {
      const [m, s] = await Promise.all([
        fetchStoreDownlines(currentStore.slug),
        fetchStoreMarketerSales(currentStore.slug)
      ]);
      setDownlines(m);
      setSales(s);
    } catch {}
  };

  const handleAddDownline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !partnerCode.trim()) {
      alert('Nama, Nomor HP, dan Kode Mitra wajib diisi!');
      return;
    }

    const newMitra: Partial<MitraDownline> = {
      storeSlug: currentStore.slug,
      partnerCode: partnerCode.trim().toUpperCase(),
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      tier,
      bankName,
      bankAccount,
      bankHolder: name.trim(),
      status: 'active',
      accumulatedSpent90Days: 0,
      totalOrdersCount: 0
    };

    await saveStoreDownline(newMitra, currentStore.slug);
    await loadData();
    setShowAddModal(false);
    setName('');
    setPhone('');
    setPartnerCode('');
    setCity('');
  };

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Database Jaringan Mitra &amp; Komisi Marketer</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Kelola data Agen, Sub Agen, Reseller, dan hitung gaji Marketer 15%</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('downlines')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: activeTab === 'downlines' ? '#0284c7' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155'
            }}
          >
            👥 Database Mitra ({downlines.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: activeTab === 'payroll' ? '#0284c7' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155'
            }}
          >
            💼 Gaji Marketer 15% ({sales.length})
          </button>
          {activeTab === 'downlines' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#059669',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <UserPlus size={14} />
              <span>Tambah Mitra</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'downlines' ? (
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 14px' }}>Kode Mitra</th>
                  <th style={{ padding: '10px 14px' }}>Nama</th>
                  <th style={{ padding: '10px 14px' }}>Level Tier</th>
                  <th style={{ padding: '10px 14px' }}>Kota &amp; Kontak</th>
                  <th style={{ padding: '10px 14px' }}>Rekening Bank</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Omset 90 Hari</th>
                </tr>
              </thead>
              <tbody>
                {downlines.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada data mitra binaan. Klik &quot;Tambah Mitra&quot; untuk mendaftarkan reseller/agen binaan Anda.
                    </td>
                  </tr>
                ) : (
                  downlines.map(m => (
                    <tr key={m.partnerCode} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38bdf8' }}>{m.partnerCode}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>{m.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(52,211,153,0.2)', color: '#34d399', fontWeight: 800 }}>
                          {m.tier.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                        <div>{m.city || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                        {m.bankName} - {m.bankAccount}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>
                        Rp {m.accumulatedSpent90Days.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Payroll Tab */
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Rekap Komisi Bulanan Marketer (15%)</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px 14px' }}>Periode</th>
                  <th style={{ padding: '10px 14px' }}>Marketer ID</th>
                  <th style={{ padding: '10px 14px' }}>Customer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Omset HET</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Komisi 15%</th>
                  <th style={{ padding: '10px 14px' }}>Status Bayar</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada catatan komisi marketer yang tercatat bulan ini.
                    </td>
                  </tr>
                ) : (
                  sales.map(s => (
                    <tr key={s.orderId} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{s.monthPeriod}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38bdf8' }}>{s.marketerId}</td>
                      <td style={{ padding: '10px 14px', color: '#f8fafc' }}>{s.customerName}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>Rp {s.omsetHet.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#34d399' }}>
                        Rp {s.commissionAmount.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: s.paidStatus === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: s.paidStatus === 'paid' ? '#34d399' : '#f59e0b', fontWeight: 800 }}>
                          {s.paidStatus === 'paid' ? 'LUNAS' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Downline Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#1e293b', color: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Tambah Mitra Binaan Toko</h3>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8' }}>X</button>
            </div>
            <form onSubmit={handleAddDownline} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Kode Mitra (contoh: RS-001 / AG-002):</label>
                <input
                  type="text"
                  required
                  placeholder="RS-001"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Mitra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Nomor HP / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Level Tier:</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PartnerTier)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                  >
                    <option value="reseller">Reseller (20%)</option>
                    <option value="sub_agen">Sub Agen (30%)</option>
                    <option value="agen">Agen (40%)</option>
                    <option value="marketer">Marketer (15%)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  marginTop: '6px'
                }}
              >
                Simpan Mitra Binaan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
