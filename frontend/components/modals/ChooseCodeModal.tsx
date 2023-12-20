import { useContext, useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon'; // Import ListItemIcon
import Checkbox from '@mui/material/Checkbox'; // Import Checkbox
import { AppContext } from '../../context/AppContext.tsx';
import {getPath} from "../../utilities.tsx";

function ChooseCodeModal({ open, onSave, onCancel, multiSelect }) {
  const { codes } = useContext(AppContext);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  const listStyle = {
    maxHeight: '500px',
    overflowY: 'auto',
  };

  const handleListItemClick = (codeId) => {
    if (multiSelect) {
      setSelectedCategories((prevSelected) => {
        if (prevSelected.includes(codeId)) {
          return prevSelected.filter((id) => id !== codeId);
        } else {
          return [...prevSelected, codeId];
        }
      });
    } else {
      setSelectedCategories([codeId]);
    }
  };

  return (
    <Modal open={open} onClose={onCancel}>
      <Box sx={modalStyle}>
        <List style={listStyle}>
          {codes.map((code) => (
            <ListItem
              key={code.code_id}
              selected={selectedCategories.includes(code.code_id)}
              onClick={() => handleListItemClick(code.code_id)}
            >
              <ListItemButton>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedCategories.includes(code.code_id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={getPath(codes, code)} style = {{ color : "black"}}/>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onCancel} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => {onSave(selectedCategories)}} color="primary" style={{ marginLeft: '10px' }}>
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
}

export default ChooseCodeModal;