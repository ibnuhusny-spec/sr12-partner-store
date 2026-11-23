import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SafeModalOverlay } from '../common/SafeModalOverlay';
import {
  fetchStoreDownlines,
  saveStoreDownline,
  saveStoreDownlinesBatch,
  fetchStoreMarketerSales,
  updateMitraTier,
  updateMitraLevelAndDueDate,
  updateMarketerSalePaidStatus,
  deleteStoreDownline,
  clearAllStoreDownlines,
  resetDownlineAccumulatedSpent,
  resetDownlinesToDefault,
  clearAllMarketerSales,
  deleteMarketerSale,
  getLocalDownlines,
  getLocalMarketerSales
} from '../../services/mitraService';
import {
  downloadMitraImportTemplate,
  parseMitraExcelFile,
  ParseMitraExcelResult
} from '../../services/excelReportService';
import { updateStorePaydayDate } from '../../services/storeService';
import { getLocalOrders, fetchStoreOrders } from '../../services/orderService';
import { saveCashflowEntry, deleteCashflowEntry } from '../../services/posService';
import { getAllowedDownlineTiers, SR12_TIERS } from '../../config/tiers';
import { MitraDownline, MarketerSale, PartnerTier, Order, CashflowEntry } from '../../types';
import {
  SR12_TIER_TARGETS,
  evaluateMitraRank,
  generateMitraWaReminderUrl,
  getMitraDueDateInfo,
  MitraRankEvaluation,
  MitraDueDateInfo
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
  RotateCcw,
  MapPin,
  Phone,
  Gift,
  ShoppingBag,
  Calendar,
  Copy,
  Check,
  CreditCard,
  BookOpen,
  FileUp,
  Download,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

interface PosDownlinesViewProps {
  onSwitchTab?: (tab: string, subTab?: string) => void;
  initialSubTab?: 'downlines' | 'payroll';
  onSubTabChange?: (subTab: 'downlines' | 'payroll') => void;
}

export const PosDownlinesView: React.FC<PosDownlinesViewProps> = ({
  onSwitchTab,
  initialSubTab = 'downlines',
  onSubTabChange
}) => {
  const { currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'downlines' | 'payroll'>(initialSubTab || 'downlines');
  const [downlines, setDownlines] = useState<MitraDownline[]>(() => getLocalDownlines(currentStore.slug));
  const [sales, setSales] = useState<MarketerSale[]>(() => getLocalMarketerSales(currentStore.slug));
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders(currentStore.slug));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'promotable' | 'warning' | 'agen' | 'sub_agen' | 'reseller' | 'marketer' | 'konsumen'>('all');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [promoteModalMitra, setPromoteModalMitra] = useState<{ mitra: MitraDownline; evalData: MitraRankEvaluation; dueDateInfo: MitraDueDateInfo } | null>(null);
  const [selectedNewTier, setSelectedNewTier] = useState<PartnerTier>('reseller');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [copiedAffiliateCode, setCopiedAffiliateCode] = useState<string | null>(null);

  const handleCopyAffiliateLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(code.toUpperCase())}`;
    navigator.clipboard.writeText(url);
    setCopiedAffiliateCode(code.toUpperCase());
    setTimeout(() => setCopiedAffiliateCode(null), 2000);
  };

  // New downline form state
  const [partnerCode, setPartnerCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tier, setTier] = useState<PartnerTier>('reseller');
  const [evaluationDueDate, setEvaluationDueDate] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [bankAccount, setBankAccount] = useState('');

  // Excel Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ParseMitraExcelResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      await downloadMitraImportTemplate(currentStore.storeName);
    } catch (err: any) {
      console.error('Gagal unduh template Excel mitra:', err);
      alert('Gagal mengunduh template Excel: ' + (err?.message || 'Error tidak diketahui'));
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parseMitraExcelFile(file, currentStore.slug, downlines);
      setImportResult(result);
      setShowImportModal(true);
    } catch (err: any) {
      console.error('Gagal membaca file Excel:', err);
      alert('Gagal membaca file Excel mitra: ' + (err?.message || 'Format tidak sesuai'));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || importResult.validMitra.length === 0) return;

    setIsSavingImport(true);
    try {
      const updatedList = await saveStoreDownlinesBatch(importResult.validMitra, currentStore.slug);
      setDownlines(updatedList);
      setShowImportModal(false);
      const count = importResult.validMitra.length;
      const newCount = importResult.previewRows.filter(r => !r.isExisting).length;
      const updateCount = importResult.previewRows.filter(r => r.isExisting).length;
      setImportSuccessMsg(`Alhamdulillah, berhasil mengimpor ${count} mitra (${newCount} baru, ${updateCount} diperbarui)!`);
      setTimeout(() => setImportSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Gagal menyimpan mitra:', err);
      alert('Gagal menyimpan data mitra ke database: ' + (err?.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSavingImport(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('sr12:cloud_sync_downlines', handleSync);
    window.addEventListener('sr12:cloud_sync_orders', handleSync);

    return () => {
      window.removeEventListener('sr12:cloud_sync_downlines', handleSync);
      window.removeEventListener('sr12:cloud_sync_orders', handleSync);
    };
  }, [currentStore.slug]);

  const loadData = async () => {
    // 1. Tampilkan data lokal instan (0ms)
    const localDl = getLocalDownlines(currentStore.slug);
    const localSl = getLocalMarketerSales(currentStore.slug);
    const localOrd = getLocalOrders(currentStore.slug);

    setDownlines(localDl);
    setSales(localSl);
    setOrders(localOrd);

    // 2. Ambil data terbaru dari Supabase Cloud
    try {
      const [cloudDownlines, cloudSales, cloudOrders] = await Promise.all([
        fetchStoreDownlines(currentStore.slug),
        fetchStoreMarketerSales(currentStore.slug),
        fetchStoreOrders(currentStore.slug)
      ]);
      if (cloudDownlines) {
        setDownlines(cloudDownlines);
      }
      if (cloudOrders) {
        setOrders(cloudOrders);
      }

      // 3. Rekonsiliasi otomatis: Pastikan setiap order aktif yang melibatkan Marketer tercatat di daftar komisi
      const activeSales = cloudSales || localSl;
      const activeOrders = cloudOrders || localOrd;
      const existingOrderIds = new Set(activeSales.map(s => s.orderId));
      let hasNewMissingSales = false;
      const combinedSales = [...activeSales];

      activeOrders.forEach(ord => {
        const isCancelled = ord.status?.toLowerCase().includes('batal') || ord.status?.toLowerCase().includes('hapus');
        if (isCancelled || !ord.orderId) return;

        const isMarketer = ord.tier === 'marketer' || Boolean(ord.marketerId);
        if (isMarketer && !existingOrderIds.has(ord.orderId)) {
          const mCode = ord.marketerId || ord.partnerCode || 'MKT-001-MRS';
          const subHet = ord.subtotalHet || ord.grandTotal || 0;
          const comm = Math.round(subHet * 0.15);
          const newSale: MarketerSale = {
            storeSlug: currentStore.slug,
            orderId: ord.orderId,
            marketerId: mCode,
            orderDate: (ord.createdAt || new Date().toISOString()).split('T')[0],
            monthPeriod: (ord.createdAt || new Date().toISOString()).slice(0, 7),
            customerName: ord.customerName || 'Konsumen',
            customerPhone: ord.customerPhone || '-',
            fulfillmentType: ord.orderSource?.includes('Kasir') ? 'pickup' : 'delivery',
            itemsDesc: Array.isArray(ord.items) && ord.items.length > 0
              ? ord.items.map((it: any) => `${it.quantity || 1}x ${it.name || 'Produk'}`).join(', ')
              : 'Pesanan Produk SR12',
            omsetHet: subHet,
            commissionPct: 15,
            commissionAmount: comm,
            paidStatus: 'unpaid'
          };
          combinedSales.push(newSale);
          existingOrderIds.add(ord.orderId);
          hasNewMissingSales = true;
        }
      });

      if (hasNewMissingSales) {
        setSales(combinedSales);
        try {
          localStorage.setItem(`sr12_marketer_sales_${currentStore.slug}`, JSON.stringify(combinedSales));
          localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(combinedSales));
        } catch {}
      } else if (cloudSales) {
        setSales(cloudSales);
      }
    } catch (err) {
      console.warn('Cloud sync error in PosDownlinesView:', err);
    }
  };

  const handleOpenAddModal = () => {
    setName('');
    setPhone('');
    setPartnerCode('');
    setCity('');
    setTier('reseller');
    // Default 90 hari dari hari ini untuk periode evaluasi target
    const d = new Date();
    d.setDate(d.getDate() + 90);
    setEvaluationDueDate(d.toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleAddDownline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !partnerCode.trim()) {
      alert('Nama, Nomor HP, dan Kode Mitra wajib diisi!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
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
      totalOrdersCount: 0,
      joinDate: todayStr,
      qualificationDate: todayStr,
      evaluationDueDate: (tier === 'marketer' || tier === 'konsumen') ? undefined : (evaluationDueDate || undefined)
    };

    await saveStoreDownline(newMitra, currentStore.slug);
    setDownlines(prev => [...prev.filter(m => m.partnerCode !== newMitra.partnerCode), newMitra]);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setPartnerCode('');
    setCity('');
    setTier('reseller');
  };

  const handleConfirmTierChange = async () => {
    if (!promoteModalMitra) return;
    const targetCode = promoteModalMitra.mitra.partnerCode;
    const dueDateToSave = (selectedNewTier === 'marketer' || selectedNewTier === 'konsumen') ? undefined : (selectedDueDate || undefined);
    await updateMitraLevelAndDueDate(targetCode, selectedNewTier, dueDateToSave, currentStore.slug);
    setDownlines(prev => prev.map(m => m.partnerCode === targetCode ? { ...m, tier: selectedNewTier, evaluationDueDate: dueDateToSave } : m));
    loadData();
    setPromoteModalMitra(null);
  };

  const handleTogglePayrollStatus = async (sale: MarketerSale) => {
    const nextStatus = sale.paidStatus === 'paid' ? 'unpaid' : 'paid';
    const nextDate = nextStatus === 'paid' ? (sale.paidDate || new Date().toISOString().split('T')[0]) : undefined;
    const updatedSale: MarketerSale = { ...sale, paidStatus: nextStatus, paidDate: nextDate };

    // 1. Update UI state secara instan (0ms optimistic UI update)
    setSales(prev => prev.map(s => s.orderId === sale.orderId ? updatedSale : s));

    // 2. Simpan status komisi di lokal & database
    await updateMarketerSalePaidStatus(sale.orderId, nextStatus, currentStore.slug, updatedSale);

    // 3. Sinkronisasi otomatis ke Buku Kas (Cashflow):
    // Jika ditandai Lunas / Transfer -> Catat sebagai 🔴 Kas Keluar di Buku Kas
    // Jika dikembalikan ke Pending -> Hapus catatan Kas Keluar tersebut
    if (nextStatus === 'paid') {
      const cashflowEntry: CashflowEntry = {
        id: `CSH-MKT-${sale.orderId}`,
        storeSlug: currentStore.slug,
        date: new Date().toISOString(),
        type: 'out',
        category: 'Gaji & Komisi Marketer',
        amount: sale.commissionAmount,
        description: `Pelunasan Komisi 15% Marketer #${sale.marketerId} (Pesanan #${sale.orderId} - ${sale.customerName || 'Konsumen'})`,
        operator: 'Owner Toko'
      };
      await saveCashflowEntry(cashflowEntry, currentStore.slug);
    } else {
      await deleteCashflowEntry(`CSH-MKT-${sale.orderId}`, currentStore.slug);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_marketer_sales', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_downlines', { detail: { storeSlug: currentStore.slug } }));
    }
  };

  const handlePayAllPending = async () => {
    const unpaidSales = sales.filter(s => s.paidStatus !== 'paid');
    if (unpaidSales.length === 0) return;
    if (!confirm(`Konfirmasi pembayaran seluruh (${unpaidSales.length}) komisi pending senilai Rp ${totalCommissionUnpaid.toLocaleString('id-ID')}?\n\nSemua komisi akan ditandai LUNAS dan otomatis dicatat sebagai KAS KELUAR di Buku Kas toko.`)) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setSales(prev => prev.map(s => ({ ...s, paidStatus: 'paid', paidDate: todayStr })));

    for (const sale of unpaidSales) {
      const updatedSale = { ...sale, paidStatus: 'paid' as const, paidDate: todayStr };
      await updateMarketerSalePaidStatus(sale.orderId, 'paid', currentStore.slug, updatedSale);
      const cashflowEntry: CashflowEntry = {
        id: `CSH-MKT-${sale.orderId}`,
        storeSlug: currentStore.slug,
        date: new Date().toISOString(),
        type: 'out',
        category: 'Gaji & Komisi Marketer',
        amount: sale.commissionAmount,
        description: `Transfer Komisi 15% Marketer #${sale.marketerId} (Pesanan #${sale.orderId})`,
        operator: 'Owner Toko'
      };
      await saveCashflowEntry(cashflowEntry, currentStore.slug);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_marketer_sales', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_downlines', { detail: { storeSlug: currentStore.slug } }));
    }
    alert(`Alhamdulillah! Seluruh (${unpaidSales.length}) komisi pending senilai Rp ${totalCommissionUnpaid.toLocaleString('id-ID')} berhasil dilunaskan dan otomatis tercatat sebagai KAS KELUAR di Buku Kas toko!`);
  };

  const handlePaySpecificMarketer = async (marketerId: string, marketerName: string, unpaidAmount: number) => {
    const targetSales = sales.filter(s => s.marketerId.toUpperCase() === marketerId.toUpperCase() && s.paidStatus !== 'paid');
    if (targetSales.length === 0) {
      alert(`Tidak ada gaji pending untuk Marketer ${marketerName} (${marketerId}).`);
      return;
    }

    if (!confirm(`Konfirmasi pelunasan gaji Marketer ${marketerName} (${marketerId}) sebesar Rp ${unpaidAmount.toLocaleString('id-ID')} (${targetSales.length} transaksi)?\n\nStatus komisi akan diubah menjadi LUNAS dan otomatis dicatat sebagai KAS KELUAR di Buku Kas toko.`)) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setSales(prev => prev.map(s => (s.marketerId.toUpperCase() === marketerId.toUpperCase() && s.paidStatus !== 'paid') ? { ...s, paidStatus: 'paid' as const, paidDate: todayStr } : s));

    for (const sale of targetSales) {
      const updatedSale = { ...sale, paidStatus: 'paid' as const, paidDate: todayStr };
      await updateMarketerSalePaidStatus(sale.orderId, 'paid', currentStore.slug, updatedSale);
      const cashflowEntry: CashflowEntry = {
        id: `CSH-MKT-${sale.orderId}`,
        storeSlug: currentStore.slug,
        date: new Date().toISOString(),
        type: 'out',
        category: 'Gaji & Komisi Marketer',
        amount: sale.commissionAmount,
        description: `Transfer Gaji 15% Marketer #${sale.marketerId} (${sale.customerName || 'Pesanan'} #${sale.orderId})`,
        operator: 'Owner Toko'
      };
      await saveCashflowEntry(cashflowEntry, currentStore.slug);
    }

    setSales(prev => prev.map(s => (s.marketerId.toUpperCase() === marketerId.toUpperCase() && s.paidStatus !== 'paid') ? { ...s, paidStatus: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] } : s));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_marketer_sales', { detail: { storeSlug: currentStore.slug } }));
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_downlines', { detail: { storeSlug: currentStore.slug } }));
    }

    alert(`Alhamdulillah! Gaji Marketer ${marketerName} sebesar Rp ${unpaidAmount.toLocaleString('id-ID')} berhasil dilunaskan dan otomatis tercatat sebagai KAS KELUAR di Buku Kas toko!`);
  };

  const handleQuickChangePayday = async () => {
    const currentDay = currentStore.marketerPaydayDate || 25;
    const input = prompt(`Masukkan tanggal gajian bulanan untuk marketer toko "${currentStore.storeName}" (1 - 31):\n\nTanggal aktif saat ini: ${currentDay}`, String(currentDay));
    if (input === null) return;
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 1 || num > 31) {
      alert('Tanggal gajian harus berupa angka antara 1 sampai 31!');
      return;
    }
    await updateStorePaydayDate(currentStore.slug, num);
    currentStore.marketerPaydayDate = num;
    setDownlines(prev => [...prev]); // re-render
    alert(`Jadwal pembayaran gaji marketer berhasil diubah menjadi setiap Tanggal ${num}!`);
  };

  const handleDeleteMitra = async (partnerCode: string, name: string) => {
    if (confirm(`Hapus mitra ${name} (${partnerCode}) dari database downline?`)) {
      const filtered = await deleteStoreDownline(partnerCode, currentStore.slug);
      setDownlines(filtered);
    }
  };

  const handleClearAllDownlines = async () => {
    if (downlines.length === 0) {
      alert('Database mitra sudah kosong (0 mitra).');
      return;
    }
    if (confirm(`⚠️ PERINGATAN PENGOSONGAN DATABASE MITRA:\n\nApakah Anda yakin ingin MENGHAPUS SEMUA (${downlines.length}) mitra untuk mengosongkan database downline menjadi 0 mitra?\n\nSemua mitra akan dikosongkan dari database Cloud Supabase agar Anda dapat memulai simulasi pendaftaran mitra dari nol.`)) {
      await clearAllStoreDownlines(currentStore.slug);
      setDownlines([]);
      alert('Semua mitra berhasil dihapus dari Cloud Supabase! Database mitra sekarang bersih dan kosong (0 mitra).');
    }
  };

  const handleResetSpent = async () => {
    if (confirm('Apakah Anda yakin ingin mereset total belanja akumulasi SEMUA mitra ke Rp 0 untuk memulai simulasi evaluasi level dari awal?')) {
      await resetDownlineAccumulatedSpent(currentStore.slug);
      await loadData();
      alert('Akumulasi belanja semua mitra berhasil direset ke Rp 0!');
    }
  };

  const handleResetDefaultDownlines = async () => {
    if (confirm('Kembalikan daftar mitra downline ke data contoh resmi bawaan SR12?')) {
      await resetDownlinesToDefault(currentStore.slug);
      await loadData();
      alert('Daftar mitra berhasil dikembalikan ke standar SR12!');
    }
  };

  const handleDeleteMarketerSale = async (sale: MarketerSale) => {
    if (confirm(`Hapus catatan komisi #${sale.orderId} (${sale.customerName}) secara permanen?`)) {
      const remaining = await deleteMarketerSale(sale.orderId, currentStore.slug);
      setSales(remaining);
      await deleteCashflowEntry(`CSH-MKT-${sale.orderId}`, currentStore.slug);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
      }
    }
  };

  const handleClearPayroll = async () => {
    if (sales.length === 0) {
      alert('Riwayat komisi marketer sudah kosong.');
      return;
    }
    if (confirm(`Hapus seluruh (${sales.length}) riwayat komisi dan penjualan Marketer dari cloud & perangkat ini?`)) {
      const res = await clearAllMarketerSales(currentStore.slug);
      setSales([]);
      if (res.cloudDeleted) {
        alert('Riwayat komisi marketer berhasil dibersihkan secara permanen di cloud & perangkat ini!');
      } else {
        alert('Riwayat komisi sudah dikosongkan di perangkat ini.\n\nCatatan: Untuk menghapus permanen di Cloud Supabase lintas HP/device lain, pastikan Anda sudah menjalankan file database/patch_cleanup_permanent.sql sekali di SQL Editor Supabase.');
      }
    }
  };

  const getMitraOrders = (mitra: MitraDownline): Order[] =>
    orders.filter(o =>
      (o.partnerCode && o.partnerCode.toUpperCase() === mitra.partnerCode.toUpperCase()) ||
      (mitra.tier === 'marketer' && o.marketerId && o.marketerId.toUpperCase() === mitra.partnerCode.toUpperCase()) ||
      (o.customerName && o.customerName.toLowerCase().trim() === mitra.name.toLowerCase().trim()) ||
      (mitra.phone && o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '').endsWith(mitra.phone.replace(/[^0-9]/g, '').slice(-8)))
    );

  // Perhitungan Bonus Potongan Diskon Level & Gaji Marketer (berdasarkan Omset HET)
  const calculateMitraBonusAndDiscount = (mitra: MitraDownline, pOrders: Order[]) => {
    const orderDiscounts = pOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const orderSubtotalHet = pOrders.reduce((sum, o) => sum + (o.subtotalHet || o.grandTotal), 0);
    const effectiveHet = orderSubtotalHet > 0 ? orderSubtotalHet : (mitra.accumulatedSpent90Days || 0);

    if (mitra.tier === 'marketer') {
      const recordedComms = sales
        .filter(s => s.marketerId.toUpperCase() === mitra.partnerCode.toUpperCase())
        .reduce((sum, s) => sum + s.commissionAmount, 0);
      const bonusAmount = recordedComms > 0 ? recordedComms : Math.round(effectiveHet * 0.15);
      return {
        bonusAmount,
        bonusLabel: 'Gaji Bulanan (15%)',
        badgeColor: '#818cf8',
        badgeBg: 'rgba(99, 102, 241, 0.15)',
        pct: 15,
        orderCount: pOrders.length
      };
    }

    const tierMeta: Record<string, { pct: number; label: string; color: string; bg: string }> = {
      reseller: { pct: 20, label: 'Diskon Level (20%)', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
      sub_agen: { pct: 30, label: 'Diskon Level (30%)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
      agen: { pct: 40, label: 'Diskon Level (40%)', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
      distributor: { pct: 50, label: 'Diskon Pasokan (50%)', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }
    };
    const meta = tierMeta[mitra.tier];
    if (!meta) {
      return {
        bonusAmount: 0,
        bonusLabel: 'HET Retail Normal',
        badgeColor: '#94a3b8',
        badgeBg: 'rgba(148, 163, 184, 0.12)',
        pct: 0,
        orderCount: pOrders.length
      };
    }

    const bonusAmount = orderDiscounts > 0 ? orderDiscounts : Math.round(effectiveHet * (meta.pct / 100));
    return {
      bonusAmount,
      bonusLabel: meta.label,
      badgeColor: meta.color,
      badgeBg: meta.bg,
      pct: meta.pct,
      orderCount: pOrders.length
    };
  };

  // Evaluations mapping (memperhitungkan level toko, tanggal jatuh tempo 3 bulan, & omset HET affiliate)
  const evaluatedDownlines = downlines.map(m => {
    const pOrders = getMitraOrders(m);
    const marketerSalesList = m.tier === 'marketer'
      ? sales.filter(s => s.marketerId.toUpperCase() === m.partnerCode.toUpperCase())
      : [];
    const salesOmsetHet = marketerSalesList.reduce((sum, s) => sum + (s.omsetHet || 0), 0);
    const maxSaleHet = marketerSalesList.reduce((max, s) => Math.max(max, s.omsetHet || 0), 0);
    const effectiveSpent = m.tier === 'marketer'
      ? Math.max(m.accumulatedSpent90Days || 0, salesOmsetHet)
      : (m.accumulatedSpent90Days || 0);
    const effectiveMitra: MitraDownline = effectiveSpent !== m.accumulatedSpent90Days
      ? { ...m, accumulatedSpent90Days: effectiveSpent }
      : m;

    const orderMaxHet = pOrders.reduce((max, o) => Math.max(max, o.subtotalHet || o.grandTotal || 0), 0);
    const maxSingleOrderHet = Math.max(orderMaxHet, maxSaleHet);

    const marketerUnpaidSales = m.tier === 'marketer'
      ? sales.filter(s => s.marketerId.toUpperCase() === m.partnerCode.toUpperCase() && s.paidStatus !== 'paid')
      : [];
    const marketerUnpaidAmount = marketerUnpaidSales.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);
    const marketerPaidAmount = (m.tier === 'marketer'
      ? sales.filter(s => s.marketerId.toUpperCase() === m.partnerCode.toUpperCase() && s.paidStatus === 'paid')
      : []).reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

    return {
      mitra: effectiveMitra,
      evalData: evaluateMitraRank(effectiveMitra.tier, effectiveSpent, {
        storeTier: currentStore.partnerTier,
        mitra: effectiveMitra,
        maxSingleOrderHet
      }),
      bonusInfo: calculateMitraBonusAndDiscount(effectiveMitra, pOrders),
      dueDateInfo: getMitraDueDateInfo(effectiveMitra, currentStore.marketerPaydayDate || 25),
      marketerUnpaidAmount,
      marketerPaidAmount,
      marketerTotalCommission: marketerUnpaidAmount + marketerPaidAmount
    };
  });

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
    if (filterCategory === 'agen') return mitra.tier === 'agen';
    if (filterCategory === 'sub_agen') return mitra.tier === 'sub_agen';
    if (filterCategory === 'reseller') return mitra.tier === 'reseller';
    if (filterCategory === 'marketer') return mitra.tier === 'marketer';
    if (filterCategory === 'konsumen') return mitra.tier === 'konsumen';
    return true;
  });

  // Summary Metrics & Tier Counts
  const totalOmsetNetwork = downlines.reduce((acc, m) => acc + (m.accumulatedSpent90Days || 0), 0);
  const totalNetworkBonusDiscounts = evaluatedDownlines
    .filter(e => e.mitra.tier !== 'marketer' && e.mitra.tier !== 'konsumen')
    .reduce((sum, e) => sum + e.bonusInfo.bonusAmount, 0);
  const totalMarketerSalaries = evaluatedDownlines
    .filter(e => e.mitra.tier === 'marketer')
    .reduce((sum, e) => sum + e.bonusInfo.bonusAmount, 0);
  const promotableCount = evaluatedDownlines.filter(e => e.evalData.status === 'promotable').length;
  const warningCount = evaluatedDownlines.filter(e => e.evalData.status === 'warning').length;
  const agenCount = downlines.filter(m => m.tier === 'agen').length;
  const subAgenCount = downlines.filter(m => m.tier === 'sub_agen').length;
  const resellerCount = downlines.filter(m => m.tier === 'reseller').length;
  const marketerCount = downlines.filter(m => m.tier === 'marketer').length;
  const konsumenCount = downlines.filter(m => m.tier === 'konsumen').length;
  const totalCommissionUnpaid = sales
    .filter(s => s.paidStatus === 'unpaid')
    .reduce((acc, s) => acc + s.commissionAmount, 0);

  const getTierBadgeStyle = (t: PartnerTier) => {
    switch (t) {
      case 'agen':
        return {
          label: '👑 AGEN (40%)',
          shortLabel: 'AGEN 40%',
          gradient: 'linear-gradient(135deg, #d97706, #b45309)',
          color: '#fef3c7',
          border: 'rgba(245, 158, 11, 0.4)',
          avatarBg: 'rgba(245, 158, 11, 0.15)',
          avatarColor: '#fbbf24',
          req: 'Min Rp 15jt/bln (Rp 45jt/3 bln)'
        };
      case 'sub_agen':
        return {
          label: '💠 SUB AGEN (30%)',
          shortLabel: 'SUB AGEN 30%',
          gradient: 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#e0f2fe',
          border: 'rgba(56, 189, 248, 0.4)',
          avatarBg: 'rgba(56, 189, 248, 0.15)',
          avatarColor: '#38bdf8',
          req: 'Min Rp 4jt/bln (Rp 12jt/3 bln)'
        };
      case 'reseller':
        return {
          label: '⭐ RESELLER (20%)',
          shortLabel: 'RESELLER 20%',
          gradient: 'linear-gradient(135deg, #059669, #047857)',
          color: '#d1fae5',
          border: 'rgba(16, 185, 129, 0.4)',
          avatarBg: 'rgba(16, 185, 129, 0.15)',
          avatarColor: '#34d399',
          req: 'Min Rp 500rb/bln (Rp 1.5jt/3 bln)'
        };
      case 'marketer':
        return {
          label: '💼 MARKETER (GAJI 15%)',
          shortLabel: 'MARKETER (15%)',
          gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#e0e7ff',
          border: 'rgba(99, 102, 241, 0.4)',
          avatarBg: 'rgba(99, 102, 241, 0.15)',
          avatarColor: '#818cf8',
          req: `Bayar Full HET • Gaji Tgl ${currentStore.marketerPaydayDate || 25}`
        };
      case 'konsumen':
      default:
        return {
          label: '🛍️ NON MITRA (HET)',
          shortLabel: 'PELANGGAN',
          gradient: 'linear-gradient(135deg, #9333ea, #7e22ce)',
          color: '#f3e8ff',
          border: 'rgba(168, 85, 247, 0.4)',
          avatarBg: 'rgba(168, 85, 247, 0.15)',
          avatarColor: '#c084fc',
          req: 'Pelanggan Tetap / Langganan Retail'
        };
    }
  };

  const getInitials = (fullName: string) => {
    const clean = fullName.replace(/dr\.|H\.|Hj\.|S\.Farm|Sp\.KK|\(|\)/g, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return 'SR';
  };

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

        {/* Segmented Tab Switcher & Modern Pill Action Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'inline-flex', background: '#090f1d', padding: '3px', borderRadius: '999px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => setActiveTab('downlines')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: 'none',
                background: activeTab === 'downlines' ? '#0284c7' : 'transparent',
                color: activeTab === 'downlines' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              <span>Mitra &amp; Cust ({downlines.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('payroll');
                if (onSubTabChange) onSubTabChange('payroll');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: 'none',
                background: activeTab === 'payroll' ? '#0284c7' : 'transparent',
                color: activeTab === 'payroll' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <DollarSign size={14} />
              <span>Gaji &amp; Komisi Marketer ({sales.length})</span>
              {totalCommissionUnpaid > 0 && (
                <span style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.66rem',
                  fontWeight: 900
                }}>
                  Pending: Rp {totalCommissionUnpaid.toLocaleString('id-ID')}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'downlines' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mitra-pill-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                }}
                title="Tambah Mitra Resmi atau Pelanggan Baru"
              >
                <UserPlus size={14} />
                <span>+ Tambah Mitra</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mitra-pill-btn"
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '7px 12px',
                  fontSize: '0.78rem'
                }}
                title="Unduh template Excel resmi untuk input mitra (Marketer, Reseller, Sub Agen, Agen)"
              >
                <Download size={14} />
                <span className="hide-on-mobile">Unduh Template</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerFileInput}
                disabled={isImporting}
                className="mitra-pill-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 13px',
                  fontSize: '0.78rem',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  opacity: isImporting ? 0.7 : 1,
                  cursor: isImporting ? 'wait' : 'pointer'
                }}
                title="Import data mitra dari file Excel (.xlsx / .xls)"
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                <span>{isImporting ? 'Membaca...' : 'Import Excel'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="mitra-pill-btn"
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '7px 12px',
                  fontSize: '0.78rem'
                }}
                title="Lihat Aturan Baku Kemitraan SR12 2026 Resmi (CK SWORD)"
              >
                <Award size={14} />
                <span className="hide-on-mobile">Rules 2026</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultDownlines}
                className="mitra-pill-btn"
                style={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '7px 12px',
                  fontSize: '0.78rem'
                }}
                title="Kembalikan daftar mitra bawaan contoh SR12 (Agen, Sub Agen, Reseller, Marketer & Non-Mitra)"
              >
                <RotateCcw size={13} />
                <span className="hide-on-mobile">Mitra Default</span>
              </button>

              <button
                type="button"
                onClick={handleResetSpent}
                className="mitra-pill-btn"
                style={{
                  background: '#1e293b',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '7px 12px',
                  fontSize: '0.78rem'
                }}
                title="Reset seluruh akumulasi belanja mitra ke Rp 0 untuk simulasi baru"
              >
                <RotateCcw size={13} />
                <span className="hide-on-mobile">Reset Omset (0)</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllDownlines}
                className="mitra-pill-btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '7px 12px',
                  fontSize: '0.78rem'
                }}
                title="Hapus seluruh data mitra untuk mengosongkan database menjadi 0 mitra"
              >
                <Trash2 size={13} />
                <span className="hide-on-mobile">Kosongkan</span>
              </button>
            </div>
          )}

          {activeTab === 'payroll' && (
            <button
              type="button"
              onClick={handleClearPayroll}
              className="mitra-pill-btn"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '7px 14px',
                fontSize: '0.78rem'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
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

        <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Bonus Diskon Jaringan (20-40%)</span>
            <Gift size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
            Rp {totalNetworkBonusDiscounts.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
            Keuntungan margin Reseller/Sub Agen/Agen
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('payroll');
            if (onSubTabChange) onSubTabChange('payroll');
          }}
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          title="Klik untuk membuka menu Pelunasan Gaji Marketer"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 800 }}>💼 Total Gaji Marketer (15%)</span>
              <DollarSign size={16} color="#818cf8" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#818cf8', marginTop: '4px' }}>
              Rp {totalMarketerSalaries.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#c7d2fe', marginTop: '2px' }}>
              {totalCommissionUnpaid > 0 ? (
                <b style={{ color: '#fbbf24' }}>⏳ Rp {totalCommissionUnpaid.toLocaleString('id-ID')} belum dicairkan</b>
              ) : (
                '✓ Semua komisi sudah lunas'
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('payroll');
              if (onSubTabChange) onSubTabChange('payroll');
            }}
            style={{
              marginTop: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <CheckCircle2 size={12} />
            <span>{totalCommissionUnpaid > 0 ? 'Lunaskan Gaji Marketer &rarr;' : 'Lihat Rekap Gaji &rarr;'}</span>
          </button>
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

            {/* Filter Pills with Modern Rounded Geometry */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none', padding: '2px 0' }}>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'all' ? '#0284c7' : '#0f172a',
                  color: filterCategory === 'all' ? '#fff' : '#94a3b8',
                  border: filterCategory === 'all' ? '1px solid #38bdf8' : '1px solid #334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Semua ({downlines.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('agen')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'agen' ? 'linear-gradient(135deg, #d97706, #b45309)' : '#0f172a',
                  color: filterCategory === 'agen' ? '#fff' : '#fbbf24',
                  border: filterCategory === 'agen' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                👑 Agen ({agenCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('sub_agen')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'sub_agen' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#0f172a',
                  color: filterCategory === 'sub_agen' ? '#fff' : '#38bdf8',
                  border: filterCategory === 'sub_agen' ? '1px solid #0284c7' : '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                💠 Sub Agen ({subAgenCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('reseller')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'reseller' ? 'linear-gradient(135deg, #059669, #047857)' : '#0f172a',
                  color: filterCategory === 'reseller' ? '#fff' : '#34d399',
                  border: filterCategory === 'reseller' ? '1px solid #059669' : '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ⭐ Reseller ({resellerCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('marketer')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'marketer' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#0f172a',
                  color: filterCategory === 'marketer' ? '#fff' : '#a5b4fc',
                  border: filterCategory === 'marketer' ? '1px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                💼 Marketer ({marketerCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('konsumen')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'konsumen' ? 'linear-gradient(135deg, #9333ea, #7e22ce)' : '#0f172a',
                  color: filterCategory === 'konsumen' ? '#fff' : '#c084fc',
                  border: filterCategory === 'konsumen' ? '1px solid #9333ea' : '1px solid rgba(168, 85, 247, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🛍️ Non-Mitra Langganan ({konsumenCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('promotable')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'promotable' ? '#059669' : '#0f172a',
                  color: filterCategory === 'promotable' ? '#fff' : '#34d399',
                  border: '1px solid rgba(16,185,129,0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🚀 Layak Naik ({promotableCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('warning')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: filterCategory === 'warning' ? '#dc2626' : '#0f172a',
                  color: filterCategory === 'warning' ? '#fff' : '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ⚠️ Peringatan Turun ({warningCount})
              </button>
            </div>
          </div>

          {/* Empty State */}
          {filteredDownlines.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '12px', fontSize: '0.88rem' }}>
                {downlines.length === 0 ? 'Database mitra saat ini kosong (0 mitra).' : 'Tidak ada mitra/pelanggan yang sesuai dengan pencarian atau filter yang dipilih.'}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mitra-pill-btn"
                  style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', fontSize: '0.82rem' }}
                >
                  + Tambah Mitra / Pelanggan Baru
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mitra-pill-btn"
                  style={{ padding: '8px 16px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '0.82rem' }}
                >
                  <Download size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Unduh Template Excel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerFileInput}
                  className="mitra-pill-btn"
                  style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', fontSize: '0.82rem' }}
                >
                  <FileUp size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Import File Excel
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultDownlines}
                  className="mitra-pill-btn"
                  style={{ padding: '8px 16px', background: '#334155', color: '#f8fafc', border: '1px solid #475569', fontSize: '0.82rem' }}
                >
                  Muat Data Contoh SR12 Lengkap
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Desktop Table View (Crisp CRM View on Laptops/Desktops) */}
              <div className="hide-on-mobile" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#090f1d', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '12px 14px' }}>Mitra &amp; Kode</th>
                      <th style={{ padding: '12px 14px' }}>Level Saat Ini</th>
                      <th style={{ padding: '12px 14px' }}>Bonus &amp; Diskon Level</th>
                      <th style={{ padding: '12px 14px' }}>Total Omset (HET) &amp; Target</th>
                      <th style={{ padding: '12px 14px' }}>Status Evaluasi</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDownlines.map(({ mitra, evalData, bonusInfo, dueDateInfo, marketerUnpaidAmount, marketerPaidAmount, marketerTotalCommission }) => {
                      const waUrl = generateMitraWaReminderUrl(mitra, currentStore.storeName, evalData, currentStore.marketerPaydayDate || 25);
                      const isPromotable = evalData.status === 'promotable';
                      const isWarning = evalData.status === 'warning';
                      const badgeStyle = getTierBadgeStyle(mitra.tier);
                      const isCustomer = mitra.tier === 'konsumen';

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: badgeStyle.avatarBg,
                                  border: `1.5px solid ${badgeStyle.border}`,
                                  color: badgeStyle.avatarColor,
                                  fontWeight: 900,
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {getInitials(mitra.name)}
                              </div>

                              <div>
                                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>{mitra.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.72rem', background: '#0f172a', padding: '1px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                                    #{mitra.partnerCode}
                                  </span>
                                  {mitra.city && (
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      <MapPin size={11} color="#64748b" />
                                      {mitra.city}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={11} color="#34d399" />
                                  <a href={`https://wa.me/${mitra.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                                    {mitra.phone}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Level Saat Ini */}
                          <td style={{ padding: '12px 14px' }}>
                            <div
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                background: badgeStyle.gradient,
                                color: badgeStyle.color,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                              }}
                            >
                              {badgeStyle.label}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '5px', fontWeight: 600 }}>
                              {badgeStyle.req}
                            </div>
                          </td>

                          {/* 2b. Bonus & Diskon Level */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 900, color: bonusInfo.badgeColor, fontSize: '0.92rem' }}>
                              Rp {bonusInfo.bonusAmount.toLocaleString('id-ID')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px', fontWeight: 700 }}>
                              {bonusInfo.bonusLabel}
                            </div>
                          </td>

                          {/* 3. Capaian Belanja & Progress Bar */}
                          <td style={{ padding: '12px 14px', minWidth: '180px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 900, color: isPromotable ? '#34d399' : isWarning ? '#f87171' : '#f8fafc', fontSize: '0.92rem' }}>
                                Rp {mitra.accumulatedSpent90Days.toLocaleString('id-ID')}
                              </span>
                              {!isCustomer && (
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                                  {evalData.progress3MonthsPct}%
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${evalData.progress3MonthsPct}%`,
                                  height: '100%',
                                  background: isCustomer
                                    ? 'linear-gradient(90deg, #9333ea, #c084fc)'
                                    : isPromotable
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

                            {/* Batas Waktu Evaluasi Target / Jatuh Tempo */}
                            <div
                              style={{
                                marginTop: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: dueDateInfo.badgeBg,
                                border: `1px solid ${dueDateInfo.badgeColor}40`,
                                fontSize: '0.69rem',
                                color: dueDateInfo.badgeColor,
                                fontWeight: 700
                              }}
                              title={dueDateInfo.displayLine}
                            >
                              <Calendar size={11} color={dueDateInfo.badgeColor} />
                              <span>{dueDateInfo.displayLine}</span>
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
                              {/* Tombol WhatsApp (Kirim Promo untuk Non-Mitra, Chat/Ingatkan untuk Mitra) */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mitra-pill-btn"
                                style={{
                                  background: isCustomer ? 'linear-gradient(135deg, #059669, #047857)' : isWarning ? '#dc2626' : '#059669',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  fontSize: '0.72rem',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                }}
                                title={isCustomer ? 'Kirim info promo produk terbaru via WhatsApp' : 'Kirim pesan via WhatsApp'}
                              >
                                {isCustomer ? <Gift size={13} /> : <MessageCircle size={13} />}
                                <span>{isCustomer ? 'Kirim Promo WA' : isWarning ? 'Ingatkan WA' : 'Chat WA'}</span>
                              </a>

                                {/* Tombol Promosikan / Ubah Level */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPromoteModalMitra({ mitra, evalData, dueDateInfo });
                                  setSelectedNewTier(mitra.tier);
                                  setSelectedDueDate(dueDateInfo.rawDate || '');
                                }}
                                className="mitra-pill-btn"
                                style={{
                                  background: isPromotable ? '#f59e0b' : '#334155',
                                  color: isPromotable ? '#0f172a' : '#f8fafc',
                                  border: 'none',
                                  padding: '6px 11px',
                                  fontSize: '0.72rem'
                                }}
                                title="Sesuaikan tingkatan mitra / jadikan mitra resmi"
                              >
                                <Award size={13} />
                                <span>{isCustomer ? (isPromotable ? 'Tawari Mitra 🚀' : 'Ubah Status') : (isPromotable ? 'Promosikan 🚀' : 'Ubah Level')}</span>
                              </button>

                              {mitra.tier === 'marketer' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAffiliateLink(mitra.partnerCode)}
                                    className="mitra-pill-btn"
                                    style={{
                                      background: copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? '#10b981' : '#4f46e5',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '6px 11px',
                                      fontSize: '0.72rem'
                                    }}
                                    title={`Salin Link Toko Affiliate (${mitra.partnerCode})`}
                                  >
                                    {copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? <Check size={13} /> : <Copy size={13} />}
                                    <span>{copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? 'Tersalin!' : 'Link Affiliate'}</span>
                                  </button>

                                  {(marketerUnpaidAmount || 0) > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handlePaySpecificMarketer(mitra.partnerCode, mitra.name, marketerUnpaidAmount || 0)}
                                      className="mitra-pill-btn"
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '6px 12px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)'
                                      }}
                                      title="Lunaskan komisi pending untuk marketer ini dan otomatis catat sebagai KAS KELUAR di Buku Kas"
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Lunaskan Gaji (Rp {(marketerUnpaidAmount || 0).toLocaleString('id-ID')})</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTab('payroll');
                                        if (onSubTabChange) onSubTabChange('payroll');
                                      }}
                                      className="mitra-pill-btn"
                                      style={{
                                        background: '#1e293b',
                                        color: '#94a3b8',
                                        border: '1px solid #334155',
                                        padding: '6px 10px',
                                        fontSize: '0.72rem'
                                      }}
                                      title="Lihat riwayat komisi dan pencairan gaji marketer"
                                    >
                                      <CheckCircle2 size={12} color="#34d399" />
                                      <span>Gaji Lunas</span>
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteMitra(mitra.partnerCode, mitra.name)}
                                className="mitra-pill-btn"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '6px 9px'
                                }}
                                title="Hapus dari database"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 2. Mobile Card List (Ultra-Sleek Native App View on HP screens) */}
              <div className="hide-on-desktop" style={{ padding: '12px' }}>
                {filteredDownlines.map(({ mitra, evalData, bonusInfo, dueDateInfo, marketerUnpaidAmount, marketerPaidAmount, marketerTotalCommission }) => {
                  const waUrl = generateMitraWaReminderUrl(mitra, currentStore.storeName, evalData, currentStore.marketerPaydayDate || 25);
                  const isPromotable = evalData.status === 'promotable';
                  const isWarning = evalData.status === 'warning';
                  const badgeStyle = getTierBadgeStyle(mitra.tier);
                  const isCustomer = mitra.tier === 'konsumen';

                  return (
                    <div
                      key={mitra.partnerCode}
                      className="mitra-mobile-card"
                      style={{
                        borderLeft: `4px solid ${isPromotable ? '#10b981' : isWarning ? '#ef4444' : isCustomer ? '#9333ea' : '#0284c7'}`
                      }}
                    >
                      {/* Card Header: Avatar + Name + Partner Code + Tier Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: badgeStyle.avatarBg,
                              border: `1.5px solid ${badgeStyle.border}`,
                              color: badgeStyle.avatarColor,
                              fontWeight: 900,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {getInitials(mitra.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>{mitra.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.72rem', background: '#0f172a', padding: '1px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                                #{mitra.partnerCode}
                              </span>
                              {mitra.city && (
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <MapPin size={11} color="#64748b" />
                                  {mitra.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: badgeStyle.gradient,
                            color: badgeStyle.color,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {badgeStyle.shortLabel}
                        </span>
                      </div>

                      {/* Card Bonus & Diskon Level */}
                      <div
                        style={{
                          background: bonusInfo.badgeBg,
                          border: `1px solid ${bonusInfo.badgeColor}40`,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gift size={13} color={bonusInfo.badgeColor} />
                          <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700 }}>
                            {bonusInfo.bonusLabel}:
                          </span>
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: bonusInfo.badgeColor }}>
                          Rp {bonusInfo.bonusAmount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Card Belanja & Target Progress */}
                      <div style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Belanja:</span>
                          <span style={{ fontWeight: 900, color: isPromotable ? '#34d399' : isWarning ? '#f87171' : '#f8fafc', fontSize: '0.92rem' }}>
                            Rp {mitra.accumulatedSpent90Days.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '5px', background: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${evalData.progress3MonthsPct}%`,
                              height: '100%',
                              background: isCustomer
                                ? 'linear-gradient(90deg, #9333ea, #c084fc)'
                                : isPromotable
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : isWarning
                                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                              borderRadius: '999px'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{badgeStyle.req}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: evalData.badgeColor }}>
                            {evalData.badgeLabel}
                          </span>
                        </div>
                      </div>

                      {/* Card Batas Evaluasi / Tanggal Gajian */}
                      <div
                        style={{
                          background: dueDateInfo.badgeBg,
                          border: `1px solid ${dueDateInfo.badgeColor}40`,
                          padding: '7px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: dueDateInfo.badgeColor
                        }}
                      >
                        <Calendar size={13} color={dueDateInfo.badgeColor} />
                        <span>{dueDateInfo.displayLine}</span>
                      </div>

                      {/* Khusus Marketer: Status Gaji & Tombol Pelunasan Cepat di Mobile */}
                      {mitra.tier === 'marketer' && (
                        <div
                          style={{
                            background: (marketerUnpaidAmount || 0) > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: `1.5px solid ${(marketerUnpaidAmount || 0) > 0 ? '#f59e0b' : '#10b981'}`,
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CreditCard size={14} color={(marketerUnpaidAmount || 0) > 0 ? '#f59e0b' : '#34d399'} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>Gaji &amp; Komisi (15%)</span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontWeight: 800,
                                background: (marketerUnpaidAmount || 0) > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                                color: (marketerUnpaidAmount || 0) > 0 ? '#f59e0b' : '#34d399'
                              }}
                            >
                              {(marketerUnpaidAmount || 0) > 0 ? 'Belum Cair' : '✓ Lunas'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Hak Gaji:</span>
                            <b style={{ fontSize: '0.88rem', color: '#38bdf8' }}>Rp {(marketerTotalCommission || 0).toLocaleString('id-ID')}</b>
                          </div>

                          {(marketerUnpaidAmount || 0) > 0 ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>Pending Pelunasan:</span>
                                <b style={{ fontSize: '0.92rem', color: '#f59e0b', fontWeight: 900 }}>Rp {(marketerUnpaidAmount || 0).toLocaleString('id-ID')}</b>
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePaySpecificMarketer(mitra.partnerCode, mitra.name, marketerUnpaidAmount || 0)}
                                style={{
                                  marginTop: '4px',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '9px 12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)'
                                }}
                              >
                                <CheckCircle2 size={15} />
                                <span>Lunaskan Gaji (Rp {(marketerUnpaidAmount || 0).toLocaleString('id-ID')}) &rarr; Kas Keluar</span>
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#34d399' }}>
                              <span>Semua gaji sudah dilunaskan (tercatat di Kas Keluar)</span>
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mitra-pill-btn"
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            background: isCustomer ? 'linear-gradient(135deg, #059669, #047857)' : isWarning ? '#dc2626' : '#059669',
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '8px 10px',
                            fontSize: '0.74rem'
                          }}
                        >
                          {isCustomer ? <Gift size={13} /> : <MessageCircle size={13} />}
                          <span>{isCustomer ? 'Kirim Promo WA' : isWarning ? 'Ingatkan WA' : 'Chat WA'}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setPromoteModalMitra({ mitra, evalData, dueDateInfo });
                            setSelectedNewTier(mitra.tier);
                            setSelectedDueDate(dueDateInfo.rawDate || '');
                          }}
                          className="mitra-pill-btn"
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            background: isPromotable ? '#f59e0b' : '#334155',
                            color: isPromotable ? '#0f172a' : '#f8fafc',
                            border: 'none',
                            padding: '8px 10px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <Award size={13} />
                          <span>{isCustomer ? (isPromotable ? 'Tawari Mitra' : 'Ubah') : (isPromotable ? 'Promosikan' : 'Ubah Level')}</span>
                        </button>

                        {mitra.tier === 'marketer' && (
                          <button
                            type="button"
                            onClick={() => handleCopyAffiliateLink(mitra.partnerCode)}
                            className="mitra-pill-btn"
                            style={{
                              flex: '1 1 100%',
                              justifyContent: 'center',
                              background: copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? '#10b981' : '#4f46e5',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 10px',
                              fontSize: '0.74rem'
                            }}
                          >
                            {copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedAffiliateCode === mitra.partnerCode.toUpperCase() ? 'Link Affiliate Tersalin!' : `Salin Link Affiliate (${mitra.partnerCode})`}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteMitra(mitra.partnerCode, mitra.name)}
                          className="mitra-pill-btn"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '8px 10px'
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Payroll Tab */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  Rekap Gaji &amp; Komisi Marketer Bulanan (15% HET)
                </h4>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#38bdf8' }}>
                  <Calendar size={12} />
                  <span>Jadwal Gajian: <b>Tgl {currentStore.marketerPaydayDate || 25}</b></span>
                  <button
                    type="button"
                    onClick={handleQuickChangePayday}
                    style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: '0 2px', textDecoration: 'underline', fontSize: '0.7rem' }}
                    title="Ubah tanggal gajian toko"
                  >
                    (Ubah)
                  </button>
                </div>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Dihitung otomatis dari pesanan yang masuk lewat link referral ?ref=KODE_MARKETER
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.8rem', background: '#0f172a', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8' }}>Total Belum Dibayar: </span>
                <b style={{ color: '#f59e0b' }}>Rp {totalCommissionUnpaid.toLocaleString('id-ID')}</b>
              </div>
              {totalCommissionUnpaid > 0 && (
                <button
                  type="button"
                  onClick={handlePayAllPending}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                  }}
                  title="Tandai semua komisi pending menjadi LUNAS dan otomatis catat sebagai KAS KELUAR di Buku Kas"
                >
                  <CheckCircle2 size={14} />
                  <span>Lunaskan Semua (Rp {totalCommissionUnpaid.toLocaleString('id-ID')})</span>
                </button>
              )}
              {onSwitchTab && (
                <button
                  type="button"
                  onClick={() => onSwitchTab('cashflow')}
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    border: '1px solid #38bdf8',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Buka Tab Buku Kas untuk mengecek mutasi Kas Keluar"
                >
                  <BookOpen size={14} />
                  <span>Lihat di Buku Kas &rarr;</span>
                </button>
              )}
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
                        {s.paidStatus === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePayrollStatus(s)}
                            style={{
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              cursor: 'pointer',
                              fontSize: '0.74rem',
                              padding: '5px 12px',
                              borderRadius: '999px',
                              fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Lunas dan tercatat sebagai KAS KELUAR di Buku Kas. Klik untuk batalkan jika diperlukan."
                          >
                            <Check size={13} />
                            <span>✓ LUNAS (Kas Keluar)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePayrollStatus(s)}
                            style={{
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.74rem',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)'
                            }}
                            title="Klik untuk lunaskan komisi ini dan otomatis catat sebagai KAS KELUAR di Buku Kas"
                          >
                            <CreditCard size={13} />
                            <span>Lunaskan (Kas Keluar)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMarketerSale(s)}
                          style={{
                            marginLeft: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            verticalAlign: 'middle'
                          }}
                          title="Hapus permanen baris komisi ini"
                        >
                          <Trash2 size={12} />
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

      {/* Modal: Tambah Mitra / Pelanggan Baru */}
      {showAddModal && (
        <SafeModalOverlay onClose={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', background: '#1e293b', color: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Tambah Mitra / Pelanggan Langganan</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDownline} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Kode Mitra / Pelanggan (contoh: AG-01 / SA-01 / RS-01 / MK-01 / CUST-01):
                </label>
                <input
                  type="text"
                  required
                  placeholder="RS-105 atau CUST-01"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nama Lengkap Mitra / Pelanggan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
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
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Jenjang / Kategori:
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PartnerTier)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {getAllowedDownlineTiers(currentStore.partnerTier).map(tKey => {
                      const tInfo = SR12_TIERS[tKey];
                      return (
                        <option key={tKey} value={tKey}>
                          {tInfo.name} ({tKey === 'konsumen' ? 'HET Penuh' : tKey === 'marketer' ? 'Komisi 15%' : `Diskon ${tInfo.discountPct}%`})
                        </option>
                      );
                    })}
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
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              {/* Tanggal Batas Jatuh Tempo Evaluasi Target */}
              {tier === 'marketer' ? (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  💼 <b>Jadwal Gaji Marketer:</b> Marketer tidak memiliki batas target penurunan peringkat. Seluruh komisi 15% dibayarkan serentak pada <b>Tanggal {currentStore.marketerPaydayDate || 25} setiap bulannya</b>.
                </div>
              ) : tier === 'konsumen' ? (
                <div style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  🛍️ <b>Pelanggan Retail:</b> Bebas target omset (membeli dengan harga HET normal).
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    📅 Batas Akhir Evaluasi Target (Jatuh Tempo):
                  </label>
                  <input
                    type="date"
                    required
                    value={evaluationDueDate}
                    onChange={(e) => setEvaluationDueDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    * Batas waktu perhitungan 3 bulan untuk evaluasi target omset mitra ini (bisa disesuaikan per mitra).
                  </span>
                </div>
              )}

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '11px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  marginTop: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                }}
              >
                Simpan Data Mitra / Pelanggan
              </button>
            </form>
          </div>
        </SafeModalOverlay>
      )}

      {/* Modal: Promosikan / Ubah Level Mitra */}
      {promoteModalMitra && (
        <SafeModalOverlay onClose={() => setPromoteModalMitra(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', background: '#1e293b', color: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #334155' }}>
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
                  {getAllowedDownlineTiers(currentStore.partnerTier).map(tKey => {
                    const tInfo = SR12_TIERS[tKey];
                    return (
                      <option key={tKey} value={tKey}>
                        {tInfo.name} ({tKey === 'konsumen' ? 'HET Penuh' : tKey === 'marketer' ? 'Gaji 15% - Full HET' : `Diskon ${tInfo.discountPct}%`})
                      </option>
                    );
                  })}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  * Mengubah level akan langsung memperbarui diskon belanja yang didapat mitra saat checkout.
                </span>
              </div>

              {selectedNewTier !== 'marketer' && selectedNewTier !== 'konsumen' ? (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    📅 Batas Akhir Evaluasi Target (Jatuh Tempo):
                  </label>
                  <input
                    type="date"
                    value={selectedDueDate}
                    onChange={(e) => setSelectedDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1.5px solid #334155',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    * Anda dapat memperpanjang atau menyesuaikan batas akhir evaluasi target 3 bulan untuk mitra ini.
                  </span>
                </div>
              ) : selectedNewTier === 'marketer' ? (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  💼 <b>Jadwal Gaji Marketer:</b> Bebas batas penurunan jenjang. Seluruh komisi 15% dicairkan serentak pada <b>Tanggal {currentStore.marketerPaydayDate || 25} setiap bulannya</b>.
                </div>
              ) : (
                <div style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                  🛍️ <b>Pelanggan Retail:</b> Membeli produk secara retail harga normal (bebas target).
                </div>
              )}

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
        </SafeModalOverlay>
      )}

      {/* Modal: Rules Kemitraan 2026 (CK SWORD) */}
      {showRulesModal && (
        <SafeModalOverlay onClose={() => setShowRulesModal(false)}>
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
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', padding: '10px 12px', fontSize: '0.75rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                📌 <b>Standar Evaluasi Sistem:</b> Seluruh target omset &amp; syarat promosi dihitung berdasarkan <b>nilai Omset HET</b> (sebelum diskon). Peringatan turun level muncul jika belum mencapai target minimal bulanan atau memasuki <b>30 hari terakhir masa 3 bulan</b>. Promosi otomatis dibatasi di bawah level toko pemilik (<b>{SR12_TIERS[currentStore.partnerTier]?.name}</b>).
              </div>

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
                  <li>Marketer <b>membayar FULL sesuai harga HET</b> saat berbelanja di kasir atau toko online (tanpa potongan diskon 15% langsung).</li>
                  <li>Potongan <b>15% dicatat sebagai gaji/komisi</b> yang diterima serentak pada <b>Tanggal {currentStore.marketerPaydayDate || 25} setiap bulannya</b>.</li>
                  <li>Punya <b>kesempatan emas naik menjadi RESELLER</b> melalui <b>First Order Reseller Rp 500.000,- HET</b> (Rp 400.000,- net) ATAU jalur omset akumulasi <b>Rp 800.000,-</b> (dengan omset pribadi min Rp 300.000,- berturut-turut 3 bulan).</li>
                  <li style={{ color: '#34d399', fontWeight: 800 }}>Jika target Reseller belum tercapai, <b>Marketer TETAP MENJADI MITRA AKTIF</b> (tidak ada batas target evaluasi penurunan tingkat dan tidak pernah dikeluarkan dari kemitraan SR12).</li>
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
        </SafeModalOverlay>
      )}

      {/* Toast Notifikasi Sukses Impor */}
      {importSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #065f46, #047857)',
            color: '#ecfdf5',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.4)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 700,
            border: '1px solid #10b981'
          }}
        >
          <CheckCircle2 size={20} color="#34d399" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* Modal: Preview & Konfirmasi Import Mitra dari Excel */}
      {showImportModal && importResult && (
        <SafeModalOverlay onClose={() => !isSavingImport && setShowImportModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '860px',
              width: '95%',
              background: '#0f172a',
              color: '#fff',
              borderRadius: '16px',
              border: '1.5px solid #334155',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                background: '#1e293b',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '8px',
                    borderRadius: '10px',
                    color: '#10b981'
                  }}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                    Preview &amp; Konfirmasi Import Mitra
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Menemukan <strong style={{ color: '#38bdf8' }}>{importResult.validMitra.length} mitra valid</strong> yang siap disimpan ke database
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingImport}
                onClick={() => setShowImportModal(false)}
                style={{
                  color: '#94a3b8',
                  background: 'transparent',
                  border: 'none',
                  cursor: isSavingImport ? 'not-allowed' : 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Cards */}
              {(() => {
                const newCount = importResult.previewRows.filter(r => !r.isExisting).length;
                const updateCount = importResult.previewRows.filter(r => r.isExisting).length;
                const marketerCount = importResult.validMitra.filter(m => m.tier === 'marketer').length;
                const resellerCount = importResult.validMitra.filter(m => m.tier === 'reseller').length;
                const subAgenCount = importResult.validMitra.filter(m => m.tier === 'sub_agen').length;
                const agenCount = importResult.validMitra.filter(m => m.tier === 'agen').length;

                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL MITRA</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>{importResult.validMitra.length}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '10px', border: '1px solid #059669' }}>
                      <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>MITRA BARU</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>+{newCount}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d97706' }}>
                      <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>UPDATE MITRA</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24' }}>{updateCount}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>RINCIAN LEVEL</div>
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
                        {marketerCount > 0 ? `Marketer: ${marketerCount} ` : ''}
                        {resellerCount > 0 ? `Reseller: ${resellerCount} ` : ''}
                        {subAgenCount > 0 ? `Sub Agen: ${subAgenCount} ` : ''}
                        {agenCount > 0 ? `Agen: ${agenCount}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Warning Skipped Rows */}
              {importResult.skippedRows.length > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '0.75rem',
                    color: '#fca5a5'
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                    ⚠️ {importResult.skippedRows.length} Baris dilewati karena format tidak sesuai:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', maxHeight: '70px', overflowY: 'auto' }}>
                    {importResult.skippedRows.map((s, idx) => (
                      <li key={idx}>
                        Baris {s.rowNumber}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div
                style={{
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#090f1d'
                }}
              >
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 2 }}>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '8px 12px' }}>No</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Kode Mitra</th>
                        <th style={{ padding: '8px 12px' }}>Nama Mitra</th>
                        <th style={{ padding: '8px 12px' }}>Level Tier</th>
                        <th style={{ padding: '8px 12px' }}>No. WhatsApp</th>
                        <th style={{ padding: '8px 12px' }}>Kota</th>
                        <th style={{ padding: '8px 12px' }}>Rekening Bank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.previewRows.map((item, idx) => {
                        const { mitra, isExisting } = item;
                        const badge = getTierBadgeStyle(mitra.tier);
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #1e293b',
                              background: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.4)'
                            }}
                          >
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  background: isExisting ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: isExisting ? '#fbbf24' : '#34d399',
                                  border: isExisting ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: 800
                                }}
                              >
                                {isExisting ? 'UPDATE' : 'BARU'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#38bdf8' }}>
                              {mitra.partnerCode}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#f8fafc' }}>
                              {mitra.name}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span
                                style={{
                                  background: badge.avatarBg,
                                  color: badge.avatarColor,
                                  border: `1px solid ${badge.border}`,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: 800
                                }}
                              >
                                {badge.shortLabel}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                              {mitra.phone}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                              {mitra.city || '-'}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                              {mitra.bankName ? `${mitra.bankName}: ${mitra.bankAccount || '-'}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 22px',
                background: '#1e293b',
                borderTop: '1px solid #334155',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <button
                type="button"
                disabled={isSavingImport}
                onClick={() => setShowImportModal(false)}
                style={{
                  background: '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isSavingImport ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingImport || importResult.validMitra.length === 0}
                onClick={handleConfirmImport}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: isSavingImport ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isSavingImport ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>
                  {isSavingImport
                    ? 'Menyimpan ke Cloud & Offline...'
                    : `Konfirmasi & Simpan ${importResult.validMitra.length} Mitra`}
                </span>
              </button>
            </div>
          </div>
        </SafeModalOverlay>
      )}
    </div>
  );
};
