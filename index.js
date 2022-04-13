// location of data
const countyUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const edUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

// colors used for county fills
const colors = [
    {
        color: "#ffbaba"
    },
    {
        color: "#ff7b7b"
    },
    {
        color: "#ff5252"
    },
    {
        color: "#ff0000"
    },
    {
        color: "#a70000"
    }
];

// variables to hold data once fetched/calculated.
let countyData;
let educationData;
let stateData;
let minPercent;
let maxPercent;

// add tooltip
let tip = d3.tip()
.attr("class", "text-center")
.attr("class", "card py-2 px-4")
.attr("id", "tooltip")
.offset([-10,0]);

// add svg
const width = 850;
const height = 550;

let svg = d3.select(".chloropleth-map")
.append("svg")
.attr("id", "chloropleth-map")
.attr("viewBox", `0 0 ${width + 100} ${height + 100}`)
.call(tip);

// programmatically build stepValues
// for county fill colors based on range of data
const getColorStepValues = (colors, data) => {
    
    const percents = data.map(d => d.bachelorsOrHigher);
    minPercent = Math.min(...percents);
    maxPercent = Math.max(...percents);
    
    const step = (maxPercent - minPercent)/colors.length;
    
    colors.forEach((color,i) => color.stepValue = maxPercent - (step * (i + 1)));
    console.log(colors);
}

// get county fill color bassed on 
// county percent value
const getColor = (percent) => {
    for(let i = 0; i < colors.length; i++) {
        if(percent >= colors[i].stepValue) {
            return colors[i].color;
        }
    }
    return colors[colors.length - 1];
}

const drawMap = () => {

    // draw counties
    // d attribute of the path defines the path to be drawn
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
    // path definition is a list of path commands - letter and numbers
    // geoMath method takes each of the features object and converts to
    // a path definition string that is used as the value for the d attribute
    svg.selectAll("path")
    .data(countyData)
    .enter()
    .append("path")
    .attr("d", d3.geoPath())
    .attr("class", "county")
    .attr("fill", county => {
        let currCounty = educationData.find(d => d.fips == county.id);
        return getColor(currCounty.bachelorsOrHigher);
    })
    .attr("data-fips", county => educationData.find(d => d.fips == county.id).fips)
    .attr("data-education", county =>  d3.format(".2f")(educationData.find(d => d.fips == county.id).bachelorsOrHigher))
    .on("mouseover", (event, county) => {
        let name = educationData.find(d => d.fips == county.id).area_name;
        let percent = d3.format(".2f")(educationData.find(d => d.fips == county.id).bachelorsOrHigher);
        
        tip.attr("data-education", percent);
        tip.html(`${name}<br>${percent}%`);
        tip.show(event);
    })
    .on("mouseout", tip.hide);

    // add legend
    // legend size
    const legendWidth = 200;
    const legendHeight = 200 / colors.length;

    // legend scale
    const legendScale = d3.scaleLinear()
    .domain([minPercent, maxPercent])
    .range([0, legendWidth]);

    // array of step values
    // for use as tick values
    const stepValues = colors.map(color => color.stepValue)

    // create legend axis using scale
    // using step values + maxtemp for tick values
    const legendAxis = d3.axisBottom()
    .scale(legendScale)
    .tickSize(10,0)
    .tickValues([...stepValues])
    .tickFormat(d3.format(".2f"));

    // add legend to svg
    const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", "translate(650,30)");

    // add legend rects
    // width is as long as each step
    // tooltip to display color
    legend.append("g")
    .selectAll("rect")
    .data(colors)
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d.stepValue))
    .attr("y", 0)
    .attr("width", legendWidth/colors.length)
    .attr("height", legendHeight)
    .attr("fill", d => d.color)
    .on("mouseover", (event,d,i) => {
        tip.html(`${d.color}`)
        tip.show(event);
    })
    .on("mouseout", tip.hide);

    // add legend axis
    legend.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendAxis);

}

// get county data first
// if county data loaded
// get education data
// if education data loaded
// draw the map
d3.json(countyUrl)
.then((data, error) => {
    
    if(error) {
        console.log(error);
    }

    else {
        
        // d3 requires GeoJson format (https://geojson.org/)
        // but data returned in TopoJSON format
        // need to convert data to GeoJson format
        // using topojson.feature() method (https://github.com/topojson/topojson-client/blob/master/README.md#feature)
        // get features array for drawing counties
        // each features boject contains an id value
        // this id value will correspond with ed data's fips values
        countyData = topojson.feature(data, data.objects.counties).features;
        stateData = topojson.feature(data, data.objects.states).features;

        d3.json(edUrl)
        .then((data,error) => {
            if(error) {

                console.log(error);

            }

            else {

                // each object contains a fips property
                // this fips property value identifies the county
                // to each the data can be associated
                // https://en.wikipedia.org/wiki/FIPS_county_code
                educationData = data;
                getColorStepValues(colors, data);
                drawMap();

            }
        });

    }
});