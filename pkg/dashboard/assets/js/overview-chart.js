function setupChart() {


// set the dimensions and margins of the graph
    const width = 500
    const height = 360
    const margin = 10
    const radius = Math.min(width, height) / 2 - margin

    let svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Create dummy data
    // example: var data = {a: 9, b: 1, c: 14}
    let data = {}; //window.auditData;
    for (let key in window.auditData) {
        let count = window.auditData[key].count;
        if(count>0){
            data[key] = window.auditData[key].count;
        }
    }

    // set the color scale
    let color = d3.scaleOrdinal()
        .domain(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
        .range(["red" , "orangered" , "#cc994f", "green"]);

    // Compute the position of each group on the pie:
    let  pie = d3.pie()
        .sort(null) // Do not sort group by size
        .value(function (d) { return d.value; })

    let data_ready = pie(d3.entries(data));

    // The arc generator
    let arc = d3.arc()
        .innerRadius(radius * 0.5)         // This is the size of the donut hole
        .outerRadius(radius * 0.8)

    // Another arc that won't be drawn. Just for labels positioning
    let outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
        .selectAll('allSlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) {
            return (color(d.data.key))
        })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)

    // Add the polylines between chart and labels:
    svg
        .selectAll('allPolylines')
        .data(data_ready)
        .enter()
        .append('polyline')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function (d) {
            var posA = arc.centroid(d) // line insertion in the slice
            var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc.centroid(d); // Label position = almost the same as posB
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius * 0.90 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            console.log(posC);

            return [posA, posB, posC]
        });


    // Add the polylines between chart and labels:
    svg
        .selectAll('allLabels')
        .data(data_ready)
        .enter()
        .append('text')
        .style('font-size', '10px')
        .text(function (d) {
            // console.log(d.data.key);
            return d.data.key
        })
        .attr('transform', function (d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.95 * (midangle < Math.PI ? .99 : -.99);
            pos[1] += 3;
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function (d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        })
}