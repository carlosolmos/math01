//global setup.
var game = new Phaser.Game(800, 300, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var gameState = 0;
var gameTimer;
var enemyTimer = 0;
var platforms;
var enemies;
var results;
var player;
var bullets;
var bulletTime = 0;
var bullet;
var opText;
var scoreText;
var levelText;
var startBtn;
var enemyTotal = 0;
var buttonfire, buttonleft, buttonright;
var left=false;
var right=false;
var fire=false;
var explosions;

var difficulty = 1;
var mathOps = ["+","-", "*"]; //1 additions, 2 substractions, 3 multiplications, 3 mix
const operandLimits = [1,10];
var operationText = ""; 
var opresult = 0;
var resultOptions = [];
var opInPlay = false;
const timeToMath = 5000;
var mathAttemps = 0;
var scoreValue = 0;
var errors = 0;

function gofull() {

    if (game.scale.isFullScreen)
    {
        game.scale.stopFullScreen();
    }
    else
    {
        game.scale.startFullScreen(false);
    }

}

function operation(level){


    mathOps = ["*"];

    const operatorInx = game.rnd.integerInRange(0, mathOps.length-1);
	const operator = mathOps[operatorInx];
	var operand1 = game.rnd.integerInRange(1, operandLimits[1]);
	var operand2 = game.rnd.integerInRange(1, operandLimits[1]);
    if(operator === "-"){
        var tries = 0;
        while(operand1 <= operand2){
            tries++;
            operand2 = game.rnd.integerInRange(1, operandLimits[1]);
            if(tries == 100){
                operand2 = operand1 - 1;
                break;
            }
        }
    }
	const operation = `${operand1} ${operator} ${operand2}`;
	return operation;
}

function fakesResults(value, level){
	var fakes = [];
    fakes.push(value - game.rnd.integerInRange(1, value));
    fakes.push(value + game.rnd.integerInRange(1, 5));
    
	const strval = value + '';
    
	if(strval.length > 1){
        //console.log(strval);
		var newStr = '';
		for(var i = (strval.length - 1); i >= 0; i--){
			newStr+=strval[i];
		}
        //console.log(newStr);
		fakes.push(parseInt(newStr));
	}
	while(fakes.length < 5){
		var rval = game.rnd.integerInRange(1, operandLimits[1]);
		if(rval !== value && !fakes.includes(rval)){
			fakes.push(rval);
		}
	}
	return fakes;
}

function startGame(){
    gameState = 2;
    startBtn.kill();
}


function preload() {
    game.load.image('ground', 'assets/platform.png');
    game.load.image('resbg', 'assets/resbg.png');
    game.load.spritesheet('dude', 'assets/ship01.png', 32, 37);
    game.load.image('bullet', 'assets/bullet0.png');
    game.load.image('startButton', 'assets/start.png');
    game.load.bitmapFont('carrier_command', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
    game.load.spritesheet('buttonhorizontal', 'assets/button-horizontal.png',64,32);
    game.load.spritesheet('buttonfire', 'assets/button-round-a.png',64,64);
    game.load.spritesheet('ship', 'assets/asteroid_01_30x30_sheet.png', 30, 30, 6);
    game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
 }

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    gameTimer = game.time.create(false);
    
     //  The platforms group contains the ground
    platforms = game.add.group();
    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;
    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);
    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;
    
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;
    
    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'dude');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2], 10, true);
    player.animations.add('right', [4, 5, 6], 10, true);

    cursors = game.input.keyboard.createCursorKeys();
    
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    for (var i = 0; i < 20; i++)
    {
        var b = bullets.create(0, 0, 'bullet');
        b.name = 'bullet' + i;
        b.exists = false;
        b.visible = false;
        b.checkWorldBounds = true;
        b.events.onOutOfBounds.add(resetBullet, this);
    }
    
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
    scoreText = game.add.bitmapText(10, 10, 'carrier_command','Score: ' + scoreValue,14);
    levelText = game.add.bitmapText(game.world.width - 200, 10, 'carrier_command','Level: ' + difficulty,14);
    levelText.inputEnabled = true;
    levelText.events.onInputUp.add(gofull, this);  
    
    startBtn = game.add.button(game.world.centerX, game.world.centerY, 'startButton', null, this, 0, 0, 0, 0);
    startBtn.events.onInputUp.add(startGame);
    
    
    
    opText = game.add.bitmapText(game.world.centerX-38, game.world.height - 50, 'carrier_command','Ready',34);
    
    buttonfire = game.add.button(game.world.width-100, game.world.height - 64, 'buttonfire', null, this, 0, 1, 0, 1);
    buttonfire.fixedToCamera = true;
    buttonfire.events.onInputOver.add(function(){fire=true;});
    buttonfire.events.onInputOut.add(function(){fire=false;});
    buttonfire.events.onInputDown.add(function(){fire=true;});
    buttonfire.events.onInputUp.add(function(){fire=false;});   
    
    buttonleft = game.add.button(8, game.world.height - 48, 'buttonhorizontal', null, this, 0, 1, 0, 1);
    buttonleft.fixedToCamera = true;
    buttonleft.events.onInputOver.add(function(){left=true;});
    buttonleft.events.onInputOut.add(function(){left=false;});
    buttonleft.events.onInputDown.add(function(){left=true;});
    buttonleft.events.onInputUp.add(function(){left=false;});
    
    buttonright = game.add.button(160, game.world.height - 48, 'buttonhorizontal', null, this, 0, 1, 0, 1);
    buttonright.fixedToCamera = true;
    buttonright.events.onInputOver.add(function(){right=true;});
    buttonright.events.onInputOut.add(function(){right=false;});
    buttonright.events.onInputDown.add(function(){right=true;});
    buttonright.events.onInputUp.add(function(){right=false;});
    
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(setupInvader, this);
    
}

