import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function CreateProgramButton() {
    return (
        <Link
            href="/agency/programs/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
        >
            <Plus className="h-5 w-5" />
            Brief nouveau programme
        </Link>
    )
}
