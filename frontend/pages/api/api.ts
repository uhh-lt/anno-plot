import axios from "axios";

import { CodeSegmentsResponse, ProjectStatsResponse, ClusterStatsResponse } from "@/pages/api/types";

// Define the base URL of your FastAPI server
const baseURL = "http://localhost:8000";
const datasetName = "few_nerd";

// Projects

export const getProjects = (): Promise<any> => {
  console.log(`${baseURL}/data/${datasetName}/projects/`);
  return axios.get<any>(`${baseURL}/projects/`);
};

export const getProject = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/`);
};

export const deleteProject = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/`);
  return axios.delete(`${baseURL}/projects/${project_id}/`);
};

export const updateProjectName = (project_id: number, projectName: string): Promise<any> => {
  console.log(projectName, "projectName");
  console.log(project_id, "project_id");
  return axios.put(`${baseURL}/projects/${project_id}/?project_name=${projectName}`);
};

// Configs

export const getConfigs = (): Promise<any> => {
  console.log(`${baseURL}/configs/`);
  return axios.get<any>(`${baseURL}/configs/`);
};

export const getConfig = (config_id: number): Promise<any> => {
  console.log(`${baseURL}/configs/${config_id}`);
  return axios.get<any>(`${baseURL}/configs/${config_id}`);
};

export const updateConfig = (config_id: number, configData: any): Promise<any> => {
  let body = {
    name: configData.name,
    model_type: configData.config.model_type,
    embedding_config: configData.config.embedding_config,
    reduction_config: configData.config.reduction_config,
    cluster_config: configData.config.cluster_config,
  };
  console.log(`${baseURL}/configs/${config_id}`, body);

  return axios.put<any>(`${baseURL}/configs/${config_id}`, body);
};

export const postProject = (projectName: string): Promise<any> => {
  console.log(`${baseURL}/projects/?project_name=${projectName}`);
  return axios.post(`${baseURL}/projects/?project_name=${projectName}`);
};

// Datasets
export const getDatasets = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/datasets/`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/datasets/`);
};

export const updateDataset = (project_id: number, dataset_id: number, datasetName: string): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/datasets/${dataset_id}/?dataset_name=${datasetName}`);
  return axios.put(`${baseURL}/projects/${project_id}/datasets/${dataset_id}/?dataset_name=${datasetName}`);
};

export const deleteDataset = (project_id: number, dataset_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/datasets/${dataset_id}`);
  return axios.delete(`${baseURL}/projects/${project_id}/datasets/${dataset_id}`);
};

export const uploadTestDataset = (): Promise<any> => {
  console.log(`${baseURL}/data/${datasetName}/codes/roots`);
  return axios.get<any>(`${baseURL}/projects/%7Bproject_id%7D/plots/test/`);
};

export const uploadDataset = (projectId: number, datasetName: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(
    `${baseURL}/projects/${projectId}/datasets/upload?dataset_name=${datasetName}&split=%5Ct&sentence_split=%5Cn%5Cn&word_idx=0&label_idx=1&label_split=-&type=plain`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const uploadAdvancedDataset = (
  projectId: number,
  datasetName: string,
  file: File,
  split: string,
  sentence_split: string,
  word_idx: number,
  label_idx: number,
  label_split: string,
  type: string,
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(
    `${baseURL}/projects/${projectId}/datasets/upload?dataset_name=${datasetName}&split=${split}&sentence_split${sentence_split}&word_idx=${word_idx}&label_idx=${label_idx}&label_split=${label_split}&type=${type}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

// Codes

export const mergeCodes = (project_id: number, codes: number[], codeName: string): Promise<any> => {
  const body = {
    list_of_codes: codes,
    new_code_name: codeName,
  };

  console.log(`${baseURL}/projects/${project_id}/codes/merge \n`, body);
  return axios.post<any>(`${baseURL}/projects/${project_id}/codes/merge`, body);
};

export const extractCodes = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/extract`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/extract`);
};

export const getCodesRoutes = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/`);
};

export const getCodeRoots = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/roots`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/roots`);
};

export const getCodeLeaves = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/leaves`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/leaves`);
};

export const getCodeTree = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/tree`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/tree`);
};

export const getCodeRoute = (id: number, project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/${id}`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/codes/${id}`);
};

