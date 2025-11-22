import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Upload, Building2 } from "lucide-react";

export default function CreateDepartment() {
  const api = useAxiosPrivate();

  const [deptName, setDeptName] = useState("");
  const [studentFile, setStudentFile] = useState(null);
  const [facultyFile, setFacultyFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!deptName || !studentFile || !facultyFile) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("dept_name", deptName);
      form.append("students", studentFile);
      form.append("faculties", facultyFile);

      const res = await api.post("/admin", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Department, Students & Faculty added successfully!");

      setDeptName("");
      setStudentFile(null);
      setFacultyFile(null);
      const dept_id = res.data.data.updatedDepartment._id;
      navigate(`/admin/department`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start mt-10 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <Card className="w-[480px] bg-white shadow-2xl rounded-3xl border-none">

          <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Building2 size={24} /> Create Department
          </CardTitle>

        <CardContent className="space-y-5 py-6">

          <div className="space-y-1">
            <label className="text-gray-700 font-medium">Department Name</label>
            <Input
              placeholder="Enter department name"
              className="border-blue-300 focus:border-blue-600"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-700 font-medium flex items-center gap-2">
              <Upload size={18} /> Upload Students Excel
            </label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              className="border-blue-300 cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
              onChange={(e) => setStudentFile(e.target.files[0])}
            />
            <p className="text-xs text-gray-500">
              Supported: .xlsx, .xls
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-gray-700 font-medium flex items-center gap-2">
              <Upload size={18} /> Upload Faculty Excel
            </label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              className="border-blue-300 cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
              onChange={(e) => setFacultyFile(e.target.files[0])}
            />
            <p className="text-xs text-gray-500">
              Supported: .xlsx, .xls
            </p>
          </div>

          <Button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-blue-700 hover:bg-blue-800 py-3 rounded-xl shadow-md text-lg font-semibold transition"
          >
            {loading ? "Processing..." : "Create Department"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
