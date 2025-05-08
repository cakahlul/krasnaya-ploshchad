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
      className="w-full flex items-center justify-center gap-3 py-3 mt-2 bg-white text-secondary font-semibold rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-muted animate-fade-in"
    >
      <GoogleOutlined className="text-red-500 text-xl animate-bounce-left-right" />
      <span className="text-sm">Login with Google ✨</span>
    </button>
  );
}
