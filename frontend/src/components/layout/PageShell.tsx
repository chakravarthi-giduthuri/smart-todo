import type { ReactNode } from 'react';

interface Props { children: ReactNode; className?: string; noPadding?: boolean; }

export function PageShell({ children, className = '', noPadding = false }: Props) {
  return (
    <div
      className={`min-h-screen pb-24 ${className}`}
      style={{
        background: 'var(--app-bg)',
        color: 'var(--text-base)',
        ...(noPadding ? {} : { padding: '0' }),
      }}
    >
      {children}
    </div>
  );
}
