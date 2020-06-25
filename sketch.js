var cx = 1000;
var cy = 500;
var gridx = cx;
var gridy = cy;
var c_height = 300;
var c_speed = 6;
var camera_mode = "spec";
var look_dir;
var view_dist = 500;
var look_speed = 50;

var money = 500;
var current_tower = "none";
var stock = [];
var shop_cursor = 0;

var x_click = 0;
var y_click = 0;

var towers = [];
var enemies = [];
var bullets = [];

var path = [];

var font;

/// SETUP ///

function preload(){
	font = loadFont("momcake.otf");
}

function setup(){
	createCanvas(1024, 768, WEBGL);
	enemies.push(new create_enemy(1000, 500, 150, 2));
	enemies.push(create_scout(1000, 200));
	look_dir = PI/2;
	setup_path();

	textFont(font);
	textSize(width/12);
	textAlign(CENTER, CENTER,);
}

function setup_path(){
	path[0] = [1000, 500];
	path[1] = [1000, 800];
	path[2] = [1500, 800];
	path[3] = [1500, 1500];
	path[4] = [2000, 1500];
}






/// STEP FUNCTIONS ///

//PROCESSING//
function draw(){
	background(0);

	camera_control();

	gridx = (cx-cx%50)+25;
	gridy = (cy-cy%50)+25;

	tower_loop();
	bullet_loop();
	enemy_loop();

	if(camera_mode != "shop"){
		draw_cursor();
		draw_ground();
		draw_path();
		draw_enemies();
		draw_towers();
		draw_bullets();
	}
}

function camera_control(){
	let w = keyIsDown('87') != null ? keyIsDown('87') : false;
	let a = keyIsDown('65') != null ? keyIsDown('65') : false;
	let s = keyIsDown('83') != null ? keyIsDown('83') : false;
	let d = keyIsDown('68') != null ? keyIsDown('68') : false;

	let q = keyIsDown(LEFT_ARROW)!= null ? keyIsDown(LEFT_ARROW) : false;
	let e = keyIsDown(RIGHT_ARROW)!= null ? keyIsDown(RIGHT_ARROW) : false;


	switch(camera_mode){
		case "build":
			let horz = a - d;
			let vert = s - w;
			cx += horz * c_speed;
			cy += vert * c_speed;

			camera(cx, cy, -c_height, cx, cy, 0, 0, 1, 0);
			break;
		case "spec":
			look_dir += (q-e)/look_speed;
			if(w){
				cx += cos(look_dir)*c_speed;
				cy += sin(look_dir)*c_speed;
			}
			if(a){
				cx += cos(look_dir + PI/2)*c_speed;
				cy += sin(look_dir + PI/2)*c_speed;
			}
			if(s){
				cx += cos(look_dir + PI)*c_speed;
				cy += sin(look_dir + PI)*c_speed;
			}
			if(d){
				cx += cos(look_dir - PI/2)*c_speed;
				cy += sin(look_dir - PI/2)*c_speed;
			}

			camera(cx, cy, -c_height, cx + cos(look_dir)*view_dist, cy + sin(look_dir)*view_dist, 20, 0, 0, 1)
			break;
		case "shop":
			camera();
			shop_loop();
			break;
	}
}

function place_towers(){
	if(camera_mode == "build"){
		for(let i = 0; i < towers.length; i++){
			if(gridx == towers[i].xpos && gridy == towers[i].ypos)
				return;
		}
		towers.push(new create_tower(gridx, gridy, 60, "glue"));
	}
}

function enemy_loop(){
	for(let i = 0; i < enemies.length; i++){
		let c_enem = enemies[i];

		if(c_enem.glue_timer > 0){
			c_enem.glue_timer--;
		}
		else if(c_enem.glue_timer == 0){
			c_enem.glued = false;
		}

		if(c_enem.hp <= 0){
			enemies.splice(i, 1);
			i--;
			continue;
		}
		if(c_enem.flag < path.length - 1){
			let cur_speed = c_enem.glued ? c_enem.mvspd/2 : c_enem.mvspd;
			c_enem.xpos += cos(atan2(path[c_enem.flag+1][1] - c_enem.ypos, path[c_enem.flag+1][0] - c_enem.xpos))*cur_speed;
			c_enem.ypos += sin(atan2(path[c_enem.flag+1][1] - c_enem.ypos, path[c_enem.flag+1][0] - c_enem.xpos))*cur_speed;

			if(abs(path[c_enem.flag+1][0] - c_enem.xpos) < 10 && abs(path[c_enem.flag+1][1] - c_enem.ypos) < 10){
				c_enem.flag++;
			}
		}
	}
}

function tower_loop(){
	for(let i = 0; i < towers.length; i++){
		let cur = towers[i];
		
		if(cur.cooldown > 0){
			cur.cooldown--;
		}
		else{
			let range = 250;
			for(let k = 0; k < enemies.length; k++){
				let c_enem = enemies[k];
				if(abs(c_enem.xpos - cur.xpos) < range && abs(c_enem.ypos - cur.ypos) < range){
					bullets.push(new create_bullet(cur.xpos, cur.ypos, 10, c_enem, cur.bul_type));
					cur.cooldown = cur.max_cool;
					break;
				}
			}
		}
	}
}

