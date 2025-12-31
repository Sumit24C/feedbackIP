import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";

const FeedbackResponse = () => {
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState("");
  const api = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const { form_id } = useParams();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/faculty/${form_id}`);
        const { sections, targetType: target } = res.data.data;
        setFacultySubjects(sections);
        setTargetType(target);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [form_id]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 p-6">
      <aside className="w-full lg:w-80">
        <div className="sticky top-20 space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Feedback Responses
            </h3>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => navigate(`/faculty/feedback/${form_id}`)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition
                  cursor-pointer p-3 border
                  ${location.pathname === `/faculty/feedback/${form_id}`
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                  }    
                  `}
              >
                Overall Summary
              </button>
            </div>

            <hr />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Subjects
              </p>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
                </div>
              ) : facultySubjects.length > 0 ? (
                <div className="max-h-1/3 overflow-y-auto space-y-1 pr-1">
                  {facultySubjects.map((fs) => {
                    const active =
                      location.pathname ===
                      `/faculty/feedback/${form_id}/subject/${fs._id}`;

                    return (
                      <div
                        key={fs._id}
                        onClick={() =>
                          navigate(
                            `/faculty/feedback/${form_id}/subject/${fs._id}`
                          )
                        }
                        className={`cursor-pointer rounded-lg p-3 text-sm transition border
                          ${active
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-gray-800 truncate">
                            {fs.subject.name} · {fs.classSection}
                          </p>

                          <span className="shrink-0 px-2 py-0.5 rounded-xs bg-gray-100 text-gray-700">
                            {fs.formType}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-0.5">
                          {fs.totalResponses} responses
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No subjects found
                </p>
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
