import { createContext, useEffect, useState } from "react";
import {
  getPlots,
  getProjects,
  getCodesRoutes,
  getClusterErrors,
  getCodeTree,
  getCodeStats,
  getConfig,
  updateConfig,
  trainDynamicCluster,
  trainDynamicCorrection,
} from "../api/api";

const defaultData = {
  loading: false,
  data: [],
  setData: (value: any[]) => {},
  codes: [],
  setCodes: (value: any[]) => {},
  codeTree: [],
  setCodeTree: (value: any[]) => {},
  errors: [],
  arrows: [],
  projects: [],
  currentProject: 0,
  fetchProjects: async () => {},
  fetchProject: async () => {},
  fetchCodes: async () => {},
  showClusters: async (value: any) => {},
  fetchErrors: async () => {},
  setCurrentProject: (value: any) => {},
  setArrows: (value: any[]) => {},
  setLoading: (value: boolean) => {},
  filteredCodes: [],
  setFilteredCodes: (value: any[]) => {},
  config: {} as any,
  localSetConfig: (value: any) => {},
  trainClusters: async () => {},
  codeAveragePositions: [],
  trainArrows: async () => {},
  showCluster: false,
  showError: false,
  setShowCluster: (value: boolean) => {},
  setShowError: (value: boolean) => {},
  codeScale: 70,
  setCodeScale: (value: number) => {},
  transform : null,
    setTransform: (value: any) => {},
};

export const AppContext = createContext(defaultData);

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [codeScale, setCodeScale] = useState(70);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState(0);

  const [codes, setCodes] = useState<any[]>([]);
  const [codeTree, setCodeTree] = useState<any[]>([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [codeAveragePositions, setCodeAveragePositions] = useState<any[]>([]);

  const [data, setData] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  const [arrows, setArrows] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [showCluster, setShowCluster] = useState(false);
  const [showError, setShowError] = useState(false);
  const [transform, setTransform] = useState(null);

  useEffect(() => {
    //reset transform when project changes
    setTransform(null);
  }, [currentProject]);
  useEffect(() => {
    console.log("Mounting: AppContext");
    fetchProjects();
    return () => {
      console.log("Unmounting: AppContext");
    };
  }, []);

  useEffect(() => {
    console.log("Current Project Changed");
    console.log(currentProject);
    fetchProject();
  }, [currentProject]);

  const fetchConfig = async () => {
    console.log("Fetching Config");
    const config_response = await getConfig(currentProject);
    setConfig(config_response.data.config);
  };

  const localSetConfig = async (newConfig) => {
    await updateConfig(currentProject, { name: "default", config: newConfig });
    await fetchProject();
  };
  const trainClusters = async () => {
    console.log("Training Clusters");
    const train_response = await trainDynamicCluster(currentProject, 3);
    await fetchProject();
  };

  const trainArrows = async () => {
    console.log("Training Arrows");
    const arrow_list = [];
    for (const arrow of arrows) {
      const new_arrow = {
        id: arrow.dot_id,
        pos: [arrow.end.x, arrow.end.y],
      };
      arrow_list.push(new_arrow);
    }
    console.log(arrow_list);
    const train_response = await trainDynamicCorrection(currentProject, 3, arrow_list);
    await fetchProject();
  };
  const fetchProjects = async () => {
    console.log("Fetching Projects");
    setLoading(true);
    const projects_response = await getProjects();
    setProjects(projects_response.data.data);
    if (currentProject === 0 && projects_response.data.data.length > 0) {
      setCurrentProject(projects_response.data.data[0].project_id);
    }
    setLoading(false);
  };

  const fetchProject = async () => {
    if (currentProject != 0) {
      console.log("Fetching Project");
      setLoading(true);
      await fetchData(true); //false);
      await fetchCodes();
      await fetchConfig();
      await fetchErrors();
      setLoading(false);
    }
  };

  const fetchAverageCodePositions = async () => {
    if (currentProject != 0) {
      console.log("Fetching Average Code Positions");
      const average_code_positions_response = await getCodeStats(currentProject);
      setCodeAveragePositions(average_code_positions_response.code_segments_count.codes);
    }
  };
  const fetchCodes = async (projectId = null) => {
    if (currentProject != 0) {
      console.log("Fetching Codes");
      const codes_tree = await getCodeTree(currentProject);
      setCodeTree(codes_tree.data.codes);
      const codes_response = await getCodesRoutes(currentProject);
      setCodes(codes_response.data.data);
      await fetchAverageCodePositions();
    }
  };

  const fetchData = async (withClusters: boolean) => {
    if (currentProject != 0) {
      console.log("Fetching Data");
      const data_response = await getPlots(currentProject, true, 0, 0);
      setData(data_response.data.data);
      // update arrow start position if its dot changed position
      // create mapper for the arrows which maps dot_id to arrow
      const arrow_mapper = {};
      for (const arrow of arrows) {
        arrow_mapper[arrow.dot_id] = arrow;
      }
      for (const data_point of data_response.data.data) {
        if (data_point.id in arrow_mapper) {
          const arrow = arrow_mapper[data_point.id];
          arrow.start.x = data_point.reduced_embedding.x;
          arrow.start.y = data_point.reduced_embedding.y;
        }
      }
      const new_arrows = [...arrows];
      setArrows(new_arrows);
    }
  };

  const showClusters = async (show: boolean) => {
    if (currentProject != 0) {
      if (show) {
        console.log("Fetching Clusters");
        await fetchData(true);
      } else {
        await fetchData(false);
      }
    }
  };

  const fetchErrors = async () => {
    if (currentProject != 0) {
      console.log("Fetching Errors");
      const errors_response = await getClusterErrors(currentProject, 0, 0.7);
      setErrors(errors_response.data.data);
    }
  };

  const contextValue = {
    loading,
    data,
    setData,
    codes,
    setCodes,
    codeTree,
    setCodeTree,
    errors,
    arrows,
    projects,
    currentProject,
    fetchProjects,
    fetchProject,
    fetchCodes,
    showClusters,
    fetchErrors,
    setCurrentProject,
    setArrows,
    filteredCodes,
    setFilteredCodes,
    config,
    localSetConfig,
    trainClusters,
    setLoading,
    codeAveragePositions,
    trainArrows,
    showCluster,
    showError,
    setShowCluster,
    setShowError,
    codeScale,
    setCodeScale,
    transform,
    setTransform,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
