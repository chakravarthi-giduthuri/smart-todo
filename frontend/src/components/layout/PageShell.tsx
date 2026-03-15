import type { ReactNode } from 'react';

interface Props { children: ReactNode; className?: string; noPadding?: boolean; }

export function PageShell({ children, className = '', noPadding = false }: Props) {
  return (
    <div
      className={`min-h-screen bg-[#080810] text-white pb-24 ${className}`}
      style={noPadding ? {} : { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      {children}
    </div>
  );
}
