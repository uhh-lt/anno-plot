import React, { useContext, useState } from "react";
import ScrollableList from "./ScrollableList";
import { AppContext } from "@/context/AppContext";
import { Button } from "@mui/material";

// Assuming you have a ScrollableList component already
// import ScrollableList from './ScrollableList';

const TrainingComponent = () => {
  const [isTrainingCodes, setIsTrainingCodes] = useState(false);
  const [isTrainingArrows, setIsTrainingArrows] = useState(false);
  const { trainClusters, trainArrows } = useContext(AppContext);

  const handleTrainCodes = async () => {
    // Logic to start/stop training codes
    setIsTrainingCodes(!isTrainingCodes);
    let index = 3;
    while (index > 0 && !isTrainingCodes) {
      await trainClusters();
      index--;
    }
    setIsTrainingCodes(false);
  };

  const handleTrainArrows = async () => {
    setIsTrainingArrows(true);
    await trainArrows();
    setIsTrainingArrows(false);
  };

  return (
    <div style={{ width: "300px" }}>
      <div>
        <ScrollableList />
        <Button
          type="button"
          sx={{ backgroundColor: "#1E3A8A", color: "white" }}
          variant="contained"
          color="primary"
          onClick={handleTrainCodes}
        >
          {isTrainingCodes ? "Stop" : "Train Codes"}
        </Button>
        <Button
          type="button"
          sx={{ backgroundColor: "#1E3A8A", color: "white" }}
          variant="contained"
          onClick={handleTrainArrows}
          disabled={isTrainingArrows}
        >
          {isTrainingArrows ? "Training Arrows" : "Train Arrows"}
        </Button>
      </div>
    </div>
  );
};

export default TrainingComponent;
