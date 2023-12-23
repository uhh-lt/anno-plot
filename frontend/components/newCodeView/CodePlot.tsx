import { useEffect, useRef, useContext, useState } from "react";

import { AppContext } from "@/context/AppContext";
import { hexToRGBA } from "@/utilities";
import { render } from "@/components/newCodeView/D3_Code_Plot_Manager";
import ContextMenu from "@/components/newCodeView/ContextMenuCodeDot";

export const DotPlotWebGL = ({}) => {
  const ref = useRef(null);
  const {
    codeAveragePositions,
    errors,
    arrows,
    setArrows,
    loading,
    codes,
    fetchProject,
    currentProject,
    filteredCodes,
      codeScale,
      transform,
        setTransform,
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
      nodeId: d.code_id,
      selected: [d.code_id],
      key: d.code_id,
    });
  };

  useEffect(() => {
    if (currentProject === 0) {
      return;
    }
    if (loading) {
      return;
    }
    setInitialized(true);
    //});
  }, [loading, currentProject]);
  useEffect(() => {
    // Initialize the D3 manager with the ref and handler functions
    if (!initialized) {
      return;
    }
    const d3_data = codeAveragePositions
      .filter((item) => filteredCodes.includes(item.code_id) && item.segment_count > 0).sort((a, b) => {
        return b.segment_count - a.segment_count;
        })
      .map((item) => ({
        code_id: item.code_id,
        text: item.text,
        x: item.average_position.x,
        y: item.average_position.y,
        r: item.segment_count*codeScale,
      }));

    render(d3_data, codes, handleRightClick, transform, setTransform);
    return () => {
    };
  }, [initialized, codeAveragePositions, errors, codes, filteredCodes, arrows, d3Manager, codeScale]);

  return (
    <>
      <ContextMenu
        key={contextMenu.key}
        event={contextMenu.event}
        nodeId={contextMenu.nodeId}
        selected={contextMenu.selected}
      />
      <div id="chart-container" style={{ width: "100%", height: "1000px", position: "relative" }}>
        <div id="chart" style={{ width: "100%", height: "100%", position: "relative" }}></div>
      </div>
    </>
  );
};

export default DotPlotWebGL;
