import { PartnerTier, MitraDownline } from '../types';
import { getAllowedDownlineTiers } from '../config/tiers';

export interface TierTargetConfig {
  tier: PartnerTier;
  name: string;
  discountPct: number;
  firstOrderHet: number;         // Nominal order pertama bruto (HET)
  firstOrderNet: number;         // Nominal order pertama netto setelah diskon
  minMonthlyTarget: number;      // Omset minimal per bulan (HET)
  accum3MonthsTarget: number;    // Akumulasi minimal selama 3 bulan (HET)
  careerTrackMin: number;        // Jalur omset minimal untuk naik ke tingkat ini
  careerTrackPersonal: number;   // Omset pribadi minimal berturut-turut selama 3 bulan
  nextTier: PartnerTier | null;
  prevTier: PartnerTier | null;
  rulesNotes: string[];
}

/**
 * 2026 Rules Kemitraan Resmi SR12 Skin Care / CK SWORD
 */
export const SR12_TIER_TARGETS: Record<PartnerTier, TierTargetConfig> = {
  konsumen: {
    tier: 'konsumen',
    name: 'Konsumen Retail',
    discountPct: 0,
    firstOrderHet: 0,
    firstOrderNet: 0,
    minMonthlyTarget: 0,
    accum3MonthsTarget: 0,
    careerTrackMin: 0,
    careerTrackPersonal: 0,
    nextTier: 'marketer',
    prevTier: null,
    rulesNotes: ['Pembelian eceran normal tanpa syarat omset.']
  },
  marketer: {
    tier: 'marketer',
    name: 'Marketer',
    discountPct: 0, // Membayar Full sesuai harga HET saat transaksi belanja (tanpa diskon langsung)
    firstOrderHet: 0,
    firstOrderNet: 0,
    minMonthlyTarget: 0, // Marketer tidak memiliki target minimal bulanan (status mitra permanen aman)
    accum3MonthsTarget: 0, // Tidak ada ancaman turun tingkat atau keluar dari kemitraan SR12
    careerTrackMin: 800000, // Jalur omset minimal akumulasi untuk naik ke tingkat Reseller
    careerTrackPersonal: 300000,
    nextTier: 'reseller',
    prevTier: null,
    rulesNotes: [
      'Membayar Full sesuai harga HET saat belanja (tanpa diskon 15% langsung).',
      'Komisi penjualan 15% dari omset HET masuk ke gaji bulanan.',
      'Penerimaan gaji bulanan berlangsung serentak di hari yang sama setiap bulannya (setiap tanggal 25).',
      'Kesempatan menjadi Reseller melalui First Order Rp 500.000,- HET ATAU jalur omset akumulasi Rp 800.000,- (omset pribadi min Rp 300.000,- berturut-turut 3 bulan).',
      'Jika target belum tercapai, Marketer TETAP MENJADI MITRA AKTIF (tidak pernah turun level dan tidak pernah keluar dari kemitraan SR12).'
    ]
  },
  reseller: {
    tier: 'reseller',
    name: 'Reseller',
    discountPct: 20,
    firstOrderHet: 500000,
    firstOrderNet: 400000,
    minMonthlyTarget: 500000,
    accum3MonthsTarget: 1500000,
    careerTrackMin: 4000000,
    careerTrackPersonal: 3000000,
    nextTier: 'sub_agen',
    prevTier: 'marketer',
    rulesNotes: [
      'First Order senilai minimal Rp 500.000,- (Rp 400.000,- setelah diskon 20%).',
      'Kesempatan menjadi Reseller melalui jalur omset minimal Rp 800.000,- dengan omset pribadi minimal Rp 300.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Rp 500.000,- per bulan ATAU akumulasi minimal Rp 1.500.000,- selama 3 bulan.',
      'Reseller yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Marketer).'
    ]
  },
  sub_agen: {
    tier: 'sub_agen',
    name: 'Sub Agen',
    discountPct: 30,
    firstOrderHet: 5000000,
    firstOrderNet: 3500000,
    minMonthlyTarget: 4000000,
    accum3MonthsTarget: 12000000,
    careerTrackMin: 15000000,
    careerTrackPersonal: 10000000,
    nextTier: 'agen',
    prevTier: 'reseller',
    rulesNotes: [
      'First Order senilai minimal Rp 5.000.000,- (Rp 3.500.000,- setelah diskon 30%).',
      'Kesempatan menjadi Sub Agent melalui jalur omset minimal Rp 4.000.000,- dengan omset pribadi minimal Rp 3.000.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Rp 4.000.000,- per bulan ATAU akumulasi omset minimal Rp 12.000.000,- selama 3 bulan.',
      'Sub Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Reseller).'
    ]
  },
  agen: {
    tier: 'agen',
    name: 'Agen',
    discountPct: 40,
    firstOrderHet: 25000000,
    firstOrderNet: 15000000,
    minMonthlyTarget: 15000000,
    accum3MonthsTarget: 45000000,
    careerTrackMin: 30000000,
    careerTrackPersonal: 20000000,
    nextTier: null, // Level Distributor memerlukan pengajuan langsung ke pusat PT SR12
    prevTier: 'sub_agen',
    rulesNotes: [
      'First Order kepada Distributor/Agent senilai minimal Rp 25.000.000,- (Rp 15.000.000,- setelah diskon 40%).',
      'Kesempatan menjadi Agent melalui jalur omset minimal Rp 15.000.000,- dengan omset pribadi minimal Rp 10.000.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Agent sebesar Rp 15.000.000,- per bulan ATAU akumulasi omset minimal Rp 45.000.000,- selama 3 bulan.',
      'Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Sub Agen).'
    ]
  },
  distributor: {
    tier: 'distributor',
    name: 'Distributor',
    discountPct: 50,
    firstOrderHet: 50000000,
    firstOrderNet: 25000000,
    minMonthlyTarget: 30000000,
    accum3MonthsTarget: 90000000,
    careerTrackMin: 0,
    careerTrackPersonal: 0,
    nextTier: null,
    prevTier: 'agen',
    rulesNotes: [
      'Tingkat kemitraan tertinggi dengan hak pasokan wilayah dan diskon 50%.',
      'Omset minimal Rp 30.000.000,- per bulan atau Rp 90.000.000,- akumulasi 3 bulan.'
    ]
  }
};

