export default function ProgressRing({ value = 0, size = 72, stroke = 8, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (value / 100) * circumference;
  return <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${value}% complete`}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><circle className="progress-ring__base" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} /><circle className="progress-ring__value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={dash} /></svg>
    <span>{label || `${value}%`}</span>
  </div>;
}
