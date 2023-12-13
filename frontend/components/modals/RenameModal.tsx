import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

function RenameModal({ open, currentName, onSave, onCancel}) {
  const [newName, setNewName] = React.useState(currentName);
  // Modal styling
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

  return (
    <Modal open={open} onClose={onCancel}>
      <Box sx={modalStyle}>
        <TextField
          label="New Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onCancel} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => {onSave(newName)}} color="primary" style={{ marginLeft: '10px' }}>
            Save
          </Button>
        </div>
      </Box>
    </Modal>
  );
}

export default RenameModal;
