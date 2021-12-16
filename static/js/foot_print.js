function reDrawChart(projectWeight) {
    var svg = d3.select("svg"),
        margin = 200,
        width = svg.attr("width") - margin,
        height = svg.attr("height") - margin

    svg.append("text")
       .attr("transform", "translate(100,0)")
       .attr("x", 50)
       .attr("y", 50)
       .attr("font-size", "24px")
       .text("年度志工時數")

    var xScale = d3.scaleBand().range([0, width]).padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g")
               .attr("transform", "translate(" + 100 + "," + 100 + ")");

    d3.csv("/static/delme/XYZ.csv", function(error, data) {
        if (error) {
            throw error;
        }

	console.log("data = " + JSON.stringify(data));
	data = JSON.parse(getCookie("project_weight"));

        xScale.domain(data.map(function(d) { return d.month; }));
        yScale.domain([0, d3.max(data, function(d) { return d.value; })]);

        g.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(xScale))
         .append("text")
         .attr("y", height - 250)
         .attr("x", width - 100)
         .attr("text-anchor", "end")
         .attr("stroke", "black")
         .text("月份");

        g.append("g")
         .call(d3.axisLeft(yScale).tickFormat(function(d){
             return d;
         })
         .ticks(10))
         .append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("dy", "-5.1em")
         .attr("text-anchor", "end")
         .attr("stroke", "black")
         .text("時數");

        g.selectAll(".bar")
         .data(data)
         .enter().append("rect")
         .attr("class", "bar")
         .attr("x", function(d) { return xScale(d.month); })
         .attr("y", function(d) { return yScale(d.value); })
         .attr("width", xScale.bandwidth())
         .attr("height", function(d) { 
		 console.log("hello, height = " + height);
		 console.log("hello, d.value = " + d.value);
		 console.log("hello, yScale(d.value) = " + yScale(d.value));

		 return height - yScale(d.value); 
	 });
    });
}

function getProjectWeight(list_task_UUIDs) {
  var projectWeight = {};
  var dataJSON = {};
  dataJSON.uuid = list_task_UUIDs[0];

  $.ajax({
    url: "https://tplanet-backend.townway.com.tw/projects/weight",
    type: "POST",
    async: false,
    crossDomain: true,
    data: dataJSON,
    success: function(returnData) {
       const obj = JSON.parse(returnData);
       // Set project weight to cookie
       setCookie("project_weight", returnData, 1);
       projectWeight = obj;
    },
    error: function(xhr, ajaxOptions, thrownError){
      console.log(thrownError);
    }
  });

  return projectWeight;
}

function updateTalbeData(list_task_UUIDs) {
  // table_summary
  var tbodyRef = document.getElementById("table_summary").getElementsByTagName("tbody")[0];
  for (var index = 0; index < list_task_UUIDs.length; index ++) {
    // Get task info
    if (getCookie(list_task_UUIDs[index]) === "") {
      continue;
    }
    var obj = JSON.parse(getCookie(list_task_UUIDs[index]));

    // Insert a row at the end of table
    var newRow = tbodyRef.insertRow();

    // Insert a cell at the end of the row
    var newCell_task_name = newRow.insertCell();
    var newText_task_name = document.createTextNode(obj.name);
    newCell_task_name.appendChild(newText_task_name);
    
    var newCell2 = newRow.insertCell();
    var newText2 = document.createTextNode(obj.token);
    newCell2.appendChild(newText2);
  }
}

function submitTaskTickets(task_UUID) {
  if (getCookie(task_UUID)=== "") {
    return;
  }
  obj = JSON.parse(getCookie(task_UUID));
  var taskWeight = {};
  var dataJSON = {};
  dataJSON.uuid = obj.uuid;
  dataJSON.token = obj.token;

  $.ajax({
    url: "https://tplanet-backend.townway.com.tw/tasks/submit",
    type: "POST",
    async: false,
    crossDomain: true,
    data: dataJSON,
    success: function(returnData) {
       const obj = JSON.parse(returnData);
       // Set project weight to cookie
       setCookie("project_weight", returnData, 1);
       taskWeight = obj;
    },
    error: function(xhr, ajaxOptions, thrownError){
      console.log(thrownError);
    }
  });

  return taskWeight;
}

function detectNoNeedSubmitTask(list_task_UUIDs) {
  for (var index = 0; index < list_task_UUIDs.length; index ++) {
    // FIXME: Should be type, not uuid
    if (list_task_UUIDs[index] === "00000007") {
        list_task_UUIDs.splice(index, 1);
    }
  }

  return list_task_UUIDs;
}

function updateNodeData() {
  // Get user tasks
  var str_list_task_UUIDs = getCookie("list_tasks");
  var list_task_UUIDs  = [];
  if (str_list_task_UUIDs === "") {
    // Get user task UUIDs
    list_task_UUIDs = list_tasks(getCookie("username"));
    setCookie("list_tasks", list_task_UUIDs, 1);
  } else {
    list_task_UUIDs = str_list_task_UUIDs.split(",");
  }

  // Remove no need submit task
  list_task_UUIDs = detectNoNeedSubmitTask(list_task_UUIDs);

  // Submit all tasks
  for (var index = 0; index < list_task_UUIDs.length; index ++) {
    submitTaskTickets(list_task_UUIDs[index]);
  }

  // Update Table data
  updateTalbeData(list_task_UUIDs);

  // reDraw Chart
  var projectWeight = getProjectWeight(list_task_UUIDs);
  reDrawChart(projectWeight);
}
