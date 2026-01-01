import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormCard from "@/components/forms/FormCard";

function AllForms() {
  const axiosPrivate = useAxiosPrivate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await axiosPrivate.get(`/form`);
        setForms(res.data.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch forms");
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this form?");
    if (!confirmDelete) return;

    try {
      await axiosPrivate.delete(`/form/${id}`);
      toast.success("Form deleted successfully");
      setForms((prev) => prev.filter((f) => f._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete form");
    }
  };


  const filteredForms = forms.filter((form) => {
    if (filter === "self") return form.createdBy === userData._id;
    if (filter === "department") return form.targetType == "DEPARTMENT";
    if (filter === "class") return form.targetType == "CLASS";
    return true;
  });

  const options = userData?.role === "admin" ? ["all", "self", "department"] : ["all", "self", "class", "department"]

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center gap-4 mt-32">
        <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-1">
        <h1 className="text-2xl font-bold">Feedback Forms</h1>
        <div className="w-fit">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter forms" />
            </SelectTrigger>

            <SelectContent>
              {options.map((opt, id) => (
                <SelectItem key={id} value={opt}>{opt} forms</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <p className="text-gray-500">No forms created in your department.</p>
      ) : (
        filteredForms.map((form) =>
          <FormCard key={form._id} form={form} handleDelete={handleDelete} />
        ))}
    </div>
  );
}

export default AllForms;
