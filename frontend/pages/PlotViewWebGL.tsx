import Header from "@/components/Header";
import { useContext, useEffect, useState } from "react";
import Table from "../components/CodeTree/Table";
import ConfigEditor from "../components/ConfigEditor";
import TrainingComponent from "../components/TrainingComponent";

import { AppContext } from "@/context/AppContext";
import dynamic from "next/dynamic";

const DotPlotWebGL = dynamic(() => import("../components/plotView/DotPlotWebGL"), { ssr: false });

const PlotView = () => {
  const { config } = useContext(AppContext);
  const [isDynamic, setDynamic] = useState(false);

  useEffect(() => {
    if (!config) return;
    config.model_type === "dynamic" ? setDynamic(true) : setDynamic(false);
  }, [config]);
  return (
    <div>
      <Header title="Plot View" />
      <div id="try" style={{ textAlign: "center", marginTop: "50px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <Table />
          <DotPlotWebGL />
          {isDynamic && <TrainingComponent />}
        </div>
        <ConfigEditor />
      </div>
    </div>
  );
};

export default PlotView;
