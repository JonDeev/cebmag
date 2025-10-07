export default function Subheader({ title }: { title: string }) {
  return (
    <div className="bg-panel shadow-header">
      <div className="h-16 max-w-7xl mx-auto px-6 flex flex-col justify-center">
        <div className="text-xs text-slate-500">Principal <span className="mx-1">›</span> {title}</div>
        <div className="text-lg font-semibold text-slate-700">{title}</div>
      </div>
    </div>
  );
}
