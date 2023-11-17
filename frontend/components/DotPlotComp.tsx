import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import * as d3 from "d3";
import { Button } from "@mui/material";
import ItemList from "@/components/ItemList";
import ChangeCodeModal from "@/components/ChangeCodeModal";

/**
 * This class is responsible for managing and rendering a plot of segments. It includes
 * methods for handling zoom behavior and data filtering.
 */

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

function findCodePath(tree, code_id, currentPath = "") {
  for (const key in tree) {
    const node = tree[key];
    const newPath = currentPath ? `${currentPath}-${node.name}` : node.name;

    if (node.id === code_id) {
      return newPath;
    }

    const subcategories = node.subcategories;
    const result = findCodePath(subcategories, code_id, newPath);
    if (result) return result;
  }
  return null;
}

const idToColorMap = {};

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

function arrayRemove(arr, value) {
  return arr.filter(function (geeks) {
    return geeks != value;
  });
}

function newColorScale(code_id) {
  return idToColorMap[code_id] || "#808080"; // Fallback to gray
}

class Dot {
  public addToCode: () => void;
  public setRightClickedId: (id: number) => void;
  public dotId: number;
  public x: number;
  public y: number;
  public segment: number;
  public sentence: string;
  public code: number;
  public codeText: string;
  public cluster_id: number;
  public cluster: boolean;
  public color: any;
  public plot: any;
  public circle: null | d3.Selection<SVGCircleElement, any, any, any>;
  public line: null | Line;
  public tooltip: null | d3.Selection<HTMLDivElement, any, any, any>;
  public suggestion: boolean;

  constructor(
    dotId,
    x,
    y,
    segment,
    sentence,
    code,
    cluster_id,
    plot,
    addToCode: () => void,
    setRightClickedId: (id: number) => void,
  ) {
    this.dotId = dotId;
    this.x = x;
    this.y = y;
    this.segment = segment;
    this.sentence = sentence;
    this.cluster_id = cluster_id;
    this.cluster = false;
    this.code = code;
    this.codeText = findCodePath(plot.tree, code);
    this.line = null;
    this.tooltip = null; // for tooltip
    this.circle = null; // for the circle representation
    this.plot = plot;
    this.suggestion = false;
    if (!this.plot.color_mapper) {
      this.plot.color_mapper = newColorScale;
    }
    this.color = plot.color_mapper(this.code);
    this.addToCode = addToCode;
    this.setRightClickedId = setRightClickedId;
  }

  makeSuggestion() {
    this.remove();
    this.draw(this.plot);
    const scale = d3.zoomTransform(this.plot.svg.node()).k;
    if (!this.suggestion) {
      this.suggestion = true;
      this.circle.attr("stroke", "red").attr("stroke-width", 2 / scale);
    } else {
      this.suggestion = false;
    }
  }
  removeSuggestion() {
    this.remove();
    this.draw(this.plot);
  }

  makeCluster() {
    this.cluster = true;
    this.remove();
    this.draw(this.plot);
  }

  removeCluster() {
    this.cluster = false;
    this.remove();
    this.draw(this.plot);
  }
  draw(plotter) {
    const creationZoomScale = d3.zoomTransform(this.plot.svg.node()).k;
    this.circle = plotter.container
      .append("circle")
      .attr("class", "dot")
      .attr("cx", this.x)
      .attr("cy", this.y)
      .attr("r", this.plot.point_r / creationZoomScale)
      .attr("data-dotId", this.dotId)
      .attr("fill", this.color) // Add fill color
      .on("mouseover", (event) => {
        this.showTooltip(plotter.svg);
      })
      .on("mouseout", (event) => {
        this.hideTooltip();
      });
    this.plot.data.push(this);

    if (this.cluster) {
      const scale = d3.zoomTransform(this.plot.svg.node()).k;
      console.log("setting cluster color");
      const colors = ["#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#FF8800", "#FF0088", "#00FFF0"];
      const index = this.cluster_id % colors.length;
      this.circle.attr("stroke", colors[index]).attr("stroke-width", 2 / scale);
    }

    this.circle.on("contextmenu", (event) => {
      event.preventDefault();
      this.showContextMenu(event, plotter);
    });
    if (this.plot.is_dynamic) {
      this.setDragBehavior(plotter);
    }
  }

