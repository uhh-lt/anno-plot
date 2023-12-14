import { useEffect, useRef, useContext, useState } from 'react';


import { AppContext } from '@/context/AppContext';
//import '../style/DotPlotWebGL.css';
import {hexToRGBA} from "@/utilities.tsx";
import {D3_Code_Plot_Manager} from "@/components/newCodeView/D3_Code_Plot_Manager.tsx";

export const DotPlotWebGL = ({ handleHover, handleRightClick}) => {
    const ref = useRef(null);
    const { codeAveragePositions, errors,arrows, setArrows,loading,  clusters, codes, selected, fetchProject, currentProject, filteredCodes } = useContext(AppContext);
    const [initialized, setInitialized] = useState(false);
    const [d3Manager, setD3Manager] = useState(null);
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [annotationCoord, setAnnotationCoord] = useState([0,0]);
    const [annotationData, setAnnotationData] = useState(null);
    const [codeColor, setCodeColor] = useState("");

        useEffect(() => {
        if (currentProject === 0) {
            return;
        }
        if (loading) {
            return;
        }
        //fetchProject().then(() => {
            const newManager = new D3_Code_Plot_Manager(
                                                                        ref.current,
                                                                        handleRightClick
                                                                    );
            setD3Manager(newManager);
            setInitialized(true);
        //});
    }, [loading, currentProject]);
    useEffect(() => {
        // Initialize the D3 manager with the ref and handler functions
        if (!initialized) {
            return;
        }

        const d3_data = codeAveragePositions.filter(item => filteredCodes.includes(item.code_id)).map(item => ({
        code_id: item.code_id,
            text: item.text,
        x: item.average_position.x,
        y: item.average_position.y,
        r: item.segment_count,
    }));
        d3Manager.ownFunctionZoomColor(d3_data, codes);

        // Update the plot when data or other dependencies change
        return () => {
            // Cleanup if necessary, e.g., removing event listeners
        };
    }, [initialized, codeAveragePositions, errors, codes, selected, filteredCodes, arrows]);


    return (

    <div id="chart-container" style={{ width: '100%', height: '1000px', position: "relative"}}>
        <div id="chart" style={{ width: '100%', height: '100%', position: 'relative'}}></div>

    </div>
);

};

export default DotPlotWebGL;