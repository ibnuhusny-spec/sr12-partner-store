import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface StoreAdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const StoreAdminLoginModal: React.FC<StoreAdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const { currentStore, loginStoreAdmin, resetStorePassword } = useApp();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login Form
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotWa, setForgotWa] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  // Password strength checker helper
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 5
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const res = loginStoreAdmin(emailInput, passwordInput);
    if (res.success) {
      onClose();
      onSuccessLogin();
    } else {
      setLoginError(res.message);
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const cleanInputWa = forgotWa.replace(/[^0-9]/g, '');
    const cleanStoreWa = currentStore.storeWaNumber.replace(/[^0-9]/g, '');
    const storeEmail = (currentStore.ownerEmail || 'admin@sr12.co.id').toLowerCase();

    if (forgotEmail.toLowerCase().trim() !== storeEmail) {
      setForgotError(`Email ${forgotEmail} tidak terdaftar pada toko ${currentStore.storeName}!`);
      return;
    }

    if (!cleanStoreWa.endsWith(cleanInputWa.slice(-8))) {
      setForgotError(`Nomor WhatsApp tidak cocok dengan nomor kontak pemilik toko ${currentStore.storeName}!`);
      return;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setForgotStep(2);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (otpInput.trim() !== generatedOtp) {
      setForgotError('Kode OTP Verifikasi salah! Harap cek kembali kode 6 digit.');
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('Password baru minimal 8 karakter!');
      return;
    }

    const strength = getPasswordStrength(newPassword);
    if (strength < 3) {
      setForgotError('Password terlalu lemah! Harap gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol khusus.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    const res = resetStorePassword(forgotEmail, forgotWa, newPassword);
    if (res.success) {
      setForgotSuccess(true);
      setTimeout(() => {
        setForgotSuccess(false);
        setMode('login');
        setForgotStep(1);
        setPasswordInput(newPassword);
        setEmailInput(forgotEmail);
      }, 2500);
    } else {
      setForgotError(res.message);
    }
  };

  const strengthScore = getPasswordStrength(newPassword);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b, #047857)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
              <Lock size={18} color="#fde68a" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>
                {mode === 'login' ? 'Login Kasir / Admin Toko' : 'Pemulihan Akun Toko'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>
                Olsera POS Backoffice &bull; {currentStore.storeName}
              </span>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} style={{ color: '#fff' }}>
            <X size={18} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: LOGIN ADMIN TOKO                                  */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <div style={{ padding: '20px' }}>
            {/* Notice Banner */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.76rem',
              color: '#bae6fd',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <ShieldCheck size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b>Akses Terproteksi:</b> Olsera POS hanya dapat diakses oleh Pemilik Toko <b>{currentStore.storeName}</b> atau kasir berwenang.
              </div>
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} color="#ef4444" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Email Aktif Pemilik Toko:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8' }}>
                    Password Toko:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotEmail(emailInput || currentStore.ownerEmail || '');
                      setForgotWa(currentStore.storeWaNumber || '');
                    }}
                    style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Lupa Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password kuat / PIN"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 38px 9px 36px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '9px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Demo Hint Helper */}
              <div style={{
                background: '#1e293b',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                color: '#94a3b8',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fde68a', fontWeight: 800 }}>
                  <HelpCircle size={12} />
                  <span>Akun Terdaftar Toko Ini:</span>
                </div>
                <div>Email: <b style={{ color: '#fff' }}>{currentStore.ownerEmail || 'admin@sr12.co.id'}</b></div>
                <div>Password: <b style={{ color: '#fff' }}>{currentStore.adminPassword || 'AdminSR12@2026!'}</b> (atau PIN: 1234)</div>
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '11px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <Lock size={16} />
                <span>Buka Olsera POS Backoffice</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: LUPA / RESET PASSWORD MANDIRI                     */}
        {/* ========================================================= */}
        {mode === 'forgot' && (
          <div style={{ padding: '20px' }}>
            {forgotSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800 }}>Password Berhasil Diperbarui!</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Password baru Anda telah tersimpan secara aman. Mengarahkan kembali ke halaman login...
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800 }}>
                    {forgotStep === 1 ? '1. Verifikasi Identitas Pemilik' : '2. Buat Password Baru yang Kuat'}
                  </h4>
                  <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                    {forgotStep === 1
                      ? 'Masukkan email dan WhatsApp resmi toko untuk menerima kode OTP verifikasi mandiri.'
                      : 'Masukkan kode OTP 6 digit dan buat password baru yang memenuhi standar keamanan tinggi.'}
                  </span>
                </div>

                {forgotError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    marginBottom: '12px'
                  }}>
                    {forgotError}
                  </div>
                )}

                {forgotStep === 1 && (
                  <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Email Aktif Terdaftar:
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Email pemilik toko"
                          style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Nomor WhatsApp Toko:
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                        <input
                          type="tel"
                          required
                          value={forgotWa}
                          onChange={(e) => setForgotWa(e.target.value)}
                          placeholder="0812xxxx"
                          style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#334155',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 2,
                          padding: '10px',
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          color: '#fff',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}
                      >
                        Kirim Kode OTP
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Simulated OTP Display Banner */}
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      padding: '10px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>
                        Kode OTP Pemulihan Anda:
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fde68a', letterSpacing: '4px' }}>
                        {generatedOtp}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                        (Gunakan kode 6 digit di atas untuk verifikasi)
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Masukkan Kode OTP 6 Digit:
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Contoh: 123456"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fde68a',
                          fontWeight: 800,
                          fontSize: '1rem',
                          textAlign: 'center',
                          letterSpacing: '3px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Password Baru yang Kuat:
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 karakter (huruf, angka, simbol)"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />

                      {/* Password Strength Meter */}
                      {newPassword && (
                        <div style={{ marginTop: '6px' }}>
                          <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ flex: 1, background: strengthScore >= 1 ? '#ef4444' : '#334155' }} />
                            <div style={{ flex: 1, background: strengthScore >= 2 ? '#f59e0b' : '#334155' }} />
                            <div style={{ flex: 1, background: strengthScore >= 3 ? '#eab308' : '#334155' }} />
                            <div style={{ flex: 1, background: strengthScore >= 4 ? '#10b981' : '#334155' }} />
                            <div style={{ flex: 1, background: strengthScore >= 5 ? '#059669' : '#334155' }} />
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: strengthScore < 3 ? '#fca5a5' : strengthScore < 5 ? '#fde68a' : '#86efac'
                          }}>
                            Kekuatan: {strengthScore < 3 ? 'Lemah (tambahkan simbol/angka)' : strengthScore < 5 ? 'Sedang' : 'Sangat Kuat (Aman)'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Konfirmasi Password Baru:
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#334155',
                          color: '#f8fafc',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 2,
                          padding: '10px',
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: '#fff',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}
                      >
                        Simpan Password Baru
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
