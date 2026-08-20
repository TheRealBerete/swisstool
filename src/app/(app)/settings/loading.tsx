export default function Loading() {
  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-4 animate-pulse">
      <div className="h-56 bg-surface-container rounded-xl" />
      <div className="h-44 bg-surface-container rounded-xl" />
    </div>
  );
}
