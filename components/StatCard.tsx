import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  accentColor?: string; // Legacy support
  bgColor?: string;
  textColor?: string;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  subValue,
  change,
  changeLabel,
  icon: Icon,
  accentColor = 'var(--accent-gold)',
  bgColor = 'var(--card-bg)',
  textColor = 'var(--text-primary)',
  loading = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const finalBg = bgColor || accentColor;

  return (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-200`}
      style={{ 
        background: bgColor,
        border: `1px solid ${accentColor}40`,
        boxShadow: `4px 4px 0px rgba(0,0,0,0.1)`
      }}
    >

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-[0.04] rounded-bl-full"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            color: textColor,
            fontSize: '0.62rem',
            fontWeight: 800,
            opacity: 0.8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5"
        >
          <Icon size={18} style={{ color: textColor }} />
        </div>
      </div>

      {/* Value */}
      <div
        className={`font-black count-up tracking-tight ${loading ? 'skeleton-box h-8 w-1/2' : ''}`}
        style={{ color: textColor, lineHeight: 1, fontSize: '2.5rem', letterSpacing: '-0.05em' }}
      >
        {!loading && value}
      </div>
      {subValue && (
        <div className={loading ? 'skeleton-box h-3 w-3/4 mt-2' : ''} style={{ color: textColor, opacity: 0.8, fontSize: '0.62rem', fontWeight: 900, marginTop: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {!loading && subValue}
        </div>
      )}

      {/* Change */}
      {change !== undefined && (
        <div
          className="flex items-center gap-1.5 mt-3 pt-3"
        >
          {loading ? (
            <div className="skeleton-box h-3 w-1/4" />
          ) : (
            <>
              <TrendIcon
                size={12}
                style={{ color: isPositive ? 'var(--accent-emerald)' : isNegative ? 'var(--accent-crimson)' : 'var(--text-muted)' }}
              />
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  color: isPositive ? 'var(--accent-emerald)' : isNegative ? 'var(--accent-crimson)' : 'var(--text-muted)',
                }}
              >
                {Math.abs(change)}% {changeLabel || (isPositive ? 'increase' : 'decrease')}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
