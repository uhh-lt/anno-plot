import { CircularProgress, Modal } from "@mui/material";
import React from "react";

/**
 * This component displays a loading modal. It is used to indicate ongoing operations or loading processes in the application.
 */

interface LoadingModalProps {
  open: boolean;
}

export default function LoadingModal(props: LoadingModalProps) {
  return (
    <>
      <Modal open={props.open}>
        <div className="w-fit bg-white p-5 rounded-lg shadow mx-auto mt-[15rem] grid-cols-2">
          <p>Loading</p>
          <CircularProgress />
        </div>
      </Modal>
    </>
  );
}
