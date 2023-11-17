import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { getClusterStats, getProjects } from "@/pages/api/api";
import { ClusterStatsResponse } from "@/pages/api/types";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

/**
 * Statistics for visualizing data about clusters for each project
 */
export default function StatsPage() {
  const [projectData, setProjectData] = useState<any>(null);

  const fetchAndUpdateStats = async () => {
    try {
      const projectsResponse: any = await getProjects();
      let projects = projectsResponse.data.data;
      let project_ids = projects.map((project: any) => project.project_id);
      let all_project_data = [];
      for (let i = 0; i < project_ids.length; i++) {
        const clusterStatsResponse: ClusterStatsResponse = await getClusterStats(project_ids[i]);
        // merge project with stats
        let project_data = {
          project: projects[i],
          clusterStats: clusterStatsResponse,
        };
        all_project_data.push(project_data);
      }
      setProjectData(all_project_data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  useEffect(() => {
    fetchAndUpdateStats();
  }, []);

  const renderPieClusterCharts = () => {
    if (!projectData) return null;

    return projectData.map((project: any, index: number) => {
      const labels = project.clusterStats.cluster_info.map((cluster: any) => cluster.cluster_value);
      const data = project.clusterStats.cluster_info.map((cluster: any) => cluster.segment_count);

      const pieData = {
        labels: labels,
        datasets: [
          {
            label: "Cluster Segment Count",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };

      const options = {
        maintainAspectRatio: true,
        height: 100,
        width: 100,
      };

      return (
        <div key={index}>
          <h3 className="w-fit mx-auto text-3xl underline my-5">{project.project.project_name}</h3>
          <Doughnut data={pieData} options={options} />
        </div>
      );
    });
  };

  return (
    <div>
      <Header title="Cluster Stats" />
      <div className="pie-container w-[50%] mx-auto mb-12">{renderPieClusterCharts()}</div>
    </div>
  );
}
