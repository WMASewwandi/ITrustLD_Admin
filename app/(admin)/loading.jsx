export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="h-10 w-full max-w-xl animate-pulse rounded-xl bg-white/5" />
      <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
    </div>
  );
}
