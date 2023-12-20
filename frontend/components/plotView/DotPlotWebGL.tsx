import { useEffect, useRef, useContext, useState } from "react";
import { D3_WebGL_Plot_Manager } from "./D3_WebGL_Plot_Manager";

import { AppContext } from "@/context/AppContext";
//import '../style/DotPlotWebGL.css';
import Annotation from "./Annotation";
import { hexToRGBA } from "@/utilities";
import dynamic from "next/dynamic";
import ContextMenu from "@/components/CodeTree/ContextMenu";
import ContextMenuCodeDot from "@/components/plotView/ContextMenuDot";

const createClusterErrorData = (data, errors, show_errors, show_clusters) => {
  let errorIds = new Set(errors);
  if (!show_errors) {
    errorIds = new Set([]);
  }
  const errorData = data.filter((item) => errorIds.has(item.id));
  const nonErrorData = data.filter((item) => !errorIds.has(item.id));

  const highlight_size = 60;
  const dot_size = 70;
  const error_size = 10;

  const highlightedNonErrorData = nonErrorData.flatMap((item) => {
    const highlightDot =
      show_clusters && item.cluster !== -1
        ? [
            {
              id: -1,
              x: item.reduced_embedding.x,
              y: item.reduced_embedding.y,
              r: dot_size + highlight_size,
              code_id: item.code,
              cluster_id: item.cluster,
            },
          ]
        : [];

    const originalDot = {
      id: item.id,
      x: item.reduced_embedding.x,
      y: item.reduced_embedding.y,
      r: dot_size,
      code_id: item.code,
      cluster_id: item.cluster,
    };

    return [...highlightDot, originalDot];
  });

  const highlightedErrorData = errorData.flatMap((item) => {
    const highlightDot =
      show_clusters && item.cluster !== -1
        ? [
            {
              id: -1,
              x: item.reduced_embedding.x,
              y: item.reduced_embedding.y,
              r: dot_size + highlight_size,
              code_id: item.code,
              cluster_id: item.cluster,
            },
          ]
        : [];

    const originalDot = {
      id: item.id,
      x: item.reduced_embedding.x,
      y: item.reduced_embedding.y,
      r: dot_size,
      code_id: item.code,
      cluster_id: item.cluster,
    };

    const errorHighlightDot = {
      id: -2,
      x: item.reduced_embedding.x,
      y: item.reduced_embedding.y,
      r: error_size, // Smaller radius for the error dot
      code_id: item.code,
      cluster_id: item.cluster,
    };

    return [...highlightDot, originalDot, errorHighlightDot];
  });

  return [...highlightedNonErrorData, ...highlightedErrorData];
};

export const DotPlotWebGL = () => {
  const ref = useRef(null);
  const {
    showCluster,
    showError,
    data,
    errors,
    arrows,
    setArrows,
    loading,
    codes,
    config,
    fetchProject,
    currentProject,
    filteredCodes,
  } = useContext(AppContext);
  const [initialized, setInitialized] = useState(false);
  const [d3Manager, setD3Manager] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [annotationCoord, setAnnotationCoord] = useState([0, 0]);
  const [annotationData, setAnnotationData] = useState(null);
  const [codeColor, setCodeColor] = useState("");
  const [contextMenu, setContextMenu] = useState({
    event: null,
    nodeId: null,
    selected: [],
    key: null,
  });

  const handleRightClick = (event, d) => {
    setContextMenu({
      event: event,
      nodeId: d.id,
      selected: [d.id],
      key: d.id,
    });
  };

  useEffect(() => {
    if (currentProject === 0) {
      return;
    }
    if (loading) {
      return;
    }
    //fetchProject().then(() => {
    const newManager = new D3_WebGL_Plot_Manager(ref.current, handleSetArrow, handleHoverLocal, handleRightClick);
    setD3Manager(newManager);
    setInitialized(true);
    //});
  }, [currentProject]); // loading used to be here
  useEffect(() => {
    // Initialize the D3 manager with the ref and handler functions
    if (!initialized) {
      return;
    }

    // only set dots which should be shown, and represent data
    const filtered_data = data.filter((item) => filteredCodes.includes(item.code));
    const highlightedDataWithError = createClusterErrorData(filtered_data, errors, showError, showCluster);
    let filtered_arrows = arrows.filter((arrow) => filteredCodes.includes(arrow.code_id));
    console.log(config);
    const dynamic = config?.model_type === "dynamic";
    if (!dynamic) {
      filtered_arrows = [];
    }
    d3Manager.ownFunctionZoomColor(highlightedDataWithError, codes, filtered_arrows, dynamic);
    d3Manager.handle_hover = handleHoverLocal;
    d3Manager.handle_set_arrow = handleSetArrow;

    // Update the plot when data or other dependencies change
    return () => {
      // Cleanup if necessary, e.g., removing event listeners
    };
  }, [showCluster, showError, initialized, data, errors, codes, config, filteredCodes, arrows]);

  const handleSetArrow = (data) => {
    const arrow_id = data.dot_id;
    const copy_arrows = [...arrows];
    const index = copy_arrows.findIndex((a) => a.dot_id === arrow_id);
    if (index !== -1) {
      copy_arrows.splice(index, 1);
    }
    copy_arrows.push(data);
    setArrows(copy_arrows);
  };
  const handleHoverLocal = (coordinate, data_id) => {
    //find the data point
    if (data_id === -1) {
      setShowAnnotations(false);
      return;
    }
    const data_point = data.find((d) => d.id === data_id);
    if (data_point === undefined) {
      setShowAnnotations(false);
      return;
    }
    const fitting_code = codes.find((c) => c.code_id === data_point.code);
    if (fitting_code === undefined || fitting_code === null) {
      setShowAnnotations(false);
      return;
    }

    const color_to_look_for = hexToRGBA(codes.find((c) => c.code_id === data_point.code).color, 0.5);
    setCodeColor(color_to_look_for);
    setAnnotationCoord(coordinate);
    setAnnotationData(data_point);
    setShowAnnotations(true);
  };
  return (
    <>
      <ContextMenuCodeDot
        key={contextMenu.key}
        event={contextMenu.event}
        nodeId={contextMenu.nodeId}
        selected={contextMenu.selected}
      />
      <div id="chart-container" style={{ width: "100%", height: "1000px", position: "relative" }}>
        {showAnnotations && <Annotation data={annotationData} color={codeColor} />}
        <div id="chart" style={{ width: "100%", height: "100%", position: "relative" }}></div>
      </div>
    </>
  );
};

export default DotPlotWebGL;