export interface MitraRankEvaluation {
  status: 'promotable' | 'safe' | 'warning';
  progressMonthlyPct: number;
  progress3MonthsPct: number;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  shortMessage: string;
  remainingMonthlyMin: number;
  remaining3MonthsMin: number;
  remainingToPromo: number;
  currentTierConfig: TierTargetConfig;
  nextTierConfig: TierTargetConfig | null;
  prevTierConfig: TierTargetConfig | null;
}

export interface EvaluateMitraOptions {
  storeTier?: PartnerTier;
  mitra?: MitraDownline;
  maxSingleOrderHet?: number;
}

/**
 * Mengevaluasi capaian belanja mitra (dalam nilai Omset HET) berdasarkan 2026 Rules Kemitraan SR12
 * @param tier Tingkat kemitraan saat ini
 * @param spentAmount Akumulasi omset HET periode 90 hari / 3 bulan berjalan
 * @param options Konteks level toko pemilik, data jatuh tempo mitra, dan nilai order tunggal terbesar
 */
export function evaluateMitraRank(
  tier: PartnerTier,
  spentAmount: number,
  options?: EvaluateMitraOptions
): MitraRankEvaluation {
  const cfg = SR12_TIER_TARGETS[tier] || SR12_TIER_TARGETS.reseller;
  const rawNextCfg = cfg.nextTier ? SR12_TIER_TARGETS[cfg.nextTier] : null;
  const allowedTiers = getAllowedDownlineTiers(options?.storeTier || 'distributor');
  // Promosi hanya ditampilkan jika jenjang berikutnya memang dapat dibina di bawah level toko pemilik
  const nextCfg = rawNextCfg && allowedTiers.includes(rawNextCfg.tier) ? rawNextCfg : null;
  const prevCfg = cfg.prevTier ? SR12_TIER_TARGETS[cfg.prevTier] : null;
  const maxSingleHet = options?.maxSingleOrderHet || 0;

  // Aturan Khusus Non Mitra (Pelanggan Langganan Tetap / Customer):
  if (tier === 'konsumen') {
    const minOfferTarget = 500000;
    const isPromotable = spentAmount >= minOfferTarget;
    const progressPct = Math.min(100, Math.round((spentAmount / minOfferTarget) * 100));
    return {
      status: isPromotable ? 'promotable' : 'safe',
      progressMonthlyPct: progressPct,
      progress3MonthsPct: progressPct,
      badgeLabel: isPromotable ? '🎁 Layak Ditawari Mitra' : '🛍️ Pelanggan Tetap (Non-Mitra)',
      badgeColor: isPromotable ? '#10b981' : '#a855f7',
      badgeBg: isPromotable ? 'rgba(16, 185, 129, 0.18)' : 'rgba(168, 85, 247, 0.18)',
      shortMessage: isPromotable
        ? `Total belanja Rp ${spentAmount.toLocaleString('id-ID')} melampaui Rp 500rb. Sangat potensial ditawari gabung Reseller (Diskon 20%) atau Marketer (Komisi 15%)!`
        : `Customer aktif tanpa beban target omset. Hubungi secara berkala untuk kirim promo produk terbaru via WhatsApp.`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo: Math.max(0, minOfferTarget - spentAmount),
      currentTierConfig: {
        ...cfg,
        name: 'Non Mitra (Langganan)',
        discountPct: 0
      },
      nextTierConfig: allowedTiers.includes('reseller') ? SR12_TIER_TARGETS.reseller : null,
      prevTierConfig: null
    };
  }

  // Aturan Khusus Marketer:
  // Naik ke Reseller via First Order 1x order >= Rp 500.000 HET ATAU jalur omset akumulasi >= Rp 800.000 HET.
  // Jika belum tercapai, TETAP AMAN sebagai Marketer Aktif (tidak pernah turun level / keluar).
  if (tier === 'marketer') {
    const firstOrderResellerHet = 500000;
    const accumTrackResellerHet = 800000;
    const qualifiedViaFo = maxSingleHet >= firstOrderResellerHet;
    const qualifiedViaAccum = spentAmount >= accumTrackResellerHet;

    if (nextCfg && (qualifiedViaFo || qualifiedViaAccum)) {
      return {
        status: 'promotable',
        progressMonthlyPct: 100,
        progress3MonthsPct: 100,
        badgeLabel: '🚀 Layak Naik ke Reseller',
        badgeColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        shortMessage: qualifiedViaFo
          ? `Order Rp ${maxSingleHet.toLocaleString('id-ID')} memenuhi syarat First Order Reseller (min Rp 500.000 HET). Berhak promosi ke Reseller (Diskon 20%)!`
          : `Akumulasi omset Rp ${spentAmount.toLocaleString('id-ID')} melampaui syarat jalur omset Reseller (Rp 800.000 HET). Berhak promosi ke Reseller (Diskon 20%)!`,
        remainingMonthlyMin: 0,
        remaining3MonthsMin: 0,
        remainingToPromo: 0,
        currentTierConfig: cfg,
        nextTierConfig: nextCfg,
        prevTierConfig: null
      };
    }

    const remainingToPromo = nextCfg ? Math.max(0, accumTrackResellerHet - spentAmount) : 0;
    const progressPct = Math.min(100, Math.round((spentAmount / accumTrackResellerHet) * 100));
    return {
      status: 'safe',
      progressMonthlyPct: progressPct,
      progress3MonthsPct: progressPct,
      badgeLabel: '⭐ Tetap Marketer Aktif (Komisi 15%)',
      badgeColor: '#0ea5e9',
      badgeBg: 'rgba(14, 165, 233, 0.18)',
      shortMessage: nextCfg
        ? `Target Reseller belum tercapai (kurang Rp ${remainingToPromo.toLocaleString('id-ID')} jalur akumulasi Rp 800rb atau 1x order FO Rp 500rb). Status tetap aman tanpa risiko turun level.`
        : `Status Marketer Resmi aktif (komisi 15% cair serentak tgl 25 setiap bulan).`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: null
    };
  }

  // Ambang promosi naik tingkat (menggunakan First Order HET tingkat berikutnya bila masih di bawah level toko)
  const promoTarget = nextCfg ? (nextCfg.firstOrderHet || nextCfg.minMonthlyTarget) : 0;

  const remainingMonthlyMin = Math.max(0, cfg.minMonthlyTarget - spentAmount);
  const remaining3MonthsMin = Math.max(0, cfg.accum3MonthsTarget - spentAmount);
  const remainingToPromo = promoTarget > 0 ? Math.max(0, promoTarget - spentAmount) : 0;

  const progressMonthlyPct = cfg.minMonthlyTarget > 0 
    ? Math.min(100, Math.round((spentAmount / cfg.minMonthlyTarget) * 100)) 
    : 100;

  const progress3MonthsPct = cfg.accum3MonthsTarget > 0
    ? Math.min(100, Math.round((spentAmount / cfg.accum3MonthsTarget) * 100))
    : 100;

  const daysRemaining = options?.mitra ? getMitraDueDateInfo(options.mitra).daysRemaining : 90;

  // 1. PROMOTABLE: Capaian belanja memenuhi syarat promosi naik tingkat (sekaligus tidak melebihi batas level toko)
  if (nextCfg && promoTarget > 0 && (spentAmount >= promoTarget || maxSingleHet >= promoTarget)) {
    return {
      status: 'promotable',
      progressMonthlyPct: 100,
      progress3MonthsPct: 100,
      badgeLabel: `🚀 Layak Naik ke ${nextCfg.name}`,
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      shortMessage: `Omset Rp ${Math.max(spentAmount, maxSingleHet).toLocaleString('id-ID')} HET melampaui syarat First Order ${nextCfg.name}!`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo: 0,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 2. Mitra Baru Terdaftar (0 omset & sisa masa evaluasi masih > 30 hari)
  if (spentAmount === 0 && daysRemaining > 30) {
    return {
      status: 'safe',
      progressMonthlyPct: 0,
      progress3MonthsPct: 0,
      badgeLabel: `🟢 Mitra Baru (${cfg.name})`,
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      shortMessage: `Mitra aktif terdaftar resmi sebagai ${cfg.name} (Diskon ${cfg.discountPct}%). Target minimal Rp ${cfg.minMonthlyTarget.toLocaleString('id-ID')}/bln.`,
      remainingMonthlyMin: cfg.minMonthlyTarget,
      remaining3MonthsMin: cfg.accum3MonthsTarget,
      remainingToPromo: promoTarget,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 3. WARNING: Peringatan turun level ke tier bawahnya
  // Terpicu jika omset di bawah minimal bulanan, ATAU memasuki bulan terakhir/jatuh tempo (sisa <= 30 hari) tapi akumulasi 3 bulan belum terpenuhi
  const belowMonthlyMin = cfg.minMonthlyTarget > 0 && spentAmount < cfg.minMonthlyTarget;
  const approachingDueBelow3Months = cfg.accum3MonthsTarget > 0 && spentAmount < cfg.accum3MonthsTarget && daysRemaining <= 30;

  if (belowMonthlyMin || approachingDueBelow3Months) {
    const neededAmt = belowMonthlyMin ? remainingMonthlyMin : remaining3MonthsMin;
    const reasonText = belowMonthlyMin
      ? `Omset HET kurang Rp ${neededAmt.toLocaleString('id-ID')} dari target min Rp ${cfg.minMonthlyTarget.toLocaleString('id-ID')}/bln.`
      : `Sisa ${Math.max(0, daysRemaining)} hari jelang bulan ke-4! Akumulasi kurang Rp ${neededAmt.toLocaleString('id-ID')} dari target 3 bln (Rp ${cfg.accum3MonthsTarget.toLocaleString('id-ID')}).`;

    return {
      status: 'warning',
      progressMonthlyPct,
      progress3MonthsPct,
      badgeLabel: `⚠️ Peringatan Turun ke ${prevCfg?.name || 'Bawah'}`,
      badgeColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.18)',
      shortMessage: `${reasonText} Terancam turun level di bulan ke-4.`,
      remainingMonthlyMin,
      remaining3MonthsMin,
      remainingToPromo,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 4. SAFE: Target bulanan atau 3 bulanan tercapai aman
  const isFull3MonthsMet = cfg.accum3MonthsTarget > 0 && spentAmount >= cfg.accum3MonthsTarget;
  return {
    status: 'safe',
    progressMonthlyPct: 100,
    progress3MonthsPct,
    badgeLabel: isFull3MonthsMet
      ? `🟢 Target 3 Bln Aman (${progress3MonthsPct}%)`
      : `🟢 Target Bulan Aman (${progress3MonthsPct}% 3 Bln)`,
    badgeColor: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.18)',
    shortMessage: nextCfg && promoTarget > 0
      ? `Kurang Rp ${remainingToPromo.toLocaleString('id-ID')} HET lagi untuk promosi naik ke ${nextCfg.name}.`
      : isFull3MonthsMet
      ? `Target akumulasi 3 bulan tercapai aman!`
      : `Target minimal bulanan tercapai! Sisa Rp ${remaining3MonthsMin.toLocaleString('id-ID')} lagi untuk melengkapi akumulasi 3 bulan.`,
    remainingMonthlyMin: 0,
    remaining3MonthsMin,
    remainingToPromo,
    currentTierConfig: cfg,
    nextTierConfig: nextCfg,
    prevTierConfig: prevCfg
  };
}

export interface MitraDueDateInfo {
  isMarketer: boolean;
  isCustomer: boolean;
  dueDateStr: string;            // e.g. "15 Nov 2026" or "Tgl 25 Setiap Bulan"
  rawDate: string;               // e.g. "2026-11-15"
  daysRemaining: number;         // e.g. 23
  status: 'safe' | 'warning' | 'expired' | 'monthly_fixed';
  badgeLabel: string;            // e.g. "📅 Sisa 23 hr", "⚠️ Sisa 8 hr", "🔴 Lewat Jatuh Tempo", "💼 Gajian Tgl 25"
  badgeColor: string;
  badgeBg: string;
  displayLine: string;           // "Jatuh Tempo: 15 Nov 2026 (Sisa 23 hari)"
}

/**
 * Menghitung tanggal batas akhir perhitungan penghasilan / evaluasi target omset mitra
 * Khusus Marketer menerima gaji serentak di hari yang sama setiap bulannya (Tanggal 25)
 */
export function getMitraDueDateInfo(mitra: MitraDownline): MitraDueDateInfo {
  const now = new Date();

  if (mitra.tier === 'konsumen') {
    return {
      isMarketer: false,
      isCustomer: true,
      dueDateStr: 'Bebas Target',
      rawDate: '',
      daysRemaining: 999,
      status: 'safe',
      badgeLabel: '🛍️ Bebas Target',
      badgeColor: '#c084fc',
      badgeBg: 'rgba(168, 85, 247, 0.15)',
      displayLine: 'Pelanggan Langganan Tetap (Bebas Beban Target)'
    };
  }

  if (mitra.tier === 'marketer') {
    // Marketer menerima gaji serentak di hari yang sama setiap bulannya (Tanggal 25)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let payDate = new Date(currentYear, currentMonth, 25);
    if (currentDay > 25) {
      payDate = new Date(currentYear, currentMonth + 1, 25);
    }

    const diffTime = payDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formattedPayDate = `25 ${months[payDate.getMonth()]} ${payDate.getFullYear()}`;

    return {
      isMarketer: true,
      isCustomer: false,
      dueDateStr: 'Tgl 25 Setiap Bulan',
      rawDate: payDate.toISOString().split('T')[0],
      daysRemaining,
      status: 'monthly_fixed',
      badgeLabel: `💼 Gajian Tgl 25 (${daysRemaining === 0 ? 'Hari Ini!' : `Sisa ${daysRemaining} hr`})`,
      badgeColor: '#818cf8',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      displayLine: `Gaji Serentak: ${formattedPayDate} (${daysRemaining === 0 ? 'Hari Ini' : `Sisa ${daysRemaining} hari`})`
    };
  }

  // Reseller, Sub Agen, Agen, Distributor: Jatuh tempo evaluasi target masing-masing mitra
  let rawDueDate = mitra.evaluationDueDate;
  if (!rawDueDate) {
    if (mitra.qualificationDate) {
      const qDate = new Date(mitra.qualificationDate);
      qDate.setDate(qDate.getDate() + 90);
      rawDueDate = qDate.toISOString().split('T')[0];
    } else {
      const def = new Date(now);
      def.setDate(def.getDate() + 60);
      rawDueDate = def.toISOString().split('T')[0];
    }
  }

  const dParts = rawDueDate.split('-');
  const dueDateObj = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]), 23, 59, 59);
  const diffTime = dueDateObj.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedDueDate = `${parseInt(dParts[2])} ${months[parseInt(dParts[1]) - 1]} ${dParts[0]}`;

  if (daysRemaining < 0) {
    const overdue = Math.abs(daysRemaining);
    return {
      isMarketer: false,
      isCustomer: false,
      dueDateStr: formattedDueDate,
      rawDate: rawDueDate,
      daysRemaining,
      status: 'expired',
      badgeLabel: `🔴 Lewat Jatuh Tempo (${overdue} hr lalu)`,
      badgeColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.18)',
      displayLine: `Batas Evaluasi: ${formattedDueDate} (Lewat ${overdue} hari)`
    };
  }

  if (daysRemaining <= 14) {
    return {
      isMarketer: false,
      isCustomer: false,
      dueDateStr: formattedDueDate,
      rawDate: rawDueDate,
      daysRemaining,
      status: 'warning',
      badgeLabel: `⚠️ Jatuh Tempo: Sisa ${daysRemaining} hr`,
      badgeColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.18)',
      displayLine: `Jatuh Tempo: ${formattedDueDate} (Sisa ${daysRemaining} hari!)`
    };
  }

  return {
    isMarketer: false,
    isCustomer: false,
    dueDateStr: formattedDueDate,
    rawDate: rawDueDate,
    daysRemaining,
    status: 'safe',
    badgeLabel: `📅 Sisa ${daysRemaining} hr`,
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    displayLine: `Jatuh Tempo: ${formattedDueDate} (Sisa ${daysRemaining} hari)`
  };
}