function bullet_loop(){
	for(let i = 0; i < bullets.length; i++){
		let c_bul = bullets[i];
		let targ = c_bul.target;
		
		let dir = atan2(c_bul.ypos - targ.ypos, c_bul.xpos - targ.xpos);
		let mv_spd = 5;
		c_bul.xpos += -cos(dir)*mv_spd;
		c_bul.ypos += -sin(dir)*mv_spd;
		
		for(let k = 0; k < enemies.length; k++){
			let c_enem = enemies[k];
			if(abs(c_bul.xpos - c_enem.xpos) < 20 && abs(c_bul.ypos - c_enem.ypos) < 20){
				if(c_bul.type == "regular"){
					c_enem.hp-=3;
					bullets.splice(i, 1);
					i--;
					break;
				}
				else if(c_bul.type == "glue"){
					c_enem.glued = true;
					c_enem.glue_timer = 40;
					bullets.splice(i, 1);
					i--;
					break;
				}
			}
		}
	}
}

function shop_loop(){
	fill(255);
	text("money", -width/2 + 120, height/2-50);

	noStroke();
	fill(200, 200, 0);

	push();
	translate(-100, -100, 300);
	box(50);
	pop();

	push();
	translate(0, -100, 300);
	box(50);
	pop();

	push();
	translate(100, -100, 300);
	box(50);
	pop();

	push();
	translate(-100, 0, 300);
	box(50);
	pop();

	push();
	translate(0, 0, 300);
	box(50);
	pop();

	push();
	translate(100, 0, 300);
	box(50);
	pop();

	push();
	translate(-100, 100, 300);
	box(50);
	pop();

	push();
	translate(0, 100, 300);
	box(50);
	pop();

	push();
	translate(100, 100, 300);
	box(50);
	pop();

	switch(shop_cursor){
		case 0:
			push();
			translate(-100, -100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 1:
			push();
			translate(0, -100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 2:
			push();
			translate(100, -100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 3:
			push();
			translate(-100, 0, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 4:
			push();
			translate(0, 0, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 5:
			push();
			translate(100, 0, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 6:
			push();
			translate(-100, 100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 7:
			push();
			translate(0, 100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
		case 8:
			push();
			translate(100, 100, 300);
			noFill();
			stroke(255, 0, 0);
			box(80);
			pop();
			break;
	}
}



//DRAWING//
function draw_cursor(){
	push();
	translate(gridx, gridy);
	stroke(255, 0, 0);
	strokeWeight(2);
	fill(0, 0, 0, 0);
	box(50, 50, 50);
	pop();
}

function draw_ground(){
	push();
	noStroke();
	fill(0, 255, 0);
	translate(2000, 2000, 25);
	plane(4000, 4000);
	pop();
}

function draw_towers(){
	for(let i = 0; i < towers.length; i++){
		c_tower = towers[i];

		push();
		noStroke();
		fill(255);
		translate(c_tower.xpos, c_tower.ypos, 0);
		box(50, 50, 50);
		pop();
	}
}

function draw_enemies(){
	for(let i = 0; i < enemies.length; i++){
		c_enem = enemies[i];

		push();
		noStroke();
		fill(255, 0, 0);
		translate(c_enem.xpos, c_enem.ypos, 0);
		sphere(25);
		pop();
	}
}

function draw_bullets(){
	for(let i = 0; i < bullets.length; i++){
		let c_bul = bullets[i];

		push();
		noStroke();
		fill(255, 255, 0);
		translate(c_bul.xpos, c_bul.ypos, 0);
		sphere(10);
		pop();
	}
}

function draw_path(){
	for(let i = 0; i < path.length - 1; i++){
		let run = abs(path[i][0] - path[i+1][0]);
		let rise = abs(path[i][1] - path[i+1][1]);
		let length = sqrt(run*run + rise*rise);
		let ang = atan2(path[i][1] - path[i+1][1], path[i][0] - path[i+1][0]);

		noStroke();
		push();
		fill(0, 0, 255);
		translate(path[i][0] - cos(ang)*length/2, path[i][1] - sin(ang)*length/2, 1);
		rotateZ(ang+PI/2);
		plane(25, length);
		pop();
	}
}




//INPUTS//
function mousePressed(){
	x_click = mouseX - width/2;
	y_click = mouseY - height/2;
}

function keyPressed(){
	if(key === 'e'){
		if(camera_mode == "build")
			camera_mode = "spec";
		else if(camera_mode == "spec")
			camera_mode = "build";
		else if(camera_mode == "shop")
			camera_mode = "build";
	}
	if(key === ' '){
		place_towers();
	}
	if(key === 'q'){
		camera_mode = "shop";
	}

	if(camera_mode == "shop"){
		if(keyCode === RIGHT_ARROW){
			shop_cursor++;
		}
		if(keyCode === LEFT_ARROW){
			shop_cursor--;
		}
		if(keyCode === UP_ARROW){
			shop_cursor-=3;
		}
		if(keyCode === DOWN_ARROW){
			shop_cursor+=3;
		}
	}
}





/// STRUCTS ///

function create_tower(xpos, ypos, max_cool, bul_type){
	this.xpos = xpos;
	this.ypos = ypos;
	this.max_cool = max_cool;
	this.bul_type = bul_type;

	this.cooldown = 0;
}

function create_enemy(xpos, ypos, hp, mvspd){
	this.xpos = xpos;
	this.ypos = ypos;
	this.hp = hp;
	this.mvspd = mvspd;

	this.flag = 0;
	this.glued = false;
	this.glue_timer = 0;
}

function create_bruiser(xpos, ypos){
	return new create_enemy(xpos, ypos, 30, 0.8);
}
function create_infantry(xpos, ypos){
	return new create_enemy(xpos, ypos, 15, 2);
}
function create_scout(xpos, ypos){
	return new create_enemy(xpos, ypos, 5, 3.5);
}

function create_bullet(xpos, ypos, dmg, target, type){
	this.xpos = xpos;
	this.ypos = ypos;
	this.dmg = dmg;
	this.target = target;
	this.type = type;
}

























