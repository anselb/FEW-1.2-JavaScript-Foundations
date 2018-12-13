const Phaser = require('phaser')

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

var player;
var score = 0;
var scoreText;

function preload () {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet('dude',
    'assets/dude.png',
    { frameWidth: 32, frameHeight: 48 }
  );
}

function create () {
  // images are loaded at their center
  // order of loading images affects which images cover each other
  this.add.image(400, 300, 'sky');
  // refers to physics defined in the config object
  platforms = this.physics.add.staticGroup();
  // ground platform, doubled in size with corresponding refreshed physics
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  // elevated platforms
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(100, 450, 'dude');

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // Can set higher gravity but isn't necessary
  // player.body.setGravityY(300)

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    // -1 will repeat forever
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  stars = this.physics.add.group({
    key: 'star',
    // Number of stars
    repeat: 11,
    // Each star is spaced out 70 units from the last star on the x axis
    setXY: { x: 12, y: 0, stepX: 70 }
  });

  // Sets random bounce for each star
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();

  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

  // Adds collision between different physics types (dynamic and static)
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);

  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // If player and star overlap, call collectStar and pass player and star
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // Keyboard manager
  cursors = this.input.keyboard.createCursorKeys();
}

function update () {
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);

  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('right', true);

  } else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  // Prevents player from jumping mid air
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

// Disables star's physics and makes star invisible and inactive
function collectStar (player, star) {
  star.disableBody(true, true);

  score += 10;
  scoreText.setText('Score: ' + score);

  // Re-enables stars to be collected after all of them are collected
  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    // Pick x coordinate to spawn, will be on oppside side of player
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    // Random velocity
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    // Ignore gravity
    bomb.allowGravity = false;
  }
}

function hitBomb (player, bomb) {
  // Stop game
  this.physics.pause();

  // Suppose to tint player red
  player.setTint(0xff0000);

  player.anims.play('turn');
  gameOver = true;
}
