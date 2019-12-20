let counters = {
    "CRITICAL": 0,
    "MEDIUM": 0,
    "NOISSUES": 0,
    "NODATA": 0
};
let groupColors = ['gray', 'red', 'orange', 'green'];
const severityList = ["CRITICAL", "MEDIUM", "NOISSUES", "NODATA"];

function setupChart() {

    let jdata = [
        ['Severity', 'Number']
    ];
    let sevcolors = [];
    for(let i=0;i<window.auditData.ImagesGroups.length;i++){
        let group = window.auditData.ImagesGroups[i];
        jdata.push([group.Title, group.Count]);
        sevcolors.push(getSeverityColor(group.Title));
    }

    let data = google.visualization.arrayToDataTable(jdata);
    let options = {
        titlePosition: 'none',
        width: 400,
        height: 250,
        slices: {
            0: {color: sevcolors[0]},
            1: {color: sevcolors[1]},
            2: {color: sevcolors[2]},
            3: {color: sevcolors[3]}
        },
        pieHole: 0.5,
        chartArea: {'width': '100%', 'height': '80%'},
        legend: {
            position: 'bottom',
            alignment: 'center',
            textStyle: {
                fontSize: 9
            }
        },
    };

    let chart = new google.visualization.PieChart(document.getElementById('chart'));
    chart.draw(data, options);

    console.log(`[] chart created`);
}


function createAttributeGroup() {
    const defaultGroupBy = 'namespace';

    let groupBy = [];
    for (let i = 0; i < window.auditData.Results.length; i++) {
        const image = window.auditData.Results[i];

        for (let j = 0; j < image.attributes.length; j++) {
            const attribute = image.attributes[j];
            const chunk = attribute.split(':');
            const name = chunk[0];
            const attributeIndex = _.findIndex(groupBy, function (o) {
                return o.name == name;
            });

            if (attributeIndex === -1) {
                groupBy.push({
                    name: name,
                    count: 1
                });
                //console.log('adding attribute :' + name);
            } else {
                groupBy[attributeIndex].count += 1;
            }
        }
    }
    groupBy = _.sortBy(groupBy, 'count').reverse();

    $("#group-by-dropdown").empty();
    for (let i = 0; i < groupBy.length; i++) {
        const optionName = groupBy[i].name + ' (' + groupBy[i].count + ')';
        const optionValue = groupBy[i].name;
        $("#group-by-dropdown").append(new Option(optionName, optionValue));
    }
    $("#group-by-dropdown").val(defaultGroupBy);
}

function setListOfItemsByGroup(filter) {

    const groupBy = $("#group-by-dropdown").val();

    let results = [];

    // scan images
    for (let i = 0; i < window.auditData.Results.length; i++) {
        const image = window.auditData.Results[i];

        for (let j = 0; j < image.attributes.length; j++) {
            const attribute = image.attributes[j];

            if (attribute.split(':')[0] === groupBy) {

                const attributeValue = attribute.split(':')[1];

                // check if the image with the attribute value exists under the group
                const imageIndex = _.findIndex(results, function (o) {
                    return o.title === attributeValue;
                });

                if (imageIndex === -1) {
                    // create new image under group
                    results.push({
                        title: attributeValue,
                        images: [image],
                        order: 255
                    });
                } else {
                    // add existing image under group
                    results[imageIndex].images.push(image);
                }
            }
        }
    }

    results = _.sortBy(results, 'name');

    // sort result groups by severity
    for (let i = 0; i < results.length; i++) {
        const resultGroup = results[i];
        window.counters = {
            "CRITICAL": 0,
            "MEDIUM": 0,
            "NOISSUES": 0,
            "NODATA": 0
        }
        for (let j = 0; j < resultGroup.images.length; j++) {
            const rowText = parseSeverities(resultGroup.images[j]);
            resultGroup.images[j].rowText = rowText;
            if (rowText === 'No Issues') {
                resultGroup.images[j].order = 1;
                if (resultGroup.order > 1) resultGroup.order = 1;
            } else if (rowText === 'No Data') {
                resultGroup.images[j].order = 2;
                if (resultGroup.order > 2) resultGroup.order = 2;
            } else {
                resultGroup.images[j].order = 0;
                if (resultGroup.order > 0) resultGroup.order = 0;
            }
        }
    }

    results = _.sortBy(results, 'order');

    for (let i = 0; i < results.length; i++) {
        results[i].images = _.sortBy(results[i].images, 'order');
    }

    // render images
    $("#results").empty();
    for (let i = 0; i < results.length; i++) {
        const resultGroup = results[i];
        let namespaceCounters = {
            failing: 0,
            passing: 0,
            nodata: 0,
        }

        let sublist = `<ul>`;
        for (let j = 0; j < resultGroup.images.length; j++) {
            const rowText = resultGroup.images[j].rowText;
            const longImageName = resultGroup.images[j].image;
            const shortImageName = shortenImageName(longImageName);
            let link = '';

            sublist += '<li>';
            sublist += ' <div style="float:right;">' + rowText + '</div>';
            if (rowText === 'No Issues') {
                namespaceCounters.passing += 1;
                sublist += '<i class="fas fa-check noissues-icon"></i>';

                link += '<a href="/image/' + longImageName + '" class="more-info">';
                link += ' <span class="tool" data-tip="Click to see detailed image analysis">';
                link += '  <i class="far fa-question-circle"></i>';
                link += ' </span>';
                link += '</a>';

            } else if (rowText === 'No Data') {
                namespaceCounters.nodata += 1;
                sublist += '<i class="fas fa-times nodata-icon"></i>';

                link += '<a class="more-info">';
                link += ' <span class="tool" data-tip="Failed to scan this image">';
                link += '  <i class="far fa-question-circle"></i>';
                link += ' </span>';
                link += '</a>';
            } else {
                namespaceCounters.failing += 1;
                sublist += '<i class="fas fa-exclamation-triangle warning-icon"></i>';

                link += '<a href="/image/' + longImageName + '" class="more-info">';
                link += ' <span class="tool" data-tip="Click to see detailed image analysis">';
                link += '  <i class="far fa-question-circle"></i>';
                link += ' </span>';
                link += '</a>';
            }
            sublist += shortImageName;
            sublist += link;
            sublist += '</li>';
        }
        sublist += '</ul>';

        results[i].severitySummary = window.counters;
        results[i].severityBarData = generateGroupSeverityData(window.counters);
        results[i].barId = 'bar' + i;

        if (filter && filter.length > 1 && resultGroup.title.indexOf(filter) === -1) continue;

        let imagehtml = '<div>';
        imagehtml += getBar(i, namespaceCounters);

        imagehtml += '<ul>';
        imagehtml += ' <li>';
        imagehtml += '  <input type="checkbox" id="target' + i + '" checked/>';
        imagehtml += '  <label for="target' + i + '">';
        if (filter && filter.length > 1) {
            imagehtml += resultGroup.title.replace(filter, '<span class="highlight">' + filter + '</span>');
            imagehtml += '(' + resultGroup.images.length + ')';
        } else {
            imagehtml += resultGroup.title + '(' + resultGroup.images.length + ')';
        }
        imagehtml += '  </label>';

        imagehtml += sublist;

        imagehtml += ' </li>';
        imagehtml += '</ul>';

        imagehtml += '</div>';

        $("#results").append(imagehtml);
    }

    console.log(`-------`);
    console.log(results);
    console.log(`-------`);
}

