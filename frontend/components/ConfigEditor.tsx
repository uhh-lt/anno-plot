import React, {useContext, useEffect, useState} from 'react';
import NumericInput from 'react-numeric-input';
import {AppContext} from "@/context/AppContext";
const ConfigEditor = ({ onSave }) => {
  const {config, loading,  localSetConfig} = useContext(AppContext);
  const [inputConfig, setConfig] = useState(config);

    useEffect(() => {
        if (!config) return;
        const newConfig = {...config};
        if (newConfig.model_type === "dynamic") {
            newConfig.reduction_config.args.n_components = 2;
            newConfig.reduction_config.args.metric = "cosine";
            newConfig.reduction_config.args.random_state = 42;
            newConfig.reduction_config.args.n_jobs = 1;
        }
        console.log("newConfig");
        console.log(newConfig);
        setConfig(newConfig);
    }, [loading, config]);
  const handleInputChange = (model, key, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [model]: {
        ...prevConfig[model],
        args: {
          ...prevConfig[model].args,
          [key]: value
        }
      }
    }));
  };

  const toggleModelType = () => {
      //set model type to dynamic and reduction_config.model_name to dynamic_umap
      const newConfig = {...inputConfig};
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

const reduction_configInputs = inputConfig.model_type === "static" ? (
  <div>
    {Object.entries(inputConfig?.reduction_config?.args).map(([key, value]) => {
      // Skip n_jobs and random_state
      if (key === 'n_jobs' || key === 'random_state') return null;

      return (
        <div key={key}>
          <label>{key}: </label>
          {key === 'metric' ? (
            <select
              value={value}
              onChange={e => handleInputChange('reduction_config', key, e.target.value)}
            >
              <option value="cosine">cosine</option>
              <option value="euclidean">euclidean</option>
              <option value="manhattan">manhattan</option>
              <option value="chebyshev">chebyshev</option>
              <option value="minkowski">minkowski</option>
              <option value="canberra">canberra</option>
              <option value="braycurtis">braycurtis</option>
              <option value="haversine">haversine</option>
              <option value="mahalanobis">mahalanobis</option>
              <option value="wminkowski">wminkowski</option>
              <option value="seuclidean">seuclidean</option>
              <option value="correlation">correlation</option>
              <option value="hamming">hamming</option>
              <option value="jaccard">jaccard</option>
              <option value="dice">dice</option>
              <option value="russellrao">russellrao</option>
              <option value="kulsinski">kulsinski</option>
              <option value="rogerstanimoto">rogerstanimoto</option>
              <option value="sokalmichener">sokalmichener</option>
              <option value="sokalsneath">sokalsneath</option>
              <option value="yule">yule</option>
            </select>
          ) : (
            <NumericInput
              value={value}
              onChange={value => handleInputChange('reduction_config', key, value)}
            />
          )}
        </div>
      );
    })}
  </div>
) : (
  <div>
    <label>n_neighbors: </label>
    <NumericInput
      value={inputConfig?.reduction_config?.args.n_neighbors}
      onChange={value => handleInputChange('reduction_config', 'n_neighbors', value)}
    />
  </div>
);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <div>
        <h3>Embedding Model Config</h3>
        {Object.entries(inputConfig?.embedding_config?.args).map(([key, value]) => (
          <div key={key}>
            <label>{key}: </label>
            <input
              type="text"
              value={value}
              onChange={e => handleInputChange('embedding_config', key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div>
        <h3>Cluster Model Config</h3>
        {Object.entries(inputConfig.cluster_config.args).map(([key, value]) => (
  <div key={key}>
    <label>{key}: </label>
    {key === 'metric' ? (
      <select
        value={value}
        onChange={e => handleInputChange('cluster_config', key, e.target.value)}
      >
        <option value="euclidean">euclidean</option>
        <option value="braycurtis">braycurtis</option>
        <option value="canberra">canberra</option>
        <option value="chebyshev">chebyshev</option>
        <option value="cityblock">cityblock</option>
        <option value="dice">dice</option>
        <option value="hamming">hamming</option>
        <option value="haversine">haversine</option>
        <option value="infinity">infinity</option>
        <option value="jaccard">jaccard</option>
        <option value="kulsinski">kulsinski</option>
        <option value="l1">l1</option>
        <option value="l2">l2</option>
        <option value="mahalanobis">mahalanobis</option>
        <option value="manhattan">manhattan</option>
        <option value="matching">matching</option>
        <option value="minkowski">minkowski</option>
        <option value="p">p</option>
        <option value="pyfunc">pyfunc</option>
        <option value="rogerstanimoto">rogerstanimoto</option>
        <option value="russellrao">russellrao</option>
        <option value="seuclidean">seuclidean</option>
        <option value="sokalmichener">sokalmichener</option>
        <option value="sokalsneath">sokalsneath</option>
        <option value="wminkowski">wminkowski</option>
      </select>
    ) : key === 'cluster_selection_method' ? (
      <select
        value={value}
        onChange={e => handleInputChange('cluster_config', key, e.target.value)}
      >
        <option value="eom">eom</option>
        <option value="leaf">leaf</option>
      </select>
    ) : (
      <NumericInput
        value={value}
        onChange={value => handleInputChange('cluster_config', key, value)}
      />
    )}
  </div>
))}

      </div>
      <div>
        <h3>Reduction Model Config</h3>
        {reduction_configInputs}
        <button onClick={toggleModelType}>
          Switch to {inputConfig.model_type === "static" ? "dynamic" : "static"}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleSave}>Save Config</button>
        <button onClick={handleSave}>Show Clusters</button>
        <button onClick={handleSave}>Show Errors</button>
      </div>
    </div>
  );
};

export default ConfigEditor;
