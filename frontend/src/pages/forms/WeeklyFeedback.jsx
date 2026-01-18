import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import ClassCard from "@/components/forms/ClassCard";
import { useSelector } from "react-redux";

const FORM_TYPES = [
  { label: "Theory", value: "theory" },
  { label: "Practical", value: "practical" },
  { label: "Tutorial", value: "tutorial" },
];

const WeeklyFeedback = () => {

  const [formTypeFilter, setFormTypeFilter] = useState("theory");
  const { entities, loading } = useSelector((state) => state.facultySubjects);

  const filteredEntities = useMemo(() => {
    return entities.filter(
      (en) => en.formType === formTypeFilter
    );
  }, [entities, formTypeFilter]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 p-6">
      <aside className="w-full lg:w-80">
        <div className="sticky top-20">
          <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Weekly Feedback Responses
            </h3>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Feedback Type
              </p>

              <div className="flex rounded-lg border overflow-hidden">
                {FORM_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormTypeFilter(type.value)}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition
                      ${formTypeFilter === type.value
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <hr />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Class
              </p>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-transparent border-t-blue-500 border-l-blue-400 rounded-full animate-spin" />
                </div>
              ) : filteredEntities.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
                  {filteredEntities.map((en) => (
                    <ClassCard
                      key={en._id}
                      en={en}
                      isWeekly
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No classes for this type
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="bg-white rounded-2xl border shadow-sm p-6 min-h-[500px]">
          <Outlet context={{ formType: formTypeFilter }} />
        </div>
      </main>
    </div>
  );
};

export default WeeklyFeedback;
