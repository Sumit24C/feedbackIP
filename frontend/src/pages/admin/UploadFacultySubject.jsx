import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Building2, X } from "lucide-react";

export default function UploadFacultySubject() {
    const api = useAxiosPrivate();

    const [facultySubjectFile, setFacultySubjectFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!facultySubjectFile) {
            toast.error("Please select a FacultySubject Excel file");
            return;
        }

        try {
            setLoading(true);

            const form = new FormData();
            form.append("facultysubjects", facultySubjectFile);

            await api.post("/admin/faculty-subjects", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("FacultySubject uploaded successfully");
            setFacultySubjectFile(null);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to upload FacultySubject file"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex justify-center items-start bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 p-8">
            <Card className="w-full max-w-lg rounded-3xl shadow-xl border border-blue-100">

                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="text-blue-700" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Upload Faculty–Subject Mapping
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                        Upload institute-level Excel to assign faculty to subjects,
                        classes, and sections.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            FacultySubject Excel File
                        </label>

                        <div className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center hover:bg-blue-100 transition">
                            <Upload className="text-blue-600" />
                            <p className="text-sm text-gray-700">
                                Drag & drop your Excel file here or
                            </p>

                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) =>
                                    setFacultySubjectFile(e.target.files?.[0] || null)
                                }
                            />

                            <Button
                                type="button"
                                variant="outline"
                                className="mt-2"
                            >
                                Browse File
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Supported formats: .xlsx, .xls
                        </p>
                    </div>

                    {facultySubjectFile && (
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 border">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="text-green-600" />
                                <span className="text-sm font-medium">
                                    {facultySubjectFile.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setFacultySubjectFile(null)}
                                className="text-gray-500 hover:text-red-500 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    <Button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="w-full rounded-xl bg-blue-700 py-3 text-lg font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
                    >
                        {loading ? "Uploading..." : "Upload FacultySubject"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
