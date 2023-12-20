import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { Box, Grid, Button, TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";

const ConfigEditor = ({}) => {
  const { config, loading, localSetConfig, showCluster, showError, setShowCluster, setShowError } =
    useContext(AppContext);
  const [inputConfig, setConfig] = useState(config);

  useEffect(() => {
    if (!config) return;
    const newConfig = { ...config };
    if (newConfig.model_type === "dynamic") {
      newConfig.reduction_config.args.n_components = 2;
      newConfig.reduction_config.args.metric = "cosine";
      newConfig.reduction_config.args.random_state = 42;
      newConfig.reduction_config.args.n_jobs = 1;
    }
    setConfig(newConfig);
  }, [loading, config]);
  const handleInputChange = (model, key, value) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [model]: {
        ...prevConfig[model],
        args: {
          ...prevConfig[model].args,
          [key]: value,
        },
      },
    }));
  };
  const handleToggleShowCluster = () => {
    setShowCluster(!showCluster);
  };

  const handleToggleShowError = () => {
    setShowError(!showError);
  };

  const toggleModelType = () => {
    //set model type to dynamic and reduction_config.model_name to dynamic_umap
    const newConfig = { ...inputConfig };
    newConfig.model_type = newConfig.model_type === "static" ? "dynamic" : "static";
    newConfig.reduction_config.model_name = newConfig.model_type === "static" ? "umap" : "dynamic_umap";
    setConfig(newConfig);
  };

  const handleSave = () => {
    localSetConfig(inputConfig);
  };

  if (loading || !config || !inputConfig) {
    return <div>Loading...</div>;
  }
  const reduction_configInputs =
    inputConfig.model_type === "static" ? (
      <Box>
        {Object.entries(inputConfig?.reduction_config?.args).map(([key, value]) => {
          if (key === "n_jobs" || key === "random_state") return null;
          return (
            <FormControl key={key} fullWidth margin="normal">
              <InputLabel>{key === "metric" ? key : ""}</InputLabel>

              {key === "metric" ? (
                <Select
                  id="metric"
                  value={value}
                  onChange={(e) => handleInputChange("reduction_config", key, e.target.value)}
                  label={key}
                >
                  <MenuItem value="cosine">cosine</MenuItem>
                  <MenuItem value="euclidean">euclidean</MenuItem>
                  <MenuItem value="manhattan">manhattan</MenuItem>
                  <MenuItem value="chebyshev">chebyshev</MenuItem>
                  <MenuItem value="minkowski">minkowski</MenuItem>
                  <MenuItem value="canberra">canberra</MenuItem>
                  <MenuItem value="braycurtis">braycurtis</MenuItem>
                  <MenuItem value="haversine">haversine</MenuItem>
                  <MenuItem value="mahalanobis">mahalanobis</MenuItem>
                  <MenuItem value="wminkowski">wminkowski</MenuItem>
                  <MenuItem value="seuclidean">seuclidean</MenuItem>
                  <MenuItem value="correlation">correlation</MenuItem>
                  <MenuItem value="hamming">hamming</MenuItem>
                  <MenuItem value="jaccard">jaccard</MenuItem>
                  <MenuItem value="dice">dice</MenuItem>
                  <MenuItem value="russellrao">russellrao</MenuItem>
                  <MenuItem value="kulsinski">kulsinski</MenuItem>
                  <MenuItem value="rogerstanimoto">rogerstanimoto</MenuItem>
                  <MenuItem value="sokalmichener">sokalmichener</MenuItem>
                  <MenuItem value="sokalsneath">sokalsneath</MenuItem>
                  <MenuItem value="yule">yule</MenuItem>
                </Select>
              ) : (
                // console log the key and value values: inside the html
                <TextField
                  id="not_metric"
                  type="number"
                  label={key}
                  value={value}
                  onChange={(e) => handleInputChange("reduction_config", key, Number(e.target.value))}
                  variant="outlined"
                  fullWidth
                />
              )}
            </FormControl>
          );
        })}
      </Box>
    ) : (
      <Box>
        <FormControl fullWidth margin="normal">
          <TextField
            type="number"
            label="n_neighbors"
            value={inputConfig?.reduction_config?.args.n_neighbors}
            onChange={(e) => handleInputChange("reduction_config", "n_neighbors", Number(e.target.value))}
            fullWidth
          />
        </FormControl>
      </Box>
    );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        {/* Embedding Model Config */}
        <Grid item xs={12} md={4}>
          <h3>Embedding Model Config</h3>
          {Object.entries(inputConfig?.embedding_config?.args).map(([key, value]) => (
            <TextField
              key={key}
              label={key}
              type="text"
              value={value}
              onChange={(e) => handleInputChange("embedding_config", key, e.target.value)}
              variant="outlined"
              fullWidth
              margin="normal"
            />
          ))}
        </Grid>

        {/* Cluster Model Config */}
        <Grid item xs={12} md={3}>
          <h3>Cluster Model Config</h3>
          {Object.entries(inputConfig.cluster_config.args).map(([key, value]) => (
            <FormControl key={key} fullWidth margin="normal">
              <InputLabel>{key === "metric" || key === "cluster_selection_method" ? key : ""}</InputLabel>
              {key === "metric" ? (
                <Select
                  label={key}
                  value={value}
                  onChange={(e) => handleInputChange("cluster_config", key, e.target.value)}
                >
                  <MenuItem value="euclidean">euclidean</MenuItem>
                  <MenuItem value="braycurtis">braycurtis</MenuItem>
                  <MenuItem value="canberra">canberra</MenuItem>
                  <MenuItem value="chebyshev">chebyshev</MenuItem>
                  <MenuItem value="cityblock">cityblock</MenuItem>
                  <MenuItem value="dice">dice</MenuItem>
                  <MenuItem value="hamming">hamming</MenuItem>
                  <MenuItem value="haversine">haversine</MenuItem>
                  <MenuItem value="infinity">infinity</MenuItem>
                  <MenuItem value="jaccard">jaccard</MenuItem>
                  <MenuItem value="kulsinski">kulsinski</MenuItem>
                  <MenuItem value="l1">l1</MenuItem>
                  <MenuItem value="l2">l2</MenuItem>
                  <MenuItem value="mahalanobis">mahalanobis</MenuItem>
                  <MenuItem value="manhattan">manhattan</MenuItem>
                  <MenuItem value="matching">matching</MenuItem>
                  <MenuItem value="minkowski">minkowski</MenuItem>
                  <MenuItem value="p">p</MenuItem>
                  <MenuItem value="pyfunc">pyfunc</MenuItem>
                  <MenuItem value="rogerstanimoto">rogerstanimoto</MenuItem>
                  <MenuItem value="russellrao">russellrao</MenuItem>
                  <MenuItem value="seuclidean">seuclidean</MenuItem>
                  <MenuItem value="sokalmichener">sokalmichener</MenuItem>
                  <MenuItem value="sokalsneath">sokalsneath</MenuItem>
                  <MenuItem value="wminkowski">wminkowski</MenuItem>
                </Select>
              ) : key === "cluster_selection_method" ? (
                <Select
                  label={key}
                  value={value}
                  onChange={(e) => handleInputChange("cluster_config", key, e.target.value)}
                >
                  <MenuItem value="eom">eom</MenuItem>
                  <MenuItem value="leaf">leaf</MenuItem>
                </Select>
              ) : (
                <TextField
                  type="number"
                  label={key}
                  value={value}
                  onChange={(e) => handleInputChange("cluster_config", key, Number(e.target.value))}
                  //variant="outlined"
                  fullWidth
                />
              )}
            </FormControl>
          ))}
        </Grid>

        {/* Reduction Model Config */}
        <Grid item xs={12} md={3}>
          <h3>Reduction Model Config</h3>
          {reduction_configInputs}
          <Button
            type="button"
            sx={{ backgroundColor: "#1E3A8A", color: "white" }}
            variant="contained"
            onClick={toggleModelType}
          >
            Switch to {inputConfig.model_type === "static" ? "dynamic" : "static"}
          </Button>
        </Grid>

        {/* Buttons at the bottom */}
        <Grid item xs={12} md={2}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Button
              type="button"
              sx={{ backgroundColor: "#1E3A8A", color: "white" }}
              variant="contained"
              onClick={handleSave}
            >
              Save Config
            </Button>
            <Button
              type="button"
              sx={{
                backgroundColor: showCluster ? "#4CAF50" : "#1E3A8A",
                color: "white",
              }}
              variant="contained"
              onClick={handleToggleShowCluster}
            >
              Show Clusters
            </Button>

            <Button
              type="button"
              sx={{
                backgroundColor: showError ? "#F44336" : "#1E3A8A",
                color: "white",
              }}
              variant="contained"
              onClick={handleToggleShowError}
            >
              Show Errors
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigEditor;
