const w_width = 512;
const w_height = 512;
const h_w_width = w_width / 2.0;
const h_w_height = w_height  / 2.0;
let agents = [];
let obstacles = [];

const agent_count = 10;


function setup() {
	rectMode(CENTER); // Draws rectangle from the center instead of the top left corner
	createCanvas(512, 512);

	obstacles.push(new Obstacle(w_width * 0.375, h_w_height - 50, w_width * 0.75, 25));
	obstacles.push(new Obstacle(w_width * 0.625, h_w_height + 50, w_width * 0.75, 25));

	Agent.setObstacles(obstacles);

	Agent.setSpawnPoint(h_w_width, w_height - 10);

	Agent.setGoal(h_w_width, w_height - 100, 10);

	for (var i = 0; i < agent_count; i++) {
		agents.push(new Agent(100));
	}

	// Testing the agent copy function
	/*for (var i = 0; i < 5; i++) {
		agents.push(agents[0].copy());
	}*/
}

function draw() {
	background(0);
	stroke(255);
	fill(255);


	Agent.goal.draw();

	for (var i = agents.length - 1; i >= 0; i--) {
		agents[i].update();
		agents[i].draw();
	}

	for (var i = obstacles.length - 1; i >= 0; i--) {
		obstacles[i].draw();
	}

	if(Agent.allAgentDead())
	{
		for (var i = agents.length - 1; i >= 0; i--) {
			agents[i].reset();
			agents[i].randomizeSteps();
		}
	}
}

class BoxShape
{
	constructor(x, y, width, height)
	{

		this.x = x || 0;
		this.y = y || 0;
		this.width = width;
		this.height = height;
		this.half_width = width / 2.0;
		this.half_height = height / 2.0;
	}

	isPointInside(x, y)
	{
		if(x >= this.x - this.half_width && x <= this.x + this.half_width)
		{
			if(y >= this.y - this.half_height && y <= this.y + this.half_height)
			{
				return true;
			}
		}
		return false;
	}

	isCircleInside(x, y, radius)
	{
		// More expensive to call then isPointInside, make sure you need this precision

		// Reference: https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection

		// This collapses the four quadrants into one
		let circleDistance_x = abs(x - this.x);
		let circleDistance_y = abs(y - this.y);

		// Early check to see if the circle is to far to be in the box
		if (circleDistance_x > (this.h_width + radius)) { return false; }
    	if (circleDistance_y > (this.h_height + radius)) { return false; }

    	// Check to see if the circle is close enough that an intersection is guaranteed
    	if (circleDistance_x <= (this.h_width)) { return true; } 
    	if (circleDistance_y <= (this.h_height)) { return true; }

    	// Check if the circle intersect the corner of the box
    	// Computes the distance from the corner to the center of the circle and check if it is less
    	// than the circle radius
    	// Also we compare against the square of the radius to avoid using an expensive call to squrt()
    	let cornerDistance_sq = (circleDistance_x - this.h_width)^2 +(circleDistance_y - this.h_height)^2;
    	return (cornerDistance_sq <= (radius^2));
	}

	draw()
	{
		rect(this.x, this.y, this.width, this.height);
	}
}


class Obstacle
{
	constructor(x, y, width, height)
	{
		this.box = new BoxShape(x, y, width, height)
		this.color = [158, 36, 36];
	}

	draw()
	{
		fill(this.color);
		this.box.draw();
	}
}

class Goal
{
	constructor(x, y, radius)
	{
		this.pos = createVector(x || 0, y || 0);
		this.radius = radius || 1;
		this.color = [0, 0, 255]; // Blue
	}

	isCircleInside(x, y, radius)
	{
		let dx = this.pos.x - x;
		let dy = this.pos.y - y;
		let dr = this.radius + radius;
		return (dx * dx) + (dy * dy) < (dr * dr);
	}

	setColor(r, g, b, a)
	{
		if(a)
		{
			this.color = [r, g, b, a];
		}
		else
		{
			this.color = [r, g, b];
		}
	}

	draw()
	{
		fill(this.color);
		ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
	}
}



class Agent
{
	//Static variables
	/*
		Agent.goal
		Agent.spawnPoint
		Agent.agent_alive_count
		Agent.agent_created_count;
	*/

