/**
 * Shared shell for Researcher sub-pages.
 * Each page wraps its content in this to get the sidebar.
 */
import ResearchSidebar from "./ResearchSidebar";

export default function ResearchPage({
  title, subtitle, children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen">
      <ResearchSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Sub-page header */}
        <div
          className="flex items-center px-6 h-11 border-b shrink-0"
          style={{ borderColor: "#21262d", background: "#161b22" }}
        >
          <h1 className="text-sm font-semibold text-[#e6edf3]">{title}</h1>
          {subtitle && <span className="text-[11px] text-[#484f58] ml-3">{subtitle}</span>}
        </div>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
