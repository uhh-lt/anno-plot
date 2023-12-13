import { Menu } from "@mui/icons-material";
import { Accordion, AccordionSummary, Drawer } from "@mui/material";
import {useContext, useEffect, useState} from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { useRouter } from "next/router";
import { Button, ButtonGroup } from "@mui/material";
import { getProjects } from "@/api/api";
import BarChartIcon from "@mui/icons-material/BarChart";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";

import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import BuildIcon from "@mui/icons-material/Build";
import StorageIcon from "@mui/icons-material/Storage";
import MessageIcon from "@mui/icons-material/Message";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import DatasetIcon from "@mui/icons-material/Dataset";
import SpeakerNotesIcon from "@mui/icons-material/SpeakerNotes";
import DataArrayIcon from "@mui/icons-material/DataArray";
import PlaceIcon from "@mui/icons-material/Place";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SchemaIcon from "@mui/icons-material/Schema";
import { AppContext } from "@/context/AppContext.tsx";
/**
 * This component represents the header of the application, including the navigation menu, project selection, and various links to different views and statistics.
 */

export default function Header(props) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {projects, currentProject, setCurrentProject} = useContext(AppContext);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <header className="w-screen h-16 bg-blue-900 p-3 pl-5 mb-5 text-white flex items-center">
      <div className="mr-5">
        <button onClick={toggleDrawer}>
          <Menu />
        </button>
      </div>
      <div className="">
        <h1 className="font-bold text-3xl">{props.title}</h1>
      </div>
      <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer}>
        <div className="p-4 w-64">
          <div className="mt-5">
            <h2 className="text-2xl text-black">Project {currentProject}</h2>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <p className="w-fit mx-auto">
                  {projects.find((project) => project.project_id == currentProject)?.project_name}
                </p>
              </AccordionSummary>
              {projects.map((project) => (
                <div key={project.project_id} className="w-fit mx-auto my-1">
                  {project.project_name}
                  {project.project_id != currentProject && (
                    <button
                      className="ml-1"
                      onClick={() => {
                        setCurrentProject(project.project_id);
                      }}
                    >
                      <CompareArrowsIcon />
                    </button>
                  )}
                </div>
              ))}
            </Accordion>
          </div>
          <br />
          <h1 className="text-2xl text-black">Menu</h1>

          <ButtonGroup
            variant="contained"
            color="primary"
            aria-label="contained primary button group"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Button
              variant="outlined"
              component="label"
              onClick={() => {
                console.log("routing to project");
                router.push(`/projects`);}}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>Projects</span>
              <BusinessCenterIcon />
            </Button>
            <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/datasets`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Datasets</span>
                <DatasetIcon />
              </Button>
            </ButtonGroup>

        </div>

        <div className="p-4 w-64">
          <h1 className="text-xl text-black">View</h1>

          <div className="center">
            <ButtonGroup
              variant="contained"
              color="primary"
              aria-label="contained primary button group"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/codeView`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Codes</span>
                <MessageIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/PlotViewWebGL`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Graph</span>
                <ScatterPlotIcon />
              </Button>
            </ButtonGroup>
            <br />
            <h1 className="text-xl text-black">Data</h1>
            <ButtonGroup
              variant="contained"
              color="primary"
              aria-label="contained primary button group"
              style={{ display: "flex", flexDirection: "column" }}
            >

              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/sentences`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Sentences</span>
                <SpeakerNotesIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/embeddings`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Embeddings</span>
                <DataArrayIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/reducedEmbeddings`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Positions</span>
                <PlaceIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/clusters`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Clusters</span>
                <SchemaIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/plotData`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Plot</span>
                <ManageSearchIcon />
              </Button>
            </ButtonGroup>
            <br />
            <h1 className="text-xl text-black">Stats</h1>
            <ButtonGroup
              variant="contained"
              color="primary"
              aria-label="contained primary button group"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/projectStats`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Project</span>
                <BarChartIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/codeStats`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Code</span>
                <BubbleChartIcon />
              </Button>
              <Button
                variant="outlined"
                component="label"
                onClick={() => router.push(`/clusterStats`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>Cluster</span>
                <DonutLargeIcon />
              </Button>
            </ButtonGroup>
            <br />
            <h1 className="text-xl text-black">Admin</h1>
            <ButtonGroup
              variant="contained"
              color="primary"
              aria-label="contained primary button group"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Button
              variant="outlined"
              component="label"
              onClick={() => router.push(`/databases`)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span>Databases</span>
              <StorageIcon />
            </Button>
          </ButtonGroup>

            <br />
          </div>
        </div>
      </Drawer>
      <button className="ml-auto mr-5" onClick={() => router.push("/")}>
        AnnoPlot
      </button>
    </header>
  );
}
