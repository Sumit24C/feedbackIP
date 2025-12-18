import React, { useEffect, useState } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";

const Dashboard = () => {
  const [facultySubjects, setFacultySubjects] = useState([]);
  const api = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const { form_id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ; (async function () {
      try {
        const res = await api.get(`/faculty/${form_id}`)
        setFacultySubjects(res.data.data)
      } catch (error) {
        console.error(err)
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-6 p-8 min-h-lh">
      <div className="w-56 p-5 rounded-xl shadow-lg h-fit bg-white border border-gray-200 hidden sm:block">
        <h3 className="text-lg font-bold mb-4 text-blue-700">Dashboard</h3>

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
        <h4 className="text-xs uppercase text-gray-500 mb-2">Subjects</h4>

        {facultySubjects.map((fs) => {
          const active =
            location.pathname ===
            `/faculty/dashboard/${form_id}/subject/${fs._id}`;

          return (
            <div
              key={fs._id}
              onClick={() =>
                navigate(`/faculty/dashboard/${form_id}/subject/${fs._id}`)
              }
              className={`p-2 rounded-md cursor-pointer mb-1 text-sm transition-all 
              ${active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-blue-100 text-gray-700"
                }`}
            >
              {fs.subject.name} - {fs.classSection} ({fs.formType})
            </div>
          );
        })}
      </div>
      <div className="sm:min-w-2xl max-w-4xl rounded-2xl shadow-xl p-6 bg-white">
        <Outlet />
      </div>

    </div>
  );
};

export default Dashboard;
