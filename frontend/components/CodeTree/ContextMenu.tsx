import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import {useEffect, useState} from "react";
import RenameModal from "../modals/RenameModal";
import ChooseCodeModal from "../modals/ChooseCodeModal.tsx";
import {AppContext} from "@/context/AppContext";
import {deleteCodeRoute, updateCode} from "@/api/api";

export default function ContextMenu({event, nodeId, selected}) {
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

        if (selected.includes(nodeId?.toString()) && selected.length > 1) {
            console.log("Multiple Selected");
            setMultipleSelected(true);
        }
        else {
            console.log("Single Selected");
            setMultipleSelected(false);
        }
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

const handleMerge = () => {
    setShowRenameModal(true);
    console.log("Merge");
    handleClose();
}

const handleRename = () => {
    setShowRenameModal(true);
    console.log("Rename");
    //handleClose();
}

const rename = (newName) => {
    console.log(newName);
    updateCode(currentProject, nodeId, newName, null, null).then(() => {fetchCodes()});
    setShowRenameModal(false)
    handleClose();
    }


const handleRemove = () => {
    console.log("Remove");
    deleteCodeRoute(currentProject, nodeId).then(() => {fetchProject();});

    handleClose();
}

const handleMakeRoot = () => {
    console.log("Make Root");
    updateCode(currentProject, nodeId, null, -1, null).then(() => {fetchCodes()});
    handleClose();
}

const setNewParent = (newParent) => {
    console.log(newParent);
    if (multipleSelected) {
        console.log(selected);
        const updatePromises = selected.map((id) => {
            updateCode(currentProject, id, null, newParent, null);
        });
        Promise.all(updatePromises).then(() => {
            fetchCodes();
        });
    }
    else
    {
        updateCode(currentProject, nodeId, null, newParent, null).then(() => {fetchCodes()});
    }
    handleClose();
}
const handleNewParent = () => {
    console.log("New Parent");
    setShowCategoryModal(true);
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
          {multipleSelected ?
              <MenuItem onClick={handleMerge}>Merge</MenuItem> :
              <MenuItem onClick={handleRename}>Rename</MenuItem>}
          <MenuItem onClick={handleRemove}>Remove</MenuItem>
          <MenuItem onClick={handleMakeRoot}>Make Root</MenuItem>
        <MenuItem onClick={handleNewParent}>Add to Category</MenuItem>


      </Menu>
            <RenameModal
                open={showRenameModal}
                currentName={"Test"}
                onSave={(newName) => {rename(newName)}}
                onCancel={() => {setShowRenameModal(false)}}
            />
            <ChooseCodeModal
                open={showCategoryModal}
                multiSelect={false}
                onSave={(selectedCategories) => {setNewParent(selectedCategories)}}
                onCancel={() => {setShowCategoryModal(false)}}
                />

    </div>
  );
}