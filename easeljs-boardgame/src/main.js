init = function () {

	// Create a queue to load files forcing to use XHR true
	var queue = new createjs.LoadQueue(true);

	var canvas, stage;

	var offset;
	var update = true;

	// The coordinates collection, catched by a image editor
	var coordinates = [
		[200, 0],
		[177, 127],
		[289, 152],
		[480, 100],
		[566, 131],
		[575, 250],
		[362, 262],
		[78, 310],
		[80, 394],
		[288, 400]
	];

	// A great place to load the splash screen
	// queue.loadManifest(["images/splash.jpg"]);

	// The event complete of the load calls a handleComplete function
	queue.on("complete", handleComplete, this);

	// Try to load some files, listed in a array of objects
	queue.loadManifest([{
		id: "map",
		src: "images/map.jpg"
	}]);

	function handleComplete() {

		// Identify the HTML element to be the canvas
		canvas = document.getElementById('main');

		// Create an imagem object with the loaded content
		var image = queue.getResult("map");

		// Create the stage inside the canvas
		stage = new createjs.Stage(canvas);

		// Enable touch interactions if supported on the current device
		createjs.Touch.enable(stage);

		// Enable mouse over / out events
		stage.enableMouseOver(10);

		// keep tracking the mouse even when it leaves the canvas
		stage.mouseMoveOutside = true;

		// Create a Bitmap object from the image object (will be our game cenario/board)
		var mapBitmap = new createjs.Bitmap(image);

		// Positions the Bitmap on the left-top corner
		mapBitmap.regX = 0;
		mapBitmap.regY = 0;

		// Put it on the stage first - the cenario should be behind of all others elements
		stage.addChild(mapBitmap);

		// Refresh the stage on the screen
		stage.update();

		// Draw a red line by the path
		for (var i = 1; i < coordinates.length; i++) {

			// Create a shape object on the left-top corner
			var s = new createjs.Shape();
			s.x = 0;
			s.y = 0;

			// Create other shape
			var p = new createjs.Shape();

			// Define the previous and the next point of coordinates
			var previousPoint = coordinates[i - 1];
			var nextPoint = coordinates[i];

			console.log(previousPoint);
			console.log(nextPoint);

			// Define properties for the graphic inside the shape
			p.graphics
			// background color
			.beginFill("#0000FF")
			// size of the square
			.drawRect(0, 0, 30, 30);

			// The mouse cursor
			p.cursor = "pointer";

			// Put the point on each coordinate of the collection, ajusted to the center
			p.x = previousPoint[0] - 15;
			p.y = previousPoint[1] - 15;

			// using "on" binds the listener to the scope of the currentTarget by default
			// in this case that means it executes in the scope of the button.
			p.on("mousedown", function (evt) {
				this.parent.addChild(this);
				this.offset = {
					x: this.x - evt.stageX,
					y: this.y - evt.stageY
				};
			});

			// the pressmove event is dispatched when the mouse moves after a mousedown on the target until the mouse is released.
			p.on("pressmove", function (evt) {
				this.x = evt.stageX + this.offset.x;
				this.y = evt.stageY + this.offset.y;
				// indicate that the stage should be updated on the next tick:
				update = true;
			});

			// p.on("rollover", function (evt) {
			// 	this.scaleX = this.scaleY = this.scale * 1.2;
			// 	update = true;
			// });

			// p.on("rollout", function (evt) {
			// 	this.scaleX = this.scaleY = this.scale;
			// 	update = true;
			// });

			// Define properties for the graphic inside the shape
			s.graphics
			// the stroke style (round)
			.setStrokeStyle(1)
			// the inicial point
			.moveTo(previousPoint[0], previousPoint[1])
			// the color tint
			.beginStroke(createjs.Graphics.getRGB(255, 0, 0))
			// the final point
			.lineTo(nextPoint[0], nextPoint[1]);

			// Add the both elements to the stage, in order of appearance
			stage.addChild(s);
			stage.addChild(p);
		}

		// Refresh the stage
		// stage.update();
		createjs.Ticker.addEventListener("tick", tick);
	}

	function tick(event) {
		// this set makes it so the stage only re-renders when an event handler indicates a change has happened.
		if (update) {
			// only update once
			update = false;
			stage.update(event);
		}
	}
};