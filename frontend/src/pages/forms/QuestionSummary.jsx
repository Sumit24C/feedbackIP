import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { toast } from "sonner";
import { extractErrorMsg } from "@/utils/extractErrorMsg";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const QuestionSummary = () => {
  const { form_id, subjectId, formType } = useParams();
  const axios = useAxiosPrivate();

  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chart");

  useEffect(() => {
    fetchQuestionData();
  }, [subjectId, form_id]);

  const fetchQuestionData = async () => {
    setLoading(true);
    setLoading(true);
    try {
      let url = "";
      if (formType === "infrastructure") {
        const classYear = subjectId.split('_')[0];
        const classSection = subjectId.split('_')[1];
        url = `/faculty/class/${form_id}/${classSection}/${classYear}`
      } else {
        url = `/faculty/subject/${form_id}/${subjectId}`
      }

      const res = await axios.get(url);
      setGraphData(res.data.data);
    } catch (error) {
      toast.error(extractErrorMsg(error) || "Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  const labels = graphData.map((item) => `Q-${item.questionId.slice(-4)}`);
  const values = graphData.map((item) => item.avgRating);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Average Rating per Question",
        data: values,
        borderWidth: 1,
        backgroundColor: "#4f8cff",
      },
    ],
  };

  return (
    <div className="flex flex-col items-center justify-start w-full">

      <h2 className="text-xl font-semibold mb-4 text-black">
        Question-wise Feedback Summary
      </h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("chart")}
          className={`px-4 py-2 rounded-lg font-medium ${tab === "chart"
            ? "bg-blue-500 text-white shadow-md"
            : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          Chart View
        </button>

        <button
          onClick={() => setTab("table")}
          className={`px-4 py-2 rounded-lg font-medium ${tab === "table"
            ? "bg-blue-500 text-white shadow-md"
            : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          Question List
        </button>
      </div>
      {loading ? (
        <p className="text-gray-700 animate-pulse">Loading chart...</p>
      ) : graphData.length === 0 ? (
        <p className="text-gray-500">No question data available</p>
      ) : tab === "chart" ? (
        <div className="w-[80%]">
          <Bar
            data={chartData}
            options={{
              plugins: { legend: { labels: { color: "black" } } },
              scales: {
                x: { ticks: { color: "black" } },
                y: { ticks: { color: "black" } },
              },
            }}
          />
        </div>
      ) : (
        <div className="w-[90%]">
          <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="p-2 text-left">Question ID</th>
                <th className="p-2 text-left">Question Text</th>
                <th className="p-2 text-left">Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {graphData.map((item) => (
                <tr key={item.questionId} className="border-b hover:bg-gray-100">
                  <td className="p-2">Q-{item.questionId.slice(-4)}</td>
                  <td className="p-2">{item.questionText}</td>
                  <td className="p-2">{item.avgRating.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuestionSummary;
