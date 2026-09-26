interface ProgressBarProps {
  /** A number between 0 and 100 */
  value: number;
  className?: string;
}

export default function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
