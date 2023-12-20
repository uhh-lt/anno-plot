import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {useEffect, useState} from "react";
import RenameModal from "../modals/RenameModal";
import ChooseCodeModal from "../modals/ChooseCodeModal.tsx";
import {AppContext} from "@/context/AppContext";
import {addCodeToSegmentRoute, deleteCodeRoute, deleteSegment, updateCode} from "@/api/api";

export default function ContextMenuCodeDot({event, nodeId, selected}) {
    const {currentProject, fetchCodes, fetchProject} = React.useContext(AppContext);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [Loading, setLoading] = useState(true);
  const [multipleSelected, setMultipleSelected] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

    useEffect(() => {
        if (event !== null && event !== undefined) {
            handleContextMenu(event);
        }
    }, [event, nodeId, selected]);

    useEffect(() => {
        if (!Loading) {
            handleContextMenu(event);
        }
    }, [Loading]);
  const handleContextMenu = (event: React.MouseEvent) => {
      console.log(nodeId, selected);
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        :
          null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleRightClick = (event) => {
  event.preventDefault(); // Prevent default browser context menu
  if (contextMenu) {
    handleClose(); // Close the current menu if open
  }
};

const handleChangeCode = () => {
        setShowCategoryModal(true);
}

const handleChangeCodeSelection = (selection) => {
    setShowCategoryModal(false);
    handleClose();
    addCodeToSegmentRoute(currentProject, nodeId, selection[0]).then(() => {fetchProject();});
}


const handleRemove = () => {
    console.log("Remove");
    deleteSegment(currentProject, nodeId).then(() => {fetchProject();});
    handleClose();
}


  if (contextMenu === null) {
      return null;
  }
  return (
      <div
    onContextMenu={handleRightClick}
    style={{ cursor: 'context-menu' }}
  >
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >

          <MenuItem onClick={handleChangeCode}>Change Code</MenuItem>
          <MenuItem onClick={handleRemove}>Remove</MenuItem>


      </Menu>
            <ChooseCodeModal
                open={showCategoryModal}
                multiSelect={false}
                onSave={handleChangeCodeSelection}
                onCancel={() => {setShowCategoryModal(false)}}
                />

    </div>
  );
}