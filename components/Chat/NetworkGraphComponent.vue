<template>
    <div id="active-network-chart" v-bind:class="{'peer-video-fullscreen': inFullscreen}">

    </div>
</template>

<style>
    #active-network-chart {
        height: 150px;
    }

    #active-network-chart.peer-video-fullscreen {
        /*Set the height to 0 so the width calculations can still work if the orientation changes*/
        /*Otherwise setting to display-none will set the width to NaN*/
        height: 0px;
        overflow: hidden;
    }

    .link {
        stroke: #aaa;
    }

    .node text {
        stroke:#333;
        cursor:pointer;
    }

    .node circle{
        stroke:#fff;
        stroke-width:3px;
        fill:#555;
    }
</style>

<script>
    import * as d3 from "d3";

    export default {
        props: {
            inFullscreen: Boolean
        },
        mounted() {
            let self = this;
            console.log("Network Graph Mounted");
            window.addEventListener("orientationchange", function(e) {
                //Orientation change, recalculate the width of the chart
                setTimeout(function() {

                    self.width = +d3.select('#active-network-chart').style('width').slice(0, -2);

                    self.svg.attr("width", self.width);
                    self.update(self.connections);
                }, 200);

            });
            self.init();
        },
        data: function () {
            return {
                height: 0,
                width: 0,
                svg: null,
                simulation: null,
                link: null,
                node: null,
                label: null,
                color: null,
                connections: {
                    "nodes": [
                    {
                    "id": "me",
                    "name": "Me"
                    }
                ],
                "links": []
                },
            }
        },
        methods: {
            init () {
                let self = this;

                self.color = d3.scaleOrdinal(d3.schemeTableau10);

                // set the dimensions and margins of the graph
                var margin = {top: 10, right: 30, bottom: 30, left: 40};
                self.width = +d3.select('#active-network-chart').style('width').slice(0, -2);
                self.height = 150;

                self.tooltip = d3.select("#active-network-chart")
                    .append("div")
                    .attr("class", "network-node-tooltip")
                    .style("position", "absolute")
                    .style("top", "0px")
                    .style("left", "0px")
                    .style("font-size", "16px")
                    .style("z-index", "10")
                    .style("visibility", "hidden")
                    .style("background", "#fff")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                    .text("---");


                self.svg = d3.select("#active-network-chart")
                    .append("svg")
                    .attr("width", self.width)
                    .attr("height", self.height)
                    //.attr("viewBox", [-self.width / 2, -self.height / 2, self.width, self.height]);

                self.simulation = d3.forceSimulation()
                    .force("charge", d3.forceManyBody().strength(-400))
                    .force("link", d3.forceLink().id(d => d.id).distance(75))
                    .force("x", d3.forceX(self.width / 2))
                    .force("y", d3.forceY(self.height / 2))
                    .on("tick", self.tick);

                self.link = self.svg.append("g")
                    .attr("stroke", "#ccc")
                    .attr("stroke-width", 1.5)
                    .selectAll("line");

                self.node = self.svg.append("g")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .selectAll("circle");

                self.label = self.svg.append("g")
                    .attr("class", "labels")
                    .style("cursor", "default")
                    .selectAll("text")


                self.update(self.connections);

            },
            update(data) {
                //console.log("Recieved");
                //console.log(data);
                let self = this;
                self.connections = data;

                // Make a shallow copy to protect against mutation, while
                // recycling old nodes to preserve position and velocity.
                const old = new Map(self.node.data().map(d => [d.id, d]));

                data.nodes = data.nodes.map(d => Object.assign(old.get(d.id) || {}, d));
                data.links = data.links.map(d => Object.assign({}, d));

                self.node = self.node
                    .data(data.nodes, d => d.id)
                    .join(
                        enter => enter.append("circle")
                        .attr("r", 20)
                        .attr("fill", d => self.color(d.id))
                        .on("mouseover", self.onHover)
                        .on("mousemove", self.onMove)
                        .on("mouseout", self.onOut)
                    );

                self.link = self.link
                    .data(data.links, d => [d.source, d.target])
                    .join("line");


                self.label = self.label
                    .data(data.nodes, d => d.name)
                    .join(enter => enter.append("text")
                        .attr("class", "label")
                        .html(function(d) { d.truncated = d.name.toLowerCase() != 'me'; return !d.truncated ? d.name : d.name.substr(0,1); })
                        .on("mouseover", self.onHover)
                        .on("mousemove", self.onMove)
                        .on("mouseout", self.onOut)

                    );

                self.simulation.nodes(data.nodes);
                self.simulation.force("link").links(data.links);
                self.simulation.alpha(1).restart();

            },
            onHover(node, index) {
                let self = this;
                if(node.id == 'me') {
                    return self.tooltip.style("visibility", "hidden");
                }
                return self.tooltip.style("visibility", "visible");
                //console.log(node);
                //console.log(index);
            },
            onMove(node, index) {
                let self = this;
                if(node.id == 'me') {
                    return self.tooltip.style("visibility", "hidden");
                }

                return self.tooltip
                    .style("top", (d3.event.pageY - 50)+"px")
                    .style("left",(d3.event.pageX - ((node.name.length * 8) / 2))+"px")
                    .text(node.name);
            },
            onOut(node, index) {
                let self = this;
                return self.tooltip.style("visibility", "hidden");
            },
            tick() {
                let self = this;

                self.node.attr("cx", function(d) {
                        //Hard lock the me element to center
                        if(d.id == 'me') {return d.x= self.width/2;}
                        return d.x = Math.max(20, Math.min(self.width - 20, d.x));
                    })
                    .attr("cy", function(d) {
                         //Hard lock the me element to center
                        if(d.id == 'me') {return d.y = self.height/2;}
                        return d.y = Math.max(20, Math.min(self.height - 20, d.y));
                    });


                //self.node.attr("cx", d => d.x)
                //    .attr("cy", d => d.y)
                //console.log(self.width);


                self.link.attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                self.label
                    .attr("x", function(d) { return d.x-10 + (d.truncated ? 5 : 0); })
                    .attr("y", function (d) { return d.y+5; })
                    .style("font-size", "15px")
                    .style("font-weight", "bold")
                    .style("fill", "#fff");
            }
        }
    }
</script>
