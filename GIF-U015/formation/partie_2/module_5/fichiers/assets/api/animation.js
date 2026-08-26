require.undef("animation");

define("animation", ["d3"], function (d3) {

  function NeuralNetwork(element) {
    d3.select(element).append("div").attr("class", "network-div");

    this.svg = d3.select("div.network-div").append("svg");
    this.svg.attr("class", "network");

    this.init = function (layerStructure, width, height, margin) {
      this.svg = d3
        .select("div.network-div")
        .append("svg")
        .attr("class", "network")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      width = width - margin.left - margin.right;
      height = height - margin.bottom - margin.top;

      this.x_pos_scale = defineScale([0, 1], [0, width]);
      this.y_pos_scale = defineScale([0, 1], [0, height]);

      this.layerStructure = layerStructure;

      this.neurons = initNeurons(layerStructure);

      this.circles = this.svg
        .selectAll("circle")
        .data(this.neurons)
        .enter()
        .append("circle");

      this.visualize_neurons(this.circles, layerStructure);

      this.links = initLinks(layerStructure);

      this.lines = this.svg
        .selectAll("line")
        .data(this.links)
        .enter()
        .append("line");

      this.visualize_links(this.lines, layerStructure, 0, true);
    };

    this.runEpoch = function (gradient, predictedClass) {
      this.visualize_neurons(this.circles, this.layerStructure, predictedClass);

      this.modifyLinksGradient(gradient);

      this.lines = this.svg.selectAll("line").data(this.links);

      let minGradient = Math.min(...gradient.flat(4));
      let maxGradient = Math.max(...gradient.flat(4));
      let absoluteMeanGradient =
        (Math.abs(minGradient) + Math.abs(maxGradient)) / 2;

      this.visualize_links(
        this.lines,
        this.layerStructure,
        absoluteMeanGradient
      );
    };

    this.visualize_neurons = function (circles, layerLengths, predicted_class) {
      let num_layers = layerLengths.length;

      circles
        .attr("cx", (d) => {
          return getElementPosition(d[0], num_layers * 0.7, this.x_pos_scale);
        })
        .attr("cy", (d) => {
          return getElementPosition(
            d[1],
            layerLengths[d[0]],
            this.y_pos_scale,
            true
          );
        })
        .attr("r", 15)
        .attr("fill", (d) => {
          if (d[0] === 0) {
            return "black";
          } 
          else if (d[0] === num_layers-1) {
            return "white";
          }
          else if (
            typeof predicted_class !== "undefined" &&
            d[0] === num_layers - 1 &&
            d[1] === predicted_class
          ) {
            return "green";
          } else {
            return "grey";
          }
        })
        .attr("class", "neuron");
    };

    this.visualize_links = function (
      lines,
      layerLengths,
      mean,
      staticLinks = false
    ) {
      let num_layers = layerLengths.length;

      let colorScale = defineScale(
        [-mean, 0, mean],
        ["#a50026", "#ffffbf", "#313695"],
        true
      );

      let thicknessScale = defineScale([0, mean], [3, 8], true);

      lines
        .attr("x1", (d) => {
          return (
            getElementPosition(
              d.inputNeuron[0],
              num_layers * 0.7,
              this.x_pos_scale
            ) + 15
          );
        })
        .attr("y1", (d) => {
          return getElementPosition(
            d.inputNeuron[1],
            layerLengths[d.inputNeuron[0]],
            this.y_pos_scale,
            true
          );
        })
        .attr("x2", (d) => {
          return (
            getElementPosition(
              d.outputNeuron[0],
              num_layers * 0.7,
              this.x_pos_scale
            ) - 15
          );
        })
        .attr("y2", (d) => {
          return getElementPosition(
            d.outputNeuron[1],
            layerLengths[d.outputNeuron[0]],
            this.y_pos_scale,
            true
          );
        })
        .attr("stroke-width", (d) => {
          return thicknessScale(Math.abs(d.partialDerivative));
        })
        .attr("stroke", (d) => {
          return colorScale(d.partialDerivative);
        })
        .attr("class", (d) => {
          if (staticLinks === true) {
            return "link static";
          } else if (d.inputNeuron[0] === 0) {
            return "link slow";
          } else {
            return "link fast";
          }
        });
    };

    function initNeurons(layerStructure) {
      let neurons = [];

      layerStructure.forEach((numberOfNeurons, layerIndex) => {
        for (let i = 0; i < numberOfNeurons; i++) {
          neurons.push([layerIndex, i]);
        }
      });

      return neurons;
    }

    function initLinks(layerStructure) {
      let links = [];

      for (let layer = 1; layer < layerStructure.length; layer++) {
        for (
          let outputNeuron = 0;
          outputNeuron < layerStructure[layer];
          outputNeuron++
        ) {
          for (
            let inputNeuron = 0;
            inputNeuron < layerStructure[layer - 1];
            inputNeuron++
          ) {
            links.push({
              outputNeuron: [layer, outputNeuron],
              inputNeuron: [layer - 1, inputNeuron],
              partialDerivative: 0,
            });
          }
        }
      }
      return links;
    }

    this.modifyLinksGradient = function (gradient) {
      let inputLength = this.layerStructure[0];
      let numProcessed = 0;

      for (
        let firstLayerNeuron = 0;
        firstLayerNeuron < gradient[0].length;
        firstLayerNeuron++
      ) {
        for (let initialInput = 0; initialInput < inputLength; initialInput++) {
          this.links[numProcessed].partialDerivative =
            gradient[0][firstLayerNeuron][initialInput];
          numProcessed++;
        }
      }

      for (let layer = 1; layer < gradient.length; layer++) {
        for (
          let outputNeuron = 0;
          outputNeuron < gradient[layer].length;
          outputNeuron++
        ) {
          for (
            let inputNeuron = 0;
            inputNeuron < gradient[layer - 1].length;
            inputNeuron++
          ) {
            this.links[numProcessed].partialDerivative =
              gradient[layer][outputNeuron][inputNeuron];
            numProcessed++;
          }
        }
      }
    };

    this.reset = function() {
      this.lines = this.svg.selectAll("line").data(this.links);
      this.visualize_links(this.lines, this.layerStructure, 0, true);
    }

    function defineScale(domain, range, clamp = false) {
      return d3.scaleLinear().domain(domain).range(range).clamp(clamp);
    }

    function getElementPosition(index, total, scale, center = false) {
      let centering = center ? 1 : 0;

      return scale((index + centering) / (total + centering));
    }

  }

  return NeuralNetwork;
  ////////////
});
