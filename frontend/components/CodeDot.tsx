import * as d3 from "d3";
//import { getidToColorMap } from "@/components/CodeDotPlotter";
/**
 * This class represents a visual dot associated with a code. It is used for rendering and interacting with code dots
 * within a plot.
 */

/*function newColorScale(code_id) {
  return getidToColorMap()[code_id] || "#808080"; // Fallback to gray
}*/

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
class CodeDot {
  private dotId: number;
  private x: number;
  private y: number;
  private code: string;
  private circle: null | d3.Selection<SVGCircleElement, any, any, any>;
  private plot: any;
  private radius: number;
  private color: any;
  private label: null | d3.Selection<SVGTextElement, any, any, any>;
  private addToCategory: () => void;
  private setRightClickedId: (id: number) => void;
  private deleteCode: () => void;
  private renameCode: () => void;
  private showCode: () => void;
  constructor(
    dotId: number,
    x: number,
    y: number,
    code: string,
    plot: any,
    addToCategory: () => void,
    radius: number,
    setRightClickedId: (id: number) => void,
    deleteCode: () => void,
    renameCode: () => void,
    showCode: () => void,
  ) {
    this.dotId = dotId;
    this.x = x;
    this.y = y;
    this.code = code;
    this.circle = null;
    this.label = null;
    this.plot = plot;
    this.setRightClickedId = setRightClickedId;
    this.deleteCode = deleteCode;
    this.renameCode = renameCode;
    if (!this.plot.color_mapper) {
      console.log("No color mapper");
      console.log(this.plot.color_mapper);
      console.log(this.plot);
      this.color = "#808080";
    } else {
      console.log("Color mapper");
      this.color = plot.color_mapper(this.dotId);
    }
    this.radius = radius;

    this.plot.data.push(this);
    this.addToCategory = addToCategory;
    this.showCode = showCode;

    if (this.x === 0 && this.y === 0) {
      this.x = Math.random() * 100;
      this.y = Math.random() * 100;
    }
  }
  setRadius(radius: number) {
    this.radius = radius;
    this.plot.point_r = radius;
    if (this.circle) {
      this.circle.attr("r", radius);
    }
  }

  draw(plotter: any) {
    console.log("this.plot.point_r", this.plot.point_r);
    this.circle = plotter.container
      .append("circle")
      .attr("class", "dot")
      .attr("cx", this.x)
      .attr("cy", this.y)
      .attr("r", this.radius)
      .attr("fill", d3.color(this.color).copy({ opacity: 0.5 }));

    this.label = plotter.container
      .append("text")
      .attr("class", "dot-label")
      .attr("font-size", "0.07px")
      .attr("x", this.x) // Adjust the x-coordinate for label placement
      .attr("y", this.y - 0.01) // Adjust the y-coordinate for label placement
      .text(findCodePath(this.plot.tree, this.dotId)); //

    this.circle?.on("contextmenu", (event, d) => {
      event.preventDefault();
      const circleNode = this.circle?.node();
      if (!circleNode) {
        return;
      }

      const circleRect = circleNode.getBoundingClientRect();
      d3.select(".custom-context-menu").remove();
      const contextMenu = d3
        .select("body")
        .append("div")
        .attr("class", "custom-context-menu")
        .style("position", "absolute")
        .style("left", circleRect.left + 10 + "px")
        .style("top", circleRect.top - 10 + "px");

      // Add menu options
      contextMenu
        .append("div")
        .text("Rename")
        .style("border", "1px solid #000000")
        .style("background-color", "#FFFFFF")
        .on("click", () => {
          this.setRightClickedId(this.dotId);
          this.renameCode();
          contextMenu.remove();
        });

      contextMenu
        .append("div")
        .text("Delete")
        .style("border", "1px solid #000000")
        .style("background-color", "#FFFFFF")
        .on("click", () => {
          this.setRightClickedId(this.dotId);
          this.deleteCode();
          contextMenu.remove();
        });

      contextMenu
        .append("div")
        .text("Add to Category")
        .style("border", "1px solid #000000")
        .style("background-color", "#FFFFFF")
        .on("click", () => {
          this.setRightClickedId(this.dotId);
          this.addToCategory();
          contextMenu.remove();
        });

      contextMenu
        .append("div")
        .text("Show category occurrences")
        .style("border", "1px solid #000000")
        .style("background-color", "#FFFFFF")
        .on("click", () => {
          this.setRightClickedId(this.dotId);
          this.showCode();
          contextMenu.remove();
        });

      // Close the context menu when clicking elsewhere
      d3.select("body").on("click.custom-context-menu", () => {
        contextMenu.remove();
      });
    });
  }

  remove() {
    if (this.circle) {
      this.circle.remove();
    }
    if (this.label) {
      this.label.remove();
    }
  }
}
export default CodeDot;
