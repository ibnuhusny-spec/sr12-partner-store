import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SafeModalOverlay } from '../common/SafeModalOverlay';
import { fetchMyMarketerCommission, MarketerPortalReport } from '../../services/mitraService';
import { evaluateMitraRank } from '../../utils/tierTargetUtils';
import { SR12_TIERS } from '../../config/tiers';
import {
  X,
  Wallet,
  RefreshCw,
  Award,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  TrendingUp,
  Lock
} from 'lucide-react';

interface MarketerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedPortalCredentials {
  code: string;
  phone: string;
}

export const MarketerPortalModal: React.FC<MarketerPortalModalProps> = ({ isOpen, onClose }) => {
  const { currentStore } = useApp();
  const authStorageKey = `sr12_marketer_portal_auth_${currentStore.slug}`;
  const affiliateStorageKey = `sr12_marketer_affiliate_${currentStore.slug}`;

  const [codeInput, setCodeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savedCreds, setSavedCreds] = useState<SavedPortalCredentials | null>(() => {
    try {
      const raw = localStorage.getItem(authStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [report, setReport] = useState<MarketerPortalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const loadCommissionReport = useCallback(async (creds: SavedPortalCredentials, persistOnSuccess = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchMyMarketerCommission(currentStore.slug, creds.code, creds.phone);
      if (!res.found || !res.mitra || !res.summary) {
        setErrorMsg(res.message || 'Kombinasi Kode Marketer dan Nomor WhatsApp tidak cocok.');
        if (!persistOnSuccess) {
          setReport(null);
        }
        return;
      }

      setReport(res);
      if (persistOnSuccess) {
        try {
          localStorage.setItem(authStorageKey, JSON.stringify(creds));
          if (res.mitra.tier === 'marketer') {
            localStorage.setItem(
              affiliateStorageKey,
              JSON.stringify({ partnerCode: res.mitra.partnerCode, name: res.mitra.name })
            );
          }
        } catch {}
        setSavedCreds(creds);
      }
    } catch {
      setErrorMsg('Gagal memuat data gaji. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }, [currentStore.slug, authStorageKey, affiliateStorageKey]);

  useEffect(() => {
    if (isOpen && savedCreds) {
      loadCommissionReport(savedCreds, false);
    }
  }, [isOpen, savedCreds, loadCommissionReport]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const creds: SavedPortalCredentials = {
      code: codeInput.trim().toUpperCase(),
      phone: phoneInput.trim()
    };
    await loadCommissionReport(creds, true);
  };

  const handleLogout = () => {
    setSavedCreds(null);
    setReport(null);
    setCodeInput('');
    setPhoneInput('');
    setErrorMsg('');
    try {
      localStorage.removeItem(authStorageKey);
    } catch {}
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const affiliateUrl = report?.mitra ? `${origin}/?ref=${encodeURIComponent(report.mitra.partnerCode)}` : '';

  const evalData = report?.mitra && report?.summary
    ? evaluateMitraRank(report.mitra.tier, report.summary.totalOmsetHet, {
        storeTier: currentStore.partnerTier,
        maxSingleOrderHet: report.summary.maxSingleOrderHet
      })
    : null;

  const isMarketer = report?.mitra?.tier === 'marketer';
  const tierLabel = report?.mitra ? (SR12_TIERS[report.mitra.tier]?.name || report.mitra.tier) : '';

  return (
    <SafeModalOverlay onClose={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                Cek Gaji &amp; Komisi Marketer 15%
              </h3>
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                Laporan Real-Time &bull; {currentStore.storeName}
              </div>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!report?.found || !report.mitra || !report.summary ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.78rem',
                  color: '#166534',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
                  <Lock size={14} />
                  <span>Akses Privat Mitra Marketer</span>
                </div>
                Masukkan <b>Kode Marketer</b> dan <b>Nomor WhatsApp terdaftar</b> Anda untuk melihat akumulasi gaji 15%, riwayat order affiliate, dan progres naik level ke Reseller.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Kode Marketer / Mitra:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MK-301"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '9px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Nomor WhatsApp Terdaftar (Verifikasi):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '9px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    background: '#ffffff'
                  }}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Wallet size={17} />
                <span>{loading ? 'Memeriksa Data...' : 'Lihat Gaji & Komisi Saya'}</span>
              </button>
            </form>
          ) : (
            /* Real-Time Marketer Salary Dashboard */
            <>
              {/* Identity Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#0f172a',
                  color: '#f8fafc'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{report.mitra.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                      #{report.mitra.partnerCode}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#312e81', color: '#c7d2fe', padding: '2px 8px', borderRadius: '999px' }}>
                      {tierLabel}
                    </span>
                  </div>
                  {report.mitra.bankName && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                      Rekening Pencairan: {report.mitra.bankName} {report.mitra.bankAccountMasked || ''}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => savedCreds && loadCommissionReport(savedCreds, false)}
                    style={{
                      background: '#1e293b',
                      color: '#34d399',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: loading ? 'wait' : 'pointer'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>{loading ? 'Update...' : 'Refresh'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={13} />
                    <span>Ganti</span>
                  </button>
                </div>
              </div>

              {/* 2 Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    border: '1px solid #6ee7b7'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
                    Siap Cair (Tanggal 25)
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '4px' }}>
                    Rp {Number(report.summary.unpaidCommission || 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#065f46', marginTop: '3px' }}>
                    Bulan ini ({report.summary.currentMonth}): <b>Rp {Number(report.summary.currentMonthCommission || 0).toLocaleString('id-ID')}</b>
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    Total Komisi 15% ({report.summary.totalOrders} Order)
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    Rp {Number(report.summary.totalCommissionEarned || 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '3px' }}>
                    Sudah Dibayarkan: <b>Rp {Number(report.summary.paidCommission || 0).toLocaleString('id-ID')}</b>
                  </div>
                </div>
              </div>

              {/* Rules 2026 Omset Progress */}
              {evalData && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <TrendingUp size={15} color="#059669" />
                      {isMarketer ? 'Progres Naik Level ke Reseller (Rules 2026)' : 'Akumulasi Omset HET Anda'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        color: evalData.badgeColor,
                        background: evalData.badgeBg
                      }}
                    >
                      {evalData.badgeLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#475569', marginBottom: '6px' }}>
                    <span>Total Omset HET: <b>Rp {Number(report.summary.totalOmsetHet || 0).toLocaleString('id-ID')}</b></span>
                    <span>{evalData.progress3MonthsPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${evalData.progress3MonthsPct}%`,
                        height: '100%',
                        background: evalData.status === 'promotable' ? '#10b981' : '#3b82f6',
                        borderRadius: '999px'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '5px' }}>
                    {evalData.shortMessage}
                  </div>
                </div>
              )}

              {/* Quick Affiliate Store Link */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={14} />
                  <span>Link Toko Affiliate Anda (Otomatis Komisi 15% + Omset HET):</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value={affiliateUrl}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '7px',
                      border: '1px solid #c7d2fe',
                      fontSize: '0.76rem',
                      background: '#ffffff',
                      color: '#1e1b4b'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(affiliateUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    style={{
                      background: copiedLink ? '#059669' : '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '7px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Transaction List */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Riwayat Transaksi Affiliate ({report.sales?.length || 0} Terakhir)
                </div>

                {!report.sales || report.sales.length === 0 ? (
                  <div
                    style={{
                      padding: '22px 14px',
                      textAlign: 'center',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}
                  >
                    Belum ada transaksi masuk dari link affiliate Anda. Bagikan link produk atau link toko Anda di atas untuk mulai menghasilkan komisi 15%!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {report.sales.map((item) => {
                      const isPaid = item.paidStatus === 'paid';
                      return (
                        <div
                          key={item.orderId}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.76rem', color: '#0f172a' }}>
                                #{item.orderId}
                              </span>
                              <span style={{ fontSize: '0.71rem', color: '#64748b' }}>
                                &bull; {item.orderDate} &bull; {item.customerInitials}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '3px', lineHeight: 1.35 }}>
                              {item.itemsDesc}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: '2px' }}>
                              Omset HET: <b>Rp {Number(item.omsetHet || 0).toLocaleString('id-ID')}</b>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#059669' }}>
                              +Rp {Number(item.commissionAmount || 0).toLocaleString('id-ID')}
                            </div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '3px',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                background: isPaid ? '#dcfce7' : '#fef3c7',
                                color: isPaid ? '#166534' : '#92400e'
                              }}
                            >
                              {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                              <span>{isPaid ? 'Sudah Cair' : 'Menunggu Tgl 25'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SafeModalOverlay>
  );
};
