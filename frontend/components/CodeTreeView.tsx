import React, { useState } from "react";
import { TreeView, TreeItem } from "@mui/lab";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { Checkbox, TextField } from "@mui/material";

/**
 * This component renders a tree view of codes and allows users to search for specific codes and select them.
 */

interface Category {
  id: number;
  name: string;
  subcategories: Record<string, Category>;
}

interface CodeTreeViewProps {
  taxonomyData: Record<string, Category>;
  selectedNodes: number[]; // New prop for selected nodes
  updateSelectedNodes: (newSelectedNodes: number[]) => void;
}

const CodeTreeView: React.FC<CodeTreeViewProps> = ({ taxonomyData, selectedNodes, updateSelectedNodes }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const renderTree = (node: Category): React.ReactNode => {
    const nodeMatchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());

    const childrenMatchSearch = Object.keys(node.subcategories).some((subcategoryKey) => {
      const subcategory = node.subcategories[subcategoryKey];
      return subcategory.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!nodeMatchesSearch && !childrenMatchSearch) {
      return null;
    }

    return (
      <TreeItem
        key={node.id}
        nodeId={node.id?.toString()}
        label={
          <>
            {" "}
            <Checkbox
              checked={selectedNodes.includes(node.id)}
              onClick={(event) => handleNodeSelect(event, node.id)}
              size="small"
            />{" "}
            {node.name}{" "}
          </>
        }
      >
        {Object.keys(node.subcategories).map((subcategoryKey) => {
          const subcategory = node.subcategories[subcategoryKey];
          return renderTree(subcategory);
        })}
      </TreeItem>
    );
  };

  const getAllChildIds = (node: undefined): number[] => {
    if (!node) return [];
    let ids = [node.id];
    for (let subcategoryKey in node.subcategories) {
      ids.push(node.subcategories[subcategoryKey].id);
      ids = ids.concat(getAllChildIds(node.subcategories[subcategoryKey]));
    }
    return ids;
  };
  const findNodeById = (nodeId: number, data: Record<string, Category>): Category | undefined => {
    for (let key in data) {
      if (data[key].id === nodeId) {
        return data[key];
      }
      const child = findNodeById(nodeId, data[key].subcategories);
      if (child) {
        return child;
      }
    }
  };
  const handleNodeSelect = (event: React.ChangeEvent<{}>, nodeId: number) => {
    event.stopPropagation();

    const node = findNodeById(nodeId, taxonomyData);
    if (!node) return;

    const relatedIds = getAllChildIds(node);

    const isSelected = selectedNodes.includes(nodeId);

    let newSelectedNodes: number[];

    if (isSelected) {
      // Remove all related IDs from selectedNodes
      newSelectedNodes = selectedNodes.filter((selectedNode) => !relatedIds.includes(selectedNode));
    } else {
      // Add all related IDs to selectedNodes, but ensure no duplicates
      newSelectedNodes = Array.from(new Set([...selectedNodes, ...relatedIds]));
    }

    updateSelectedNodes(newSelectedNodes);
  };

  return (
    <div className="w-fit m-12 border p-5">
      <h1 className="text-2xl underline mb-5">Categories</h1>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="h-[60vh] w-80 overflow-auto">
        <TreeView defaultCollapseIcon={<ExpandMore />} defaultExpandIcon={<ChevronRight />} multiSelect>
          {Object.keys(taxonomyData).map((topLevelKey) => renderTree(taxonomyData[topLevelKey]))}
        </TreeView>
      </div>
    </div>
  );
};

export default CodeTreeView;
