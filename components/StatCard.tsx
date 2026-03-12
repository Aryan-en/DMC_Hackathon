import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accentColor?: string;
  glowClass?: string;
}

export default function StatCard({
  label,
  value,
  subValue,
  change,
  changeLabel,
  icon: Icon,
  accentColor = '#c8a84a',
  glowClass = 'glow-cyan',
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div
      className={`glass-card rounded-2xl p-5 relative overflow-hidden ${glowClass}`}
      style={{ transition: 'box-shadow 0.25s' }}
    >
      {/* Subtle top-edge gold shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
      />

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-[0.04] rounded-bl-full"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            color: '#3a4e62',
            fontSize: '0.62rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
            border: `1px solid ${accentColor}28`,
          }}
        >
          <Icon size={14} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value */}
      <div
        className="font-bold count-up"
        style={{ color: '#dce4ee', lineHeight: 1, fontSize: '1.85rem', letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      {subValue && (
        <div style={{ color: '#4a6070', fontSize: '0.7rem', marginTop: '4px' }}>{subValue}</div>
      )}

      {/* Change */}
      {change !== undefined && (
        <div
          className="flex items-center gap-1.5 mt-3 pt-3"
          style={{ borderTop: '1px solid rgba(200,168,74,0.08)' }}
        >
          <TrendIcon
            size={12}
            style={{ color: isPositive ? '#3eb87a' : isNegative ? '#b84a4a' : '#3a4e62' }}
          />
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              color: isPositive ? '#3eb87a' : isNegative ? '#b84a4a' : '#3a4e62',
            }}
          >
            {Math.abs(change)}% {changeLabel || (isPositive ? 'increase' : 'decrease')}
          </span>
        </div>
      )}
    </div>
  );
}
