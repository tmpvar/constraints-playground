var seg2 = require('segment2');
var vec2 = require('vec2');
var mouse2 = require('./mouse');
var TAU = Math.PI*2;

vec2.prototype.renderRadius = 5;
vec2.prototype.render = function(ctx, dt) {
  ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.arc(this.x, this.y, this.renderRadius, TAU, false);
    ctx.stroke();
};
vec2.prototype.hovering = function(mouse) {

};

seg2.prototype.render = function(ctx, dt) {
  ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);

  ctx.closePath();
  ctx.strokeStyle = "orange";
  ctx.stroke();

  this.start.render(ctx, dt);
  this.end.render(ctx, dt);
}

var lock = function(obj, key) {
  var v = (key) ? obj[key] : obj;
  return function(ctx, dt) {
    ctx.save();
      ctx.translate(v.x-20, v.y);

      ctx.fillStyle = "red";
      ctx.fillRect(-5, -5, 10, 10);

      ctx.beginPath()
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3, 10);
        ctx.lineTo(3, 10);
        ctx.lineTo(3, 0);
        ctx.lineWidth = 2
        ctx.strokeStyle = "red";
        ctx.stroke();
    ctx.restore();
    obj.render(ctx, dt);
  }
};

var origin = vec2(0, 0);
var scene = [
  lock(seg2(origin, vec2(0, 100)), 'end'),
  seg2(origin, vec2(100, 0)),
  lock(origin)
];

var mouse = mouse2(window, scene);


var floor = Math.floor;
var ctx = require('fc')(function(dt) {
  ctx.fillStyle = "#111115"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.save();

    // 0,0 is at the center of the screen
    ctx.translate(floor(ctx.canvas.width/2), floor(ctx.canvas.height/2));

    // flip Y to be closer to a normal coordinate system
    ctx.scale(1, -1);

    for (var i=0; i<scene.length; i++) {
      if (scene[i].render) {
        scene[i].render(ctx, dt);
      } else {
        scene[i](ctx, dt);
      }
    }

  mouse.render(ctx, dt);

  ctx.restore();

}, false);

// whenever an item in the scene changes, schedule a re-draw
scene.forEach(function(r) {
  r.change && r.change(ctx.dirty);
});

mouse.change(ctx.dirty);



window.origin = origin;
