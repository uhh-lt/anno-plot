import * as d3 from 'd3';
import * as fc from 'd3fc';
import {hashCode, webglColor} from "@/utilities.tsx";
import {arrowSeries, initializeArrows} from "./Arrows.tsx";

export class D3_WebGL_Plot_Manager {
    public transformation: any;
    private dynamic: boolean;
    private ref: any;
    private zoom: any;
    private svg: any;
    private scale: any;
    private previousData: any;
    private zoomTransform: any;
    private currentAnnotation: any;

    private handle_set_arrow: any;
    public handle_hover: any;
    private handle_right_click: any;

    constructor(
        ref: any,
        handle_set_arrow: any,
        handle_hover: any,
        handle_right_click: any,
    ) {
        this.ref = ref;
        this.handle_set_arrow = handle_set_arrow;
        this.handle_hover = handle_hover;
        this.handle_right_click = handle_right_click;
        this.scale = 1;
        this.previousData = [];
        this.zoomTransform = null;
        this.currentAnnotation = -1;


    }

    private ownFunctionZoomColor = (data, categories, arrows, dynamic) => {

        const data_without_cluster_or_errors = data.filter(d => d.id >= 0);

        const quadtree = d3
            .quadtree()
            .x(d => d.x)
            .y(d => d.y)
            .addAll(data_without_cluster_or_errors);

        const containerElement = document.getElementById('chart');
        containerElement.innerHTML = '';
        const svg = initializeArrows(containerElement);


        const width = containerElement.clientWidth; // - 100;
        const height = containerElement?.clientHeight; // - 64;


        const xScale = d3.scaleLinear()
            .domain([0, width])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([height, 0])
            .range([height, 0]);


        const xScaleOriginal = xScale.copy();
        const yScaleOriginal = yScale.copy();


        const pointSeries = fc.seriesWebglPoint()
            .equals((a, b) => {
                return a === b;
            })
            .size(d => d.r)
            .crossValue(d => d.x)
            .mainValue(d => d.y);

        // mapper from category_id to color
        const idToColorMapper = {};

        categories.forEach(item => {
            idToColorMapper[item.code_id] = item.color;
        });


        const clusterColorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const categoryFill = d => {
            if(d.id>=0) {
                return webglColor(idToColorMapper[d.code_id]);
            }
            if (d.id === -1) {
                // cluster denoting point:
                return webglColor(clusterColorScale(String(d.cluster_id % 10)));
            }
            // it should return red
            return webglColor("#FF0000");
        }
        const fillColor = fc.webglFillColor().value(categoryFill).data(data);
        pointSeries.decorate(program => fillColor(program));

        const zoom = d3.zoom()
            .scaleExtent([0.001, 10000])
            .on("zoom", (event) => {
                this.zoomTransform = event.transform;
                xScale.domain(event.transform.rescaleX(xScaleOriginal).domain());
                yScale.domain(event.transform.rescaleY(yScaleOriginal).domain());
                redraw();
            });

        function initiateArrowDrag(datum, coord) {
            const newArrow = {
                dot_id: datum.id,
                start: { x: datum.x, y: datum.y },
                end: { x: coord.x, y: coord.y },
                code_id: datum.code_id/* appropriate code_id */
            };
    //delete arrow if it already exists
    const index = arrows.findIndex(a => a.dot_id === newArrow.dot_id);
    if (index !== -1) {
        arrows.splice(index, 1);
    }
    arrows.push(newArrow);
    redraw();
    //onDrag(coord, newArrow);

}

        const pointer = fc.pointer().on("point", ([coord]) => {
            let newAnnotation = -1;
            if (coord && quadtree) {
                // find the closes datapoint to the pointer
                const x = xScale.invert(coord.x);
                const y = yScale.invert(coord.y);
                const radius = Math.abs(xScale.invert(coord.x) - xScale.invert(coord.x - 10));
                const closestDatum = quadtree.find(x, y, radius);
                if (closestDatum) {
                    newAnnotation = closestDatum.id;
                }

                if (newAnnotation !== this.currentAnnotation) {
                    this.currentAnnotation = newAnnotation;
                    const rect = containerElement.getBoundingClientRect();
                    // Calculate absolute coordinates
                    const absoluteX = coord.x + rect.left;
                    const absoluteY = coord.y + rect.top;
                    // Pass absolute coordinates
                    this.handle_hover({x: absoluteX, y: absoluteY}, this.currentAnnotation);
                }
            }
    });



        const onSubjectDrag = (event) => {
            const [x_coord, y_coord] = d3.pointer(event);
            const x = xScale.invert(x_coord);
            const y = yScale.invert(y_coord);
            const radius = Math.abs(xScale.invert(x_coord) - xScale.invert(x_coord - 5));
            const closestDatum = quadtree.find(x, y,
                radius);
            if (closestDatum) {
                return closestDatum;
            }
        }
        const initDrag = (event, {arrows, data}) => {
            const d = event.subject;
            //dont do anything
        }
        const onDragTry = (event, {arrows, data}) => {
            const d = event.subject;
            const xDomain = xScale.domain();
            const xRange = xScale.range();
            const xScaleFactor = (xRange[1] - xRange[0]) / (xDomain[1] - xDomain[0]);
            // I have zero clue why the coordinates changed so much with this event, and why
            // but this works
            const difference_x = (event.x - d.x)/xScaleFactor;
            const difference_y = (event.y - d.y)/xScaleFactor;
            const x = d.x + difference_x;
            const y = d.y + difference_y;
            const i = arrows.findIndex(a => a.dot_id === d.id);
            if (i == -1) {
                const newArrow = {
                    dot_id: d.id,
                    start: { x: d.x, y: d.y },
                    end: { x: x, y: y },
                    code_id: d.code_id
                }
                arrows.push(newArrow);
            }
            else {
                arrows[i].end.x = x;
                arrows[i].end.y = y;
            }
            redraw();
        }

        const onDragEndTry = (event, data) => {
            // find arrow belonging to this dot
            const d = event.subject;
            const i = arrows.findIndex(a => a.dot_id === d.id);
            if (i == -1) {
                return null;
            }
            const arrow = arrows[i];
            this.handle_set_arrow(arrow);
        }

        let trydrag = d3.drag().subject(onSubjectDrag)
                .on('start', initDrag) // Assuming abc is your drag start handler function
                .on('drag', onDragTry)  // Assuming abc is your drag during handler function
                .on('end', onDragEndTry);
        if(!dynamic) {
            trydrag = d3.drag().subject(()=> null)
                .on('start', initDrag) // Assuming abc is your drag start handler function
                .on('drag', onDragTry)  // Assuming abc is your drag during handler function
                .on('end', onDragEndTry);
        }

        function onDrag(event, d) {
            const [x_coord, y_coord] = d3.pointer(event);
        const containerElement = document.getElementById('chart');
        const offset_left = containerElement.getBoundingClientRect().left + 14;
        const offset_top = containerElement.getBoundingClientRect().top + 14;
        d.end.x = xScale.invert(x_coord - offset_left);
        d.end.y = yScale.invert(y_coord- offset_top);

        // Update line end position
        d3.select(this).select('line')
            .attr('x2', xScale(d.end.x))
            .attr('y2', yScale(d.end.y));

        // Update drag handle position
        d3.select(this).select('.drag-handle')
            .attr('cx', xScale(d.end.x))
            .attr('cy', yScale(d.end.y));

        redraw();
    }

    const onDragEnd = (event, d) => {
            this.handle_set_arrow(d);
    }


const handle_right_click = this.handle_right_click;
        const handle_hover = this.handle_hover;

        const chart = fc
            .chartCartesian(xScale, yScale)
            .webglPlotArea(
                // only render the point series on the WebGL layer
                fc
                    .seriesWebglMulti()
                    .series([pointSeries])
                    .mapping(d => d.data)
            )
            .svgPlotArea(
                // only render the annotations series on the SVG layer
                fc
                    .seriesSvgMulti()
                    .series([arrowSeries(xScale, yScale, onDrag, onDragEnd, idToColorMapper, svg)])
                    .mapping(d => d.arrows)
            )
            .decorate(sel =>
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
                            if (this.zoomTransform !== null) {
                                d3.select("d3fc-svg.plot-area")
                                    .call(zoom.transform, this.zoomTransform);
                            }
                        }
                        redraw();
                    })
                    .call(trydrag)
                    .call(zoom)
                    .call(pointer)
                .on("contextmenu", function(event, d) {
                    // check if it hit an object in the quadtree
                    const [x_coord, y_coord] = d3.pointer(event);
                    const x = xScale.invert(x_coord);
                    const y = yScale.invert(y_coord);
                    const radius = Math.abs(xScale.invert(x_coord) - xScale.invert(x_coord - 5));
                    const closestDatum = quadtree.find(x, y,
                           radius);
                    if (closestDatum) {
                        event.preventDefault();
                        handle_hover({}, -1);
                        handle_right_click(event, closestDatum);
                    }

            }));
        const redraw = () => {
            this.handle_hover({}, -1);
            d3.select("#chart")
                .datum({arrows, data})
                .call(chart);
        }
        redraw();
        if (this.zoomTransform !== null) {
            d3.select("d3fc-svg.plot-area")
                .call(zoom.transform, this.zoomTransform);
        }

    }
}