  showContextMenu(event, plotter) {
    // Remove any existing context menus
    d3.selectAll(".custom-context-menu").remove();
    this.hideTooltip();

    const currentTransform = d3.zoomTransform(plotter.svg.node());
    const scale = currentTransform.k;

    const adjustedX = (event.layerX - currentTransform.x) / currentTransform.k;
    const adjustedY = (event.layerY - currentTransform.y) / currentTransform.k;

    const options = [
      { name: "Delete", type: "option" },
      { name: "Add to other category", type: "option" },
    ];

    const rectHeight = 30 / scale;
    const rectWidth = 150 / scale;

    const contextMenu = plotter.container
      .append("g")
      .attr("class", "custom-context-menu")
      .attr("transform", `translate(${adjustedX}, ${adjustedY})`);

    // Handle option type
    contextMenu
      .selectAll("g.option")
      .data(options.filter((d) => d.type === "option"))
      .enter()
      .append("g")
      .attr("class", "option")
      .on("click", (d) => {
        d = d.target.__data__;
        if (d.name === "Delete") {
          // Call the backend at DELETE /projects/:project_id/plots/segment/:segment_id
          // with project id being the plotter.projectId and segment_id being the dot.dotId
          fetch(this.plot.source + "projects/" + this.plot.projectId + "/plots/segment/" + this.dotId, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json", // Specify that we're sending JSON data
            },
          }).then(() => plotter.forceUpdate());
        } else if (d.name === "Add to other category") {
          this.setRightClickedId(this.dotId);
          this.addToCode();
        }
      })
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * rectHeight)
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .style("fill", "#eee");

    contextMenu
      .selectAll("g.option")
      .append("text")
      .attr("x", 10 / scale)
      .attr("y", (d, i) => i * rectHeight + 20 / scale)
      .attr("font-size", `${12 / scale}px`)
      .text((d) => d.name);

    // Handle dropdown type
    const dropdownGroup = contextMenu
      .selectAll("g.dropdown")
      .data(options.filter((d) => d.type === "dropdown"))
      .enter()
      .append("g")
      .attr("class", "dropdown")
      .attr("transform", (d, i) => `translate(0, ${i * rectHeight})`);

    const dropdown = dropdownGroup
      .append("foreignObject")
      .attr("x", rectWidth - 60 / scale)
      .attr("y", 0)
      .attr("width", 60 / scale)
      .attr("height", rectHeight);

    dropdown
      .append("xhtml:select")
      .on("change", function (d) {
        const selectedValue = this.value;
        // Handle the selected value
      })
      .selectAll("option")
      .data((d) => d.values)
      .enter()
      .append("xhtml:option")
      .attr("value", (d) => d)
      .text((d) => d);

    // Add an event listener to hide the menu when clicking elsewhere
    d3.select("body").on(
      "click",
      () => {
        contextMenu.remove();
      },
      false,
    );
  }

  move() {
    if (this.circle) {
      this.circle
        .transition()
        .duration(10 * 300)
        .attr("cx", this.x)
        .attr("cy", this.y);
    }
    if (this.line) {
      this.line.updateStart(this.x, this.y);
    }
  }

  showTooltip(svg) {
    const absolutePosition = this.circle.node().getBoundingClientRect();

    this.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("left", absolutePosition.left + 10 + "px")
      .style("top", absolutePosition.top - 10 + "px")
      .style("display", "block")
      .style("background-color", d3.color(this.color).copy({ opacity: 0.5 }).toString());
    this.tooltip
      .append("div")
      .text("Segment: " + this.segment)
      .append("div")
      .text("Category: " + findCodePath(this.plot.tree, this.code))
      .append("div")
      .text("Sentence: " + this.sentence);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
  setDragBehavior(plotter) {
    const drag = d3
      .drag()
      .on("start", (event) => this.dragStart(plotter, event))
      .on("drag", (event) => this.dragMove(event))
      .on("end", (event) => this.dragEnd(event));

    this.circle.call(drag);
  }

  removeDragBehavior() {
    this.circle.on(".drag", null);
  }

  dragStart(plotter, event) {
    if (this.line) {
      this.line.remove();
    }
    this.line = new Line(this);
    this.line.draw(plotter);
  }

  dragMove(event) {
    if (this.line) {
      this.line.updateEnd(event.x, event.y);
    }
  }

  remove() {
    if (this.line) {
      this.line.remove();
    }
    if (this.plot.data.includes(this)) {
      this.plot.data = arrayRemove(this.plot.data, this);
    }
    if (this.circle) {
      this.circle.remove();
    }
    if (this.tooltip) {
      this.tooltip.remove();
    }
  }

  dragEnd(event) {
    if (this.line) {
      // Any logic you want after the drag ends
    }
  }
}

