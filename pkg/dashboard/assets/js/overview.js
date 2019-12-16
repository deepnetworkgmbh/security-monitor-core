let counters = {
    "CRITICAL": 0,
    "MEDIUM": 0,
    "NOISSUES": 0,
    "NODATA": 0
}
const severityList = ["CRITICAL", "MEDIUM", "NOISSUES", "NODATA"];

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
    let data = setData();
    window.severities = data;

    // set the color scale
    let color = d3.scaleOrdinal()
        .domain(["CRITICAL", "MEDIUM", "NOISSUES", "NODATA"])
        .range(["#a11f4c" , "#f26c21" , "#8BD2DC", "#777777"]);

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

    console.log(`[] chart created`);
}

function setupOverviewBar(resultGroup) {

    console.log(resultGroup.barId);
    console.log(resultGroup.severityBarData.domain);
    console.log(resultGroup.severityBarData.range);

    let formatPercent = d3.format(".0%"),
        formatNumber = d3.format(".0f");

    let threshold = d3.scaleThreshold()
        .domain(resultGroup.severityBarData.domain)
        .range(resultGroup.severityBarData.range);

    let x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 200]);

    let xAxis = d3.axisBottom(x)
        .tickSize(13)
        .tickValues(threshold.domain())
        .tickFormat(function(d) { return d === 0.5 ? formatPercent(d) : formatNumber(100 * d); });

    let g = d3.select("#" + resultGroup.barId)
        .append("svg")
        .call(xAxis);

    g.select(".domain")
        .remove();

    g.selectAll("rect")
        .data(threshold.range().map(function(color) {
            var d = threshold.invertExtent(color);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))
        .enter().insert("rect", ".tick")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return threshold(d[0]); });

    g.append("text")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .attr("y", -6)
        .text("Population density");
}
function setData() {
    let data = {};

    for (let key in window.auditData.ImagesGroups) {
        let severity = window.auditData.ImagesGroups[key].Title
        let count = window.auditData.ImagesGroups[key].Count
        data[severity] = count;
    }

    return data;
}

function createAttributeGroup() {
    const defaultGroupBy = 'namespace';

    let groupBy = [];
    for(let i=0;i<window.auditData.Results.length;i++) {
        const image = window.auditData.Results[i];

        for(let j=0;j<image.attributes.length;j++) {
            const attribute = image.attributes[j];
            const chunk = attribute.split(':');
            const name = chunk[0];
            const value = chunk[1];
            const attributeIndex = _.findIndex(groupBy,function(o) { return o.name == name; });

            if (attributeIndex === -1) {
                groupBy.push({
                    name: name,
                    count: 1
                });
                //console.log('adding attribute :' + name);
            }else{
                groupBy[attributeIndex].count +=1;
            }
        }
    }
    groupBy = _.sortBy(groupBy, 'count').reverse();
    //console.log(groupBy);

    $("#group-by-dropdown").empty();
    for(let i=0;i<groupBy.length;i++){
        const optionName = groupBy[i].name + ' (' + groupBy[i].count + ')';
        const optionValue = groupBy[i].name;

        $("#group-by-dropdown").append(new Option(optionName, optionValue));
    }
    $("#group-by-dropdown").val(defaultGroupBy);
}

function setListOfItemsByGroup() {

    const groupBy = $("#group-by-dropdown").val();
    //console.log(`[] grouping by `+ groupBy);


    let results = [];

    // scan images
    for(let i=0;i<window.auditData.Results.length;i++) {
        const image = window.auditData.Results[i];

        const attributeIndex = _.findIndex(image.attributes, function (o) {
            return o.startsWith(groupBy+ ':');
        });

        // if image does not have the attribute, skip
        if (attributeIndex === -1) continue;

        const attributeValue = image.attributes[attributeIndex].split(':')[1];

        // check if the image with the attribute value exists under the group
        const imageIndex = _.findIndex(results, function (o) {
            return o.title === attributeValue;
        });

        if (imageIndex === -1) {
            // create new image under group
            results.push({
                title: attributeValue,
                images: [image]
            });
        }else {
            // add existing image under group
            results[imageIndex].images.push(image);
        }

    }


    // render images
    $("#results").empty();
    for(let i=0;i<results.length;i++){
        const resultGroup = results[i];

        window.counters = {
            "CRITICAL": 0,
            "MEDIUM": 0,
            "NOISSUES": 0,
            "NODATA": 0
        }

        let sublist = `<ul>`;
        for(let j=0;j<resultGroup.images.length;j++) {
            sublist += '<li>';
            sublist += '<div style="float:right;">' + parseSeverities(resultGroup.images[j]) + '</div>';
            sublist += '<div class="imagename">' + shortenImageName(resultGroup.images[j].image) + '</div>';
            sublist += '</li>';
        }
        sublist += '</ul>';

        results[i].severitySummary = window.counters;
        results[i].severityBarData = generateGroupSeverityData(window.counters);
        results[i].barId = 'bar' + i;

        let imagehtml = '<div>';
        imagehtml += getBar(i);
        imagehtml += '<h4>' + resultGroup.title +  '(' + resultGroup.images.length  + ')</h4>';
        imagehtml += sublist;
        imagehtml += '</div>';

        $("#results").append(imagehtml);
    }

    for(let i=0;i<results.length;i++) {
        setupOverviewBar(results[i]);
    }
    console.log(`-------`);
    console.log(results);
    console.log(`-------`);
}

