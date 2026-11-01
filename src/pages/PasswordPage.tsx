import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
type Field = 'current' | 'next' | 'confirm';
export default function PasswordPage() {
  const { changePassword } = useAuth(),
    { lang } = useI18n(),
    vi = lang === 'vi';
  const [values, setValues] = useState({ current: '', next: '', confirm: '' }),
    [errors, setErrors] = useState<Partial<Record<Field, string>>>({}),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const labels = {
    current: vi ? 'Mật khẩu hiện tại' : 'Current password',
    next: vi ? 'Mật khẩu mới' : 'New password',
    confirm: vi ? 'Xác nhận mật khẩu mới' : 'Confirm new password',
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const invalid: Partial<Record<Field, string>> = {};
    if (!values.current)
      invalid.current = vi ? 'Nhập mật khẩu hiện tại.' : 'Enter your current password.';
    if (values.next.length < 8 || !/[A-Za-z]/.test(values.next) || !/\d/.test(values.next))
      invalid.next = vi
        ? 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số.'
        : 'Use at least 8 characters, including a letter and a number.';
    else if (values.next === values.current)
      invalid.next = vi
        ? 'Mật khẩu mới phải khác mật khẩu hiện tại.'
        : 'New password must differ from the current password.';
    if (values.confirm !== values.next || !values.confirm)
      invalid.confirm = vi
        ? 'Xác nhận mật khẩu không khớp.'
        : 'Password confirmation does not match.';
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      if (await changePassword(values.current, values.next)) {
        setValues({ current: '', next: '', confirm: '' });
        setSaved(true);
      } else
        setErrors({
          current: vi ? 'Mật khẩu hiện tại không đúng.' : 'Current password is incorrect.',
        });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold text-rice-950">
        {vi ? 'Đổi mật khẩu' : 'Change password'}
      </h1>
      <form
        noValidate
        onSubmit={submit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card"
      >
        <p id="password-help" className="text-sm text-slate-600">
          {vi
            ? 'Ít nhất 8 ký tự, gồm chữ và số; khác mật khẩu hiện tại.'
            : 'At least 8 characters, including letters and numbers; different from the current password.'}
        </p>
        {(Object.keys(labels) as Field[]).map((key) => (
          <div key={key}>
            <label htmlFor={`password-${key}`} className="mb-2 block text-sm font-semibold">
              {labels[key]}
            </label>
            <input
              id={`password-${key}`}
              type="password"
              autoComplete={key === 'current' ? 'current-password' : 'new-password'}
              value={values[key]}
              onChange={(e) => {
                setValues({ ...values, [key]: e.target.value });
                setErrors((previous) => ({ ...previous, [key]: undefined }));
                setSaved(false);
              }}
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? `password-${key}-error` : 'password-help'}
              className="w-full rounded-lg border border-slate-300 px-3 py-3"
            />
            {errors[key] && (
              <p id={`password-${key}-error`} role="alert" className="mt-2 text-sm text-red-700">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        <button
          disabled={busy}
          className="rounded-lg bg-rice-900 px-5 py-3 text-sm font-bold text-white"
        >
          {busy ? (vi ? 'Đang lưu…' : 'Saving…') : vi ? 'Cập nhật mật khẩu' : 'Update password'}
        </button>
        {saved && (
          <p role="status" className="text-sm font-semibold text-rice-900">
            {vi ? 'Đã đổi mật khẩu.' : 'Password updated.'}
          </p>
        )}
      </form>
    </div>
  );
}
