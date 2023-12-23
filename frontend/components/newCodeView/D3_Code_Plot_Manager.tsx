import * as d3 from "d3";
import * as fc from "d3fc";
import {webglColor} from "@/utilities";


export const render = (data, codes,
                handle_right_click, zoomTransform, setZoomTransform) => {
    const containerElement = document.getElementById("chart");
    containerElement.innerHTML = "";

    const width = containerElement.clientWidth;
    const height = containerElement?.clientHeight;

    const xScale = d3.scaleLinear().domain([0, width]).range([0, width]);

    const yScale = d3.scaleLinear().domain([height, 0]).range([height, 0]);

    const xScaleOriginal = xScale.copy();
    const yScaleOriginal = yScale.copy();

    // mapper from category_id to color
    const idToColorMapper = {};

    codes.forEach((item) => {
        idToColorMapper[item.code_id] = item.color;
    });

    const categoryFill = (d) => idToColorMapper[d.code_id];
    let right_click_function = handle_right_click;
    const pointSeries = fc
        .seriesSvgPoint()
        .crossValue((d) => d.x)
        .mainValue((d) => d.y)
        .size((d) => d.r)
        .decorate((sel) => {
            sel
                .enter()
                .attr("fill", (d) => categoryFill(d))
                .on("contextmenu", function (event, d) {
                    event.preventDefault();
                    right_click_function(event, d3.select(this).datum());
                });
        });

    const textLabel = fc
        .layoutTextLabel()
        .padding(2)
        .value((d) => d.text);

    const strategy = fc.layoutRemoveOverlaps(fc.layoutGreedy());

    const labels = fc
        .layoutLabel(strategy)
        .size((d, i, g) => {
            const textSize = g[i].getElementsByTagName("text")[0].getBBox();
            return [textSize.width, textSize.height];
        })
        .position((d) => {
            return [d.x, d.y];
        })
        .component(textLabel);

    const zoom = d3
        .zoom()
        .scaleExtent([0.001, 10000])
        .on("zoom", (event) => {
            xScale.domain(event.transform.rescaleX(xScaleOriginal).domain());
            yScale.domain(event.transform.rescaleY(yScaleOriginal).domain());
            redraw();
            setZoomTransform(event.transform);
        });

    const multiSeries = fc.seriesSvgMulti().series([pointSeries, labels]);

    let chart = fc
        .chartCartesian(xScale, yScale)
        .svgPlotArea(pointSeries)
        .decorate((sel) => sel.enter().select("d3fc-svg.plot-area").call(zoom));
    if (data.length > 0) {
        chart = fc
            .chartCartesian(xScale, yScale)
            .svgPlotArea(multiSeries)
            .decorate((sel) =>
                sel
                    .enter()
                    .select("d3fc-svg.plot-area")
                    .on("measure.range", (event) => {
                        xScaleOriginal.range([0, event.detail.width]);
                        yScaleOriginal.range([event.detail.height, 0]);
                        xScaleOriginal.domain([0, event.detail.width]);
                        yScaleOriginal.domain([event.detail.height, 0]);
                        if (event.detail.resized) {
                            if (zoomTransform !== null) {
                                // @ts-ignore
                                d3.select("d3fc-svg.plot-area").call(zoom.transform, zoomTransform);
                            }
                        }
                        redraw();
                    })
                    .call(zoom),
            );
    }
    const redraw = () => {
        d3.select("#chart").datum(data).call(chart);
    };
    redraw();
    if (zoomTransform !== null) {
        // @ts-ignore
        d3.select("d3fc-svg.plot-area").call(zoom.transform, zoomTransform);
    }
}