function setupInvader (invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('kaboom');

}

function update() {
    var hitPlatform = game.physics.arcade.collide(player, platforms);
    game.physics.arcade.overlap(bullets, results, collisionHandler, null, this);
    game.physics.arcade.overlap(bullets, enemies, enemyCollisionHandler, null, this);
        
    if(gameState === 2){
        scoreText.text = 'Score: ' + scoreValue;
        levelText.text = 'Level: ' + difficulty;
        
        //set operation in play
        if(!opInPlay){
            opInPlay = true;
            operationText = operation(difficulty);
            
            opresult = eval(operationText);
            resultOptions = fakesResults(opresult, difficulty);
            resultOptions.push(opresult);

            opText.text = operationText;
            setMathOps(resultOptions);
        }
        
        
        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;

        if (cursors.left.isDown || left)
        {
            //  Move to the left
            player.body.velocity.x = -250;
            player.animations.play('left');
        }
        else if (cursors.right.isDown || right)
        {
            //  Move to the right
            player.body.velocity.x = 250;
            player.animations.play('right');
        }
        else
        {
            //  Stand still
            player.animations.stop();
            player.frame = 3;
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || fire)
        {
            //fire
            fireBullet();
        }
        
        if (enemyTotal < 5 && game.time.now > enemyTimer)
        {
            releaseship();
        }
        
    }
    
}

function setMathOps(resultOptions){
    results = game.add.group();
    results.enableBody = true;
    results.physicsBodyType = Phaser.Physics.ARCADE;
    var style = { font: "32px Helvetica", fill: "#ffffff", wordWrap: true, wordWrapWidth: 90, align: "center", backgroundColor: "#000000" };
    
    shuffle(resultOptions);
    var spread = (game.world.width - 32 )/ resultOptions.length;
    
    for (var i = 0; i < resultOptions.length; i++)
    {
        var t = game.add.bitmapText((i*spread)+32, game.world.centerY- 80, 'carrier_command',resultOptions[i],28, results);
        t.name = resultOptions[i];
    }
    
}

function resetMath(){
    console.log("Reset Math");
    opInPlay = false;
}

//  Called if the bullet hits one of the result sprites
function collisionHandler (bullet, resultado) {
    console.log("hit:",resultado.name);
    bullet.kill();
    resultado.kill();
    if(resultado.name === opresult){
        scoreValue += (100 - (mathAttemps * 10));
        difficulty++;
        mathAttemps = 0;
        opText.text = "Correct!";
        results.callAll('kill');
        gameTimer.add(timeToMath, resetMath);
        gameTimer.start();
    }else{
        errors++;
        mathAttemps++;
        if(errors > 10){
            reset();
        }else{
            if(mathAttemps === 3){
                results.callAll('kill');
                opText.text = "Next...";
                gameTimer.add(timeToMath, resetMath);
                gameTimer.start();
            } 
        }
    }
}

function enemyCollisionHandler(bullet, enemy){
    console.log('hit enemy');
    bullet.kill();
    enemy.kill();
    scoreValue+=10;
    enemyTotal--;
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.body.x, enemy.body.y);
    explosion.play('kaboom', 30, false, true);
}

function fireBullet () {

    if (game.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            bullet.reset(player.x + 6, player.y - 8);
            bullet.body.velocity.y = -300;
            bulletTime = game.time.now + 150;
        }
    }

}

//  Called if the bullet goes out of the screen
function resetBullet (bullet) {
    bullet.kill();
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i >= 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

function enemyOut(enemy){
    //  Move the alien to the top of the screen again
    //enemy.reset(-(Math.random() * 800), game.rnd.integerInRange(100,game.world.height - 100));
    //  And give it a new random velocity
    //enemy.body.velocity.x = 50 + Math.random() * 200;
    enemy.kill();
    enemyTotal--;
}

function releaseship() {
    var ship_x = game.rnd.integerInRange(100,game.world.width - 180);
    var ship = enemies.create(ship_x, -(Math.random() * 360), 'ship');
    ship.scale.setTo(1, 1);
    ship.animations.add('walk');
    ship.animations.play('walk', 6, true);
    ship.checkWorldBounds = true;
    ship.events.onOutOfBounds.add(enemyOut, this);
    ship.body.velocity.y = 4 + Math.random() * 10;
    game.add.tween(ship).to({ y: game.width + (42 + ship.y) }, 60000, Phaser.Easing.Linear.None, true);
    enemyTimer = game.time.now + 100;
    enemyTotal++;
}

function reset(){
    opInPlay = false;
    difficulty = 1;
    scoreValue = 0;
    opText.text = "game over";
    gameState = 1;
    startBtn = game.add.button(game.world.centerX, game.world.centerY, 'startButton', null, this, 0, 0, 0, 0);
    startBtn.events.onInputUp.add(startGame);
    enemyTotal = 0;
    enemyTimer = 0;
    errors = 0;
    mathAttemps = 0;
    enemies.callAll('kill');
    results.callAll('kill');
    left=false;
    right=false;
    fire=false;
}