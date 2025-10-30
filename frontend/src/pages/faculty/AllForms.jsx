import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function AllForms() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  if (loading) return <div className="text-center p-6 text-gray-500">Loading forms...</div>;

  const today = new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">All Feedback Forms</h1>

      {forms.length === 0 ? (
        <p className="text-gray-500">No forms created in your department.</p>
      ) : (
        forms.map((form) => {
          const isExpired = new Date(form.deadline) < today;

          return (
            <div
              key={form._id}
              className={`border p-4 rounded shadow-sm bg-white hover:shadow-md transition relative ${
                isExpired ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            >
              {/* MENU BUTTON */}
              <div
                className="absolute top-3 right-3 cursor-pointer p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(openMenu === form._id ? null : form._id);
                }}
              >
                ⋮
              </div>

              {/* MENU DROPDOWN */}
              {openMenu === form._id && (
                <div
                  className="absolute top-10 right-3 bg-white border shadow-md rounded text-sm w-28 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      navigate(`/faculty/dashboard/${form._id}`);
                    }}
                  >
                    View
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      navigate(`/faculty/form/${form._id}`);
                    }}
                  >
                    Edit
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-red-100 text-red-600 cursor-pointer"
                    onClick={() => handleDelete(form._id)}
                  >
                    Delete
                  </div>
                </div>
              )}

              {/* ✅ CARD CONTENT — Not clickable */}
              <div>
                <div className="flex justify-between items-center mb-1 pr-8">
                  <h2
                    className={`text-lg font-semibold ${
                      isExpired ? "text-red-600" : ""
                    }`}
                  >
                    {form.title}
                  </h2>

                  {/* ✅ Moved Badge Away from Menu */}
                  <span
                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      isExpired
                        ? "bg-red-200 text-red-700"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {form.formType}
                  </span>
                </div>

                <p
                  className={`text-sm ${
                    isExpired ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  Deadline:{" "}
                  <strong>{new Date(form.deadline).toLocaleDateString()}</strong>
                  {isExpired && " (Expired)"}
                </p>

                <p className="text-sm text-gray-700">
                  Total Responses: <strong>{form.responseCount}</strong>
                </p>

                {form.responsesByClass && form.responsesByClass.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {form.responsesByClass.map((r, idx) => (
                      <div key={idx}>
                        {r.year} - {r.classSection}:{" "}
                        <span className="font-semibold">{r.count}</span> responses
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default AllForms;
