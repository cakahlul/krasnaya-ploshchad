import React from 'react';
import { GoogleOutlined } from '@ant-design/icons';

export default function GoogleLoginButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      <GoogleOutlined className="text-xl text-red-500" />
      <span className="text-sm">Continue with Google</span>
    </button>
  );
}
