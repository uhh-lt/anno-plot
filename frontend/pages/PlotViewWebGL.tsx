//import {DotPlotWebGL} from "../components/plotView/DotPlotWebGL.tsx";
import Table from "../components/CodeTree/Table.tsx";
import ProjectDropdown from "../components/Menu/ProjectDropdown.tsx";
import ScrollableList from "../components/ScrollableList.tsx";
import TrainingComponent from "../components/TrainingComponent.tsx";
import ConfigEditor from "../components/ConfigEditor.tsx";
import Header from "@/components/Header";
import React from "react";


import dynamic from 'next/dynamic';

const DotPlotWebGL = dynamic(() => import("../components/plotView/DotPlotWebGL.tsx"), { ssr: false });


const PlotView = () => {
    return (
        <div>
         <Header title="Plot View" />
        <div id= "try" style={{ textAlign: 'center', marginTop: '50px', position:"relative" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'}}>
                <Table/>
                <DotPlotWebGL/>
                <TrainingComponent/>

        </div>
            <ConfigEditor/>
            </div>
            </div>
    );
};

export default PlotView;