/**
 * Generate WhatsApp message URL for motivational reminder
 */
export function generateMitraWaReminderUrl(
  mitra: MitraDownline,
  storeName: string,
  evaluation: MitraRankEvaluation
): string {
  const cleanPhone = mitra.phone.replace(/[^0-9]/g, '');
  const phoneTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const dueDateInfo = getMitraDueDateInfo(mitra);

  let message = '';
  const tierName = evaluation.currentTierConfig.name;
  const spentFormatted = `Rp ${mitra.accumulatedSpent90Days.toLocaleString('id-ID')}`;

  // Kasus Khusus: Non Mitra / Langganan Tetap (Kirim Promo & Tawaran Gabung)
  if (mitra.tier === 'konsumen') {
    if (evaluation.status === 'promotable') {
      message = `Halo Kak *${mitra.name}*! 🌿✨\n\n` +
        `Salam hangat dari *${storeName}* (Mitra Resmi SR12 Skin Care).\n` +
        `Terima kasih banyak sudah menjadi pelanggan setia kami (total belanja Kakak tercatat: *${spentFormatted}*)! 🎉\n\n` +
        `💡 *KABAR BAIK & PELUANG PENGHEMATAN:*\n` +
        `Karena Kakak sering berbelanja produk SR12, Kakak sudah sangat memenuhi syarat untuk bergabung menjadi *Mitra Resmi SR12* (Marketer / Reseller)!\n\n` +
        `Keuntungan jika Kakak bergabung:\n` +
        `✅ Beli produk untuk dipakai sendiri langsung dapat diskon hingga 20%\n` +
        `✅ Bisa jualan ke teman / keluarga dan dapat keuntungan bersih langsung\n` +
        `✅ Tanpa modal besar, langsung kami bimbing cara promosinya\n\n` +
        `Apakah Kakak berminat kami daftarkan gratis hari ini? Silakan balas pesan ini ya Kak. Terima kasih! 🙏✨`;
    } else {
      message = `Halo Kak *${mitra.name}*! 🌿✨\n\n` +
        `Salam hangat dari *${storeName}* (Mitra Resmi SR12 Skin Care).\n` +
        `Terima kasih telah berbelanja di toko kami (total belanja: *${spentFormatted}*).\n\n` +
        `🎁 *PROMO KHUSUS PELANGGAN SETIA HARI INI:*\n` +
        `Kami sedang ada promo menarik & bonus untuk produk perawatan kecantikan dan herbal best seller SR12 (Deodorant Spray, Facial Wash, Manjakani, Sunscreen, Salimah Slim, & Paket Glowing)!\n\n` +
        `Apakah stok produk perawatan Kakak di rumah sudah ada yang mulai habis dan ingin di-restock hari ini? Kami siap melayani dan kirimkan cepat untuk Kakak ya! 😊🙏`;
    }
    return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
  }

  // Kasus Khusus: Marketer
  if (mitra.tier === 'marketer') {
    if (evaluation.status === 'promotable') {
      message = `Halo Kak *${mitra.name}* (Mitra Marketer SR12 ${mitra.partnerCode})! 🎉🌿\n\n` +
        `Kabar gembira dari *${storeName}*!\n` +
        `Akumulasi penjualan Kakak tercatat sebesar *${spentFormatted}* dan telah *MEMENUHI SYARAT NAIK LEVEL MENJADI RESELLER RESMI*! 🚀\n\n` +
        `Keuntungan naik menjadi Reseller:\n` +
        `✅ Langsung dapat DISKON 20% di muka saat belanja (bukan komisi bulanan lagi)\n` +
        `✅ Margin keuntungan bersih per produk jauh lebih besar\n` +
        `✅ Berhak membina tim marketer sendiri\n\n` +
        `Silakan konfirmasi ke kami untuk pengesahan posisi Reseller Kakak ya. Selamat atas kerja kerasnya! 🙏✨`;
    } else {
      message = `Halo Kak *${mitra.name}* (Mitra Marketer SR12 ${mitra.partnerCode})! 🌿\n\n` +
        `Semangat terus berbisnis bersama *${storeName}*.\n` +
        `Akumulasi penjualan Kakak saat ini tercatat *${spentFormatted}*.\n` +
        `🗓️ *Jadwal Pembayaran Gaji Bulanan:* Serentak tanggal 25 setiap bulan (${dueDateInfo.displayLine}).\n\n` +
        `💡 *PELUANG NAIK LEVEL MENJADI RESELLER:*\n` +
        `Sebagai Marketer, Kakak punya kesempatan emas untuk naik tingkat menjadi *RESELLER RESMI SR12*:\n` +
        `• Cukup capai 1x order First Order Rp 500.000,- HET ATAU akumulasi Rp 800.000,- HET.\n` +
        `• Dengan menjadi Reseller, Kakak langsung mendapatkan DISKON 20% di muka saat belanja!\n\n` +
        `Kurang *Rp ${evaluation.remainingToPromo.toLocaleString('id-ID')}* HET lagi untuk meraih posisi Reseller via jalur akumulasi. Jangan khawatir, jika belum tercapai Kakak tetap aman sebagai Marketer resmi SR12 tanpa ada risiko turun level atau keluar.\n\n` +
        `Yuk bagikan katalog & promo produk SR12 hari ini! Hubungi kami jika butuh bantuan stok atau info produk ya. Semangat terus! 🔥`;
    }
    return `https://api.whatsapp.com/send?phone=${phoneTarget}&text=${encodeURIComponent(message)}`;
  }

  if (evaluation.status === 'promotable') {
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode})! 🎉🌿\n\n` +
      `Kabar gembira dari *${storeName}*!\n` +
      `Akumulasi omset HET Kakak tercatat sebesar *${spentFormatted}* dan telah *MEMENUHI SYARAT 2026 PROMOSI NAIK LEVEL KE ${evaluation.nextTierConfig?.name.toUpperCase()}*! 🚀\n\n` +
      `Dengan naik level menjadi *${evaluation.nextTierConfig?.name}*:\n` +
      `✅ Diskon kemitraan meningkat jadi *${evaluation.nextTierConfig?.discountPct}%*\n` +
      `✅ Margin keuntungan per produk lebih tinggi\n` +
      `✅ Berhak membina tim reseller & marketer sendiri\n\n` +
      `Silakan konfirmasi ke kami untuk pengesahan level baru Kakak ya. Selamat atas pencapaian luar biasanya! 🙏✨`;
  } else if (evaluation.status === 'warning') {
    const neededAmt = evaluation.remainingMonthlyMin > 0 ? evaluation.remainingMonthlyMin : evaluation.remaining3MonthsMin;
    const sisaTargetStr = `Rp ${neededAmt.toLocaleString('id-ID')}`;
    const target3Bulan = `Rp ${evaluation.currentTierConfig.accum3MonthsTarget.toLocaleString('id-ID')}`;
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode} - ${tierName}) 🌿\n\n` +
      `Salam hangat dari tim *${storeName}*.\n` +
      `Kami ingin menginformasikan akumulasi omset HET Kakak saat ini tercatat *${spentFormatted}*.\n` +
      `🗓️ *Batas Akhir Evaluasi Target (Jatuh Tempo):* *${dueDateInfo.dueDateStr}* (${dueDateInfo.badgeLabel})\n\n` +
      `⚠️ *PENGINGAT ATURAN KEMITRAAN SR12 2026:*\n` +
      `Sesuai aturan resmi SR12 CK SWORD:\n` +
      `• Target omset HET minimal status *${tierName}* adalah Rp ${evaluation.currentTierConfig.minMonthlyTarget.toLocaleString('id-ID')}/bulan (atau akumulasi ${target3Bulan} selama 3 bulan).\n` +
      `• Mitra yang tidak mencapai akumulasi minimal 3 bulan sebelum tanggal jatuh tempo (*${dueDateInfo.dueDateStr}*), status mitra akan diturunkan ke tingkatan di bawahnya (${evaluation.prevTierConfig?.name || 'Marketer'}).\n\n` +
      `Kakak memerlukan omset HET sebesar *${sisaTargetStr}* lagi sebelum batas waktu tersebut agar posisi Kakak tetap aman dan diskon *${evaluation.currentTierConfig.discountPct}%* tetap aktif! 💪\n\n` +
      `Yuk segera restock produk best seller (Deodorant, Manjakani, Salimah, Sunscreen, Paket Glowing) hari ini. Hubungi kami untuk bantu proses order ya Kak. Semangat terus! 🔥`;
  } else {
    // Safe
    const sisaPromo = evaluation.nextTierConfig && evaluation.remainingToPromo > 0 
      ? `Tinggal *Rp ${evaluation.remainingToPromo.toLocaleString('id-ID')}* HET lagi untuk promosi ke *${evaluation.nextTierConfig.name}* (Diskon ${evaluation.nextTierConfig.discountPct}%)!` 
      : 'Pertahankan prestasi hebat ini!';

    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode}) 🌿\n\n` +
      `Terima kasih atas keaktifan berbelanja di *${storeName}*.\n` +
      `Akumulasi omset HET Kakak saat ini sebesar *${spentFormatted}* (Status: Target Aman 🟢).\n` +
      `🗓️ *Batas Waktu Periode Evaluasi Target:* *${dueDateInfo.dueDateStr}* (${dueDateInfo.badgeLabel})\n\n` +
      `${sisaPromo}\n\n` +
      `Jika butuh tambahan materi promosi atau stok cepat, silakan kabari kami ya. Sukses selalu untuk bisnis Kakak! 🙏✨`;
  }

  return `https://api.whatsapp.com/send?phone=${phoneTarget}&text=${encodeURIComponent(message)}`;
}
