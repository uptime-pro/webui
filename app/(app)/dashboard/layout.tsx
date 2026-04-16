export default function DashboardLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-96 border-r overflow-y-auto flex-shrink-0">
        {children}
      </div>
      <div className="flex-1 overflow-y-auto">{detail}</div>
    </div>
  );
}
