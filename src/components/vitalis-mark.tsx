import Image from 'next/image';

type VitalisMarkProps = {
  /** Pixel width and height (square asset). */
  size?: number;
  className?: string;
  priority?: boolean;
};

/** App mark from `/logo.png` (favicon_io bundle). */
export function VitalisMark({ size = 36, className, priority = false }: VitalisMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
