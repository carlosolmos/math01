//global setup.
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var gameState = 0;

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

var buttonfire, buttonleft, buttonright;
var left=false;
var right=false;
var fire=false;

var difficulty = 1;
var mathOps = ["+","-"]; //1 additions, 2 substractions, 3 multiplications, 3 mix
const operandLimits = [1,10,20,30,40,50,60,70,100,1000];
var operationText = ""; 
var opresult = 0;
var resultOptions = [];
var opInPlay = false;

var scoreValue = 0;

function operation(level, types){
    const operatorInx = game.rnd.integerInRange(0, types.length);
	const operator = mathOps[operatorInx];
	var operand1 = game.rnd.integerInRange(1, operandLimits[level]);
	var operand2 = game.rnd.integerInRange(1, operandLimits[level]);
    if(operator === "-"){
        var tries = 0;
        while(operand1 < operand2){
            tries++;
            operand2 = game.rnd.integerInRange(1, operandLimits[level]);
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
		var rval = game.rnd.integerInRange(1, operandLimits[level]);
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

function reset(){
    difficulty = 1;
    scoreValue = 0;
    opText = "Ready";
    gameState = 1;
    startBtn = game.add.button(game.world.centerX, game.world.centerY, 'startButton', null, this, 0, 0, 0, 0);
    startBtn.events.onInputUp.add(startGame);
    startBtn.events.onInputDown.add(startGame);
}

function preload() {
    game.load.image('ground', 'assets/platform.png');
    game.load.image('resbg', 'assets/resbg.png');
    game.load.spritesheet('dude', 'assets/mag.png', 32, 48);
    game.load.image('bullet', 'assets/bullet0.png');
    game.load.image('startButton', 'assets/start.png');
    game.load.bitmapFont('carrier_command', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
    game.load.spritesheet('buttonhorizontal', 'assets/button-horizontal.png',64,32);
    game.load.spritesheet('buttonfire', 'assets/button-round-a.png',64,64);
    
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
 }

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
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
    levelText = game.add.bitmapText(game.world.width - 164, 10, 'carrier_command','Level: ' + difficulty,14);
    
    startBtn = game.add.button(game.world.centerX, game.world.centerY, 'startButton', null, this, 0, 0, 0, 0);
    startBtn.events.onInputUp.add(startGame);
    startBtn.events.onInputDown.add(startGame);
    
    
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
}


function update() {
    var hitPlatform = game.physics.arcade.collide(player, platforms);
    game.physics.arcade.overlap(bullets, results, collisionHandler, null, this);
        
    if(gameState === 2){
        scoreText.text = 'Score: ' + scoreValue;
        levelText.text = 'Level: ' + difficulty;
        
        //set operation in play
        if(!opInPlay){
            opInPlay = true;
            operationText = operation(difficulty, mathOps);
            opresult = eval(operationText);
            resultOptions = fakesResults(opresult, difficulty);
            resultOptions.push(opresult);
            //console.log(operationText);
            //console.log(opresult);
            //console.log(resultOptions);
            opText.text = operationText;
            setMathOps(resultOptions);
        }
        
        
        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;

        if (cursors.left.isDown || left)
        {
            //  Move to the left
            player.body.velocity.x = -150;
            player.animations.play('left');
        }
        else if (cursors.right.isDown || right)
        {
            //  Move to the right
            player.body.velocity.x = 150;
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
        var t = game.add.bitmapText((i*spread)+8, 120, 'carrier_command',resultOptions[i],14, results);
        
        t.name = resultOptions[i];
    }
}

//  Called if the bullet hits one of the result sprites
function collisionHandler (bullet, resultado) {
    console.log("hit:",resultado.name);
    bullet.kill();
    resultado.kill();
    if(resultado.name == opresult){
        scoreValue += 100;
        console.log("YEAH!");
    }

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
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

