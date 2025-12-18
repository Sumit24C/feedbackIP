import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useParams } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const OverallSummary = () => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);
  const axios = useAxiosPrivate();
  const { form_id } = useParams();

  useEffect(() => {
    if (!form_id) return;
    setLoading(true);

    axios
      .get(`/faculty/overall-result/${form_id}`)
      .then((res) => {
        setGraphData(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [form_id]);

  const labels = graphData.map((item) => item._id);
  const avgRatings = graphData.map((item) => Number(item.avgRating) || 0);
  const totalResponses = graphData.map(
    (item) => Number(item.totalResponses) || 0
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Average Rating",
        data: avgRatings,              
        backgroundColor: "#4f8cff",
        borderRadius: 6,
      },
    ],
  };


  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // cleaner UI
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Class ${tooltipItems[0].label}`;
          },
          label: (tooltipItem) => {
            const index = tooltipItem.dataIndex;
            return [
              `Average Rating: ${avgRatings[index].toFixed(2)}`,
              `Total Responses: ${totalResponses[index]}`,
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
        max: 5, // ⭐ rating scale (important UX)
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
        Overall Feedback Summary (Class-wise)
      </h2>

      {loading ? (
        <p className="text-gray-600 animate-pulse">Loading chart...</p>
      ) : graphData.length === 0 ? (
        <p className="text-gray-600">No feedback available</p>
      ) : (
        <div className="w-[80%]">
          <Bar
            data={chartData}
            options={options}
          />
        </div>
      )}
    </div>
  );
};

export default OverallSummary;
