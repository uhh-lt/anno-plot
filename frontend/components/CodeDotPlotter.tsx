import * as d3 from "d3";
import { ZoomBehavior, ZoomedElementBaseType } from "d3";
import CodeDot from "@/components/CodeDot";
import { getCodeStats } from "@/api/api";

/**
 * This class is responsible for managing and rendering a plot of CodeDot instances (codes) within an SVG container. It includes
 * methods for handling zoom behavior and data filtering.
 */
// TODO Check type again of commit 8090ddc000af2cd0ca954d38d4384428ab0c5a84
function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

const idToColorMap = {};
function newColorScale(code_id) {
  return idToColorMap[code_id] || "#808080"; // Fallback to gray
}
function assignColors(
  codes,
  hueOffset = 0,
  saturation = 100,
  value = 100,
  depth = 0,
  hueStep = 20,
  satStep = 5,
  valStep = 10,
) {
  let hue = hueOffset;
  let sat = saturation;
  let val = value;

  // Larger hue step for root categories
  if (depth === 0) {
    hueStep = 360 / Object.keys(codes).length;
  }

  for (const id in codes) {
    const category = codes[id];

    // Set the hue, making sure it's cycled within the 0-359 range
    const newHue = hue % 360;
    sat = sat % 100; // Keep saturation within 0-100 range
    sat = Math.max(60, sat);

    const color = hsvToRgb(hue / 380, sat / 100, val / 100);

    category.color = color;
    idToColorMap[id] = color;

    if (Object.keys(category.subcategories).length > 0) {
      // Increment hue and saturation for the next level, but reduce the step to keep colors close
      assignColors(category.subcategories, hue + hueStep, sat + satStep, value, depth + 1, hueStep, satStep, valStep);
    }

    // Increment hue and saturation for each category to make them distinct
    hue += hueStep;
    sat += satStep;
    val += valStep;

    val = (val % 60) + 20; // Keep value within 0-100 range

    // Cycle saturation back to 30 if it reaches 100, to ensure variety while avoiding very low saturation
    if (sat >= 100) {
      sat = 60;
    }
    if (sat <= 60) {
      sat = 100;
    }
  }
}

class CodeDotPlotter {
  private container: any;
  private zoom: ZoomBehavior<ZoomedElementBaseType, unknown>;
  private svg: any;
  private selected: any[];
  private data: any[];
  private projectId: number;
  private source: any;
  private containerId: string;
  private filter: any;
  private selectedNodes: number[];
  private addToCategory: () => void;
  private fetched_data: any;
  private minRadiusOfAllCodes: number;
  private maxRadiusOfAllCodes: number;
  private setRightClickedId: (id: number) => void;
  private deleteCode: () => void;
  private renameCode: () => void;
  private showCode: () => void;
  private tree: any;
  private color_mapper: any;
  public set_loading: (boolean) => void;

  constructor(
    containerId: string,
    projectId: number,
    source: any,
    svg: any,
    container: any,
    selectedNodes: number[],
    addToCategory: () => void,
    setRightClickedId: (id: number) => void,
    deleteCode: () => void,
    renameCode: () => void,
    showCode: () => void,
    setLoading: (boolean) => void,
  ) {
    this.set_loading = setLoading;
    this.containerId = containerId;
    this.source = source;
    this.projectId = projectId;
    this.data = [];
    this.selected = [];
    this.svg = svg;
    this.container = container;
    this.selectedNodes = selectedNodes;
    this.addToCategory = addToCategory;
    this.fetched_data = null;
    this.minRadiusOfAllCodes = 1;
    this.maxRadiusOfAllCodes = 4;
    this.setRightClickedId = setRightClickedId;
    this.deleteCode = deleteCode;
    this.renameCode = renameCode;
    this.showCode = showCode;
    const allDotsInSVG = this.container.selectAll(".dot");
    allDotsInSVG.each(function () {
      console.log("removing erranious dots");
      const dot = d3.select(this);
      dot.remove();
    });

    // window.addEventListener('beforeunload', this.handleBeforeUnload);

    this.zoom = d3
      .zoom()
      .scaleExtent([0.01, 1000])
      .on("zoom", (event) => {
        this.container.attr("transform", event.transform);
        const scale = event.transform.k;
        const labels = this.container.selectAll("text");
        console.log(labels);
        labels.attr("font-size", 14 / scale);
      });

    this.svg.call(this.zoom);
    this.generateColors();
  }

  private handleBeforeUnload = (event: Event) => {
    this.data = [];
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  };

