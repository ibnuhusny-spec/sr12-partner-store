import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchStoreDownlines,
  saveStoreDownline,
  fetchStoreMarketerSales,
  updateMitraTier,
  updateMarketerSalePaidStatus,
  deleteStoreDownline,
  clearAllStoreDownlines,
  resetDownlineAccumulatedSpent,
  resetDownlinesToDefault,
  clearAllMarketerSales,
  getLocalDownlines,
  getLocalMarketerSales
} from '../../services/mitraService';
import { MitraDownline, MarketerSale, PartnerTier } from '../../types';
import {
  SR12_TIER_TARGETS,
  evaluateMitraRank,
  generateMitraWaReminderUrl,
  MitraRankEvaluation
} from '../../utils/tierTargetUtils';
import {
  Users,
  UserPlus,
  DollarSign,
  Award,
  AlertTriangle,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  ChevronRight,
  X,
  Trash2,
  RotateCcw
} from 'lucide-react';

export const PosDownlinesView: React.FC = () => {
  const { currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'downlines' | 'payroll'>('downlines');
  const [downlines, setDownlines] = useState<MitraDownline[]>(() => getLocalDownlines());
  const [sales, setSales] = useState<MarketerSale[]>(() => getLocalMarketerSales());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'promotable' | 'warning' | 'reseller' | 'sub_agen' | 'agen' | 'marketer'>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [promoteModalMitra, setPromoteModalMitra] = useState<{ mitra: MitraDownline; evalData: MitraRankEvaluation } | null>(null);
  const [selectedNewTier, setSelectedNewTier] = useState<PartnerTier>('sub_agen');

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

  const loadData = () => {
    setDownlines(getLocalDownlines());
    setSales(getLocalMarketerSales());
  };

  const handleAddDownline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !partnerCode.trim()) {
      alert('Nama, Nomor HP, dan Kode Mitra wajib diisi!');
      return;
    }

    const newMitra: MitraDownline = {
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

    saveStoreDownline(newMitra, currentStore.slug);
    setDownlines(prev => [...prev.filter(m => m.partnerCode !== newMitra.partnerCode), newMitra]);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setPartnerCode('');
    setCity('');
  };

  const handleConfirmTierChange = async () => {
    if (!promoteModalMitra) return;
    await updateMitraTier(promoteModalMitra.mitra.partnerCode, selectedNewTier, currentStore.slug);
    loadData();
    setPromoteModalMitra(null);
  };

  const handleTogglePayrollStatus = (sale: MarketerSale) => {
    const nextStatus = sale.paidStatus === 'paid' ? 'unpaid' : 'paid';
    updateMarketerSalePaidStatus(sale.orderId, nextStatus);
    setSales(prev => prev.map(s => s.orderId === sale.orderId ? { ...s, paidStatus: nextStatus } : s));
  };

  const handleDeleteMitra = (partnerCode: string, name: string) => {
    if (confirm(`Hapus mitra ${name} (${partnerCode}) dari database downline?`)) {
      deleteStoreDownline(partnerCode);
      setDownlines(prev => prev.filter(m => m.partnerCode !== partnerCode && m.id !== partnerCode));
    }
  };

  const handleClearAllDownlines = () => {
    if (downlines.length === 0) {
      alert('Database mitra sudah kosong (0 mitra).');
      return;
    }
    if (confirm(`⚠️ PERINGATAN PENGOSONGAN DATABASE MITRA:\n\nApakah Anda yakin ingin MENGHAPUS SEMUA (${downlines.length}) mitra untuk mengosongkan database downline menjadi 0 mitra?\n\nSemua mitra akan dikosongkan agar Anda dapat memulai simulasi pendaftaran mitra dari nol.`)) {
      clearAllStoreDownlines();
      setDownlines([]);
      alert('Semua mitra berhasil dihapus! Database mitra sekarang bersih dan kosong (0 mitra).');
    }
  };

  const handleResetSpent = () => {
    if (confirm('Apakah Anda yakin ingin mereset total belanja akumulasi SEMUA mitra ke Rp 0 untuk memulai simulasi evaluasi level dari awal?')) {
      resetDownlineAccumulatedSpent();
      loadData();
      alert('Akumulasi belanja semua mitra berhasil direset ke Rp 0!');
    }
  };

  const handleResetDefaultDownlines = () => {
    if (confirm('Kembalikan daftar mitra downline ke data contoh resmi bawaan SR12?')) {
      resetDownlinesToDefault();
      loadData();
      alert('Daftar mitra berhasil dikembalikan ke standar SR12!');
    }
  };

  const handleClearPayroll = () => {
    if (sales.length === 0) {
      alert('Riwayat komisi marketer sudah kosong.');
      return;
    }
    if (confirm(`Hapus seluruh (${sales.length}) riwayat komisi dan penjualan Marketer?`)) {
      clearAllMarketerSales();
      setSales([]);
      alert('Riwayat komisi marketer berhasil dibersihkan!');
    }
  };

  // Evaluations mapping
  const evaluatedDownlines = downlines.map(m => ({
    mitra: m,
    evalData: evaluateMitraRank(m.tier, m.accumulatedSpent90Days)
  }));

  // Filtering
  const filteredDownlines = evaluatedDownlines.filter(({ mitra, evalData }) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      mitra.name.toLowerCase().includes(q) ||
      mitra.partnerCode.toLowerCase().includes(q) ||
      mitra.phone.includes(q) ||
      mitra.city.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterCategory === 'promotable') return evalData.status === 'promotable';
    if (filterCategory === 'warning') return evalData.status === 'warning';
    if (filterCategory === 'reseller') return mitra.tier === 'reseller';
    if (filterCategory === 'sub_agen') return mitra.tier === 'sub_agen';
    if (filterCategory === 'agen') return mitra.tier === 'agen';
    if (filterCategory === 'marketer') return mitra.tier === 'marketer';
    return true;
  });

  // Summary Metrics
  const totalOmsetNetwork = downlines.reduce((acc, m) => acc + (m.accumulatedSpent90Days || 0), 0);
  const promotableCount = evaluatedDownlines.filter(e => e.evalData.status === 'promotable').length;
  const warningCount = evaluatedDownlines.filter(e => e.evalData.status === 'warning').length;
  const totalCommissionUnpaid = sales
    .filter(s => s.paidStatus === 'unpaid')
    .reduce((acc, s) => acc + s.commissionAmount, 0);

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc' }}>
              Database Mitra &amp; Evaluasi Jenjang Karir
            </h3>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#0284c7', color: '#e0f2fe', padding: '2px 8px', borderRadius: '999px' }}>
              SR12 PARTNER NETWORK
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Pantau target omset bulanan mitra binaan, evaluasi naik/turun level, dan kirim pengingat WhatsApp
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              border: '1px solid #334155',
              cursor: 'pointer'
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
              border: '1px solid #334155',
              cursor: 'pointer'
            }}
          >
            💼 Komisi Marketer 15% ({sales.length})
          </button>
          {activeTab === 'downlines' && (
            <>
              <button
                type="button"
                onClick={handleClearAllDownlines}
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                title="Hapus seluruh mitra downline untuk mengosongkan database menjadi 0 mitra"
              >
                <Trash2 size={14} />
                <span>Kosongkan Semua Mitra</span>
              </button>

              <button
                type="button"
                onClick={handleResetSpent}
                style={{
                  background: '#1e293b',
                  color: '#fbbf24',
                  border: '1px solid #475569',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                title="Reset seluruh akumulasi belanja mitra ke Rp 0 untuk simulasi baru"
              >
                <RotateCcw size={14} />
                <span>Reset Belanja ke 0</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultDownlines}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                title="Kembalikan daftar mitra bawaan contoh SR12"
              >
                <Users size={14} />
                <span>Mitra Default</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}
                title="Lihat Aturan Baku Kemitraan SR12 2026 Resmi (CK SWORD)"
              >
                <Award size={14} />
                <span>📜 Rules 2026</span>
              </button>

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
                  gap: '5px',
                  cursor: 'pointer'
                }}
              >
                <UserPlus size={14} />
                <span>Tambah Mitra</span>
              </button>
            </>
          )}

          {activeTab === 'payroll' && (
            <button
              type="button"
              onClick={handleClearPayroll}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Hapus seluruh riwayat komisi dan penjualan Marketer"
            >
              <Trash2 size={14} />
              <span>Bersihkan Riwayat Komisi</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total Mitra Binaan</span>
            <Users size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', marginTop: '4px' }}>
            {downlines.length} Mitra
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
            Aktif di bawah naungan {currentStore.storeName}
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total Omset Jaringan</span>
            <TrendingUp size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            Rp {totalOmsetNetwork.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
            Akumulasi pembelanjaan periode aktif
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 800 }}>🚀 Layak Promosi Level</span>
            <Sparkles size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            {promotableCount} Mitra
          </div>
          <div style={{ fontSize: '0.7rem', color: '#a7f3d0', marginTop: '2px' }}>
            Omset melampaui syarat naik tingkat
          </div>
        </div>

        <div style={{ background: 'rgba(244, 63, 94, 0.12)', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid rgba(244, 63, 94, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#fda4af', fontWeight: 800 }}>⚠️ Peringatan Turun Level</span>
            <AlertTriangle size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f43f5e', marginTop: '4px' }}>
            {warningCount} Mitra
          </div>
          <div style={{ fontSize: '0.7rem', color: '#fecdd3', marginTop: '2px' }}>
            Perlu diingatkan via WhatsApp segera
          </div>
        </div>
      </div>

      {activeTab === 'downlines' ? (
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          {/* Controls & Filter Bar */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari nama, kode mitra, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'all' ? '#0284c7' : '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                  cursor: 'pointer'
                }}
              >
                Semua ({downlines.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('promotable')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'promotable' ? '#059669' : '#0f172a',
                  color: filterCategory === 'promotable' ? '#fff' : '#34d399',
                  border: '1px solid rgba(16,185,129,0.3)',
                  cursor: 'pointer'
                }}
              >
                🚀 Layak Naik ({promotableCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('warning')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'warning' ? '#dc2626' : '#0f172a',
                  color: filterCategory === 'warning' ? '#fff' : '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Peringatan Turun ({warningCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('reseller')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'reseller' ? '#334155' : '#0f172a',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  cursor: 'pointer'
                }}
              >
                Reseller
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('sub_agen')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'sub_agen' ? '#334155' : '#0f172a',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  cursor: 'pointer'
                }}
              >
                Sub Agen
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('marketer')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: filterCategory === 'marketer' ? '#334155' : '#0f172a',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  cursor: 'pointer'
                }}
              >
                Marketer
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px 14px' }}>Mitra &amp; Kode</th>
                  <th style={{ padding: '12px 14px' }}>Level Saat Ini</th>
                  <th style={{ padding: '12px 14px' }}>Capaian Belanja Bulan Ini</th>
                  <th style={{ padding: '12px 14px' }}>Status Evaluasi Jenjang</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tindakan Manajemen</th>
                </tr>
              </thead>
              <tbody>
                {filteredDownlines.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '50px 20px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '12px', fontSize: '0.88rem' }}>
                        {downlines.length === 0 ? 'Database mitra saat ini kosong (0 mitra).' : 'Tidak ada mitra yang sesuai dengan pencarian atau filter yang dipilih.'}
                      </div>
                      {downlines.length === 0 && (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            style={{ padding: '8px 14px', borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                          >
                            + Tambah Mitra Baru
                          </button>
                          <button
                            type="button"
                            onClick={handleResetDefaultDownlines}
                            style={{ padding: '8px 14px', borderRadius: '8px', background: '#334155', color: '#f8fafc', border: '1px solid #475569', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Muat Mitra Contoh SR12
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDownlines.map(({ mitra, evalData }) => {
                    const waUrl = generateMitraWaReminderUrl(mitra, currentStore.storeName, evalData);
                    const isPromotable = evalData.status === 'promotable';
                    const isWarning = evalData.status === 'warning';

                    return (
                      <tr
                        key={mitra.partnerCode}
                        style={{
                          borderBottom: '1px solid #334155',
                          background: isPromotable ? 'rgba(16, 185, 129, 0.04)' : isWarning ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                        }}
                      >
                        {/* 1. Mitra & Kontak */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>{mitra.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.74rem' }}>{mitra.partnerCode}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>&bull; {mitra.city || '-'}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            WA: {mitra.phone}
                          </div>
                        </td>

                        {/* 2. Level Saat Ini */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155' }}>
                            <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '0.74rem' }}>
                              {evalData.currentTierConfig.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#38bdf8' }}>
                              ({evalData.currentTierConfig.discountPct}%)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                            Min/Bln: Rp {evalData.currentTierConfig.minMonthlyTarget.toLocaleString('id-ID')}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                            Target 3 Bln: Rp {evalData.currentTierConfig.accum3MonthsTarget.toLocaleString('id-ID')}
                          </div>
                        </td>

                        {/* 3. Capaian Belanja & Progress Bar */}
                        <td style={{ padding: '12px 14px', minWidth: '180px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 900, color: isPromotable ? '#34d399' : isWarning ? '#f87171' : '#f8fafc', fontSize: '0.92rem' }}>
                              Rp {mitra.accumulatedSpent90Days.toLocaleString('id-ID')}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                              {evalData.progress3MonthsPct}% (3 Bln)
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${evalData.progress3MonthsPct}%`,
                                height: '100%',
                                background: isPromotable
                                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                                  : isWarning
                                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                  : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                                borderRadius: '999px'
                              }}
                            />
                          </div>

                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
                            {evalData.shortMessage}
                          </div>
                        </td>

                        {/* 4. Status Evaluasi Jenjang */}
                        <td style={{ padding: '12px 14px' }}>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: evalData.badgeColor,
                              background: evalData.badgeBg,
                              border: `1px solid ${evalData.badgeColor}33`
                            }}
                          >
                            {evalData.badgeLabel}
                          </div>

                          {evalData.status === 'promotable' && evalData.nextTierConfig && (
                            <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                              Siap naik ke {evalData.nextTierConfig.name} (Diskon {evalData.nextTierConfig.discountPct}%)
                            </div>
                          )}

                          {evalData.status === 'warning' && (
                            <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700, marginTop: '4px' }}>
                              Kurang Rp {evalData.remainingMonthlyMin.toLocaleString('id-ID')} sebelum akhir bulan!
                            </div>
                          )}
                        </td>

                        {/* 5. Tindakan Manajemen */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {/* Tombol Kirim Pengingat WA */}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: isWarning ? '#dc2626' : '#059669',
                                color: '#ffffff',
                                textDecoration: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                              title="Kirim pesan otomatis via WhatsApp"
                            >
                              <MessageCircle size={13} />
                              <span>{isWarning ? 'Ingatkan WA' : 'Chat WA'}</span>
                            </a>

                            {/* Tombol Promosikan / Ubah Level */}
                            <button
                              type="button"
                              onClick={() => {
                                setPromoteModalMitra({ mitra, evalData });
                                setSelectedNewTier(evalData.nextTierConfig?.tier || mitra.tier);
                              }}
                              style={{
                                background: isPromotable ? '#f59e0b' : '#334155',
                                color: isPromotable ? '#0f172a' : '#f8fafc',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                              }}
                              title="Sesuaikan level mitra (naik/turun level)"
                            >
                              <Award size={13} />
                              <span>{isPromotable ? 'Promosikan 🚀' : 'Ubah Level'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMitra(mitra.partnerCode, mitra.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="Hapus mitra ini dari database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Payroll Tab */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Rekap Gaji &amp; Komisi Marketer Bulanan (15% HET)
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Dihitung otomatis dari pesanan yang masuk lewat link referral ?ref=KODE_MARKETER
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', background: '#0f172a', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ color: '#94a3b8' }}>Total Belum Dibayar: </span>
              <b style={{ color: '#f59e0b' }}>Rp {totalCommissionUnpaid.toLocaleString('id-ID')}</b>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px 14px' }}>Periode &amp; Order ID</th>
                  <th style={{ padding: '12px 14px' }}>Marketer ID</th>
                  <th style={{ padding: '12px 14px' }}>Pembeli &amp; Produk</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Omset HET</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Komisi 15%</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status Transfer</th>
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
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc' }}>{s.orderId}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.orderDate} &bull; {s.monthPeriod}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#38bdf8' }}>
                        {s.marketerId}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 700 }}>{s.customerName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.itemsDesc}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                        Rp {s.omsetHet.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#34d399', fontSize: '0.9rem' }}>
                        Rp {s.commissionAmount.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePayrollStatus(s)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontWeight: 800,
                            background: s.paidStatus === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: s.paidStatus === 'paid' ? '#34d399' : '#f59e0b'
                          }}
                          title="Klik untuk ubah status LUNAS / PENDING"
                        >
                          {s.paidStatus === 'paid' ? '✓ LUNAS' : '⏳ PENDING'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tambah Mitra Baru */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', background: '#1e293b', color: '#fff', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Tambah Mitra Binaan Toko</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDownline} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Kode Mitra (contoh: RS-105 / SA-205):
                </label>
                <input
                  type="text"
                  required
                  placeholder="RS-105"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nama Lengkap Mitra:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Nomor WhatsApp:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Jenjang Level:
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PartnerTier)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    <option value="marketer">Marketer (15%)</option>
                    <option value="reseller">Reseller (20%)</option>
                    <option value="sub_agen">Sub Agen (30%)</option>
                    <option value="agen">Agen (40%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Kota Domisili:
                </label>
                <input
                  type="text"
                  placeholder="Kota (contoh: Jakarta, Bandung)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  marginTop: '8px',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Simpan Mitra Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Promosikan / Ubah Level Mitra */}
      {promoteModalMitra && (
        <div className="modal-overlay" onClick={() => setPromoteModalMitra(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#1e293b', color: '#fff', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Sesuaikan Level Kemitraan</h3>
              </div>
              <button type="button" onClick={() => setPromoteModalMitra(null)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>
                  {promoteModalMitra.mitra.name} ({promoteModalMitra.mitra.partnerCode})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  Level Saat Ini: <b style={{ color: '#38bdf8' }}>{promoteModalMitra.evalData.currentTierConfig.name} ({promoteModalMitra.evalData.currentTierConfig.discountPct}%)</b>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  Omset Belanja: <b style={{ color: '#34d399' }}>Rp {promoteModalMitra.mitra.accumulatedSpent90Days.toLocaleString('id-ID')}</b>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Pilih Jenjang Level Baru:
                </label>
                <select
                  value={selectedNewTier}
                  onChange={(e) => setSelectedNewTier(e.target.value as PartnerTier)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1.5px solid #0284c7',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 800
                  }}
                >
                  <option value="marketer">Marketer (Diskon 15%)</option>
                  <option value="reseller">Reseller (Diskon 20%)</option>
                  <option value="sub_agen">Sub Agen (Diskon 30%)</option>
                  <option value="agen">Agen (Diskon 40%)</option>
                  <option value="distributor">Distributor (Diskon 50%)</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  * Mengubah level akan langsung memperbarui diskon belanja yang didapat mitra saat checkout.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPromoteModalMitra(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#334155',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTierChange}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Terapkan Level Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rules Kemitraan 2026 (CK SWORD) */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', background: '#0f172a', color: '#fff', borderRadius: '16px', border: '1.5px solid #334155', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>SR12 SKIN CARE / CK SWORD</div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 900 }}>Rules Kemitraan 2026</h3>
              </div>
              <button type="button" onClick={() => setShowRulesModal(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 0. MARKETER */}
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1.5px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>DASAR</span>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#38bdf8' }}>MARKETER</h4>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>15% Komisi</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li>Mendapatkan <b>komisi 15%</b> dari seluruh omset belanja/penjualan HET yang dicairkan bulanan.</li>
                  <li>Punya <b>kesempatan emas naik menjadi RESELLER</b> melalui <b>First Order Reseller Rp 500.000,- HET</b> (Rp 400.000,- net) ATAU jalur omset akumulasi <b>Rp 800.000,-</b> (dengan omset pribadi min Rp 300.000,- berturut-turut 3 bulan).</li>
                  <li style={{ color: '#34d399', fontWeight: 800 }}>Jika target Reseller belum tercapai, <b>Marketer TETAP MENJADI MITRA AKTIF</b> (tidak turun tingkat dan tidak pernah dikeluarkan dari kemitraan SR12).</li>
                </ul>
              </div>

              {/* 1. RESELLER */}
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#38bdf8' }}>RESELLER</h4>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>20% Diskon</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li>Melakukan <b>order pertama (First Order)</b> senilai minimal <b>Rp 500.000,-</b> atau Rp 400.000,- setelah diskon 20%.</li>
                  <li>Khusus yang telah menjadi Mitra, kesempatan menjadi Reseller melalui jalur omset minimal <b>Rp 800.000,-</b> dengan omset pribadi minimal Rp 300.000,- berturut-turut selama 3 bulan.</li>
                  <li>Omset minimal <b>Rp 500.000,- per bulan</b> atau akumulasi minimal <b>Rp 1.500.000,- selama 3 bulan</b>.</li>
                  <li style={{ color: '#fca5a5' }}>Reseller yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka <b>memasuki bulan ke-4 status Mitra akan diturunkan ke tingkatan di bawahnya (Marketer)</b>.</li>
                </ul>
              </div>

              {/* 2. SUB AGEN */}
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#34d399' }}>SUB AGEN</h4>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>30% Diskon</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li>Melakukan <b>order pertama (First Order)</b> senilai minimal <b>Rp 5.000.000,-</b> atau Rp 3.500.000,- setelah diskon 30%.</li>
                  <li>Khusus yang telah menjadi Mitra, kesempatan menjadi Sub Agent melalui jalur omset minimal <b>Rp 4.000.000,-</b> dengan omset pribadi minimal Rp 3.000.000,- berturut-turut selama 3 bulan.</li>
                  <li>Omset minimal <b>Rp 4.000.000,- per bulan</b> atau akumulasi omset minimal <b>Rp 12.000.000,- selama 3 bulan</b>.</li>
                  <li style={{ color: '#fca5a5' }}>Sub Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka <b>memasuki bulan ke-4 status Mitra akan diturunkan ke tingkatan di bawahnya (Reseller)</b>.</li>
                </ul>
              </div>

              {/* 3. AGEN */}
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#f59e0b' }}>AGEN</h4>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b' }}>40% Diskon</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li>Melakukan <b>order pertama kepada Distributor/Agent</b> senilai minimal <b>Rp 25.000.000,-</b> atau Rp 15.000.000,- setelah mendapatkan diskon 40%.</li>
                  <li>Khusus yang telah menjadi Mitra, berkesempatan menjadi Agent melalui jalur omset minimal <b>Rp 15.000.000,-</b> dengan omset pribadi minimal Rp 10.000.000,- berturut-turut selama 3 bulan.</li>
                  <li>Omset minimal Agent sebesar <b>Rp 15.000.000,- per bulan</b> atau akumulasi omset minimal <b>Rp 45.000.000,- selama 3 bulan</b>.</li>
                  <li style={{ color: '#fca5a5' }}>Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka <b>memasuki bulan ke-4 status Mitra akan diturunkan ke tingkatan di bawahnya (Sub Agen)</b>.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
