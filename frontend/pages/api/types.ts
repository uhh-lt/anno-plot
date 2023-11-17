type CodeSegmentCount = {
  code_id: number;
  text: string;
  segment_count: number;
  average_position: {
    x: number;
    y: number;
  };
};

type CodeSegmentsResponse = {
  codes: CodeSegmentCount[];
};

type ProjectStatsResponse = {
  project_id: number;
  project_name: string;
  dataset_count: number;
  code_count: number;
  model_count: number;
  sentence_count: number;
  segment_count: number;
  embedding_count: number;
};

type ClusterStatsResponse = {
  project_name: string;
  project_id: number;
  cluster_count: number;
  unique_cluster_count: number;
  cluster_info: {
    cluster_value: number;
    segment_count: number;
  }[];
};

export type { CodeSegmentCount, CodeSegmentsResponse, ProjectStatsResponse, ClusterStatsResponse };
