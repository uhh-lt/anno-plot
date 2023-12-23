import * as d3 from "d3";
import * as fc from "d3fc";
import {hashCode, webglColor} from "@/utilities";
import {arrowSeries, initializeArrows} from "./Arrows";


const determineHomeTransform = (pureData, width, height, padding = 10) => {
    const xExtent = d3.extent(pureData, (d: any) => +d.x);
    const yExtent = d3.extent(pureData, (d: any) => +d.y);

    let xDomain = [xExtent[0] - padding, xExtent[1] + padding];
    let yDomain = [yExtent[0] - padding, yExtent[1] + padding];

    const xScaleFactor = width / (xDomain[1] - xDomain[0]);
    const yScaleFactor = height / (yDomain[1] - yDomain[0]);

    const scaleFactor = Math.min(xScaleFactor, yScaleFactor);

    const dataCenterX = (xDomain[0] + xDomain[1]) / 2;
    const dataCenterY = (yDomain[0] + yDomain[1]) / 2;

    const translateX = width / 2 - scaleFactor * dataCenterX;
    const translateY = height / 2 - scaleFactor * dataCenterY;

    if (pureData.length === 0) {
        return null;
    }

    return d3.zoomIdentity.translate(translateX, translateY).scale(scaleFactor);

}
export const render = (data, codes, arrows, dynamic,
                       handle_set_arrow, handle_hover, handle_right_click,
                       initialTransform, setInitialTransform) => {
    // data is entered as a combination of potentially 3 different types of data:
    // 1. data points
    // 2. cluster points (id = -1)
    // 3. error points (id = -2)
    const pureData = data.filter((d) => d.id >= 0);

    // create a quadtree for fast lookup of the closest point
    const quadtree = d3
        .quadtree()
        .x((d: any) => d.x)
        .y((d: any) => d.y)
        .addAll(pureData);

    // clear any previous data, and initialize the arrows
    const containerElement = document.getElementById("chart");
    containerElement.innerHTML = "";
    const svg = initializeArrows(containerElement);

    const width = containerElement?.clientWidth;
    const height = containerElement?.clientHeight;

    const xScale = d3.scaleLinear().domain([0, width]).range([0, width]);

    const yScale = d3.scaleLinear().domain([height, 0]).range([height, 0]);

    const xScaleOriginal = xScale.copy();
    const yScaleOriginal = yScale.copy();

    let currentTransform = initialTransform;
    if (currentTransform === null) {
        currentTransform = determineHomeTransform(pureData, width, height);
        setInitialTransform(currentTransform);
    }
    // color mapper for the codes
    // (1) if it's a data point, use the color of the code (specified in codes)
    // (2) if it's a cluster point, use the color of the cluster (randomly generated here)
    // (3) if it's an error point, use red

    // (1) mapper from code_id to color
    const idToColorMapper = {};

    codes.forEach((item) => {
        idToColorMapper[item.code_id] = item.color;
    });
    // (2) initialize color scale for clusters
    const clusterColorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const categoryFill = (d) => {
        if (d.id >= 0) {
            // (1) data point
            return webglColor(idToColorMapper[d.code_id]);
        }
        if (d.id === -1) {
            // (2) cluster point:
            return webglColor(clusterColorScale(String(d.cluster_id % 10)));
        }
        // (3) error point
        return webglColor("#FF0000");
    };
    const fillColor = fc.webglFillColor().value(categoryFill).data(data);

    // create the point series
    const pointSeries = fc
        .seriesWebglPoint()
        .equals((a: any, b: any) => {
            return a === b;
        })
        .size((d: any) => d.r)
        .crossValue((d: any) => +d.x)
        .mainValue((d: any) => +d.y);

    // add color to the point series
    pointSeries.decorate((program) => fillColor(program));

    // create the zoom behavior
    const zoom = d3
        .zoom()
        .scaleExtent([0.001, 10000])
        .on("zoom", (event) => {
            currentTransform = event.transform;
            xScale.domain(event.transform.rescaleX(xScaleOriginal).domain());
            yScale.domain(event.transform.rescaleY(yScaleOriginal).domain());
            setInitialTransform(currentTransform);
            redraw();
        });


    // Arrows:
    // for the arrows there are two sets of drag functions, one when a webgl point is dragged
    // and one when an existing arrow is dragged
    // I am sure this can be done in a more elegant way (todo)
    const onSubjectDrag = (event) => {
        const [x_coord, y_coord] = d3.pointer(event);
        const x = xScale.invert(x_coord);
        const y = yScale.invert(y_coord);
        const radius = Math.abs(xScale.invert(x_coord) - xScale.invert(x_coord - 10));
        const closestDatum = quadtree.find(x, y, radius);
        if (closestDatum) {
            return closestDatum;
        }
    };
    const initDrag = (event, {arrows, data}) => {
    };
    const onDrag = (event, {arrows, data}) => {
        const d = event.subject;
        const xDomain = xScale.domain();
        const xRange = xScale.range();
        const xScaleFactor = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0]);
        const difference_x = (event.x - d.x) / xScaleFactor;
        const difference_y = (event.y - d.y) / xScaleFactor;
        const x = d.x + difference_x;
        const y = d.y + difference_y;
        const i = arrows.findIndex((a) => a.dot_id === d.id);
        if (i == -1) {
            const newArrow = {
                dot_id: d.id,
                start: {x: d.x, y: d.y},
                end: {x: x, y: y},
                code_id: d.code_id,
            };
            arrows.push(newArrow);
        } else {
            arrows[i].end.x = x;
            arrows[i].end.y = y;
        }
        redraw();
    };
    const onDragEnd = (event, data) => {
        // find arrow belonging to this dot
        const d = event.subject;
        const i = arrows.findIndex((a) => a.dot_id === d.id);
        if (i == -1) {
            return null;
        }
        const arrow = arrows[i];
        //set the arrow for external use
        handle_set_arrow(arrow);
    };

    // drag is only enabled for dynamic models
    // if it is not enabled no point is selected
    let drag = d3
        .drag()
        .subject(onSubjectDrag)
        .on("start", initDrag) // Assuming abc is your drag start handler function
        .on("drag", onDrag) // Assuming abc is your drag during handler function
        .on("end", onDragEnd);
    if (!dynamic) {
        drag = d3
            .drag()
            .subject(() => null)
            .on("start", initDrag) // Assuming abc is your drag start handler function
            .on("drag", onDrag) // Assuming abc is your drag during handler function
            .on("end", onDragEnd);
    }
    // Arrow drag for existing arrows:
    const onDragArrow = (event, d) => {
        const [x_coord, y_coord] = d3.pointer(event);
        const containerElement = document.getElementById("chart");
        const offset_left = containerElement.getBoundingClientRect().left + 14;
        const offset_top = containerElement.getBoundingClientRect().top + 14;
        d.end.x = xScale.invert(x_coord - offset_left);
        d.end.y = yScale.invert(y_coord - offset_top);

        // Update line end position
        d3.select(this).select("line").attr("x2", xScale(d.end.x)).attr("y2", yScale(d.end.y));

        // Update drag handle position
        d3.select(this).select(".drag-handle").attr("cx", xScale(d.end.x)).attr("cy", yScale(d.end.y));

        redraw();
    }

    const onDragArrowEnd = (event, d) => {
        handle_set_arrow(d);
    };

    // capture pointer, and handle hover events
    let currentAnnotation = -1;


    const pointer = fc.pointer().on("point", ([coord]) => {
        let newAnnotation = -1;
        if (coord && quadtree) {
            // find the closes datapoint to the pointer
            const x = xScale.invert(coord.x);
            const y = yScale.invert(coord.y);
            const radius = Math.abs(xScale.invert(coord.x) - xScale.invert(coord.x - 10));
            const closestDatum = quadtree.find(x, y, radius);
            if (closestDatum) {
                newAnnotation = closestDatum["id"];
            }

            if (newAnnotation !== currentAnnotation) {
                currentAnnotation = newAnnotation;
                const rect = containerElement.getBoundingClientRect();
                const absoluteX = coord.x + rect.left;
                const absoluteY = coord.y + rect.top;
                handle_hover({x: absoluteX, y: absoluteY}, currentAnnotation);
            }
        }
    });

    // Define the chart
    const chart = fc
        .chartCartesian(xScale, yScale)
        .webglPlotArea(
            fc
                .seriesWebglMulti()
                .series([pointSeries])
                .mapping((d) => d.data),
        )
        .svgPlotArea(
            fc
                .seriesSvgMulti()
                .series([arrowSeries(xScale, yScale, onDrag, onDragEnd, idToColorMapper, svg)])
                .mapping((d: any) => d.arrows),
        )
        .decorate((sel) =>
            sel
                .enter()
                .select("d3fc-svg.plot-area")
                .on("measure.range", (event) => {
                    //this.handle_hover({}, -1);
                    xScaleOriginal.range([0, event.detail.width]);
                    yScaleOriginal.range([event.detail.height, 0]);
                    xScaleOriginal.domain([0, event.detail.width]);
                    yScaleOriginal.domain([event.detail.height, 0]);
                    if (event.detail.resized) {
                        if (currentTransform !== null) {
                            // @ts-ignore
                            d3.select("d3fc-svg.plot-area").call(zoom.transform, currentTransform);
                        }
                    }
                    redraw();
                })
                .call(drag)
                .call(zoom)
                .call(pointer)
                .on("contextmenu", function (event, d) {
                    // check if it hit an object in the quadtree
                    const [x_coord, y_coord] = d3.pointer(event);
                    const x = xScale.invert(x_coord);
                    const y = yScale.invert(y_coord);
                    const radius = Math.abs(xScale.invert(x_coord) - xScale.invert(x_coord - 10));
                    const closestDatum = quadtree.find(x, y, radius);
                    if (closestDatum) {
                        event.preventDefault();
                        handle_hover({}, -1);
                        handle_right_click(event, closestDatum);
                    }
                }),
        );
    const redraw = () => {
        handle_hover({}, -1);
        d3.select("#chart").datum({arrows, data}).call(chart);
    };
    redraw();
    if (currentTransform !== null) {
        // @ts-ignore
        d3.select("d3fc-svg.plot-area").call(zoom.transform, currentTransform);
    }
}