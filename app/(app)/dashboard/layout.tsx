export default function DashboardLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden gap-0">
      <div className="border-b bg-card flex-shrink-0">
        {children}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">{detail}</div>
    </div>
  );
}
