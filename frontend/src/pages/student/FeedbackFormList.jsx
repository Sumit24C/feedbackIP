import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import StudentFeedbackCard from "@/components/forms/StudentFeedbackCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

export default function FeedbackFormList() {
  const axiosPrivate = useAxiosPrivate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosPrivate.get("/student");
        setForms(res.data.data);
      } catch (error) {
        toast.error(extractErrorMsg(error) || "No form found");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center gap-3 mt-32">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-blue-600 font-medium">
          Loading feedback forms...
        </p>
      </div>
    );

  const filteredForms = forms.filter((form) => {
    if (filter === "submitted") return form.status === "submitted";
    if (filter === "pending") return form.status === "pending";
    if (filter === "expired") return new Date(form.deadline) < new Date();
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-2">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Feedback Forms
          </h1>
        </div>

        <div className="sticky top-16 z-20 bg-gray-50 border-b py-3 flex justify-end">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter forms" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredForms?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-gray-50 p-12 text-center">
          <p className="font-medium text-gray-700">
            No forms found
          </p>
          <span className="text-sm text-gray-500">
            Try changing the filter.
          </span>
        </div>
      )}

      <div className="space-y-4">
        {filteredForms?.map((form) => (
          <StudentFeedbackCard key={form.formId} form={form} />
        ))}
      </div>
    </div>
  );
}
