import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, User, AlertCircle, ArrowLeft, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react';
import { safeFetch } from '../utils/api';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string, admin: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess
}) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Check whether administrator account is configured or needs first-time setup
  useEffect(() => {
    let isMounted = true;
    const checkSetupStatus = async () => {
      setCheckingStatus(true);
      setError('');
      const res = await safeFetch<{ isConfigured: boolean }>('/api/auth/setup-status');
      if (isMounted) {
        if (res.ok && res.data) {
          setIsSetupMode(!res.data.isConfigured);
        } else {
          // If server error or unconfigured, default to setup mode so the user is never locked out
          setIsSetupMode(true);
        }
        setCheckingStatus(false);
      }
    };

    checkSetupStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    if (isSetupMode) {
      if (!username.trim() || username.trim().length < 3) {
        setError('يجب أن لا يقل اسم المستخدم عن 3 أحرف');
        return;
      }
      if (!password || password.length < 6) {
        setError('يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
        return;
      }

      setLoading(true);
      const res = await safeFetch<{ token: string; admin: any; message: string }>('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          forceReset: true
        })
      });

      setLoading(false);

      if (!res.ok || !res.data?.token) {
        setError(res.error || 'فشل إعداد حساب المسؤول، يرجى المحاولة مرة أخرى');
        return;
      }

      localStorage.setItem('wedding_admin_token', res.data.token);
      onLoginSuccess(res.data.token, res.data.admin);
      onClose();
    } else {
      // Normal Login
      if (!username.trim() || !password) {
        setError('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
      }

      setLoading(true);
      const res = await safeFetch<{ token: string; admin: any; needsSetup?: boolean }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      setLoading(false);

      if (!res.ok) {
        if (res.data?.needsSetup) {
          setIsSetupMode(true);
          setError('الموقع يحتاج إلى إعداد بيانات الدخول لأول مرة. يرجى إنشاء حسابك أدناه.');
          return;
        }
        setError(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        return;
      }

      if (res.data?.token) {
        localStorage.setItem('wedding_admin_token', res.data.token);
        onLoginSuccess(res.data.token, res.data.admin);
        onClose();
      }
    }
  };

  const handleResetToSetup = async () => {
    setError('');
    setLoading(true);
    const res = await safeFetch('/api/auth/reset', { method: 'POST' });
    setLoading(false);
    if (res.ok) {
      setIsSetupMode(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setSuccessNotice('تم فتح وضع إعداد الحساب. يمكنك الآن إنشاء اسم المستخدم وكلمة المرور الجديدة.');
    } else {
      setIsSetupMode(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#140e0b]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#231b17] border border-[#c89d5c]/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-[#8c7b70] hover:text-[#fbf7f0] p-1.5 rounded-full hover:bg-[#2c221d] transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-7">
          <div className="w-12 h-12 rounded-full bg-[#c89d5c]/20 border border-[#c89d5c] text-[#c89d5c] flex items-center justify-center mx-auto mb-3">
            {isSetupMode ? <UserPlus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-heading font-bold text-[#fbf7f0]">
            {isSetupMode ? 'إعداد حساب المسؤول لأول مرة' : 'تسجيل دخول المسؤول'}
          </h2>
          <p className="text-xs text-[#b09e90] leading-relaxed">
            {isSetupMode
              ? 'قم بإنشاء اسم المستخدم وكلمة المرور الخاصة بك لتأمين لوحة التحكم'
              : 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {checkingStatus ? (
          <div className="py-8 text-center text-xs text-[#8c7b70] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#c89d5c]" />
            <span>جاري التحقق من أمان النظام...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isSetupMode ? "اختر اسم المستخدم الخاص بك" : "اسم المستخدم"}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm"
                />
                <User className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm font-mono"
                />
                <KeyRound className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
              </div>
            </div>

            {isSetupMode && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#d8cfc4]">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm font-mono"
                  />
                  <ShieldCheck className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#c89d5c]/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#140e0b]" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : isSetupMode ? (
                <>
                  <span>إنشاء الحساب ودخول لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 text-[#140e0b]" />
                </>
              ) : (
                <>
                  <span>دخول لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 text-[#140e0b]" />
                </>
              )}
            </button>

            {/* Switch between Login and Setup / Reset */}
            <div className="pt-3 border-t border-[#3d2c23] flex items-center justify-between text-xs text-[#8c7b70]">
              {isSetupMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSetupMode(false);
                    setError('');
                  }}
                  className="hover:text-[#c89d5c] transition-colors cursor-pointer underline underline-offset-4"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetToSetup}
                  className="hover:text-[#c89d5c] transition-colors cursor-pointer underline underline-offset-4"
                >
                  إنشاء حساب جديد أو إعادة ضبط؟
                </button>
              )}

              <span className="text-[11px] text-[#6e5d52]">
                نظام حماية مشفر
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
