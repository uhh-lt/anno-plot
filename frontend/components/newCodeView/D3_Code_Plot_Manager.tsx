import * as d3 from 'd3';
import * as fc from 'd3fc';
import {webglColor} from "@/utilities.tsx";

export class D3_Code_Plot_Manager {
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
        handle_right_click: any,
    ) {
        this.ref = ref;
        this.handle_right_click = handle_right_click;
        this.scale = 1;
        this.previousData = [];
        this.zoomTransform = null;
        this.currentAnnotation = -1;


    }

    private ownFunctionZoomColor = (data, categories) => {



        const containerElement = document.getElementById('chart');
        containerElement.innerHTML = '';


        const width = containerElement.clientWidth;
        const height = containerElement?.clientHeight;


        const xScale = d3.scaleLinear()
            .domain([0, width])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([height, 0])
            .range([height, 0]);


        const xScaleOriginal = xScale.copy();
        const yScaleOriginal = yScale.copy();


        // mapper from category_id to color
        const idToColorMapper = {};

        categories.forEach(item => {
            idToColorMapper[item.code_id] = item.color;
        });

        const categoryFill = d => idToColorMapper[d.code_id];

        const pointSeries = fc.seriesSvgPoint()
            .crossValue(d => d.x)
            .mainValue(d => d.y)
            .size(d=>d.r)
            .decorate(sel => {
                sel.enter().attr('fill', d => categoryFill(d));
            });


        const textLabel = fc
    .layoutTextLabel()
    .padding(2)
    .value(d => d.text);


        const strategy = fc.layoutRemoveOverlaps(fc.layoutGreedy());

        const labels = fc
        .layoutLabel(strategy)
        .size((d, i, g) => {
            const textSize = g[i].getElementsByTagName('text')[0].getBBox();
            return [textSize.width, textSize.height];
        })
            .position(d => {
            return [d.x, d.y];
        })
        .component(textLabel);

        const zoom = d3.zoom()
            .scaleExtent([0.001, 10000])
            .on("zoom", (event) => {
                this.zoomTransform = event.transform;
                xScale.domain(event.transform.rescaleX(xScaleOriginal).domain());
                yScale.domain(event.transform.rescaleY(yScaleOriginal).domain());
                redraw();
            });



        const multiSeries = fc
        .seriesSvgMulti()
        .series([pointSeries, labels]);

        if (data.length === 0) {
            //just plot the axes
            const xAxis = d3.axisBottom(xScale);
            const yAxis = d3.axisRight(yScale);
            return;
        }

        const chart = fc
            .chartCartesian(xScale, yScale)
            .svgPlotArea(multiSeries)
            .decorate(sel =>
                sel
                    .enter()
                    .select("d3fc-svg.plot-area")
                    .call(zoom)
            );
        const redraw = () => {
                d3.select("#chart")
                    .datum(data)
                    .call(chart);
        }
        redraw();
        if (this.zoomTransform !== null) {
            d3.select("d3fc-svg.plot-area")
                .call(zoom.transform, this.zoomTransform);
        }

    }
}