export const updateCodeRoute = (
  id: number,
  codeName: string,
  project_id: number,
  topLevelCodeId: number | null,
): Promise<any> => {
  const body = {
    code: codeName,
    top_level_code_id: topLevelCodeId,
  };

  console.log(`${baseURL}/projects/${project_id}/codes/${id}`, body);
  return axios.put<any>(`${baseURL}/projects/${project_id}/codes/${id}`, body);
};

export const addCodeToParent = (id: number, projectId: number, topLevelCodeId: number): Promise<any> => {
  return axios.put<any>(`${baseURL}/projects/${projectId}/codes/%7Bid%7D?code_id=${id}&parent_id=${topLevelCodeId}`);
};

export const addCodeToSegment = (id: number, projectId: number, topLevelCodeId: number): Promise<any> => {
  return axios.put<any>(`${baseURL}/projects/${projectId}/plots/segment/${id}?code_id=${topLevelCodeId}`);
};

export const renameCode = (
  id: number,
  codeName: string,
  projectId: number,
  topLevelCodeId: number | null,
): Promise<any> => {
  if (topLevelCodeId == null) {
    return axios.put<any>(`${baseURL}/projects/${projectId}/codes/%7Bid%7D?code_id=${id}&code_name=${codeName}`);
  } else {
    return axios.put<any>(
      `${baseURL}/projects/${projectId}/codes/%7Bid%7D?code_id=${id}&code_name=${codeName}&parent_id=${topLevelCodeId}`,
    );
  }
};

export const deleteCodeRoute = (id: number, project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/${id}`);
  return axios.delete(`${baseURL}/projects/${project_id}/codes/${id}`);
};

export const insertCodeRoute = (codeName: string, project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/?code_name=${codeName}`);
  return axios.post(`${baseURL}/projects/${project_id}/codes/?code_name=${codeName}`);
};

export const insertCodeRouteWithParent = (
  codeName: string,
  project_id: number,
  topLevelCodeId: number,
): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/codes/?code_name=${codeName}&parent_id=${topLevelCodeId}`);
  return axios.post(`${baseURL}/projects/${project_id}/codes/?code_name=${codeName}&parent_id=${topLevelCodeId}`);
};

// Databases
export const initTables = (): Promise<any> => {
  console.log(`${baseURL}/databases/tables/init`);
  return axios.get<any>(`${baseURL}/databases/tables/init`);
};

export const getDatabaseInfos = (): Promise<any> => {
  console.log(`${baseURL}/databases/tables/infos`);
  return axios.get<any>(`${baseURL}/databases/tables/infos`);
};

export const deleteDatabaseTables = (): Promise<any> => {
  console.log(`${baseURL}/databases/tables`);
  return axios.delete(`${baseURL}/databases/tables`);
};

export const deleteDatabaseTable = (tableName: string): Promise<any> => {
  console.log(`${baseURL}/databases/${tableName}`);
  return axios.delete(`${baseURL}/databases/${tableName}`);
};

export const listFiles = (): Promise<any> => {
  console.log(`${baseURL}/databases/list-files`);
  return axios.get<any>(`${baseURL}/databases/list-files`);
};

export const downloadFile = (filePath: string) => {
  let filename: string = filePath.split("/").pop() || "";
  console.log(`${baseURL}/databases/download/${filePath}`);
  fetch(`${baseURL}/databases/download/${filePath}`, {
    method: "GET",
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
};

// Embeddings
export const getEmbeddings = (
  project_id: number,
  all: boolean,
  page: number,
  page_size: number,
  reduce_length: number,
): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/embeddings/?all=${all}&page=${page}&page_size=${page_size}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/embeddings/?all=${all}&page=${page}&page_size=${page_size}&reduce_length=${reduce_length}`,
  );
};

export const extractEmbeddings = (project_id: number, batch_size: number, use_disk_storage: boolean): Promise<any> => {
  console.log(
    `${baseURL}/projects/${project_id}/embeddings/extract?batch_size=${batch_size}&use_disk_storage=${use_disk_storage}`,
  );
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/embeddings/extract?batch_size=${batch_size}&use_disk_storage=${use_disk_storage}`,
  );
};

// Reduced Embeddings
export const getReducedEmbeddings = (
  project_id: number,
  all: boolean,
  page: number,
  page_size: number,
): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/reduced_embeddings/?all=${all}&page=${page}&page_size=${page_size}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/reduced_embeddings/?all=${all}&page=${page}&page_size=${page_size}`,
  );
};

export const extractReducedEmbeddings = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/reduced_embeddings/extract`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/reduced_embeddings/extract`);
};

