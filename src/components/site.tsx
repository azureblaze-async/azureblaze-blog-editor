import blazeLogo from "@/assets/blaze-logo.png.asset.json";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src={blazeLogo.url}
      alt="AzureBlaze logo"
      width={size}
      height={size}
      className="shrink-0"
      draggable={false}
    />
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
