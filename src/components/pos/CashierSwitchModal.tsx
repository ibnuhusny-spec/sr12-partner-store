import React, { useState, useEffect, useRef } from 'react';
import { CashierOperator } from '../../types';
import { getStoreCashiers, saveStoreCashiers, setActiveCashier } from '../../services/posService';
import { X, Users, Lock, KeyRound, Plus, Trash2, Edit2, Check, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

interface CashierSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeOwnerName: string;
  storeAdminPin: string;
  activeCashier: CashierOperator;
  onCashierChanged: (cashier: CashierOperator) => void;
}

const ROLE_LABELS: Record<CashierOperator['role'], { label: string; color: string; bg: string }> = {
  spv: { label: 'Pemilik / SPV', color: '#34d399', bg: 'rgba(16, 185, 129, 0.16)' },
  kasir: { label: 'Kasir', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)' },
  gudang: { label: 'Admin Gudang', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.16)' }
};

/**
 * Modal untuk pergantian shift kasir (dengan verifikasi PIN) dan pengelolaan daftar kasir toko.
 */
export const CashierSwitchModal: React.FC<CashierSwitchModalProps> = ({
  isOpen,
  onClose,
  storeSlug,
  storeOwnerName,
  storeAdminPin,
  activeCashier,
  onCashierChanged
}) => {
  const [modalTab, setModalTab] = useState<'switch' | 'manage'>('switch');
  const [cashiers, setCashiers] = useState<CashierOperator[]>([]);

  // Switch shift state
  const [selectedTarget, setSelectedTarget] = useState<CashierOperator | null>(null);
  const [switchPinInput, setSwitchPinInput] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [showSwitchPin, setShowSwitchPin] = useState(false);

  // Admin unlock state for managing cashiers
  const [isManageUnlocked, setIsManageUnlocked] = useState(false);
  const [adminUnlockPin, setAdminUnlockPin] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState('');

  // Add / Edit cashier form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<CashierOperator['role']>('kasir');
  const [formPin, setFormPin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [revealedPinIds, setRevealedPinIds] = useState<Record<string, boolean>>({});

  // Proteksi agar seleksi teks di dalam modal tidak menutup modal saat kursor keluar overlay
  const isMouseDownOnOverlay = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const loaded = getStoreCashiers(storeSlug, storeOwnerName, storeAdminPin);
    setCashiers(loaded);
    setModalTab('switch');
    setSelectedTarget(null);
    setSwitchPinInput('');
    setSwitchError('');
    setIsManageUnlocked(false);
    setAdminUnlockPin('');
    setAdminUnlockError('');
    resetStaffForm();
  }, [isOpen, storeSlug, storeOwnerName, storeAdminPin]);

  const resetStaffForm = () => {
    setEditingId(null);
    setFormName('');
    setFormRole('kasir');
    setFormPin('');
    setFormPhone('');
    setFormError('');
  };

  if (!isOpen) return null;

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownOnOverlay.current = (e.target === e.currentTarget);
  };

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
    }
    isMouseDownOnOverlay.current = false;
  };

  const handleVerifySwitchPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    if (switchPinInput.trim() !== selectedTarget.pin) {
      setSwitchError(`PIN Kasir salah untuk ${selectedTarget.name}.`);
      return;
    }

    setActiveCashier(storeSlug, selectedTarget);
    onCashierChanged(selectedTarget);
    onClose();
  };

  const handleUnlockManage = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedAdminPin = (storeAdminPin || '1234').trim();
    if (adminUnlockPin.trim() !== expectedAdminPin) {
      setAdminUnlockError('PIN Admin Toko tidak cocok.');
      return;
    }
    setAdminUnlockError('');
    setIsManageUnlocked(true);
  };

  const handleStartEditStaff = (staff: CashierOperator) => {
    setEditingId(staff.id);
    setFormName(staff.name);
    setFormRole(staff.role);
    setFormPin(staff.pin);
    setFormPhone(staff.phone || '');
    setFormError('');
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    const trimmedPin = formPin.trim();

    if (!trimmedName) {
      setFormError('Nama kasir wajib diisi.');
      return;
    }
    if (trimmedPin.length < 4 || trimmedPin.length > 6) {
      setFormError('PIN kasir harus 4 sampai 6 karakter/angka.');
      return;
    }

    let nextList: CashierOperator[];
    if (editingId) {
      nextList = cashiers.map(c =>
        c.id === editingId
          ? { ...c, name: trimmedName, role: formRole, pin: trimmedPin, phone: formPhone.trim() }
          : c
      );
    } else {
      const newCashier: CashierOperator = {
        id: `KASIR-${Date.now()}`,
        name: trimmedName,
        role: formRole,
        pin: trimmedPin,
        phone: formPhone.trim()
      };
      nextList = [...cashiers, newCashier];
    }

    saveStoreCashiers(storeSlug, nextList);
    setCashiers(nextList);

    // Sinkronkan jika yang diedit adalah kasir aktif saat ini
    const updatedActive = nextList.find(c => c.id === activeCashier.id);
    if (updatedActive) {
      setActiveCashier(storeSlug, updatedActive);
      onCashierChanged(updatedActive);
    }

    resetStaffForm();
  };

  const handleDeleteStaff = (staff: CashierOperator) => {
    if (cashiers.length <= 1) {
      alert('Minimal harus ada 1 kasir aktif di toko.');
      return;
    }
    if (!window.confirm(`Hapus kasir "${staff.name}" dari daftar operator toko?`)) return;

    const nextList = cashiers.filter(c => c.id !== staff.id);
    saveStoreCashiers(storeSlug, nextList);
    setCashiers(nextList);

    if (staff.id === activeCashier.id && nextList.length > 0) {
      setActiveCashier(storeSlug, nextList[0]);
      onCashierChanged(nextList[0]);
    }
    if (editingId === staff.id) {
      resetStaffForm();
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-content"
        onMouseDown={(e) => {
          e.stopPropagation();
          isMouseDownOnOverlay.current = false;
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          border: '1.5px solid #334155',
          overflow: 'hidden',
          boxShadow: '0 24px 50px rgba(0,0,0,0.75)'
        }}
      >
        {/* Header */}
        <div style={{ background: '#1e293b', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900 }}>Ganti Shift &amp; Kelola Kasir</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Kasir Aktif: <b style={{ color: '#34d399' }}>{activeCashier.name}</b>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0b1120', borderBottom: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setModalTab('switch')}
            style={{
              padding: '11px 12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: modalTab === 'switch' ? '#1e293b' : 'transparent',
              color: modalTab === 'switch' ? '#38bdf8' : '#94a3b8',
              borderBottom: modalTab === 'switch' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <KeyRound size={15} />
            <span>Ganti Kasir (PIN)</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('manage')}
            style={{
              padding: '11px 12px',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: modalTab === 'manage' ? '#1e293b' : 'transparent',
              color: modalTab === 'manage' ? '#34d399' : '#94a3b8',
              borderBottom: modalTab === 'manage' ? '2.5px solid #34d399' : '2.5px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Users size={15} />
            <span>Kelola Daftar Kasir ({cashiers.length})</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {modalTab === 'switch' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Pilih nama operator/kasir lalu masukkan <b>PIN Kasir</b> untuk berpindah shift:
              </div>

              {/* Cashier Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cashiers.map(c => {
                  const isCurrent = c.id === activeCashier.id;
                  const isSelected = selectedTarget?.id === c.id;
                  const roleMeta = ROLE_LABELS[c.role] || ROLE_LABELS.kasir;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedTarget(c);
                        setSwitchPinInput('');
                        setSwitchError('');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.14)' : '#1e293b',
                        border: isSelected
                          ? '1.5px solid #38bdf8'
                          : isCurrent
                          ? '1.5px solid rgba(52, 211, 153, 0.5)'
                          : '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{c.name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.18)', padding: '2px 6px', borderRadius: '999px' }}>
                              SEDANG AKTIF
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: roleMeta.color, background: roleMeta.bg, padding: '2px 7px', borderRadius: '6px' }}>
                            {roleMeta.label}
                          </span>
                          {c.phone && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.phone}</span>}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#94a3b8' }}>
                        {isSelected ? 'Masukkan PIN ↓' : 'Pilih'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* PIN Input Box */}
              {selectedTarget && (
                <form
                  onSubmit={handleVerifySwitchPin}
                  style={{
                    marginTop: '4px',
                    background: '#1e293b',
                    border: '1.5px solid #38bdf8',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} color="#38bdf8" />
                    <span>Masukkan PIN untuk {selectedTarget.name}:</span>
                  </label>

                  <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showSwitchPin ? 'text' : 'password'}
                        maxLength={6}
                        autoFocus
                        value={switchPinInput}
                        onChange={(e) => {
                          setSwitchPinInput(e.target.value);
                          setSwitchError('');
                        }}
                        placeholder="Ketik PIN (4-6 digit)..."
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 12px',
                          borderRadius: '8px',
                          background: '#0f172a',
                          border: '1px solid #475569',
                          color: '#ffffff',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          letterSpacing: '3px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSwitchPin(!showSwitchPin)}
                        style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        {showSwitchPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Check size={16} />
                      <span>Masuk Shift</span>
                    </button>
                  </div>

                  {switchError && (
                    <div style={{ fontSize: '0.76rem', color: '#f87171', fontWeight: 700 }}>
                      {switchError}
                    </div>
                  )}
                </form>
              )}

              {cashiers.length === 1 && (
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(148, 163, 184, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px dashed #334155' }}>
                  Ingin menambahkan karyawan/kasir lain? Buka tab <b>Kelola Daftar Kasir</b> di atas.
                </div>
              )}
            </div>
          ) : !isManageUnlocked ? (
            /* Admin PIN Gate before modifying cashiers & PINs */
            <form
              onSubmit={handleUnlockManage}
              style={{
                background: '#1e293b',
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Verifikasi Pemilik / Admin Toko</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Masukkan <b>PIN Cepat Kasir / Admin Toko</b> untuk menambah, mengubah, atau menghapus kasir.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={adminUnlockPin}
                  onChange={(e) => {
                    setAdminUnlockPin(e.target.value);
                    setAdminUnlockError('');
                  }}
                  placeholder="PIN Admin Toko..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '3px',
                    textAlign: 'center'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Buka Kunci
                </button>
              </div>

              {adminUnlockError && (
                <div style={{ fontSize: '0.76rem', color: '#f87171', fontWeight: 700 }}>{adminUnlockError}</div>
              )}

              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                * PIN Admin Toko dapat dilihat atau diubah di tab <b>Banner &amp; Profil Toko</b>.
              </div>
            </form>
          ) : (
            /* Staff List & Add/Edit Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cashiers.map(c => {
                  const roleMeta = ROLE_LABELS[c.role] || ROLE_LABELS.kasir;
                  const isPinShown = !!revealedPinIds[c.id];
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>{c.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: roleMeta.color, background: roleMeta.bg, padding: '1px 6px', borderRadius: '5px' }}>
                            {roleMeta.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPinIds(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                          >
                            <span>PIN: <b>{isPinShown ? c.pin : '••••'}</b></span>
                            {isPinShown ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditStaff(c)}
                          title="Edit kasir / ubah PIN"
                          style={{ background: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {cashiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(c)}
                            title="Hapus kasir"
                            style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add / Edit Form */}
              <form
                onSubmit={handleSaveStaff}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={15} />
                    <span>{editingId ? 'Edit Data Kasir' : 'Tambah Kasir Baru'}</span>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetStaffForm}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '3px' }}>
                      Nama Kasir *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Rina Putri"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '3px' }}>
                      Jabatan / Peran
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as CashierOperator['role'])}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="kasir">Kasir</option>
                      <option value="gudang">Admin Gudang</option>
                      <option value="spv">Pemilik / Supervisor</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '3px' }}>
                      PIN Shift (4-6 Digit) *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      placeholder="Contoh: 2468"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '2px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '3px' }}>
                      No. WhatsApp (Opsional)
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0812..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {formError && (
                  <div style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 700 }}>{formError}</div>
                )}

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                >
                  {editingId ? 'Simpan Perubahan Kasir' : '+ Tambahkan Kasir'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
