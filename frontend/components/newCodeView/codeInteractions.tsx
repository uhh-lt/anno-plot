import Header from "@/components/Header";
import Table from "@/components/CodeTree/Table";
import ConfigEditor from "@/components/ConfigEditor";
import React, {useContext} from "react";
import {Slider, Button} from "@mui/material";
import {AppContext} from "@/context/AppContext";
import AddCodeModal from "@/components/AddCodeModal";
import MergeModal from "@/components/MergeModal";

const CodeInteractions = () => {
    const {codeScale, setCodeScale, currentProject} = useContext(AppContext);
    const [addModalOpen, setAddModalOpen] = React.useState(false);
    const [mergeModalOpen, setMergeModalOpen] = React.useState(false);
    const [setParentModalOpen, setSetParentModalOpen] = React.useState(false);

    const handleAddCode = () => {
        setAddModalOpen(true);
    };

    const handleMergeCodes = () => {
        setMergeModalOpen(true);
    };

    const handleSetParent = () => {
    };

    const handleSliderChange = (event, newValue) => {
        setCodeScale(newValue);
    };

    return (
        <div>
            <MergeModal open={mergeModalOpen} handleClose={()=>{setMergeModalOpen(false)}} projectId={currentProject} setLoading={()=>{}} selected={[]}/>
            <AddCodeModal open={addModalOpen} handleClose={()=>{setAddModalOpen(false)}} projectId={currentProject} setLoading={()=>{}}/>
            <Slider
                value={codeScale}
                onChange={handleSliderChange}
                min={0.1}
                max={70}
                step={0.1}
                valueLabelDisplay="auto"
            />
            <Table />
            <div>
                <Button variant="contained" onClick={handleAddCode}>
                    Add Code
                </Button>
                <Button variant="contained" onClick={handleMergeCodes}>
                    Merge Codes
                </Button>
            </div>
        </div>
    );
};

export default CodeInteractions;