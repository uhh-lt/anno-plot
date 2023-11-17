import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Chart as ChartJS, LinearScale, Title, Tooltip, Legend, PointElement, ArcElement } from "chart.js";
import { Bubble, Pie } from "react-chartjs-2";
import { getCodeStats, getProjects, getCodeTree } from "@/pages/api/api";
import { CodeSegmentsResponse } from "@/pages/api/types";

ChartJS.register(LinearScale, PointElement, Title, Tooltip, Legend, ArcElement);

function findCodePath(tree: any, code_id: any, currentPath = ""): any {
  for (const key in tree) {
    const node = tree[key];
    const newPath = currentPath ? `${currentPath}-${node.name}` : node.name;

    if (node.id === code_id) {
      return newPath;
    }

    const subcategories = node.subcategories;
    const result = findCodePath(subcategories, code_id, newPath);
    if (result) return result;
  }
  return null;
}

/**
 * Statistics for visualizing data about codes for each project
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
        const codeStatsResponse: CodeSegmentsResponse = await getCodeStats(project_ids[i]);
        const codeTreeResponse = (await getCodeTree(project_ids[i])).data;
        console.log("codeTreeResponse", codeTreeResponse);

        // merge project with stats
        let project_data = {
          project: projects[i],
          codeStats: codeStatsResponse,
          codeTree: codeTreeResponse,
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

  const renderBubbleCharts = () => {
    if (!projectData) return null;

    return projectData.map((project: any, index: number) => {
      let data: any[] = [];
      let zeroData: any[] = [];
      for (let i = 0; i < project.codeStats.code_segments_count.codes.length; i++) {
        let code = project.codeStats.code_segments_count.codes[i];
        let maxRadiusOfAllCodes = Math.max(
          ...project.codeStats.code_segments_count.codes.map((code: any) => code.segment_count),
        );
        let minRadiusOfAllCodes = Math.min(
          ...project.codeStats.code_segments_count.codes.map((code: any) => code.segment_count),
        );
        let radius = ((code.segment_count - minRadiusOfAllCodes) / (maxRadiusOfAllCodes - minRadiusOfAllCodes)) * 50;
        let codePath = findCodePath(project.codeTree.codes, code.code_id);
        code.text = codePath;
        if (code.average_position.x == 0 && code.average_position.y == 0) {
          zeroData.push({
            x: code.average_position.x,
            y: code.average_position.y,
            r: radius,
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          });
          continue;
        }

        let codeData = {
          label: `${code.text} (${code.segment_count})`,

          data: [
            {
              x: code.average_position.x,
              y: code.average_position.y,
              r: radius,
              backgroundColor: [
                "rgb(255, 99, 132)",
                "rgb(54, 162, 235)",
                "rgb(75, 192, 192)",
                "rgb(255, 205, 86)",
                "rgb(201, 203, 207)",
                "rgb(54, 162, 235)",
                "rgb(255, 99, 132)",
              ],
            },
          ],
        };
        data.push(codeData);
      }

      const labels = project.codeStats.code_segments_count.codes.map((code: any) => code.text);

      const bubbleData = {
        datasets: data,
      };

      const bubbleOptions = {};

      return (
        <div key={index} className="chart-container">
          <h3 className="text-xl text-black">{`${project.project.project_id} - ${project.project.project_name}`}</h3>
          <Bubble options={bubbleOptions} data={bubbleData} />
          <table>
            <thead>
              <tr>
                <th>Empty Codes</th>
              </tr>
            </thead>
            <tbody>
              {zeroData.map((code: any, index: number) => {
                return (
                  <tr key={index}>
                    <td>{labels[index]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    });
  };

  const renderPieCodeCharts = () => {
    if (!projectData) return null;

    return projectData.map((project: any, index: number) => {
      const labels = project.codeStats.code_segments_count.codes.map((code: any) => code.text);
      const data = project.codeStats.code_segments_count.codes.map((code: any) => code.segment_count);

      const pieData = {
        labels: labels,
        datasets: [
          {
            label: "Code Segment Count",
            data: data,
            backgroundColor: [
              "rgb(255, 99, 132)",
              "rgb(54, 162, 235)",
              "rgb(75, 192, 192)",
              "rgb(255, 205, 86)",
              "rgb(201, 203, 207)",
              "rgb(54, 162, 235)",
              "rgb(255, 99, 132)",
            ],
            borderWidth: 1,
          },
        ],
      };
      const pieOptions = {};

      return (
        <div key={index} className="chart-container w-fit mx-auto">
          <h3 className="text-xl text-black">{`${project.project.project_id} - ${project.project.project_name}`}</h3>
          <h3>{project.project.project_name}</h3>
          <div style={{ width: "900px" }}>
            <Pie options={pieOptions} data={pieData} />
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <Header title="Code Stats" />
      <div className="bubble-container">{renderBubbleCharts()}</div>
      <div className="pie-container">{renderPieCodeCharts()}</div>
    </div>
  );
}
