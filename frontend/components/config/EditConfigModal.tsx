import React, { useEffect, useState } from "react";

import { Button, Modal, TextField } from "@mui/material";

import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

/**
 * This component displays a modal for editing the configurations of a project.
 */

type Config = {
  name: string;
  config: {
    name: string;
    embedding_config: {
      args: {
        pretrained_model_name_or_path: string;
      };
      model_name: string;
    };
    reduction_config: {
      args: {
        n_neighbors: number;
        n_components: number;
        metric: string;
        random_state: number;
        n_jobs: number;
      };
      model_name: string;
    };
    cluster_config: {
      args: {
        min_cluster_size: number;
        metric: string;
        cluster_selection_method: string;
      };
      model_name: string;
    };
    model_type: string;
  };
  config_id: number;
  project_id: number;
  project_name: string;
};

let emptyConf = {
  name: "",
  config_id: 0,
  project_id: 0,
  project_name: "",
  config: {
    name: "",
    embedding_config: {
      args: {
        pretrained_model_name_or_path: "",
      },
      model_name: "",
    },
    reduction_config: {
      args: {
        n_neighbors: 0,
        n_components: 0,
        metric: "",
        random_state: 0,
        n_jobs: 0,
      },
      model_name: "",
    },
    cluster_config: {
      args: {
        min_cluster_size: 0,
        metric: "",
        cluster_selection_method: "",
      },
      model_name: "",
    },
    model_type: "",
  },
};

interface EditModalProps {
  open: boolean;
  handleClose: () => void;
  config: Config;
  onEdit: (config: Config) => Promise<any>;
  key: number;
  setLoading: () => void;
}

function updateJsonWithPath(json: any, path: string, value: any): any {
  const keys = path.split(".");
  let current = json;
  if (keys.length === 1) {
    current[keys[0]] = value;

    return current;
  }
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return current;
}

