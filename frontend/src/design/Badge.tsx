import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-2xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  }[size];

  const variantClasses = {
    neutral: 'bg-[#ECEAE4] text-[#1F2328] border border-[#D9D6CE]',
    accent: 'bg-[#EBF2F4] text-[#1F4E5F] border border-[#B8D3DA]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]',
    success: 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]',
    outline: 'bg-transparent text-[#656D76] border border-[#D9D6CE]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-[2px] ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
