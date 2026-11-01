import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
async function avatarData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('image'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const side = Math.min(image.width, image.height);
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('canvas'));
          return;
        }
        context.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          256,
          256,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
export default function AccountPage() {
  const { account, session, updateAccount } = useAuth(),
    { lang } = useI18n(),
    vi = lang === 'vi';
  const [name, setName] = useState(account!.name),
    [avatar, setAvatar] = useState(account!.avatar),
    [nameError, setNameError] = useState(''),
    [imageError, setImageError] = useState(''),
    [saved, setSaved] = useState(false),
    [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 80) {
      setNameError(
        vi ? 'Họ tên phải có từ 2 đến 80 ký tự.' : 'Name must contain 2 to 80 characters.',
      );
      return;
    }
    updateAccount(name, avatar);
    setSaved(true);
  };
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-rice-950">
        {vi ? 'Thông tin tài khoản' : 'Account details'}
      </h1>
      <form
        noValidate
        onSubmit={submit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card"
      >
        <p className="text-sm text-slate-600">
          {vi ? 'Tên đăng nhập' : 'Username'}: {session!.username}
        </p>
        <label className="block text-sm font-semibold" htmlFor="account-name">
          {vi ? 'Họ tên' : 'Full name'}
        </label>
        <input
          id="account-name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError('');
            setSaved(false);
          }}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'account-name-error' : undefined}
          className="w-full rounded-lg border border-slate-300 px-3 py-3"
        />
        {nameError && (
          <p id="account-name-error" role="alert" className="text-sm text-red-700">
            {nameError}
          </p>
        )}
        <div className="flex items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rice-100 font-bold text-rice-900">
            {avatar ? (
              <img
                alt={vi ? 'Ảnh đại diện xem trước' : 'Avatar'}
                src={avatar}
                className="h-full w-full object-cover"
              />
            ) : (
              name
                .split(/\s+/)
                .slice(-2)
                .map((n) => n[0])
                .join('')
            )}
          </span>
          <div className="min-w-0">
            <label htmlFor="account-avatar" className="mb-2 block text-sm font-semibold">
              {vi ? 'Ảnh đại diện' : 'Avatar'}
            </label>
            <input
              id="account-avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-invalid={!!imageError}
              aria-describedby={imageError ? 'account-avatar-error' : 'account-avatar-help'}
              className="w-full min-w-0 text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSaved(false);
                if (
                  !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
                  file.size > 2 * 1024 * 1024
                ) {
                  setImageError(
                    vi
                      ? 'Chọn ảnh PNG, JPEG hoặc WebP không quá 2 MB.'
                      : 'Choose a PNG, JPEG or WebP image up to 2 MB.',
                  );
                  e.target.value = '';
                  return;
                }
                setImageError('');
                setLoading(true);
                try {
                  setAvatar(await avatarData(file));
                } catch {
                  setImageError(
                    vi
                      ? 'Không đọc được ảnh. Vui lòng chọn ảnh khác.'
                      : 'Cannot read this image. Please choose another.',
                  );
                } finally {
                  setLoading(false);
                }
              }}
            />
            <p id="account-avatar-help" className="mt-1 text-xs text-slate-600">
              PNG, JPEG, WebP · ≤ 2 MB
            </p>
          </div>
        </div>
        {imageError && (
          <p id="account-avatar-error" role="alert" className="text-sm text-red-700">
            {imageError}
          </p>
        )}
        {avatar && (
          <button
            type="button"
            onClick={() => {
              setAvatar('');
              setSaved(false);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {vi ? 'Xóa ảnh đại diện' : 'Remove avatar'}
          </button>
        )}
        <div>
          <button
            disabled={loading}
            className="rounded-lg bg-rice-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {loading
              ? vi
                ? 'Đang xử lý ảnh…'
                : 'Processing image…'
              : vi
                ? 'Lưu thay đổi'
                : 'Save changes'}
          </button>
        </div>
        {saved && (
          <p role="status" className="text-sm font-semibold text-rice-900">
            {vi ? 'Đã cập nhật thông tin tài khoản.' : 'Account details updated.'}
          </p>
        )}
      </form>
    </div>
  );
}
