import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const { form_id } = useParams();

  useEffect(() => {
    axios
      .get(`/faculty/${form_id}`)
      .then((res) => setSubjects(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex justify-center gap-6 p-8 min-h-[90vh]">

      {/* ✅ Simplified Sidebar */}
      <div className="w-56 p-5 rounded-xl shadow-lg h-fit bg-white border border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-blue-700">Dashboard</h3>

        {/* ✅ Overall Button (active highlight) */}
        <div
          onClick={() => navigate(`/faculty/dashboard/${form_id}`)}
          className={`p-3 rounded-md cursor-pointer mb-3 transition-all text-sm font-medium
          ${location.pathname === `/faculty/dashboard/${form_id}`
              ? "bg-blue-600 text-white shadow-md"
              : "hover:bg-blue-100 text-gray-800"
            }`}
        >
          Overall Summary
        </div>

        <hr className="my-3" />

        {/* ✅ Subject List */}
        <h4 className="text-xs uppercase text-gray-500 mb-2">Subjects</h4>

        {subjects.map((sub) => {
          const active =
            location.pathname ===
            `/faculty/dashboard/${form_id}/subject/${sub._id}`;

          return (
            <div
              key={sub._id}
              onClick={() =>
                navigate(`/faculty/dashboard/${form_id}/subject/${sub._id}`)
              }
              className={`p-2 rounded-md cursor-pointer mb-1 text-sm transition-all
              ${active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-blue-100 text-gray-700"
                }`}
            >
              {sub.subject} - {sub.classSection} ({sub.formType})
            </div>
          );
        })}
      </div>

      {/* ✅ Main Content */}
      <div className="w-[70%] max-w-4xl rounded-2xl shadow-xl p-6 bg-white">
        <Outlet />
      </div>

    </div>
  );
};

export default Dashboard;