class Line {
  public element: null | d3.Selection<SVGLineElement, any, any, any>;
  public start: Dot;
  public end_x: number;
  public end_y: number;
  public hitbox: null | d3.Selection<SVGCircleElement, any, any, any>;
  public dot: Dot;

  constructor(dot) {
    this.element = null;
    this.start = dot;
    this.end_x = dot.x;
    this.end_y = dot.y;
    this.hitbox = null;
    this.dot = dot;
    dot.line = this;
    dot.plot.lines.push(this);
    this.dot.plot.list_update_callback(this.dot.plot);
  }
  updateStart(x, y) {
    this.start.x = x;
    this.start.y = y;
    if (this.element) {
      this.element
        .transition()
        .duration(10 * 300) // Match the dot's transition duration
        .attr("x1", x)
        .attr("y1", y);
    }
  }
  remove() {
    if (this.dot.line == this) {
      this.dot.line = null;
    }
    if (this.dot.plot.lines.includes(this)) {
      this.dot.plot.lines = arrayRemove(this.dot.plot.lines, this);
    }
    if (this.element) {
      this.element.remove();
    }
    this.dot.plot.list_update_callback(this.dot.plot);
  }
  draw(plotter) {
    console.log("Drawing line");
    console.log("drawing line plotter", plotter);
    const creationZoomScale = d3.zoomTransform(this.dot.plot.svg.node()).k;
    this.element = plotter.container
      .append("line")
      .attr("x1", this.start.x)
      .attr("y1", this.start.y)
      .attr("x2", this.end_x)
      .attr("y2", this.end_y)
      .attr("stroke", this.dot.color) // or whatever style you want
      .attr("stroke-width", this.dot.plot.point_r / 2 / creationZoomScale)
      .attr("marker-end", "url(#arrowhead)");

    this.hitbox = plotter.container
      .append("circle")
      .attr("cx", this.end_x)
      .attr("cy", this.end_y)
      .attr("r", this.dot.plot.point_r / creationZoomScale) // Adjust the radius for your preference
      .style("fill", "transparent")
      .style("cursor", "pointer");

    this.enableDrag(plotter);
    if (this.dot.plot.train_slide) {
      this.dot.plot.train_slide.update();
    }
  }

  updateEnd(x, y) {
    this.end_x = x;
    this.end_y = y;
    this.element.attr("x2", x).attr("y2", y);
    if (this.hitbox) {
      this.hitbox.attr("cx", x).attr("cy", y);
    }
  }

  enableDrag(plotter) {
    const lineDrag = d3.drag().on("drag", (event) => this.dragLineEnd(event));

    this.hitbox.call(lineDrag); // Attach the drag behavior to the hitbox
  }

  dragLineEnd(event) {
    this.updateEnd(event.x, event.y);
  }
}

class DotPlot {
  public addToCode: () => void;
  public setRightClickedId: (id: number) => void;
  public containerId: string;
  public is_dynamic: boolean;
  public train_button: any;
  public fetched_data: any;
  public list_update_callback: any;
  public source: string;
  public projectId: number;
  public data: Dot[];
  public lines: Line[];
  public selected: number[];
  public svg: any;
  public cluster: boolean;
  public button_is_set: boolean;
  public container: any;
  public point_r: number;
  public zoom: any;
  public filter: any;
  public tree: any;
  public color_mapper: any;
  public stopTraining: boolean;

