import type { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return <section className="min-h-[calc(100vh-8rem)] rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">{children}</section>;
}