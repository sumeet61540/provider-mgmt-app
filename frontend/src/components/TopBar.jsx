import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TopBar({ title, breadcrumb, backTo, actions }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-7 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            aria-label="Back"
            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <div>
          <div className="text-lg font-bold text-gray-900">{title}</div>
          {breadcrumb && <div className="text-[12.5px] text-gray-500 mt-0.5">{breadcrumb}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2.5">{actions}</div>
    </div>
  )
}