  constructor(
    containerId,
    projectId,
    source,
    svg,
    container,
    train_button,
    is_dynamic = false,
    list_update_callback = null,
    addToCode: () => void,
    setRightClickedId: (id: number) => void,
  ) {
    console.log("Initializing dot plotter...");
    this.containerId = containerId;
    this.is_dynamic = is_dynamic;
    this.train_button = train_button;
    this.fetched_data = null;
    this.list_update_callback = list_update_callback;
    this.source = source;
    this.projectId = projectId;
    this.data = [];
    this.lines = [];
    this.selected = [];
    this.svg = svg;
    this.cluster = false;
    this.button_is_set = false;
    this.container = container;
    this.point_r = 5.5;
    this.addToCode = addToCode;
    this.setRightClickedId = setRightClickedId;
    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const allDotsInSVG = this.container.selectAll(".dot");
    allDotsInSVG.each(function () {
      const dot = d3.select(this);
      dot.remove();
    });
    this.zoom = d3
      .zoom()
      .scaleExtent([0.01, 1000]) // Adjust as per your requirements
      .on("zoom", (event) => {
        this.container.attr("transform", event.transform);
        const scale = event.transform.k;
        const dots = this.container.selectAll(".dot");
        const lines = this.container.selectAll("line");
        const hitbox = this.container.selectAll("circle");
        lines.attr("stroke-width", this.point_r / 2 / scale);
        hitbox.attr("r", this.point_r / scale);
        if (scale > 1.5) {
          dots.attr("r", this.point_r / scale).attr("stroke-width", 2 / scale); // If original radius is this.point_r
        } else {
          dots.attr("r", this.point_r);
        }
      });
    this.setupTrainButton();
    this.svg.call(this.zoom);
    this.generateColors()
      .then(() => this.update())
      .then(() => this.homeView());
  }

