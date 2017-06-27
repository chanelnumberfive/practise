;(function(THREE,_){

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
var Cell = function(x, y) {
  this.x = x;
  this.y = y;
  this.visited = false;

  // When solving the maze, this represents
  // the previous node in the navigated path.
  this.parent = null;

  this.heuristic = 0;

  this.visit = function () {
    this.visited = true;
  };

  this.score = function () {
  	var total = 0;
  	var p = this.parent;
  	
  	while(p) {
  		++total;
  		p = p.parent;
  	}
  	return total;
  };

  this.pathToOrigin = function () {
  	var path = [this];
  	var p = this.parent;
  	
  	while(p) {
  		path.push(p);
  		p = p.parent;
  	}
  	path.reverse();
  	
  	return path;
  };
};
var Graph = function(width, height) {
  this.width = width;
  this.height = height;
  this.cells = [];
  this.removedEdges = [];

  var self = this;

  this.getCellAt = function (x, y) {
    if(x >= this.width || y >= this.height || x < 0 || y < 0) {
    	return null;
    }
    if(!this.cells[x]) {
    	return null;
    }
    return this.cells[x][y];
  };

  this.getCellDistance = function (cell1, cell2) {
    var xDist = Math.abs(cell1.x - cell2.x);
    var yDist = Math.abs(cell1.y - cell2.y);
    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
  },

  // Returns true if there is an edge between cell1 and cell2
  this.areConnected = function(cell1, cell2) {
  	if(!cell1 || !cell2) {
  		return false;
  	}
  	if(Math.abs(cell1.x - cell2.x) > 1 || 
  		Math.abs(cell1.y - cell2.y) > 1) {
  		return false;
  	}

  	var removedEdge = _.detect(this.removedEdges, function(edge) {
  		return _.include(edge, cell1) && _.include(edge, cell2);
  	});

  	return removedEdge == undefined;
  };

  this.cellUnvisitedNeighbors = function(cell) {
  	return _.select(this.cellConnectedNeighbors(cell), function(c) {
      return !c.visited;
    });
  };

  // Returns all neighbors of this cell that ARE separated by an edge (maze line)
  this.cellConnectedNeighbors = function(cell) {
    return _.select(this.cellNeighbors(cell), function(c) {
      return self.areConnected(cell, c);
    });
  };

  // Returns all neighbors of this cell that are NOT separated by an edge
  // This means there is a maze path between both cells.
  this.cellDisconnectedNeighbors = function (cell) {
    return _.reject(this.cellNeighbors(cell), function(c) {
      return self.areConnected(cell, c);
    });
  }

  // Returns all neighbors of this cell, regardless if they are connected or not.
  this.cellNeighbors = function (cell) {
    var neighbors = [];
    var topCell = this.getCellAt(cell.x, cell.y - 1);
    var rightCell = this.getCellAt(cell.x + 1, cell.y);
    var bottomCell = this.getCellAt(cell.x, cell.y + 1);
    var leftCell = this.getCellAt(cell.x - 1, cell.y);

    if(cell.y > 0 && topCell) {
      neighbors.push(topCell);
    }
    if(cell.x < this.width && rightCell) {
      neighbors.push(rightCell);
    }
    if(cell.y < this.height && bottomCell) {
      neighbors.push(bottomCell);
    }
    if(cell.x > 0 && leftCell) {
      neighbors.push(leftCell);
    }

    return neighbors;
  }

  this.removeEdgeBetween = function(cell1, cell2) {
  	this.removedEdges.push([cell1, cell2]);
  };

  for(var i = 0; i < this.width; i++) {
  	this.cells.push([]);
  	row = this.cells[i];

  	for(var j = 0; j < this.height; j++) {
  		var cell = new Cell(i, j, this);
  		row.push(cell);
  	}
  }
};
var Maze = function (scene, cells, width, height) {

    this.scene = scene;
    this.elements = [];

    this.width = width;
    this.height = height;

    this.horizCells = cells;
    this.vertCells = cells;
    this.generator = new MazeGenerator(this.horizCells, this.vertCells);
    this.cellWidth = this.width / this.horizCells;
    this.cellHeight = this.height / this.vertCells;

    var self = this;

    return {
        width: function () {
            return self.width;
        },

        height: function () {
            return self.height;
        },

        generate: function () {
            self.generator.generate();
        },

        draw: function () {
            this.drawBorders();
            this.drawMaze();
        },

        solve: function () {
            self.generator.solve();
            this.drawSolution();
        },

        drawBorders: function () {
            this.drawLine(self.cellWidth, 0, self.width, 0);
            this.drawLine(self.width, 0, self.width, self.height);
            this.drawLine(self.width - self.cellWidth, self.height, 0, self.height);
            this.drawLine(0, self.height, 0, 0);
        },

        drawSolution: function () {
            var path = self.generator.path;

            for (var i = 0; i < path.length; i++) {
                (function () {
                    var cell = path[i];
                    var x = cell.x * self.cellWidth;
                    var y = cell.y * self.cellHeight;
                    setTimeout(function () {
                        self.ctx.fillRect(x, y, self.cellWidth, self.cellHeight);
                    }, 80 * i);
                })();
            }
        },

        drawMaze: function () {
            var graph = self.generator.graph;
            var drawnEdges = [];

            var edgeAlreadyDrawn = function (cell1, cell2) {
                return _.detect(drawnEdges, function (edge) {
                    return _.include(edge, cell1) && _.include(edge, cell2);
                }) != undefined;
            };

            for (var i = 0; i < graph.width; i++) {
                for (var j = 0; j < graph.height; j++) {
                    var cell = graph.cells[i][j];
                    var topCell = graph.getCellAt(cell.x, cell.y - 1);
                    var leftCell = graph.getCellAt(cell.x - 1, cell.y);
                    var rightCell = graph.getCellAt(cell.x + 1, cell.y);
                    var bottomCell = graph.getCellAt(cell.x, cell.y + 1);

                    if (!edgeAlreadyDrawn(cell, topCell) && graph.areConnected(cell, topCell)) {
                        var x1 = cell.x * self.cellWidth;
                        var y1 = cell.y * self.cellHeight;
                        var x2 = x1 + self.cellWidth;
                        var y2 = y1;

                        this.drawLine(x1, y1, x2, y2);
                        drawnEdges.push([cell, topCell]);
                    }

                    if (!edgeAlreadyDrawn(cell, leftCell) && graph.areConnected(cell, leftCell)) {
                        var x2 = x1;
                        var y2 = y1 + self.cellHeight;

                        this.drawLine(x1, y1, x2, y2);
                        drawnEdges.push([cell, leftCell]);
                    }

                    if (!edgeAlreadyDrawn(cell, rightCell) && graph.areConnected(cell, rightCell)) {
                        var x1 = (cell.x * self.cellWidth) + self.cellWidth;
                        var y1 = cell.y * self.cellHeight;
                        var x2 = x1;
                        var y2 = y1 + self.cellHeight;

                        this.drawLine(x1, y1, x2, y2);
                        drawnEdges.push([cell, rightCell]);
                    }

                    if (!edgeAlreadyDrawn(cell, bottomCell) && graph.areConnected(cell, bottomCell)) {
                        var x1 = cell.x * self.cellWidth;
                        var y1 = (cell.y * self.cellHeight) + self.cellHeight;
                        var x2 = x1 + self.cellWidth;
                        var y2 = y1;

                        this.drawLine(x1, y1, x2, y2);
                        drawnEdges.push([cell, bottomCell]);
                    }
                }
            }
        },

        getElements: function() {
            return self.elements;
        },

        drawLine: function (x1, y1, x2, y2) {
            var lengthX = Math.abs(x1 - x2);
            var lengthY = Math.abs(y1 - y2);

            // since only 90 degrees angles, so one of these is always 0
            // to add a certain thickness to the wall, set to 0.5
            if (lengthX === 0) lengthX = 0.5;
            if (lengthY === 0) lengthY = 0.5;

            // create a cube to represent the wall segment
            var wallGeom = new THREE.BoxGeometry(lengthX, 3, lengthY);
            var wallMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, opacity: 0.8, transparent: true});


            // and create the complete wall segment
            var wallMesh = new THREE.Mesh(wallGeom, wallMaterial);

            // finally position it correctly
            wallMesh.position = new THREE.Vector3(x1 - ((x1 - x2) / 2) -(self.height/2), wallGeom.height/2, y1 - ((y1 - y2)) / 2 - (self.width /2));

            self.elements.push(wallMesh);
            scene.add(wallMesh);
        }
    };
};
var MazeGenerator = function(rows, cols) {
	this.graph = new Graph(rows, cols);
	this.cellStack = [];

	var self = this;

	var recurse = function(cell) {
		cell.visit();
    var neighbors = self.graph.cellUnvisitedNeighbors(cell);
    if(neighbors.length > 0) {
    	var randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    	self.cellStack.push(cell);
    	self.graph.removeEdgeBetween(cell, randomNeighbor);
    	recurse(randomNeighbor);
    }
    else {
    	var waitingCell = self.cellStack.pop();
    	if(waitingCell) {
    		recurse(waitingCell);
    	}
    }
  };

  this.solve = function() {
    var closedSet = [];
    var startCell = this.graph.getCellAt(0, 0); // top left cell
    var targetCell = this.graph.getCellAt(this.graph.width - 1, this.graph.height - 1); // bottom right cell
    var openSet = [startCell];
    var searchCell = startCell;

    while(openSet.length > 0) {
      var neighbors = this.graph.cellDisconnectedNeighbors(searchCell);
      for(var i = 0; i < neighbors.length; i ++) {
        var neighbor = neighbors[i];
        if(neighbor == targetCell) {
          neighbor.parent = searchCell;
          this.path = neighbor.pathToOrigin();
          openSet = [];
          return;
        }
        if(!_.include(closedSet, neighbor)) {
          if(!_.include(openSet, neighbor)) {
            openSet.push(neighbor);
            neighbor.parent = searchCell;
            neighbor.heuristic = neighbor.score() + this.graph.getCellDistance(neighbor, targetCell);
          }
        }
      }
      closedSet.push(searchCell);
      openSet.remove(_.indexOf(openSet, searchCell));
      searchCell = null;

      _.each(openSet, function(cell) {
        if(!searchCell) {
          searchCell = cell;
        }
        else if(searchCell.heuristic > cell.heuristic) {
          searchCell = cell;
        }
      });
    }
  };

	this.generate = function() {
		var initialCell = this.graph.getCellAt(0, 0);
		recurse(initialCell);
	};
};
window.Maze=Maze;	
})(window.THREE,_);	