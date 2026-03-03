interface ShimmerSkeletonProps {
  className?: string;
  lines?: number;
}

export function ShimmerSkeleton({
  className = "",
  lines = 3,
}: ShimmerSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer-skeleton h-4"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function ShimmerBlock({ className = "" }: { className?: string }) {
  return <div className={`shimmer-skeleton ${className}`} />;
}
