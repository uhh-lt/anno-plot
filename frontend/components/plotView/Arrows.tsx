import * as d3 from "d3";



const defineArrowMarkers = (svg) => {
            console.log("defining arrow markers");
            svg.append("defs").selectAll("marker")
                .data(["end-marker"]) // Unique id for the arrow marker
                .enter().append("marker")
                .attr("id", d => d)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 10)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", "#000");
        };


export const initializeArrows = (containerElement) => {
    const svg = d3.select(containerElement).append("svg").attr("width", 0)
                  .attr("height", 0);;
    defineArrowMarkers(svg);
    return svg;
}



    const dragStart = (event, d) => {
        // Drag start behavior
        console.log('started dragging arrow');
    }
        export const arrowSeries = (xScale, yScale, onDrag, onDragEnd, idToColorMapper, svg) => {
            //let xScale, yScale;
                        const drag = d3.drag()
                .on('start', onDragEnd) // Assuming abc is your drag start handler function
                .on('drag', onDrag)  // Assuming abc is your drag during handler function
                .on('end', onDragEnd);  // Assuming abc is your drag end handler function
            function calculateDataDistance(pixelLength, scale) {
                const domain = scale.domain();
                const range = scale.range();

                // Convert pixel length to data space
                const dataLength = (domain[1] - domain[0]) * (pixelLength / (range[1] - range[0]));
                return dataLength;
            }

            function offsetPoint(start, end, pixelOffset, xScale, yScale) {
                // Calculate the length of the line in data space
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const lineLength = Math.sqrt(dx * dx + dy * dy);

                // Calculate the offset in data space
                const offsetX = calculateDataDistance(pixelOffset, xScale);
                const offsetY = calculateDataDistance(pixelOffset, yScale);

                // Scale the offset to the line length
                const scale = Math.sqrt((offsetX * offsetX + offsetY * offsetY) / (dx * dx + dy * dy));

                return {
                    x: end.x - dx * scale,
                    y: end.y - dy * scale
                };
            }

            function series(selection) {
                selection.each(function (data, index, group) {
                    const container = d3.select(this);


                    const markers = svg.select('defs').selectAll('marker')
                        .data(data, d => idToColorMapper[d.code_id])
                        .enter().append('marker')
                        .attr('id', d => 'arrowhead-' + d.code_id)
                        .attr('viewBox', '0 -5 10 10')
                        .attr('refX', 10)
                        .attr('refY', 0)
                        .attr('markerWidth', 6)
                        .attr('markerHeight', 6)
                        .attr('orient', 'auto')
                        .append('path')
                        .attr('d', 'M0,-5L10,0L0,5')
                        .attr('fill', d => idToColorMapper[d.code_id]);


                    const arrows = container.selectAll('line')
                        .data(data)
                        .join('line')
                        .attr('x1', d => xScale(d.start.x))
                        .attr('y1', d => yScale(d.start.y))
                        .attr('x2', d => xScale(d.end.x))
                        .attr('y2', d => yScale(d.end.y))
                        .attr('stroke', d => idToColorMapper[d.code_id])
                        .attr('stroke-width', 3)
                        .attr('marker-end', d => `url(#arrowhead-${d.code_id})`);

                    container.selectAll('circle.drag-handle')
                        .data(data)
                        .join('circle')
                        .classed('drag-handle', true)
                        .attr('cx', d => {
                            const offset = offsetPoint(d.start, d.end, 7, xScale, yScale);
                            return xScale(offset.x);
                        })
                        .attr('cy', d => {
                            const offset = offsetPoint(d.start, d.end, 7, xScale, yScale);
                            return yScale(offset.y);
                        })
                        .attr('r', 8)
                        .style("fill", "transparent")
                        //.style('visibility', 'hidden')
                        .call(drag);
                });
            }

            // Functions to set and get xScale
            series.xScale = function (_) {
                if (!arguments.length) return xScale;
                xScale = arguments[0];
                return series;
            };

            // Functions to set and get yScale
            series.yScale = function (_) {
                if (!arguments.length) return yScale;
                yScale = arguments[0];
                return series;
            };
            return series;
        };