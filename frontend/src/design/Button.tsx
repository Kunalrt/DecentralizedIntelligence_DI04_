import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-[4px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1F4E5F] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-2xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-[#1F4E5F] text-white hover:bg-[#163B48] border border-[#1F4E5F]',
    secondary: 'bg-white text-[#1F2328] border border-[#D9D6CE] hover:bg-[#FAF9F5]',
    outline: 'bg-transparent text-[#1F4E5F] border border-[#1F4E5F] hover:bg-[#F5F3EE]',
    danger: 'bg-white text-[#DC2626] border border-[#DC2626] hover:bg-[#FEF2F2]',
    ghost: 'bg-transparent text-[#656D76] hover:text-[#1F2328] hover:bg-[#FAF9F5]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
};