// Clusters
export const getClusters = (project_id: number, all: boolean, page: number, page_size: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/clusters/?all=${all}&page=${page}&page_size=${page_size}`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/clusters/?all=${all}&page=${page}&page_size=${page_size}`);
};

export const extractClusters = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/clusters/extract`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/clusters/extract`);
};

// Sentences
export const getSentences = (project_id: number, dataset_id: number, page: number, page_size: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/datasets/${dataset_id}/entries/?page=${page}&page_size=${page_size}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/datasets/${dataset_id}/entries/?page=${page}&page_size=${page_size}`,
  );
};

// Plots
// 'http://localhost:8000/projects/1/plots/?all=false&page=0&page_size=100'
export const getPlots = (project_id: number, all: boolean, page: number, page_size: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/?all=${all}&page=${page}&page_size=${page_size}`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/plots/?all=${all}&page=${page}&page_size=${page_size}`);
};

export const searchSentence = (project_id: number, search_query: string, limit: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/sentence/?search_query=${search_query}&limit=${limit}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/plots/sentence/?search_query=${search_query}&limit=${limit}`,
  );
};
// search code
/*
curl -X 'GET' \
  'http://localhost:8000/projects/1/plots/code/?search_code_id=1&limit=100' \
  -H 'accept: application/json'
*/

export const searchCode = (project_id: number, search_code_id: number, limit: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/code/?search_code_id=${search_code_id}&limit=${limit}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/plots/code/?search_code_id=${search_code_id}&limit=${limit}`,
  );
};

// search cluster
/*
curl -X 'GET' \
  'http://localhost:8000/projects/1/plots/cluster/?search_cluster_id=1&limit=100' \
  -H 'accept: application/json'
*/

export const searchCluster = (project_id: number, search_cluster_id: number, limit: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/cluster/?search_cluster_id=${search_cluster_id}&limit=${limit}`);
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/plots/cluster/?search_cluster_id=${search_cluster_id}&limit=${limit}`,
  );
};

// search segment
/*
curl -X 'GET' \
  'http://localhost:8000/projects/1/plots/segment?search_segment_query=statdium&limit=100' \
  -H 'accept: application/json'
*/

export const searchCodeOccurrences = (
  project_id: number,
  code_id: number,
  search_segment_query: string,
  limit: number,
): Promise<any> => {
  console.log(
    `${baseURL}/projects/${project_id}/plots/code/${code_id}/search?search_segment_query=${search_segment_query}&limit=${limit}`,
  );
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/plots/code/${code_id}/search?search_segment_query=${search_segment_query}&limit=${limit}`,
  );
};

export const searchSegment = (project_id: number, search_segment_query: string, limit: number): Promise<any> => {
  console.log(
    `${baseURL}/projects/${project_id}/plots/segment?search_segment_query=${search_segment_query}&limit=${limit}`,
  );
  return axios.get<any>(
    `${baseURL}/projects/${project_id}/plots/segment?search_segment_query=${search_segment_query}&limit=${limit}`,
  );
};

export const recalculateEntries = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/recalculate/`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/plots/recalculate/`);
};

// export to files
export const exportToFiles = (project_id: number): Promise<any> => {
  console.log(`${baseURL}/projects/${project_id}/plots/exportToFiles/`);
  return axios.get<any>(`${baseURL}/projects/${project_id}/plots/exportToFiles/`);
};

// stats
export const getProjectStats = (project_id: number): Promise<ProjectStatsResponse> => {
  console.log(`${baseURL}/projects/${project_id}/plots/stats/project/`);
  return axios
    .get<ProjectStatsResponse>(`${baseURL}/projects/${project_id}/plots/stats/project/`)
    .then((response) => response.data);
};

export const getCodeStats = (project_id: number): Promise<CodeSegmentsResponse> => {
  console.log(`${baseURL}/projects/${project_id}/plots/stats/code/`);
  return axios
    .get<CodeSegmentsResponse>(`${baseURL}/projects/${project_id}/plots/stats/code/`)
    .then((response) => response.data);
};

export const getClusterStats = (project_id: number): Promise<ClusterStatsResponse> => {
  console.log(`${baseURL}/projects/${project_id}/plots/stats/cluster/`);
  return axios
    .get<ClusterStatsResponse>(`${baseURL}/projects/${project_id}/plots/stats/cluster/`)
    .then((response) => response.data);
};
