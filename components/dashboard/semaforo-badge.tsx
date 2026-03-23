import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SemaforoStatus = 'verde' | 'amarelo' | 'vermelho';

type SemaforoBadgeProps = {
  status: SemaforoStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function SemaforoBadge({ status, label, size = 'md' }: SemaforoBadgeProps) {
  const statusConfig = {
    verde: {
      bg: 'bg-green-500',
      text: 'text-white',
      label: label || 'Verde',
    },
    amarelo: {
      bg: 'bg-yellow-500',
      text: 'text-white',
      label: label || 'Amarelo',
    },
    vermelho: {
      bg: 'bg-red-500',
      text: 'text-white',
      label: label || 'Vermelho',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const config = statusConfig[status];

  return (
    <Badge
      className={cn(
        config.bg,
        config.text,
        sizeClasses[size],
        'font-semibold'
      )}
    >
      {config.label}
    </Badge>
  );
}

export function calcularSemaforo(percentual: number): SemaforoStatus {
  if (percentual >= 90) return 'verde';
  if (percentual >= 70) return 'amarelo';
  return 'vermelho';
}
