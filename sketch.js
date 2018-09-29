const w_width = 512;
const w_height = 512;
const h_w_width = w_width / 2.0;
const h_w_height = w_height  / 2.0;
let agents = new Array();
let obstacles = new Array();

const agent_count = 100;


function setup() {
	createCanvas(512, 512);
	background(0);

	obstacles.push(new Obstacle(h_w_width, h_w_height - 100, 100, 25));

	Agent.set_obstacles(obstacles);

	for (var i = 0; i < 100; i++) {
		agents.push(new Agent(h_w_width, h_w_height, 100));
	}

}

function draw() {
	rectMode(CENTER); // Draws rectangle from the center instead of the top left corner
	background(0);
	stroke(255);
	fill(255);
	for (var i = agents.length - 1; i >= 0; i--) {
		agents[i].update();
		agents[i].draw();
	}
	for (var i = obstacles.length - 1; i >= 0; i--) {
		obstacles[i].draw();
	}
}

class Obstacle
{
	constructor(x, y, width, height)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.h_width = width / 2.0;
		this.h_height = height / 2.0;
		this.color = [158, 36, 36];
	}

	is_inside(x, y)
	{
		if(x >= this.x - this.h_width && x <= this.x + this.h_width)
		{
			if(y >= this.y - this.h_height && y <= this.y + this.h_height)
			{
				return true;
			}
		}
		return false;
	}

	draw()
	{
		fill(this.color);
		rect(this.x, this.y, this.width, this.height);
	}
}

class Agent
{

	constructor(x, y, step_count)
	{
		this.pos = createVector(x, y);
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
	};

	static set_obstacles(obstacles_array)
	{
		// Environement obstacles (doesn't change from agent to agent so we use static for performance)
		// Slice with argument 0 means a full copy is created (avoids reference)
		Agent.env_obstacles = obstacles_array.slice(0);
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
				if(Agent.env_obstacles[i].is_inside(this.pos.x, this.pos.y))
				{
					return true; // return True (bailout)
				}
			}
			return false;
		}
		else
		{
			throw "Agent.env_obstacles is not itinialised use Agent.set_obstacles(obstacle_array) to set it";
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
				this.alive = false;
			}
			if(this.is_insideObstacle())
			{
				this.alive = false;
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
		ellipse(this.pos.x, this.pos.y, 10.0, 10.0);
	}
}