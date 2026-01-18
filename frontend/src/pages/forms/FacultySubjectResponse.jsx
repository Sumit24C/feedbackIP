import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function FacultySubjectResponse() {
  const { _id } = useParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!_id) return;

    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/weekly-feedback/${_id}`);
        setData(res.data.data || []);
      } catch (error) {
        toast.error(extractErrorMsg(error) || "Failed to load feedback");
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [_id]);

  const labels = data.map((item) => {
    const start = new Date(item.session_start).toLocaleDateString();
    const end = new Date(item.session_end).toLocaleDateString();
    return `${start} → ${end}`;
  });

  const avgScores = data.map((item) => Number(item.avg_score) || 0);
  const totalResponses = data.map(
    (item) => Number(item.total_responses) || 0
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Average Score",
        data: avgScores,
        backgroundColor: "#4f8cff",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => `Session ${items[0].label}`,
          label: (item) => {
            const i = item.dataIndex;
            return [
              `Average Score: ${avgScores[i].toFixed(2)}`,
              `Total Responses: ${totalResponses[i]}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "black" },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          color: "black",
        },
      },
    },
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold mb-4 text-black">
        Weekly Feedback Trend
      </h2>

      {loading ? (
        <p className="text-gray-600 animate-pulse">Loading chart...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-600">No weekly feedback available</p>
      ) : (
        <div className="w-[80%]">
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}

export default FacultySubjectResponse;
