import { Button, Modal } from "@mui/material";
import React from "react";

/**
 * This component displays a modal for confirming the deletion of all databases.
 */

type ConfirmModalProps = {
  open: boolean;
  handleClose: () => void;
  onDelete: () => Promise<any>;
};

export default function DeleteAllDatabasesModal(props: ConfirmModalProps) {
  const handleFinish = async () => {
    try {
      await props.onDelete();
      // Handle successful deletion
    } catch (error) {
      // Handle error
    }
  };

  function setClosed() {
    props.handleClose();
  }

  return (
    <>
      <Modal open={props.open} onClose={setClosed}>
        <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[10vh] grid-cols-1 text-center">
          <p>Do you want to delete all?</p>
          <div className="w-fit mx-auto mt-5">
            <Button className="mx-2" variant="outlined" onClick={setClosed}>
              No
            </Button>
            <Button className="mx-2" variant="contained" component="label" onClick={handleFinish}>
              Yes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
