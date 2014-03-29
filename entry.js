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
  // TODO: give a reason

  return this.fixed;
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
}

// TODO: dynamic lock/unlock
var lock = function(obj, key, mouse, locked) {
  var v = (key) ? obj[key] : obj;
  var pos = v.subtract(20, 0, true);
  v.fixed = locked !== false;
  var ret = function(mouse, ctx, dt, time) {

    pos.set(v.x - 20, v.y);
    color = v.fixed ? 'red' : 'green';

    color = ret.hovering(mouse) ? "orange" : color;

    ctx.save();
      ctx.translate(v.x-20, v.y);

      ctx.fillStyle = color;
      ctx.fillRect(-5, -5, 10, 10);

      if (!v.fixed) {
        ctx.translate(-5, 3);
        ctx.scale(-1, 1);
      }

      ctx.beginPath()
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3, 10);
        ctx.lineTo(3, 10);
        ctx.lineTo(3, 5);
        ctx.lineWidth = 2
        ctx.strokeStyle = color;
        ctx.stroke();

    ctx.restore();
    obj.render(mouse, ctx, dt, time);
  }

  mouse.change(function() {

    if (mouse.down && ret.hovering(mouse) && !mouse.target) {
      v.fixed = !v.fixed;
    }
  })

  ret.hovering = function(m) {

    return  m.x > pos.x - 5  &&
            m.x < pos.x + 5  &&
            m.y > pos.y - 10 &&
            m.y < pos.y + 10;
  }

  return ret;
};

var mouse = mouse2(window, scene);
var origin = vec2(0, 0);

var scene = [
  lock(seg2(origin, vec2(0, 100)), 'end', mouse, false),
  lock(seg2(origin, vec2(100, 0)), 'end', mouse, false),
  lock(origin, null, mouse, true)
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
