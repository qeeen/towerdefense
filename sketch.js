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

var life = 100;
var wave = 0;
var waves = [];
var wave_timer = 0;
var wave_counter = 0;
var ongoing = false;

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
//	enemies.push(new create_enemy(1000, 500, 150, 2));
//	enemies.push(create_scout(1000, 200));
	look_dir = PI/2;

	setup_path();
	setup_waves();

	textFont(font);
}

function setup_path(){
	path[0] = [1000, 500];
	path[1] = [1000, 800];
	path[2] = [1500, 800];
	path[3] = [1500, 1500];
	path[4] = [2000, 1500];
	path[5] = [2000, 2200];
	path[6] = [1200, 2200];
	path[7] = [1200, 2500];
}

function setup_waves(){
	waves[0] = ["infantry", "infantry", "infantry", "infantry"];
	waves[1] = ["infantry", "infantry", "infantry", "infantry", "infantry", "infantry"];
	waves[2] = ["scout", "scout", "infantry", "infantry", "infantry", "infantry", "scout", "scout"];
	waves[3] = ["scout", "scout", "scout", "scout", "scout", "infantry", "scout", "scout"];
	waves[4] = ["bruiser", "bruiser"];
	waves[5] = ["bruiser", "infantry", "infantry", "bruiser"];
	waves[6] = ["scout", "scout", "bruiser", "infantry", "infantry", "bruiser", "infantry"];
	waves[7] = ["bruiser", "bruiser", "scout", "scout", "bruiser", "infantry", "infantry", "infantry", "bruiser", "infantry", "infantry"];
	waves[8] = ["infantry", "infantry", "infantry", "bruiser", "infantry", "infantry", "infantry", "bruiser", "scout", "scout", "bruiser", "scout", "scout", "infantry"];
	waves[9] = ["bruiser", "bruiser", "bruiser", "scout", "scout", "scout", "scout", "scout", "scout", "bruiser", "infantry", "infantry"];
	waves[10] = ["bruiser", "infantry", "infantry", "bruiser", "infantry", "infantry", "bruiser", "bruiser", "bruiser", "bruiser", "infantry", "scout", "infantry"];
	waves[10] = ["bruiser", "infantry", "scout", "bruiser", "infantry", "infantry", "bruiser", "scout", "scout", "scout", "infantry", "bruiser", "bruiser", "infantry", "infantry", "bruiser", "bruiser", "bruiser"];
}




/// STEP FUNCTIONS ///

