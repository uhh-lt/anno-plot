import Table from "../components/CodeTree/Table";
import ProjectDropdown from "../components/Menu/ProjectDropdown";
import ScrollableList from "../components/ScrollableList";
import ConfigEditor from "../components/ConfigEditor";
import Header from "@/components/Header";
import React from "react";

import dynamic from "next/dynamic";
import CodeInteractions from "@/components/newCodeView/codeInteractions";

const CodePlot = dynamic(() => import("../components/newCodeView/CodePlot"), { ssr: false });

const PlotView = () => {
  return (
    <div>
      <Header title="Code View" />
      <div id="try" style={{ textAlign: "center", marginTop: "50px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <CodeInteractions />
          <CodePlot />
        </div>
        <ConfigEditor />
      </div>
    </div>
  );
};

export default PlotView;
