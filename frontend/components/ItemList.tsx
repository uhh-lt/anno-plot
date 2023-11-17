import React from "react";
import { List, ListItem, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button } from "@mui/material";

/**
 * This component displays a list of items, each represented by a ListItem.
 * It is used to display train arrows and provides options to delete items and trigger training.
 */

interface Item {
  dot: {
    color?: string;
    codeText: string;
    segment: string;
    plot: string;
    dotId: string;
  };
}

interface ItemListProps {
  items: Item[];
  onDelete: (item: Item) => void;
  onTrain: (plot: any) => void;
}

interface ItemListProps {
  items: Item[];
  onDelete: (item: Item) => void;
  onTrain: (plot: any) => void;
}

function rgbToRgba(rgbString: string, alpha = 1) {
  const matches = rgbString.match(/\d+/g); // extract numbers from the rgb string

  if (!matches || matches.length !== 3) {
    console.error("Invalid RGB format"); // handle error
    return "";
  }

  const [r, g, b] = matches.map(Number);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ItemList: React.FC<ItemListProps> = ({ items, onDelete, onTrain }) => {
  //if (!items.length) return null;

  return (
    <div className="container-list border">
      <h1 className="text-2xl underline mb-5 w-fit mx-auto">Arrows</h1>

      <List className="scroll-list-list">
        {items.map((item) => (
          <ListItem
            key={item.dot.dotId}
            style={{
              backgroundColor: item.dot.color
                ? rgbToRgba(item.dot.color, 0.5) // 50% transparency
                : "rgba(245, 100, 245, 0.5)",
            }}
          >
            <div className="flex">
              <div>
                <div>Code: {item.dot.codeText}</div>
                <div>Segment: {item.dot.segment}</div>
              </div>
              <IconButton onClick={() => onDelete(item)}>
                <DeleteIcon />
              </IconButton>
            </div>
          </ListItem>
        ))}
      </List>

      <Button
        variant="contained"
        className="bg-blue-900 rounded w-fit mx-auto mb-1"
        onClick={() => {
          if (items.length > 0) {
            onTrain(items[0].dot.plot);
          }
        }}
      >
        Train Arrows
      </Button>
    </div>
  );
};

export default ItemList;
