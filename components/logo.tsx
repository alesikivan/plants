import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 80, height: 80 },
  };

  const { width, height } = sizeMap[size];

  return (
    <Image
      src="/logo.svg"
      alt="Plantsheep"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
