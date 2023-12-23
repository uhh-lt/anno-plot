import { useState, useContext, useEffect } from "react";
import { TreeView, TreeItem } from "@mui/x-tree-view";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { Button, Checkbox, TextField } from "@mui/material";
import { AppContext } from "@/context/AppContext"; // Import your context
import ColorPicker from "./ColorPicker";
import ContextMenu from "./ContextMenu";
import { hexToReactColor, reactColorToHex } from "@/utilities";
import { updateCode } from "@/api/api";
import zIndex from "@mui/material/styles/zIndex";
// When using TypeScript 4.x and above
import type {} from "@mui/x-tree-view/themeAugmentation";
// When using TypeScript 3.x and below

const Table = () => {
  const {
    loading,
    data,
    codes,
    setCodes,
    codeTree,
    setCodeTree,
    errors,
    arrows,
    projects,
    currentProject,
    fetchProjects,
    fetchProject,
    fetchCodes,
    showClusters,
    fetchErrors,
    setCurrentProject,
    setArrows,
    filteredCodes,
    setFilteredCodes,
  } = useContext(AppContext);

  const [isLoading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategories, setSearchCategories] = useState({});
  const [selectedNodes, setSelectedNodes] = useState([]);
  //const [filteredCodes, setFilteredCodes] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [lastProject, setLastProject] = useState(0);
  const [contextMenu, setContextMenu] = useState({
    event: null,
    nodeId: null,
    selected: [],
    key: null,
  });
  useEffect(() => {
    if (currentProject !== lastProject) {
      setLastProject(currentProject);
      setFilteredCodes(codes.map((code) => code.code_id));
    }
  }, [codes]);
  /*
   * Handle initialization, make sure loading variable is set until all data is loaded
   */
  useEffect(() => {
    if (!initialized && codes.length > 0 && codes.length > 0) {
      setInitialized(true);
      selectAllCategories();
    }
  }, [codes]);

  /*
   * Filters the codes based on the search query
   * Is updated when:
   * - searchQuery is updated
   * - codes is updated
   * - isLoading is updated
   */
  const isMatch = (node) => {
    return node.text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  useEffect(() => {
    if (searchQuery) {
      const filteredCategories = {};
      codes.map((code) => {
        if (isMatch(code)) {
          //add code to filteredCategories and add subcategories = {}
          filteredCategories[code.code_id] = { ...code, subcategories: {} };
        }
      });
      console.log(filteredCategories);
      setSearchCategories(filteredCategories);
    } else {
      const filteredCategories = { ...codeTree };
      setSearchCategories(filteredCategories);
    }
  }, [codes, codeTree, searchQuery, isLoading]);

  /*
   * Handle color interaction.
   * colorChange:
   * When a color is changed, update the codes state.
   * This should update the plot.
   *
   * colorClose: TODO
   * When the color picker is closed send the color to the backend
   * to make the change permanent.
   */
  const handleColorChange = (color, code) => {
    const newCategories = [...codes];
    const matchingCategory = newCategories.find((category) => category.code_id === code.code_id);
    if (matchingCategory) {
      matchingCategory.color = reactColorToHex(color);
    }
    code.color = reactColorToHex(color);
    setCodes(newCategories);
    setCodeTree({ ...codeTree });
  };

  const sendColorChange = (color, code) => {
    updateCode(currentProject, code.code_id, code.text, code.parent_code_id, color).then(() => {
      fetchCodes();
    });
  };

  const handleColorClose = (color, code) => {
    sendColorChange(reactColorToHex(color), code);
  };

  /*
   * Handles the filtering of Categories, when a category is checked/unchecked.
   * Updates the category state so the plot can be updated.
   */
  const updateFilteredCodes = (id, isSelected) => {
    if (isSelected) {
      if (!filteredCodes.includes(id)) {
        filteredCodes.push(id);
      }
    } else {
      if (filteredCodes.includes(id)) {
        filteredCodes.splice(filteredCodes.indexOf(id), 1);
      }
    }
    setFilteredCodes([...filteredCodes]);
  };
  const handleCategoryFiltering = (event, category) => {
    console.log("Event propagation stopped");
    event.stopPropagation();
    const updateSelection = (category, isSelected) => {
      updateFilteredCodes(category.code_id, isSelected);
      Object.values(category.subcategories).forEach((subCategory) => {
        updateSelection(subCategory, isSelected);
      });
    };

    const isSelected = filteredCodes.includes(category.code_id);
    if (event.shiftKey) {
      updateSelection(category, !isSelected);
    } else {
      updateFilteredCodes(category.code_id, !isSelected);
    }
  };

  const selectAllCategories = () => {
    codes.map((code) => {
      updateFilteredCodes(code.code_id, true);
    });
  };

  const clearAllCategories = () => {
    setFilteredCodes([]);
  };

  /*
   * The Selection of different codes for grouped editing is handled here.
   * The main logic is within the CodeTree component.
   * This just updates the component state selectedNodes for further usage.
   */
  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setSelectedNodes(nodeIds);
  };

  /*
   * Handles the context menu for the codes.
   */

  const handleContextMenu = (event, nodeId) => {
    event.preventDefault();
    const uniqueKey = `${nodeId}-${new Date().getTime()}`;
    setContextMenu({
      event: event,
      nodeId: nodeId,
      selected: selectedNodes,
      key: uniqueKey, // Add this line
    });
  };

  /*
   * Helper function to render the Tree.
   * It goes through all codes and recursively renders them, if root is set.
   */
  const renderTree = (node) => {
    return (
      <TreeItem
        key={node.code_id}
        nodeId={node.code_id.toString()}
        //make is so that aria selected color is red
        sx={{ "&.Mui-selected": { backgroundColor: "#1E3A8A", color: "white" } }}
        label={
          <div onContextMenu={(event) => handleContextMenu(event, node.code_id)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Checkbox
                  checked={filteredCodes.includes(node.code_id)}
                  onClick={(event) => handleCategoryFiltering(event, node)}
                  size="small"
                />
                <span style={{ lineHeight: "1.5", margin: "0" }}>{node.text.length > 20 ? "..." + node.text.slice(-17) : node.text}</span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ColorPicker
                  initialColor={hexToReactColor(node.color)}
                  externalHandleChange={(color) => handleColorChange(color.rgb, node)}
                  externalHandleClose={(color) => handleColorClose(color, node)}
                />
              </div>
            </div>
          </div>
        }
      >
        {Object.values(node.subcategories).map((subcategory) => {
          return renderTree(subcategory);
        })}
      </TreeItem>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div style={{ width: "300px" }}>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div>
        <ContextMenu
          key={contextMenu.key}
          event={contextMenu.event}
          nodeId={contextMenu.nodeId}
          selected={contextMenu.selected}
        />
        <TreeView
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
          onNodeSelect={handleSelect}
          selected={selectedNodes}
          multiSelect
        >
          {Object.values(searchCategories).map((code) => renderTree(code))}
        </TreeView>
      </div>
      <div className="button-div">
        <Button type="button" sx={{ backgroundColor: "#1E3A8A", color: "white" }} onClick={selectAllCategories}>
          Select All
        </Button>
        <Button type="button" sx={{ backgroundColor: "#1E3A8A", color: "white" }} onClick={clearAllCategories}>
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default Table;
