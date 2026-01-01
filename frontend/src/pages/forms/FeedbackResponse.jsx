import { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import ClassCard from "@/components/forms/ClassCard";

const FeedbackResponse = () => {
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const api = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const { formType, form_id } = useParams();
  useEffect(() => {
    const fetchFacultySubjects = async () => {
      try {
        const url = formType === "infrastructure" ? `/faculty/class/${form_id}` : `/faculty/${form_id}`;
        const res = await api.get(url);
        setFacultySubjects(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch faculty subjects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultySubjects();
  }, [form_id]);

  const isOverallActive =
    location.pathname === `/faculty/feedback/${formType}/${form_id}`;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 p-6">
      <aside className="w-full lg:w-80">
        <div className="sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Feedback Responses
            </h3>

            <button
              onClick={() => navigate(`/faculty/feedback/${formType}/${form_id}`)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition border cursor-pointer
                ${isOverallActive
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
            >
              Overall Summary
            </button>

            <hr />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Class
              </p>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
                </div>
              ) : facultySubjects.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1">
                  {facultySubjects.map((fs) => (
                    <ClassCard
                      key={fs._id}
                      fs={fs}
                      formId={form_id}
                      formType={formType}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No class found</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="bg-white rounded-2xl border shadow-sm p-6 min-h-[500px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default FeedbackResponse;
