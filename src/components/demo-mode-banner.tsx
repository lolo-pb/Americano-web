export function DemoModeBanner({ demoMode }: { demoMode: boolean }) {
  if (!demoMode) {
    return null;
  }

  return (
    <div className="border-b border-gold/60 bg-gold/20 px-4 py-3 text-center text-sm text-ink">
      Demo mode is active. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to connect the real backend.
    </div>
  );
}
