import { twMerge } from 'tailwind-merge';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={twMerge(
        'bg-paper rounded-xl shadow-card border border-hairline p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