export default function EditModal(props: EditModalProps) {
  const getInitialFormData = () => {
    return {
      name: props?.config?.name,
      config_id: props?.config?.config_id,
      project_id: props?.config?.project_id,
      project_name: props?.config?.project_name,
      config: {
        name: props?.config?.config?.name,
        embedding_config: {
          args: {
            pretrained_model_name_or_path: props?.config?.config?.embedding_config?.args?.pretrained_model_name_or_path,
          },
          model_name: props?.config?.config?.embedding_config?.model_name,
        },
        reduction_config: {
          args: {
            n_neighbors: props?.config?.config?.reduction_config?.args?.n_neighbors,
            n_components: props?.config?.config?.reduction_config?.args?.n_components,
            metric: props?.config?.config?.reduction_config?.args?.metric,
            random_state: props?.config?.config?.reduction_config?.args?.random_state,
            n_jobs: props?.config?.config?.reduction_config?.args?.n_jobs,
          },
          model_name: props?.config?.config?.reduction_config?.model_name,
        },
        cluster_config: {
          args: {
            min_cluster_size: props?.config?.config?.cluster_config?.args?.min_cluster_size,
            metric: props?.config?.config?.cluster_config?.args?.metric,
            cluster_selection_method: props?.config?.config?.cluster_config?.args?.cluster_selection_method,
          },
          model_name: props?.config?.config?.cluster_config?.model_name,
        },
        model_type: props?.config?.config?.model_type,
      },
    };
  };

  const [formData, setFormData] = useState<Config>(getInitialFormData);
  const [isDynamicModel, setIsDynamicModel] = useState<boolean>(props?.config?.config?.model_type === "dynamic");

  const handleFinish = async (newbody: any) => {
    try {
      props.setLoading();
      await props.onEdit(newbody);
      setClosed();
      props.setLoading();
    } catch (error) {
      // Handle error
    } finally {
      setClosed();
    }
  };

  function setClosed() {
    // reset all
    setFormData(emptyConf);

    props.handleClose();
  }

  const handleSave = () => {
    props.setLoading();
    let oldFormData = getInitialFormData();
    if (!formData) {
      setClosed();
      props.setLoading();
    }
    if (formData.name != "") {
      oldFormData.name = formData.name;
    }
    if (formData.config.model_type != undefined && formData.config.model_type != "") {
      oldFormData.config.model_type = formData.config.model_type;
    }
    if (
      formData.config.embedding_config.args.pretrained_model_name_or_path != undefined &&
      formData.config.embedding_config.args.pretrained_model_name_or_path != ""
    ) {
      oldFormData.config.embedding_config.args.pretrained_model_name_or_path =
        formData.config.embedding_config.args.pretrained_model_name_or_path;
    }
    // formData?.config?.reduction_config?.args?.n_neighbors
    if (
      formData.config.reduction_config.args.n_neighbors != undefined &&
      formData.config.reduction_config.args.n_neighbors != 0
    ) {
      oldFormData.config.reduction_config.args.n_neighbors = formData.config.reduction_config.args.n_neighbors;
    }
    // props?.config?.config?.reduction_config?.args?.n_components
    if (
      formData.config.reduction_config.args.n_components != undefined &&
      formData.config.reduction_config.args.n_components != 0
    ) {
      oldFormData.config.reduction_config.args.n_components = formData.config.reduction_config.args.n_components;
    }
    // props?.config?.config?.reduction_config?.args?.metric
    if (
      formData.config.reduction_config.args.metric != undefined &&
      formData.config.reduction_config.args.metric != ""
    ) {
      oldFormData.config.reduction_config.args.metric = formData.config.reduction_config.args.metric;
    }
    // props?.config?.config?.reduction_config?.args?.random_state
    if (
      formData.config.reduction_config.args.random_state != undefined &&
      formData.config.reduction_config.args.random_state != 0
    ) {
      oldFormData.config.reduction_config.args.random_state = formData.config.reduction_config.args.random_state;
    }
    // props?.config?.config?.reduction_config?.args?.n_jobs
    if (
      formData.config.reduction_config.args.n_jobs != undefined &&
      formData.config.reduction_config.args.n_jobs != 0
    ) {
      oldFormData.config.reduction_config.args.n_jobs = formData.config.reduction_config.args.n_jobs;
    }
    // props?.config?.config?.cluster_config?.args?.min_cluster_size
    if (
      formData.config.cluster_config.args.min_cluster_size != undefined &&
      formData.config.cluster_config.args.min_cluster_size != 0
    ) {
      oldFormData.config.cluster_config.args.min_cluster_size = formData.config.cluster_config.args.min_cluster_size;
    }
    if (isDynamicModel) {
      oldFormData.config.reduction_config.model_name = "dynamic_umap";
    } else {
      oldFormData.config.reduction_config.model_name = "umap";
    }

    handleFinish(oldFormData);
    setClosed();
    props.setLoading();
  };

  useEffect(() => {
    // This will run only once when the component mounts
    setIsDynamicModel(props?.config?.config?.model_type === "dynamic" || formData?.config?.model_type === "dynamic");
  }, []);

  useEffect(() => {
    setIsDynamicModel(props?.config?.config?.model_type === "dynamic");
  }, [props?.config?.config?.model_type]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let updatedForm = updateJsonWithPath(formData, name, value);
    setFormData({ ...formData, ...updatedForm });
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    switch (name) {
      case "model_type":
        setIsDynamicModel(value === "dynamic");
        setFormData({ ...formData, config: { ...formData.config, model_type: value } });
        break;
      default:
        setFormData({ ...formData, name: value });
        break;
    }
  };

  return (
    <Modal open={props.open} onClose={setClosed}>
      <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
        <div className="overflow-y-auto max-h-[70vh]">
          <p>Edit Config</p>
          <p>Config ID: {props?.config?.config_id}</p>
          <TextField
            name="name"
            label="Config Name"
            value={formData?.name || props?.config?.name}
            onChange={handleInputChange}
            variant="outlined"
            className="mb-2"
            fullWidth
          />
          <TextField
            name="project_name"
            label="Project Name"
            value={props?.config?.project_name}
            variant="outlined"
            className="mb-3"
            fullWidth
            disabled
          />
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Model Type</InputLabel>
              <Select
                name="model_type"
                label="Model Type"
                value={formData?.config?.model_type || props?.config?.config?.model_type}
                variant="outlined"
                className="mb-2"
                fullWidth
                onChange={handleSelectChange}
                sx={{ textAlign: "left" }}
              >
                <MenuItem value={"static"}>static</MenuItem>
                <MenuItem value={"dynamic"}>dynamic</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* all config properties */}
          <p>Embedding config</p>
          <TextField
            name="config.embedding_config.model_name"
            label="embedding_config"
            value={props?.config?.config?.embedding_config?.model_name}
            variant="outlined"
            className="mb-3"
            fullWidth
          />
          <TextField
            name="config.embedding_config.args.pretrained_model_name_or_path"
            label="pretrained_model_name_or_path"
            value={
              formData?.config?.embedding_config?.args?.pretrained_model_name_or_path ||
              props?.config?.config?.embedding_config?.args?.pretrained_model_name_or_path
            }
            onChange={handleInputChange}
            variant="outlined"
            className="mb-2"
            fullWidth
          />
          <p>Reduction config</p>
          {isDynamicModel && (
            // Render fields for dynamic model
            <div>
              <TextField
                name="config.reduction_config.model_name"
                label="reduction_config"
                value="dynamic_umap"
                variant="outlined"
                className="mb-3"
                fullWidth
                disabled
              />
              <TextField
                name="config.reduction_config.args.n_neighbors"
                label="n_neighbors"
                value={
                  formData?.config?.reduction_config?.args?.n_neighbors ||
                  props?.config?.config?.reduction_config?.args?.n_neighbors
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
            </div>
          )}
          {!isDynamicModel && (
            // Render fields for static model
            <div>
              <TextField
                name="config.reduction_config.model_name"
                label="reduction_config"
                value="umap"
                variant="outlined"
                className="mb-3"
                fullWidth
                disabled
              />
              <TextField
                name="config.reduction_config.args.n_neighbors"
                label="n_neighbors"
                value={
                  formData?.config?.reduction_config?.args?.n_neighbors ||
                  props?.config?.config?.reduction_config?.args?.n_neighbors
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
              <TextField
                name="config.reduction_config.args.n_components"
                label="n_components"
                value={
                  formData?.config?.reduction_config?.args?.n_components ||
                  props?.config?.config?.reduction_config?.args?.n_components
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
              <TextField
                name="config.reduction_config.args.metric"
                label="metric"
                value={
                  formData?.config?.reduction_config?.args?.metric ||
                  props?.config?.config?.reduction_config?.args?.metric
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
              <TextField
                name="config.reduction_config.args.random_state"
                label="random_state"
                value={
                  formData?.config?.reduction_config?.args?.random_state ||
                  props?.config?.config?.reduction_config?.args?.random_state
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
              <TextField
                name="config.reduction_config.args.n_jobs"
                label="n_jobs"
                value={
                  formData?.config?.reduction_config?.args?.n_jobs ||
                  props?.config?.config?.reduction_config?.args?.n_jobs
                }
                onChange={handleInputChange}
                variant="outlined"
                className="mb-2"
                fullWidth
              />
            </div>
          )}
          <p>Cluster config</p>
          <TextField
            name="config.cluster_config.model_name"
            label="cluster_config"
            value={props?.config?.config?.cluster_config?.model_name}
            variant="outlined"
            className="mb-3"
            fullWidth
          />
          <TextField
            name="config.cluster_config.args.min_cluster_size"
            label="min_cluster_size"
            value={
              formData?.config?.cluster_config?.args?.min_cluster_size ||
              props?.config?.config?.cluster_config?.args?.min_cluster_size
            }
            onChange={handleInputChange}
            variant="outlined"
            className="mb-2"
            fullWidth
          />
          <TextField
            name="config.cluster_config.args.metric"
            label="metric"
            value={props?.config?.config?.cluster_config?.args?.metric}
            variant="outlined"
            className="mb-3"
            fullWidth
          />
          <TextField
            name="config.cluster_config.args.cluster_selection_method"
            label="cluster_selection_method"
            value={props?.config?.config?.cluster_config?.args?.cluster_selection_method}
            variant="outlined"
            className="mb-3"
            fullWidth
          />
          <Button variant="contained" className="my-5" component="label" onClick={handleSave}>
            Save
          </Button>
          <Button variant="contained" className="my-5" component="label" onClick={setClosed}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
