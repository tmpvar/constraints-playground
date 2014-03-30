var seg2 = require('segment2');
var vec2 = require('vec2');
var mouse2 = require('./mouse');



var TAU = Math.PI*2;

vec2.prototype._dirty = true;
vec2.prototype.renderRadius = 5;
vec2.prototype.lastRender = -1;
vec2.prototype.render = function(mouse, ctx, dt, time) {

  if (this.lastRender === time) {
    return;
  }

  this.lastRender = time;

  ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.arc(this.x, this.y, this.renderRadius, TAU, false);
    ctx.stroke();

    if (this.hovering(mouse)) {
      if (!this.fixed) {
        ctx.fillStyle = "rgba(255, 255, 255, .5)";
      } else {
        ctx.fillStyle = "rgba(255, 0, 0, .5)";
      }
      ctx.fill();
    }
};

vec2.prototype.hovering = function(mouse) {
  if (this.distance(mouse) <= this.renderRadius * 5) {
    if (mouse.down && !mouse.target) {
      mouse.target = this;
    }
    return true;
  }
};

vec2.prototype.blocked = function(vec) {
  if (this.fixed) {
    return true;
  }

  if (this.constraints) {
    var blocked = false;
    for (var i=0; i<this.constraints.length; i++) {
      if (this.constraints[i].blocked(vec)) {
        return true;
      }
    }
  }
};

seg2.prototype.render = function(mouse, ctx, dt, time) {
  ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);

  ctx.closePath();
  ctx.strokeStyle = "orange";
  ctx.stroke();

  this.start.render(mouse, ctx, dt, time);
  this.end.render(mouse, ctx, dt, time);
};

vec2.prototype.addConstraint = seg2.prototype.addConstraint = function(c) {
  if (!this.constraints) {
    this.constraints = [];
  }

  this.constraints.push(c);
};


seg2.prototype.blocked = function(vec) {
  if (this.fixed) {
    return true;
  }

  if (this.constraints) {
    for (var i=0; i<this.constraints.length; i++) {
      if (this.constraints[i].blocked(vec, this)) {
        return true;
      }
    }
  }
};

seg2.prototype.constrainComponents = function() {
  var that = this;

  this.start.addConstraint({
    blocked : function(m) {
      return that.blocked(m);
    }
  });

  this.end.addConstraint({
    blocked : function(m) {
      return that.blocked(m);
    }
  });

  return this;
};


var lock = require('./lock');
var angular = require('./angular');

var mouse = mouse2(window, scene);
var origin = vec2(0, 0);

var a = vec2(0, 100);
var b = vec2(100, 0);
var oa = seg2(origin, a).constrainComponents();
var ob = seg2(origin, b).constrainComponents();



var scene = [
  oa,
  ob,
  lock(origin, mouse, true),
  lock(a, mouse, false),
  lock(b, mouse, false),
  lock(angular(oa, ob, TAU/4), mouse, true)
];




var floor = Math.floor;
var ctx = require('fc')(function(dt) {
  ctx.fillStyle = "#111115"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.save();

    // 0,0 is at the center of the screen
    ctx.translate(floor(ctx.canvas.width/2), floor(ctx.canvas.height/2));

    // flip Y to be closer to a normal coordinate system
    ctx.scale(1, -1);
    var now = Date.now();
    for (var i=0; i<scene.length; i++) {
      if (scene[i].render) {

        scene[i].render(mouse, ctx, dt, now);
      } else {
        scene[i](mouse, ctx, dt, now);
      }
    }

  ctx.restore();

}, false);

// whenever an item in the scene changes, schedule a re-draw
scene.forEach(function(r) {
  r.change && r.change(function() {
    r._dirty = true;
    ctx.dirty();
  });
});

mouse.change(ctx.dirty);



window.origin = origin;