function  shortenImageName(name) {
    let chunks = name.split('/');
    return chunks[chunks.length-1]
}

function  getSeveritFromImage(image, severity) {
    let severitIndex = _.findIndex(image.counters, function (o) {
        return o.severity === severity;
    });

    if (severitIndex === -1 ){
        return 0;
    }
    return image.counters[severitIndex].count;
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'CRITICAL': return "#a11f4c";
        case 'MEDIUM': return "#f26c21";
        case 'NOISSUES': return "#8BD2DC";
        case 'NODATA': return "#777777";
    }
}

function generateGroupSeverityData(counters) {

    let data = {
        domain: [],
        range: []
    };

    let slist = severityList.reverse();
    // calculate sum severity for group
    let severitySum = 0;
    for(let i=0;i<slist.length;i++){
        severitySum += counters[slist[i]]
    }
    console.log('[] severity sum is ' + severitySum);
;
    for(let i=0;i<slist.length;i++){
        if(counters[slist[i]] >0){
            const ratio = ((counters[slist[i]])  / severitySum);
            data.domain.push(ratio.toFixed(2));
            data.range.push(getSeverityColor(slist[i]));
        }
    }
    return data;
}

function parseSeverities(image) {

    //console.log(image);
    const severity_critical =  getSeveritFromImage(image, "CRITICAL");
    const severity_high = getSeveritFromImage(image, "HIGH");
    const severity_medium = getSeveritFromImage(image, "MEDIUM");
    const severity_low = getSeveritFromImage(image, "LOW");

    window.counters["CRITICAL"] += severity_critical + severity_high;  // these two combined
    window.counters["MEDIUM"] += severity_medium;
    window.counters["NOISSUES"] += severity_low;

    if(image.scanResult === "Failed") {
        window.counters["NODATA"] += 1;
        return "No Data";
    }
    // no data
    if ((severity_critical + severity_high + severity_medium + severity_low) == 0) {
//        window.counters["NOISSUES"] += 1;
        return "No Issues"
    }

    let results = [];
    if(severity_critical>0) {
        results.push("<b>" + severity_critical + "</b> Critical");
    }
    if(severity_high>0) {
        results.push("<b>" + severity_high + "</b> High");
    }
    if(severity_medium>0) {
        results.push("<b>" + severity_medium + "</b> Medium");
    }
    if(severity_low>0) {
        results.push("<b>" + severity_low + "</b> Low");
    }
    return results.join(", ")
}
let bars = [];

function getBar(id) {
    const barId = 'bar' + id;
    bars.push(barId);
    let barHtml = '<div style="width:200px;height:10px;float:right;margin-right: 30px;" id="'+ barId + '"></div>';

    /*
    let barHtml = '<div class="status-bar">';
    barHtml += ' <div class="status">';
    barHtml += '  <div class="failing" style="width: 20px;">';
    barHtml += '   <div class="warning" style="width: 30px;">';
    barHtml += '    <div class="passing" style="width: 40px;"></div>';
    barHtml += '   </div>';
    barHtml += '  </div>';
    barHtml += ' </div>';
    barHtml += '</div>';
     */
    return barHtml;
}


function setupOverview() {
    setupChart();
    createAttributeGroup();
    setListOfItemsByGroup();
}
