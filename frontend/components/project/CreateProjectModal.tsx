import React, { useState } from "react";
import { Button, Modal, TextField } from "@mui/material";

/**
 * This component displays a modal for creating a new project.
 */

interface CreateModalProps {
  open: boolean;
  handleClose: () => void;
  project_name: string;
  onCreate: (project_name: string) => Promise<any>;
}

export default function CreateModal(props: CreateModalProps) {
  const initialFormData: string = props?.project_name;

  const [formData, setFormData] = useState(initialFormData);

  const handleFinish = async () => {
    try {
      await props.onCreate(formData);

      setFormData("");
    } catch (error) {
      // Handle error
    }
  };

  function setClosed() {
    setFormData("");

    props.handleClose();
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(value);
  };

  return (
    <Modal open={props.open} onClose={setClosed}>
      <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
        <p>Create Project Data</p>
        <div className="w-fit mx-auto">
          <TextField
            name="project_name"
            label="Project Name"
            value={formData}
            onChange={handleInputChange}
            variant="outlined"
            className="mb-2"
            fullWidth
          />
          <Button className="mx-2" variant="outlined" component="label" onClick={setClosed}>
            Cancel
          </Button>
          <Button className="mx-2" variant="contained" component="label" onClick={handleFinish}>
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
