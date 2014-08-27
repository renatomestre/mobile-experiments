var canvasElem = document.getElementById("game");
var world = boxbox.createWorld(canvasElem);
 
var points = 0;
var time = 10;

world.createEntity({
  name: "player",
  shape: "circle",
  radius: 2,
  image: "pig.png",
  imageStretchToFit: true,
  density: 2,
  x: 2,
  onKeyDown: function(e) {
    // Esquerda
    if(e.keyCode == 37) {
        this.applyImpulse(50, 270);
    }
    // Direita
    if(e.keyCode == 39) {
        this.applyImpulse(50, 90);
    }
    // Cima
    if(e.keyCode == 38) {
      this.applyImpulse(25, 0);
    }
  }
});
 
world.createEntity({
  name: "ground",
  shape: "square",
  type: "static",
  color: "rgb(0,100,0)",
  width: 100,
  height: .5,
  y: 17
});

world.createEntity({
  name: "ceil",
  shape: "square",
  type: "static",
  color: "rgb(0,100,0)",
  width: 100,
  height: .5,
  y: -1
});

world.createEntity({
  name: "leftWall",
  shape: "square",
  type: "static",
  color: "rgb(0,100,0)",
  width: .5,
  height: 100,
  x: -1
});

world.createEntity({
  name: "rightWall",
  shape: "square",
  type: "static",
  color: "rgb(0,100,0)",
  width: .5,
  height: 100,
  x: 46
});
 
var block = {
  name: "block",
  shape: "square",
  color: "brown",
  width: .5,
  height: 4,
  onImpact: function(entity, force) {
    if (this.color() != "black" && entity.name() === "player") {
      this.color("black");
      points++;
      time += 10;
      if(points == 7) {
        document.write("<h1>GANHOU!!!</h1>");
      }
    }
  }
};

world.createEntity(block, {
  x: 15,
  height: 13
});
 
world.createEntity(block, {
  x: 20,
  height: 13
});

world.createEntity(block, {
  x: 16,
  y: 1,
  width: 20,
  height: .5
});

world.createEntity(block, {
  x: 16,
  y: 1,
  width: 20,
  height: .5
});

world.createEntity(block, {
  x: 16,
  y: 1,
  width: 20,
  height: .5
});

world.createEntity(block, {
  x: 16,
  y: 1,
  width: 20,
  height: .5
});

world.createEntity(block, {
  x: 16,
  y: 1,
  width: 20,
  height: .5
});