  setupTrainButton() {
    const trainButton = this.train_button.current;
    if (!trainButton) {
      console.log("train button not found");
      console.log("aborting...");
      return;
    }
    this.button_is_set = true;
    /*trainButton.addEventListener("click", () => {
      if (trainButton.textContent === "Train") {
        this.toggleTrainButtonState();
        this.trainForEpochs(10);
      } else {
        this.stopTraining = true;
      }
    });*/
  }
  trainLines() {
    // Transform lines data into the desired format
    const formattedData = this.lines.map((line) => {
      return {
        id: line.dot.dotId,
        pos: [line.end_x, line.end_y],
      };
    });
    const jsonData = JSON.stringify(formattedData); // Convert the formatted data to JSON
    fetch(this.source + "projects/" + this.projectId + "/dynamic/correction?epochs=3", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Specify that we're sending JSON data
      },
      body: jsonData, // Attach the JSON data to the request body
    })
      .then((response) => response.json())
      .then(() => {
        this.forceUpdate();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  toggleTrainButtonState() {
    const trainButton = this.train_button.current;
    if (!trainButton) return;
    if (trainButton.textContent === "Train") {
      trainButton.textContent = "Stop";
      this.stopTraining = false;
    } else {
      trainButton.textContent = "Train";
      this.stopTraining = true;
    }
  }
  setFilter(filterFunc) {
    this.filter = filterFunc;
  }
  homeView() {
    const xExtent = d3.extent(this.data, (d) => d.x);
    const yExtent = d3.extent(this.data, (d) => d.y);

    // Calculate width and height of the bounding box
    const dataWidth = xExtent[1] - xExtent[0];
    const dataHeight = yExtent[1] - yExtent[0];

    // Calculate the viewport's width and height
    const svgElem = this.svg.node(); // Assuming svg is a D3 selection. If it's a raw DOM element, you don't need .node().
    const { width, height } = svgElem.getBoundingClientRect();

    const kx = width / dataWidth;
    const ky = height / dataHeight;
    const k = 0.95 * Math.min(kx, ky); // 0.95 is for a little padding

    // Calculate the translation to center the bounding box in the viewport
    const tx = (width - k * (xExtent[1] + xExtent[0])) / 2;
    const ty = (height - k * (yExtent[1] + yExtent[0])) / 2;

    // Apply the zoom transform
    this.svg.transition().call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }

  fetchData() {
    if (this.fetched_data) {
      return Promise.resolve(this.fetched_data);
    } else {
      console.log("fetching data...");
      const endpoint = this.source + "projects/" + this.projectId + "/plots/?all=true";
      return fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
          this.fetched_data = data["data"];
          return data["data"];
        })
        .catch((error) => {
          console.error("Error fetching plot data:", error);
          throw error;
        });
    }
  }

  generateColors() {
    const endpoint = this.source + "projects/" + this.projectId + "/codes/tree";
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
  updateClusters() {
    return this.fetchData().then((newData) => {
      this.renderClusters(newData);
    });
  }

  renderClusters(newData) {
    // make the color of all dots in this.data [red, green, blue] depending on cluster id
    if (!this.cluster) {
      this.cluster = true;
      console.log("making clusters...");
      for (const dot of this.data) {
        dot.makeCluster();
      }
    } else {
      this.cluster = false;
      console.log("removing clusters...");
      for (const dot of this.data) {
        dot.removeCluster();
      }
    }
    console.log("done");
  }
  update() {
    console.log("updating...");
    return this.fetchData().then((newData) => {
      this.render(newData);
    });
  }

  applyCodeFilter(codes) {
    function createCodeFilter(codes) {
      return function (dot) {
        return codes.includes(dot.code);
      };
    }
    const filterFunc = createCodeFilter(codes);
    this.setFilter(filterFunc);
    this.update().then(() => this.homeView());
  }

  /*
  trainForEpochs(epochsRemaining) {
    if (this.stopTraining || epochsRemaining <= 0) {
      this.toggleTrainButtonState();
      return;
    }

    fetch(this.source + "projects/" + this.projectId + "/dynamic/cluster?epochs=3", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        this.update().then(() => this.trainForEpochs(epochsRemaining - 1));
      })
      .catch((error) => {
        console.error("Error:", error);
        this.toggleTrainButtonState(); // Ensure the button state is reset if there's an error
      });
  } */

  trainForEpochs(epochsRemaining) {
    // Check if training should stop or epochs remaining is zero
    if (this.stopTraining || epochsRemaining <= 0) {
      this.toggleTrainButtonState();
      return;
    }

    // Send a request to the backend to train for 1 epoch
    fetch(this.source + "projects/" + this.projectId + "/dynamic/cluster?epochs=3", {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }
        return response.json();
      })
      .then(() => {
        this.forceUpdate();
        setTimeout(() => this.trainForEpochs(epochsRemaining - 1), 1000);
        //this.trainForEpochs(epochsRemaining - 1);
      })
      .catch((error) => {
        console.error("Error:", error);
        this.toggleTrainButtonState(); // Ensure the button state is reset if there's an error
      });
  }

  getList() {
    return this.lines;
  }
  forceUpdate() {
    console.log("force updating...");
    this.fetched_data = null;
    return this.update();
  }

  conditionalUpdate() {
    if (this.fetched_data) {
      this.update();
    }
  }

  render(newData) {
    // Existing Dots
    //this.container.selectAll(".dot").remove();
    console.log("rendering...");
    if (this.filter) {
      newData = newData.filter((dot) => this.filter(dot));
    } else {
      newData = [];
    }

    newData.forEach((dotData) => {
      let existingDot = this.data.find((d) => d.dotId === dotData.id);
      if (existingDot) {
        existingDot.x = dotData.reduced_embedding.x;
        existingDot.y = dotData.reduced_embedding.y;
        existingDot.cluster_id = dotData.cluster;
        existingDot.move(); // Animate transition
      } else {
        let newDot = new Dot(
          dotData.id,
          dotData.reduced_embedding.x,
          dotData.reduced_embedding.y,
          dotData.segment,
          dotData.sentence,
          dotData.code,
          dotData.cluster,
          this,
          this.addToCode,
          this.setRightClickedId,
        );
        newDot.draw(this);
      }
    });
    this.data = this.data.filter((dot) => {
      let shouldKeep = newData.find((d) => d.id === dot.dotId);
      if (!shouldKeep && dot.circle) {
        dot.remove();
      }
      return shouldKeep;
    });
  }
}
export interface DotPlotProps {
  projectId: number;
  source: string;
  is_dynamic?: boolean; // Assuming this prop can be optional
}

