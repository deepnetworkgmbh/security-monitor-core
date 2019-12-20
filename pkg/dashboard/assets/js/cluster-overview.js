let groupNames = ["No Data", "Error", "Warning", "Success"];
let groupColors = ['gray', 'red', 'orange', 'green'];

let menuElement = null;
let table = null;

function isHover(e) {
    return !!(e.querySelector(":hover") || e.parentNode.querySelector(":hover") === e);
}

function checkHover() {
    let hovered = isHover(menuElement);
    if (hovered !== checkHover.hovered) {
        checkHover.hovered = hovered;
    }
    if(!hovered){
        setTimeout(function () {
            if(menuElement){
                document.body.removeChild(menuElement)
                document.removeEventListener('mousemove', checkHover);
                menuElement = null;
            }
        }, 100);
    }
}

function openContextmenu(e) {
    let menuContentHtml = '';
    menuContentHtml += '<i class="fas fa-arrow-right" style="font-size:9px;color:#aaa;"></i> <a href="">Go to Check documentation</a><br>';
    menuContentHtml += '<i class="fas fa-arrow-right" style="font-size:9px;color:#aaa;"></i> <a href="">Open Check details</a>';

    menuElement = document.createElement('div');
    menuElement.setAttribute("class", 'context-menu');
    menuElement.innerHTML = menuContentHtml;
    menuElement.style.top = (e.pageY) + 'px';
    menuElement.style.left = (e.clientX - 150) + 'px';

    document.body.appendChild(menuElement);

    document.addEventListener('mousemove', checkHover);
}

function drawStackedChart(jdata, elementId) {
    if(jdata.length === 0) return;
    let rawdata = [
        ["Severity", "No Data", "Error", "Warning", "Success"]
    ];

    for(let i=0;i<jdata.length;i++) {
        const group = jdata[i];
        rawdata.push([
                cleanName(group.resultName),
                group.NoDatas, group.Errors, group.Warnings, group.Successes
        ]);
    };

    // Set chart options
    let options = {
        isStacked: 'percent',
        orientation: 'horizontal',
        //enableInteractivity: false,
        width:280,
        height:250,
        series: {
            0:{color: groupColors[0]},
            1:{color: groupColors[1]},
            2:{color: groupColors[2]},
            3:{color: groupColors[3]}
        },
        legend: {
            position: 'top',
            alignment: 'center',
            textStyle: {
                fontSize: 9
            }
        },
        chartArea: {'width': '100%', 'height': '80%'},
        hAxis: {
            textStyle: {
                color: 'gray',
                fontSize: 9
            },
            textPosition: 'out'
        }
    };

    // Instantiate and draw our chart, passing in some options.
    let chart = new google.visualization.BarChart(document.getElementById(elementId));
    let data = google.visualization.arrayToDataTable(rawdata);
    chart.draw(data, options);
}

function drawPieChart(jdata, elementId) {

    var data = google.visualization.arrayToDataTable([
        ['Severity', 'Number'],
        ['No Data', jdata.NoDatas],
        ['Error', jdata.Errors],
        ['Warning', jdata.Warnings],
        ['Success', jdata.Successes],
    ]);

    var options = {
        title: jdata.resultName,
        titlePosition: 'none',
        width:320,
        height:250,
        slices: {
            0:{color: groupColors[0]},
            1:{color: groupColors[1]},
            2:{color: groupColors[2]},
            3:{color: groupColors[3]}
        },
        pieHole: 0.5,
        chartArea: {'width': '100%', 'height': '70%'},
        legend: {
            position: 'top',
            alignment: 'center',
            textStyle: {
                fontSize: 9
            }
        },
    };

    var chart = new google.visualization.PieChart(document.getElementById(elementId));
    chart.draw(data, options);
}

function drawTable(jdata, elementId) {

    let viewHeight = (document.compatMode === "CSS1Compat") ?
        document.documentElement.clientHeight :
        document.body.clientHeight;
    let tableHeight = viewHeight-580;
    if(tableHeight<300) tableHeight = 300;

    table = new Tabulator("#" + elementId, {
        autoResize:true,
        height:tableHeight, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data:jdata, //assign data to table
        layout:"fitColumns", //fit columns to width of table (optional)
        headerFilterPlaceholder:"...",
        tooltips:function(cell){
            //function should return a string for the tooltip of false to hide the tooltip
            const field = cell.getColumn().getField();
            if(field === 'id'){
                let desc = cell.getRow().getData().description;
                return desc;
            }
            return;
        },
        columns:[ //Define Table Columns
            {   title:"Group", field:"group", width:100, align:'center',
                headerFilter:"select", headerFilterParams:{values:true },
                formatter:function(cell){
                    return cell.getValue().replace('polaris.', '').replace('trivy.', '');
                },
            },
            {   title:"Category", field:"category", width:98, align:'center',
                headerFilter:"select", headerFilterParams:{values:true }
            },
            {   title:"Check Id", field:"id", width:200, align:'left',
                headerFilter:"select", headerFilterParams:{values:true}, formatter: function (cell) {

                    const value = cell.getValue();
                    const desc = cell.getData().description;
                    if(desc){
                        return value + '<i class="far fa-question-circle tipicon"></i>' ;
                    }
                    return value;


                }
            },
            {   title:"Resource Name", field:"resourceName", headerFilter:"input" },
            {   title: "Result", field: "result", width: 77, align: 'center',
                headerFilter:"select", headerFilterParams:{values:true },
                formatter: function (cell, formatterParams) {
                    const val = cell.getValue();
                    return '<span class="tblr-' + val + '">' + val + '</span>';
                }
            },
            {
                title: "", width: 42, formatter: function () {
                    return '<button class="testbutton" onclick="openContextmenu(event)">...</button>';
                }
            }
        ],
        /* rowClick:function(e, row){ //trigger an alert message when the row is clicked
            alert("Row " + row.getData().id + " Clicked!!!!");
        },*/
        rowContext:function(e, row){
            e.preventDefault(); // prevent the browsers default context menu form appearing.
            openContextmenu(e);
        },
    });
}


function cleanName(str) {
    return str.replace('polaris.', '').replace('trivy.', '');
}



function pageLoaded() {
    google.load("visualization", "1", {packages: ["corechart"]});
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawCharts);
}

function drawCharts() {
    drawStackedChart(window.overviewData.checkGroupSummary, 'chart1')
    drawPieChart(window.overviewData.checkResultsSummary, 'chart2');
    drawStackedChart(window.overviewData.namespaceSummary, 'chart3');
    drawTable(window.overviewData.checks, 'data-table');

    window.onresize = function(event) {
        if(table){
            table.redraw(true);
        }
    };
}


