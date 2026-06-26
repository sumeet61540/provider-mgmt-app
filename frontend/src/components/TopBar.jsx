export default function TopBar({ title, breadcrumb, actions }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-7 sticky top-0 z-10">
      <div>
        <div className="text-lg font-bold text-gray-900">{title}</div>
        {breadcrumb && <div className="text-[12.5px] text-gray-500 mt-0.5">{breadcrumb}</div>}
      </div>
      <div className="flex items-center gap-2.5">{actions}</div>
    </div>
  )
}