// This is the interface for the functions you're exposing.
export interface DotPlotCompHandles {
  setPlotFilter: (filterValue: any) => void;
  setModelType: (modelType: any) => void;
}

const DotPlotComp = forwardRef<DotPlotCompHandles, DotPlotProps>((props, ref) => {
  const { projectId, source } = props;
  const [is_dynamic, set_dynamic] = useState(props.is_dynamic);
  const [rightClickedItemId, setRightClickedItemId] = useState<number>();
  const pendingFilterRef = useRef<any>(null);
  const pendingButtonRef = useRef<any>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  const trainButtonRef = useRef<HTMLButtonElement>(null);
  //const [items, setItems] = useState<any[]>([]);
  const isInitializedRef = useRef(false);
  const [plot, setPlot] = useState<any>();
  const [train, setTrain] = useState<any>();
  const [plotItems, setPlotItems] = useState<any>([]);
  const [openChangeCodeModal, setChangeCodeModal] = useState(false);
  const handleDataUpdate = (plot_this) => {
    const value = [...(plot_this?.getList() || [])];
    setPlotItems(value);
  };

  DotPlotComp.displayName = "DotPlotComp";

  useImperativeHandle(ref, () => ({
    setPlotFilter: (filterValue: any) => {
      if (plot) {
        plot.applyCodeFilter(filterValue);
      } else {
        console.log("plot is null; queuing the filter value");
        pendingFilterRef.current = filterValue;
      }
    },

    setModelType: (modelType: any) => {
      console.log("setting model type");
      console.log("modelType", modelType);
      if (plot) {
        if (modelType == "dynamic") {
          console.log("setting dynamic to true");
          plot.is_dynamic = true;
          set_dynamic(true);
          console.log("plot", plot);
          plot?.forceUpdate().then(() => plot.homeView());
          plot.train_button = trainButtonRef;

          plot.setupTrainButton();
          for (const dot of plot.data) {
            dot.setDragBehavior(plot);
          }
        } else {
          console.log("setting dynamic to false");
          plot.is_dynamic = false;
          set_dynamic(false);
          plot.train_button = null;
          for (const dot of plot.data) {
            dot.removeDragBehavior();
          }
          for (const line of plot.lines) {
            line.remove();
          }
          console.log("plot", plot);
          plot?.forceUpdate().then(() => plot.homeView());
        }
      } else {
        console.log("plot is null; queuing the model type");
      }
      console.log(plot);
      console.log("is_dynamic: ", is_dynamic);
    },
  }));

  useEffect(() => {
    if (plot && pendingFilterRef.current) {
      console.log("Applying queued filter value");
      plot.applyCodeFilter(pendingFilterRef.current);
      pendingFilterRef.current = null; // Clear the pending filter
    }
  }, [plot]);

  useEffect(() => {
    console.log("AAAAAAAAAAAAAAAHHHHHHHHH");
    if (trainButtonRef.current) {
      // Your logic to connect the button.
      if (plot && plot.is_dynamic) {
        console.log("setting up train button");
        console.log("train button", trainButtonRef);
        plot.train_button = trainButtonRef;
        plot.setupTrainButton();
      }
    } else {
      console.log("train button not found");
    }
  }, [trainButtonRef]);

  const handleDeleteItem = (item) => {
    item.remove();
  };

  const handleOpen = () => setChangeCodeModal(true);

  useEffect(() => {
    console.log("is_dynamic: ", is_dynamic);
    console.log("isInitializedRef.current: ", isInitializedRef.current);
    console.log("Entered UseEffect");
    if (!isInitializedRef.current) {
      //} && is_dynamic != undefined) {
      if (canvasRef.current && (!is_dynamic || trainButtonRef.current)) {
        console.log("source: ", source);
        console.log("projectID: ", projectId);
        console.log("is_dynamic: ", is_dynamic);
        const svg_ = d3.select(canvasRef.current);
        const container_ = d3.select("#container");
        const newPlot = new DotPlot(
          "container",
          projectId,
          source,
          svg_,
          container_,
          trainButtonRef,
          is_dynamic,
          handleDataUpdate,
          handleOpen,
          handleRightClick,
        );
        setPlot(newPlot);

        // Call generateColors and update as usual
        /*
          newPlot
            .generateColors()
            .then(() => newPlot.update())
            .then(() => {
              // After updating, set the fetched data to the state
              setPlotItems(newPlot.getList()); // Assuming list is the correct variable name
              newPlot.homeView();
            });
           */
        isInitializedRef.current = true;
      }
    }
  }, [projectId, source, is_dynamic]);

  const handleRightClick = (id: number) => {
    setRightClickedItemId(id);
  };
  const handleChangeCodeClose = () => {
    setChangeCodeModal(false);
  };

  // Update the rendering part to utilize the fetched plotItems instead of the dummy items
  return (
    <div className="flex">
      <ChangeCodeModal
        open={openChangeCodeModal}
        handleClose={handleChangeCodeClose}
        projectId={projectId}
        segmentId={rightClickedItemId}
      />
      <div className="dynamicSvgContainer border h-[80vh] w-auto">
        {/* Use the fetched plotItems instead of dummy items */}
        <svg id="canvas" ref={canvasRef} width="100%" height="100%">
          <g id="container"></g>
        </svg>
        <div style={{ display: "flex", position: "absolute", right: "20px", bottom: "20px", gap: "10px" }}>
          <Button
            variant="contained"
            className="bg-blue-900 rounded"
            ref={trainButtonRef}
            onClick={() => {
              plot.updateClusters();
            }}
          >
            Show cluster
          </Button>
          <Button
            variant="contained"
            className="bg-blue-900 rounded "
            ref={trainButtonRef}
            onClick={() => {
              fetch(source + "projects/" + projectId + "/clusters/errors?max_count=20", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json", // Specify that we're sending JSON data
                },
              })
                .then((response) => response.json())
                .then((data) => {
                  const id_list = data.data;
                  const filtered_dots = plot.data.filter((dot) => id_list.includes(dot.dotId));
                  console.log("len dots", plot.data);
                  for (const dot of filtered_dots) {
                    dot.makeSuggestion();
                  }
                });
            }}
          >
            Suggestions
          </Button>
          {is_dynamic && (
            <Button
              variant="contained"
              className="bg-blue-900 rounded"
              ref={trainButtonRef}
              onClick={() => {
                console.log("wanting to train plot");
                console.log("plot: ", plot);
                console.log("button_set", plot?.button_is_set);
                if (!plot?.button_is_set) {
                  plot.train_button = trainButtonRef;
                  plot?.setupTrainButton();
                }
                if (trainButtonRef.current?.textContent === "Train") {
                  plot?.toggleTrainButtonState();
                  plot?.trainForEpochs(10);
                } else {
                  plot.stopTraining = true;
                  trainButtonRef.current.textContent = "Stopping...";
                }

                //plot?.trainForEpochs(10);
                //plot?.setupTrainButton();
              }}
            >
              Train
            </Button>
          )}
        </div>
      </div>
      {is_dynamic && (
        <div className="itemListContainer">
          <ItemList
            items={plotItems || []}
            onDelete={handleDeleteItem}
            onTrain={(plot) => {
              console.log("wanting to train lines, plot: ", plot);
              plot.trainLines();
            }}
          />
        </div>
      )}
    </div>
  );
});

export default DotPlotComp;
