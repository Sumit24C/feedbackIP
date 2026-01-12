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
import { useNavigate } from "react-router-dom";
import {
  Building2,
} from "lucide-react";
import { FileUpload } from "@/components/admin/FileUpload";

export default function CreateDepartment() {
  const api = useAxiosPrivate();
  const navigate = useNavigate();

  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [classFile, setClassFile] = useState(null);
  const [facultyFile, setFacultyFile] = useState(null);
  const [subjectFile, setSubjectFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!deptName || !deptCode || !classFile || !facultyFile || !subjectFile) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("dept_name", deptName);
      form.append("dept_code", deptCode);
      form.append("classess", classFile);
      form.append("faculties", facultyFile);
      form.append("subjects", subjectFile);

      const res = await api.post("/admin", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Department created successfully");

      const dept_id = res.data.data.department._id;
      navigate(`/admin/department/${dept_id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 p-8">
      <Card className="w-full max-w-xl rounded-3xl shadow-xl border border-blue-100">

        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="text-blue-700" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Create Department
          </CardTitle>
          <CardDescription>
            Set up a new department with faculty, class and subjects
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="Department Name (e.g Computer Engineering)"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
            />
            <Input
              placeholder="Department Code (e.g COMP)"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-5 pt-2">
            <FileUpload
              label="Upload Class Excel"
              file={classFile}
              setFile={setClassFile}
            />
            <FileUpload
              label="Upload Faculty Excel"
              file={facultyFile}
              setFile={setFacultyFile}
            />
            <FileUpload
              label="Upload Subjects Excel"
              file={subjectFile}
              setFile={setSubjectFile}
            />
          </div>

          <Button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-blue-700 py-3 text-lg font-semibold hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Creating Department..." : "Create Department"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