  generateColors() {
    console.log("generating colors...");
    const endpoint = this.source + "/projects/" + this.projectId + "/codes/tree";
    return fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        this.tree = data.codes;
        assignColors(data.codes);
        this.color_mapper = newColorScale;
      })
      .catch((error) => {
        console.error("Error fetching plot data:", error);
        throw error;
      });
  }
  homeView() {
    console.log("home view...");
    console.log("data", this.data);
    const xExtent = d3.extent(this.data, (d) => d.x);
    const yExtent = d3.extent(this.data, (d) => d.y);
    console.log("xExtent", xExtent);
    console.log("yExtent", yExtent);
    // Calculate width and height of the bounding box
    const dataWidth = xExtent[1] - xExtent[0];
    const dataHeight = yExtent[1] - yExtent[0];

    // Calculate the viewport's width and height
    const svgElem = this.svg.node(); // Assuming svg is a D3 selection. If it's a raw DOM element, you don't need .node().
    const { width, height } = svgElem.getBoundingClientRect();
    // Calculate the scaling factor
    const kx = width / dataWidth;
    const ky = height / dataHeight;
    const k = 0.95 * Math.min(kx, ky); // 0.95 is for a little

    // Calculate the translation to center the bounding box in the viewport
    const tx = (width - k * (xExtent[1] + xExtent[0])) / 2;
    const ty = (height - k * (yExtent[1] + yExtent[0])) / 2;

    // Apply the zoom transform
    this.svg.transition().call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }

  applyCodesFilter(codes: any) {
    function createCodeFilter(codes: any) {
      return function (dot: any) {
        return codes.includes(dot.code_id);
      };
    }
    this.selectedNodes = codes;
    console.log("Selected codes:", this.selectedNodes);
    const filterFunc = createCodeFilter(codes);
    this.setFilter(filterFunc);
    //this.update().then(() => this.homeView());
  }

  setFilter(filterFunc: any) {
    this.filter = filterFunc;
    //this.update();
  }

  fetchData() {
    console.log("fetching data...");
    if (this.fetched_data) {
      console.log("already fetched data...");
      return Promise.resolve(this.fetched_data);
    } else {
      this.set_loading(true)
      return getCodeStats(this.projectId)
        .then(async (codeStats: any) => {
            this.set_loading(false)
          console.log("Received codeStats response:", codeStats);
          if (codeStats) {
            //console.log("Code Stats Codes:", codeStats.code_segments_count.codes);
            this.fetched_data = codeStats.code_segments_count.codes;
            this.minRadiusOfAllCodes = Math.min(
              ...codeStats.code_segments_count.codes.map((code: any) => Math.sqrt(code.segment_count)),
            );
            this.maxRadiusOfAllCodes = Math.max(
              ...codeStats.code_segments_count.codes.map((code: any) => Math.sqrt(code.segment_count)),
            );
            return codeStats.code_segments_count.codes;
          }
        })
        .catch((error) => {
          if (error.response) {
            // The request was made, but the server responded with an error status code
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
          } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received. The request was made but no response was received.");
          } else {
            // Something happened in setting up the request that triggered an error
            console.error("Error setting up the request:", error.message);
          }
          console.error("Error fetching code stats data:", error);
          throw error; // Rethrow the error if needed
        });
    }
  }

  update() {
    return this.fetchData().then((newData: any) => {
      if (newData) {
        console.log("updated newData:", newData);
        this.render(newData);
      }
    });
  }

  render(newData: any) {
    console.log("rendering...");
    console.log("newdata", newData);
    if (this.filter) {
      console.log("filtering...");
      newData = newData.filter((dot) => this.filter(dot));
    } else {
      newData = [];
    }
    /*
        if (this.selectedNodes.length > 0) {
            console.log("Codes are selected", this.selectedNodes)
            newData = newData.filter((dot: any) => this.selectedNodes.includes(dot.code_id));
            console.log("Data after selection", newData);
        }
*/

    newData.forEach((dotData: any) => {
      if (dotData.segment_count !== 0) {
        let existingDot = this.data.find((d) => d.dotId === dotData.code_id);
        if (existingDot) {
          existingDot.x = dotData.average_position.x;
          existingDot.y = dotData.average_position.y;
          existingDot.code = dotData.text;
        } else {
          let radius =
            (Math.sqrt(dotData.segment_count) - this.minRadiusOfAllCodes) /
            (this.maxRadiusOfAllCodes - this.minRadiusOfAllCodes);
          let newDot = new CodeDot(
            dotData.code_id,
            dotData.average_position.x,
            dotData.average_position.y,
            dotData.text,
            this,
            this.addToCategory,
            radius,
            this.setRightClickedId,
            this.deleteCode,
            this.renameCode,
            this.showCode,
          );

          console.log("radius", radius);
          newDot.draw(this);
        }
      }
    });
    console.log("Actual data:", this.data);
    this.data = this.data.filter((dot) => {
      let shouldKeep = newData.find((d: any) => d.code_id === dot.dotId);
      if (!shouldKeep && dot.circle) {
        dot.circle.remove();
        dot.label.remove();
      }
      return shouldKeep;
    });

    console.log("Actual data:", this.data);
    console.log(this.data.length);
  }
}

export default CodeDotPlotter;
