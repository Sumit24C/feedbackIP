import { Input } from "@/components/ui/input";
import {
    Upload,
    FileSpreadsheet,
    X
} from "lucide-react";

export function FileUpload({ label, file, setFile }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload size={16} /> {label}
            </label>

            <div className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-5 hover:bg-blue-100 transition">
                <FileSpreadsheet className="text-blue-600" />
                <p className="text-sm text-gray-700 text-center">
                    Drag & drop Excel file or click to browse
                </p>

                <Input
                    type="file"
                    accept=".xlsx,.xls"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>

            {file && (
                <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <span className="text-sm font-medium truncate">
                        {file.name}
                    </span>
                    <button
                        onClick={() => setFile(null)}
                        className="text-gray-500 hover:text-red-500 transition"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}