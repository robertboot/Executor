import Image from 'next/image';

interface Props {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function Logo({ variant = 'default', className }: Props) {
  const width = variant === 'compact' ? 160 : 260;
  const height = variant === 'compact' ? 48 : 80;
  return (
    <Image
      src="/heirloom-logo-horizontal.png"
      alt="Heirloom"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
