import React, { useState } from "react";
import { Button, Modal, TextField } from "@mui/material";

/**
 * This component displays a modal for editing dataset information.
 */

type Dataset = {
  dataset_id: number;
  project_id: number;
  dataset_name: string;
};

interface EditModalProps {
  open: boolean;
  handleClose: () => void;
  dataset: Dataset;
  onEdit: (project: Dataset) => Promise<any>;
}

export default function EditModal(props: EditModalProps) {
  const initialFormData: Dataset = {
    dataset_id: props?.dataset?.dataset_id,
    project_id: props?.dataset?.project_id,
    dataset_name: props?.dataset?.dataset_name,
  };

  const [formData, setFormData] = useState<Dataset>(initialFormData);

  const handleFinish = async () => {
    try {
      await props.onEdit(formData);

      setFormData({
        dataset_id: 0,
        project_id: 0,
        dataset_name: "",
      });
    } catch (error) {
      // Handle error
    }
  };

  function setClosed() {
    setFormData({
      dataset_id: 0,
      project_id: 0,
      dataset_name: "",
    });

    props.handleClose();
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...props.dataset, [name]: value });
  };

  return (
    <Modal open={props.open} onClose={setClosed}>
      <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
        <p>Edit Dataset Data</p>
        <p>Dataset ID: {props?.dataset?.dataset_id}</p>
        <div className="w-fit mx-auto">
          <TextField
            name="dataset_name"
            label="Dataset Name"
            value={formData?.dataset_name || props?.dataset?.dataset_name}
            onChange={handleInputChange}
            variant="outlined"
            className="mb-2"
            fullWidth
          />
          <TextField
            name="project_id"
            label="Project ID"
            value={props?.dataset?.dataset_id}
            variant="outlined"
            className="mb-2"
            fullWidth
            disabled
          />
          <TextField
            name="config_id"
            label="Config ID"
            value={props?.dataset?.project_id}
            variant="outlined"
            className="mb-2"
            fullWidth
            disabled
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