function search(box) {
    let value = box.value;
    console.log(value);
    setListOfItemsByGroup(value);
}

function shortenImageName(name) {
    let chunks = name.split('/');
    return chunks[chunks.length - 1]
}

function getSeveritFromImage(image, severity) {
    let severitIndex = _.findIndex(image.counters, function (o) {
        return o.severity === severity;
    });

    if (severitIndex === -1) {
        return 0;
    }
    return image.counters[severitIndex].count;
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'CRITICAL':
            return groupColors[1];
        case 'MEDIUM':
            return groupColors[2];
        case 'NOISSUES':
            return groupColors[3];
        case 'NODATA':
            return groupColors[0];
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
    for (let i = 0; i < slist.length; i++) {
        severitySum += counters[slist[i]]
    }
    console.log('[] severity sum is ' + severitySum);
    ;
    for (let i = 0; i < slist.length; i++) {
        if (counters[slist[i]] > 0) {
            const ratio = ((counters[slist[i]]) / severitySum);
            data.domain.push(ratio.toFixed(2));
            data.range.push(getSeverityColor(slist[i]));
        }
    }
    return data;
}

function parseSeverities(image) {

    //console.log(image);
    const severity_critical = getSeveritFromImage(image, "CRITICAL");
    const severity_high = getSeveritFromImage(image, "HIGH");
    const severity_medium = getSeveritFromImage(image, "MEDIUM");
    const severity_low = getSeveritFromImage(image, "LOW");

    window.counters["CRITICAL"] += severity_critical + severity_high;  // these two combined
    window.counters["MEDIUM"] += severity_medium;
    window.counters["NOISSUES"] += severity_low;

    if (image.scanResult === "Failed") {
        window.counters["NODATA"] += 1;
        return "No Data";
    }
    // no data
    if ((severity_critical + severity_high + severity_medium + severity_low) == 0) {
        window.counters["NOISSUES"] += 1;
        return "No Issues"
    }

    let results = [];
    if (severity_critical > 0) {
        results.push("<b>" + severity_critical + "</b> Critical");
    }
    if (severity_high > 0) {
        results.push("<b>" + severity_high + "</b> High");
    }
    if (severity_medium > 0) {
        results.push("<b>" + severity_medium + "</b> Medium");
    }
    if (severity_low > 0) {
        results.push("<b>" + severity_low + "</b> Low");
    }
    return results.join(", ")
}

let bars = [];

function getBar(id, namespaceCounters) {
    const barId = 'bar' + id;
    bars.push(barId);

    // get the total number of severities
    let severitySum = namespaceCounters.passing + namespaceCounters.nodata + namespaceCounters.failing;

    const failingSum = namespaceCounters.failing * 200 / severitySum;
    const nodataSum = namespaceCounters.nodata * 200 / severitySum;

    const nodataWidth = 200 - failingSum;
    const passingWidth = 200 - failingSum - nodataSum;

    let barHtml = '<div class="status-bar">';
    barHtml += ' <div class="status">';
    barHtml += '  <div class="failing">';
    barHtml += '   <div class="nodata" style="width: ' + nodataWidth + 'px;">';
    barHtml += '    <div class="passing" style="width: ' + passingWidth + 'px;"></div>';
    barHtml += '   </div>';
    barHtml += '  </div>';
    barHtml += ' </div>';
    barHtml += '</div>';

    return barHtml;
}

function pageLoaded() {
    google.load("visualization", "1", {packages: ["corechart"]});
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(setupOverview);
}

function setupOverview() {
    setupChart();
    createAttributeGroup();
    setListOfItemsByGroup();
}