	constructor(step_count)
	{
		if(Agent.spawnPoint !== undefined)
		{
			this.pos = Agent.spawnPoint.copy();
		}
		else
		{
			this.pos = createVector(0.0, 0.0);
		}

		this.step_count = step_count;
		this.current_step = 0;
		this.steps = [];

		for (var i = 0; i < this.step_count; i++) {
			let tmp_vec = p5.Vector.random2D()
			this.steps.push(tmp_vec);
		}

		this.acc = createVector(0.0, 0.0);
		this.vel = createVector(0.0, 0.0);
		this.alive = true;
		this.score = 0.0;
		this.reached_goal = false;
		this.radius = 10.0;


		// Create static member variable if doesn't exist
		if(Agent.agent_created_count == undefined)
		{
			Agent.agent_created_count = 1;
		}else{
			Agent.agent_created_count++;
		}

		// Create static member variable if doesn't exist
		if(Agent.agent_alive_count == undefined)
		{
			Agent.agent_alive_count = 1;
		}else{
			Agent.agent_alive_count++;
		}
	};

	static allAgentDead()
	{
		return Agent.agent_alive_count == 0;
	}

	static setObstacles(obstacles_array)
	{
		// Environement obstacles (doesn't change from agent to agent so we use static for performance)
		// Slice with argument 0 means a full copy is created (avoids reference)
		Agent.env_obstacles = obstacles_array.slice(0);
	}

	static setSpawnPoint(x, y)
	{
		// Spawn Point (doesn't change from agent to agent so we use static for performance)
		Agent.spawnPoint = createVector(x, y);
	}

	static setGoal(x, y, radius)
	{
		// Goal (doesn't change from agent to agent so we use static for performance)
		Agent.goal = new Goal(x, y, radius);
	}

	hasReachedGoal()
	{
		return Agent.goal.isCircleInside(this.pos.x, this.pos.y, this.radius);
	}

	kill()
	{
		// Need to check if agent is alive to avoid subtracting 
		// to the agent alive count for no reason
		if(this.alive == true)
		{
			this.alive = false;
			Agent.agent_alive_count--;
		}
	}


	reset()
	{
		// Need to check if agent is dead to avoid adding to the agent alive count
		// for no reason
		if(this.alive == false)
		{
			this.alive = true;
			Agent.agent_alive_count++;
		}

		this.current_step = 0;

		if(Agent.spawnPoint !== undefined)
		{
			// .copy() is needed so the agent gets its own vector object
			this.pos = Agent.spawnPoint.copy();
		}
		else
		{
			// Default spawn in the middle of the screen
			this.pos = createVector(0.0, 0.0);
		}

		this.acc = createVector(0.0, 0.0);
		this.vel = createVector(0.0, 0.0);

		this.score = 0.0;
		this.reached_goal = false;
	}

	is_outOffBound()
	{
		if(this.pos.x <= 0.0 || this.pos.y <= 0.0)
		{
			return true; // return True (bailout)
		}
		if(this.pos.x >= w_height || this.pos.y >= w_height)
		{
			return true; // return True (bailout)
		}
		return false;
	}

	is_insideObstacle()
	{
		// Make sure we defined obstacles
		if(Agent.env_obstacles !== undefined)
		{
			// iterate through every obstacle in the given array
			// and query if the agent's position is inside one of them
			for (var i = Agent.env_obstacles.length - 1; i >= 0; i--) {
				if(Agent.env_obstacles[i].box.isPointInside(this.pos.x, this.pos.y))
				{
					return true; // return True (bailout)
				}
			}
			return false;
		}
		else
		{
			throw "Agent.env_obstacles is not initialised use Agent.setObstacles(obstacle_array) to set it";
		}
	}

	update()
	{
		if(this.alive == true)
		{
			if(this.current_step != this.step_count - 1)
			{
				this.acc.add(this.steps[this.current_step++]);
			}
			this.vel.add(this.acc).limit(5.0);
			this.pos.add(this.vel);
			if(this.is_outOffBound())
			{
				this.kill();
			}
			if(this.is_insideObstacle())
			{
				this.kill();
			}
			if(this.hasReachedGoal())
			{
				this.kill();
			}
		}
	}

	draw()
	{
		if(this.alive)
		{
			fill(255,255,255); // Alive: fill white
		}
		else
		{
			fill(255,0,0); // Dead: fill red
		}
		ellipse(this.pos.x, this.pos.y, this.radius, this.radius);
	}

	copy()
	{
		let newAgent = new Agent(this.step_count);
		newAgent.setSteps(this.steps); // Copy this agent's steps to the new one
		return newAgent;
	}

	setSteps(stepsArray)
	{
		// Slice(0) will basically create a deep copy of the array (independent)
		this.steps = stepsArray.slice(0);
	}

	randomizeSteps()
	{
		for (var i = 0; i < this.step_count; i++) {
			this.steps[i] = p5.Vector.random2D()
		}
	}

	determineScore()
	{
		let goalDist = this.pos.dist(Agent.goal.pos);
		this.score = 1.0 / (goalDist * goalDist);
	}
}