//PROCESSING//
function draw(){
	background(0);

	camera_control();

	gridx = (cx-cx%50)+25;
	gridy = (cy-cy%50)+25;

	if(ongoing)
		wave_loop();

	tower_loop();
	bullet_loop();
	enemy_loop();

	if(camera_mode == "build" || camera_mode == "spec"){
		draw_cursor();
		draw_ground();
		draw_path();
		draw_enemies();
		draw_towers();
		draw_bullets();
	}

	if(life <= 0){
		camera_mode = "loss";
		camera();
		fill(255);
		textSize(width/8);
		textAlign(CENTER, CENTER);
		text("game over", 0, 0);
	}
	if(wave == waves.length){
		camera_mode = "win";
		camera();
		fill(255);
		textSize(width/8);
		textAlign(CENTER, CENTER);
		text("you win!", 0, 0);
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
		let atk_spd = 60;
		if(current_tower == "rocket")
			atk_spd = 85;
		towers.push(new create_tower(gridx, gridy, atk_spd, current_tower));
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
			money+=25;
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
		else{
			life -= c_enem.hp;

			enemies.splice(i, 1);
			i--;
			continue
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
		if(targ.hp <= 0){
			bullets.splice(i, 1);
			i--;
			break;

		}
		console.log(targ);
		
		let dir = atan2(c_bul.ypos - targ.ypos, c_bul.xpos - targ.xpos);
		let mv_spd = 10;
		c_bul.xpos += -cos(dir)*mv_spd;
		c_bul.ypos += -sin(dir)*mv_spd;
		
		for(let k = 0; k < enemies.length; k++){
			let c_enem = enemies[k];
			if(abs(c_bul.xpos - c_enem.xpos) < 20 && abs(c_bul.ypos - c_enem.ypos) < 20){
				if(c_bul.type == "regular"){
					c_enem.hp-=5;
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
				else if(c_bul.type == "rocket"){
					c_enem.hp-=10;
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
	textSize(width/12);
	textAlign(LEFT, CENTER);
	text("money: " + money, -width/2 + 30, height/2-50);

	text("wave: " + wave, -width/2 + 30, -height/2+30);

	textAlign(RIGHT, CENTER);
	text("life: " + life, width/2 - 30, height/2-50);

	noStroke();
	fill(200, 200, 0);

	push();
	translate(-100, -100, 300);
	fill(255);
	box(50);
	pop();
	fill(255);
	textSize(width/30);
	textAlign(CENTER, CENTER);
	text("REGULAR: 250$", -200, -100);

	push();
	translate(0, -100, 300);
	fill(200, 200, 0);
	box(35, 50, 35);
	pop();
	fill(255);
	textSize(width/30);
	textAlign(CENTER, CENTER);
	text("GLUE: 250$", 0, -100);

	push();
	translate(100, -100, 300);
	fill(0, 0, 200);
	box(70, 50, 70);
	pop();
	fill(255);
	textSize(width/30);
	textAlign(CENTER, CENTER);
	text("ROCKET: 350$", 200, -100);

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

function wave_loop(){
	let startx = 1000;
	let starty = 500;

	if(wave_timer > 0){
		wave_timer--;
	}
	if(wave_timer == 0){
		if(wave_counter < waves[wave].length){
			wave_timer = 60;
			switch(waves[wave][wave_counter]){
				case "infantry":
					enemies.push(create_infantry(startx, starty));
					break;
				case "scout":
					enemies.push(create_scout(startx, starty));
					break;
				case "bruiser":
					enemies.push(create_bruiser(startx, starty));
					break;
			}
			wave_counter++;
		}
		else if(enemies.length == 0){
			ongoing = false;
			wave++;
			wave_counter = 0;
			money += wave*100;
		}
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
		translate(c_tower.xpos, c_tower.ypos, 0);

		switch(c_tower.bul_type){
			case "regular":
				fill(255);
				box(50, 50, 50);
				break;
			case "glue":
				fill(200, 200, 0);
				box(30, 30, 50);
				break;
			case "rocket":
				fill(0, 0, 200);
				box(70, 70, 50);
				break;
		}

		pop();
	}
}

function draw_enemies(){
	for(let i = 0; i < enemies.length; i++){
		c_enem = enemies[i];

		push();
		noStroke();
		translate(c_enem.xpos, c_enem.ypos, 0);

		switch(c_enem.type){
			case "infantry":
				fill(255, 0, 0);
				sphere(25);
				break;
			case "scout":
				fill(220, 0, 220);
				sphere(15);
				break;
			case "bruiser":
				fill(200, 0, 0);
				sphere(35);
				break;
		}

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
		if(shop_cursor > 8)
			shop_cursor = 8;
		if(shop_cursor < 0)
			shop_cursor = 0;
		if(key === ' '){
			switch(shop_cursor){
				case 0:
					if(money >= 250){
						current_tower = "regular";
						money -= 250;
					}
					break;
				case 1:
					if(money >= 250){
						current_tower = "glue";
						money -= 250;
					}
					break;
				case 2:
					if(money >= 350){
						current_tower = "rocket";
						money -= 350;
					}
					break;
			}
			camera_mode = "build";
		}
		if(key === 'q'){
			camera_mode = "spec";
		}
	}
	else{
		if(key === 'e'){
			if(camera_mode == "build")
				camera_mode = "spec";
			else if(camera_mode == "spec")
				camera_mode = "build";
			else if(camera_mode == "shop")
				camera_mode = "build";
		}
		if(key === ' '){
			if(current_tower != "none"){
				place_towers();
				current_tower = "none";
			}
		}
		if(key === 'q'){
			camera_mode = "shop";
		}
		if(keyCode === ENTER){
			ongoing = true;
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

function create_enemy(xpos, ypos, hp, mvspd, type){
	this.xpos = xpos;
	this.ypos = ypos;
	this.hp = hp;
	this.mvspd = mvspd;
	this.type = type;

	this.flag = 0;
	this.glued = false;
	this.glue_timer = 0;
}

function create_bruiser(xpos, ypos){
	return new create_enemy(xpos, ypos, 30, 0.8, "bruiser");
}
function create_infantry(xpos, ypos){
	return new create_enemy(xpos, ypos, 15, 2, "infantry");
}
function create_scout(xpos, ypos){
	return new create_enemy(xpos, ypos, 10, 3.5, "scout");
}

function create_bullet(xpos, ypos, dmg, target, type){
	this.xpos = xpos;
	this.ypos = ypos;
	this.dmg = dmg;
	this.target = target;
	this.type = type;
}

























