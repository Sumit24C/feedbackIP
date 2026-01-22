import { useEffect, useState } from "react";
import { api } from "@/api/api";
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

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expireFilter, setExpireFilter] = useState("all");
  const [formTypeFilter, setFormTypeFilter] = useState("all");
  const { userData } = useSelector((state) => state.auth);
  const options = userData?.role === "admin" ? ["all", "self", "department"] : ["all", "self", "class", "department"]
  const formTypeOptions = [
    "all",
    "theory",
    "practical",
    "tutorial",
    "infrastructure",
  ];
  const expireOptions = ["all", "active", "expired"];

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await api.get(`/form`);
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
      await api.delete(`/form/${id}`);
      toast.success("Form deleted successfully");
      setForms((prev) => prev.filter((f) => f._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete form");
    }
  };

  let filteredForms = forms.filter((form) => {
    if (filter === "self") return form.createdBy === userData._id;
    if (filter === "department") return form.targetType === "DEPARTMENT";
    if (filter === "class") return form.targetType === "CLASS";
    return true;
  });

  filteredForms = filteredForms.filter((form) => {
    if (formTypeFilter === "all") return true;
    return form.formType === formTypeFilter;
  });

  const today = new Date().setHours(0, 0, 0, 0);

  filteredForms = filteredForms.filter((form) => {
    const deadline = new Date(form.deadline).setHours(0, 0, 0, 0);
    if (expireFilter === "expired") return deadline < today;
    if (expireFilter === "active") return deadline >= today;
    return true;
  });

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center gap-4 mt-32">
        <div className="w-14 h-14 border-4 border-transparent border-t-indigo-500 border-l-indigo-400 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="sticky top-16 z-20 bg-gray-50 border-b py-3 flex flex-wrap justify-end gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="max-w-48">
            <SelectValue placeholder="Filter forms" />
          </SelectTrigger>

          <SelectContent>
            {options.map((opt, id) => (
              <SelectItem key={id} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
          <SelectTrigger className="max-w-44">
            <SelectValue placeholder="Filter forms" />
          </SelectTrigger>

          <SelectContent>
            {formTypeOptions.map((opt, id) => (
              <SelectItem key={id} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={expireFilter} onValueChange={setExpireFilter}>
          <SelectTrigger className="max-w-48">
            <SelectValue placeholder="Filter forms" />
          </SelectTrigger>
          <SelectContent>
            {expireOptions.map((opt, id) => (
              <SelectItem key={id} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
