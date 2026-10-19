export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="text-primary">
      <path d="M16 3 L29 29 H22.5 L16 15.5 L9.5 29 H3 Z" fill="currentColor" />
      <path d="M12 23 H20 L18.6 20.2 H13.4 Z" fill="var(--background)" />
    </svg>
  );
}

export function SetupNotice() {
  return (
    <div className="mx-auto my-6 max-w-2xl rounded-lg border border-azure-border bg-azure-dim p-5 text-xs leading-relaxed text-muted-foreground">
      <div className="eyebrow mb-2">Setup required</div>
      Database isn't connected yet — you can explore the editor, but saving won't work. Add <code className="text-foreground">VITE_SUPABASE_URL</code> and{" "}
      <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> to your environment, then run the SQL in{" "}
      <code className="text-foreground">database/schema.sql</code>.
    </div>
  );
}
