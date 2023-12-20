import Table from "../components/CodeTree/Table";
import ProjectDropdown from "../components/Menu/ProjectDropdown";
import ScrollableList from "../components/ScrollableList";
import ConfigEditor from "../components/ConfigEditor";
import Header from "@/components/Header";
import React from "react";

import dynamic from "next/dynamic";

const CodePlot = dynamic(() => import("../components/newCodeView/CodePlot"), { ssr: false });

const PlotView = () => {
  return (
    <div>
      <Header title="Plot View" />
      <div id="try" style={{ textAlign: "center", marginTop: "50px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <Table />
          <CodePlot />
        </div>
        <ConfigEditor />
      </div>
    </div>
  );
};

export default PlotView;
