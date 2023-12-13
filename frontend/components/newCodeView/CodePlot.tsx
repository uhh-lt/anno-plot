import { useEffect, useRef, useContext, useState } from 'react';
import { D3_Code_Plot_Manager } from './D3_Code_Plot_Manager.tsx';


import { AppContext } from '@/context/AppContext';
//import '../style/DotPlotWebGL.css';
import {hexToRGBA} from "@/utilities.tsx";
import {D3_WebGL_Plot_Manager} from "@/components/plotView/D3_WebGL_Plot_Manager";

export const DotPlotWebGL = ({ handleHover, handleRightClick}) => {
    const ref = useRef(null);
    const { data, errors,arrows, setArrows,loading,  clusters, codes, selected, fetchProject, currentProject, filteredCodes } = useContext(AppContext);
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
            const newManager = new D3_WebGL_Plot_Manager(
                                                                        ref.current,
                                                                        handleSetArrow,
                                                                        handleHoverLocal,
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

        // only set dots whos code is in filteredCodes
        const d3_data = data.filter(item => filteredCodes.includes(item.code)).map(item => ({
        id: item.id,
        x: item.reduced_embedding.x,
        y: item.reduced_embedding.y,
        r: 5, // Radius is always 1
        code_id: item.code
    }));
        // filter arrows based on weather the code is in filteredCodes
        const filtered_arrows = arrows.filter(arrow => filteredCodes.includes(arrow.code_id));
        d3Manager.ownFunctionZoomColor(d3_data, codes, filtered_arrows);
        d3Manager.handle_hover = handleHoverLocal;
        d3Manager.handle_set_arrow = handleSetArrow;

        // Update the plot when data or other dependencies change
        return () => {
            // Cleanup if necessary, e.g., removing event listeners
        };
    }, [initialized, data, errors, codes, selected, filteredCodes, arrows]);

    const handleSetArrow = (data) => {
        const arrow_id = data.dot_id;
        const copy_arrows = [...arrows];
        const index = copy_arrows.findIndex(a => a.dot_id === arrow_id);
        if (index !== -1) {
            copy_arrows.splice(index, 1);
        }
        copy_arrows.push(data);
        setArrows(copy_arrows);
    }
    const handleHoverLocal = (coordinate, data_id) => {
        //find the data point
        if (data_id === -1) {
            setShowAnnotations(false);
            return;
        }
        const data_point = data.find(d => d.id === data_id);
        if (data_point === undefined) {
            setShowAnnotations(false);
            return;
        }
        const fitting_code = codes.find(c => c.code_id === data_point.code);
        if (fitting_code === undefined || fitting_code === null) {
            setShowAnnotations(false);
            return;
        }

        const color_to_look_for = hexToRGBA(codes.find(c => c.code_id === data_point.code).color, 0.5);
        setCodeColor(color_to_look_for);
        setAnnotationCoord(coordinate);
        setAnnotationData(data_point);
        setShowAnnotations(true);
    }
    return (

    <div id="chart-container" style={{ width: '100%', height: '1000px', position: "relative"}}>
        {showAnnotations && <Annotation data={annotationData} color={codeColor} />}
        <div id="chart" style={{ width: '100%', height: '100%', position: 'relative'}}></div>

    </div>
);

};

export default DotPlotWebGL;