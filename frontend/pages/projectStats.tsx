import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { getProjectStats, getProjects } from "@/pages/api/api";
import { ProjectStatsResponse } from "@/pages/api/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Statistics page for visualizing data such as dataset count, code count, and model count for each project
 * with charts
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
        const projectStatsResponse: ProjectStatsResponse = await getProjectStats(project_ids[i]);
        // merge project with stats
        let project_data = {
          project: projects[i],
          projectStats: projectStatsResponse,
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

  const renderProjectInfoBarChart = () => {
    if (!projectData) return null;

    const barOptions = {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    const projectInfoBarStats = {
      labels: projectData?.map((project: any) => `${project.project.project_id}: ${project.project.project_name}`),
      datasets: [
        {
          label: "Dataset Count",
          data: projectData?.map((project: any) => project.projectStats.dataset_count),
          backgroundColor: "rgb(54, 162, 235)",
        },
        {
          label: "Code Count",
          data: projectData?.map((project: any) => project.projectStats.code_count),
          backgroundColor: "rgb(75, 192, 192)",
        },
        {
          label: "Model Count",
          data: projectData?.map((project: any) => project.projectStats.model_count),
          backgroundColor: "rgb(255, 205, 86)",
        },
      ],
    };

    return (
      <div id="infoBarChartContainer" style={{ width: "900px" }}>
        <Bar options={barOptions} data={projectInfoBarStats} />
      </div>
    );
  };

  const renderProjectDataBarChart = () => {
    if (!projectData) return null;

    const barOptions = {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    const projectDataBarStats = {
      labels: projectData?.map((project: any) => `${project.project.project_id}: ${project.project.project_name}`),
      datasets: [
        {
          label: "Segment Count",
          data: projectData?.map((project: any) => project.projectStats.segment_count),
          backgroundColor: "rgb(255, 99, 132)",
        },
        {
          label: "Sentence Count",
          data: projectData?.map((project: any) => project.projectStats.sentence_count),
          backgroundColor: "rgb(201, 203, 207)",
        },
        {
          label: "Embedding Count",
          data: projectData?.map((project: any) => project.projectStats.embedding_count),
          backgroundColor: "rgb(54, 162, 235)",
        },
      ],
    };

    return (
      <div id="dataBarChartContainer" style={{ width: "1300px" }}>
        <Bar options={barOptions} data={projectDataBarStats} />
      </div>
    );
  };

  return (
    <div>
      <Header title="Project Stats" />
      <div className="bar-container w-fit mx-auto my-16">{renderProjectInfoBarChart()}</div>
      <div className="bar-container w-fit mx-auto my-16">{renderProjectDataBarChart()}</div>
    </div>
  );
}
