var Vec2 = require('vec2');
var lock = require('./lock');
var Segment2 = require('segment2');
var Line2 = require('line2');

var TAU = Math.PI*2;
var toTAU = function(a) {
  while(a<0) {
    a+=Math.PI;
  }
  return a;
};

function Angle(a, b, rads) {

  Vec2.call(this);

  this.a = a;
  this.b = b;
  this.rads = rads;

  a.addConstraint(this);
  b.addConstraint(this);

}

Angle.prototype = Object.create(Vec2.prototype);

Angle.prototype.lastRender = 0;

Angle.prototype.render = function(mouse, ctx, dt, time) {
  var ds = this.a.start.subtract(this.b.start, true);
  var de = this.a.end.subtract(this.b.end, true);

  if (ds.length() > de.length()) {
    this.closest = de;
    this.furthest = ds;
  } else {
    this.closest = ds;
    this.furthest = de;
  }

  var ad = this.a.start.subtract(this.a.end, true);
  var bd = this.b.start.subtract(this.b.end, true);

  var diff = de.subtract(ds, true);

  this.radius = Math.min(bd.length()/2, Math.min(diff.length()/4, ad.length()/2));

  var ada = toTAU(Vec2(10, 0).angleTo(ad));
  var bda = toTAU(Vec2(10, 0).angleTo(bd));

  this.rotation = ada;
  this.angle = toTAU(bd.angleTo(ad));
  this.set(diff.normalize().multiply(this.radius));
  this._render = Vec2.prototype.render;


  ctx.save()
    ctx.beginPath();
      ctx.translate(this.closest.x, this.closest.y);
      ctx.rotate(this.rotation);
      ctx.arc(0, 0, this.radius, TAU-this.angle, false);
      ctx.strokeStyle = "green";
      ctx.stroke();
  ctx.restore();

  ctx.save();
    ctx.scale(1, -1);
    ctx.fillStyle = "white";
    var textPos = Vec2(this.radius, 0).rotate(this.angle/2);
    ctx.fillText(Number(this.angle * 360/TAU).toFixed(2), textPos.x, -textPos.y);
  ctx.restore();



  this._render(mouse, ctx, dt, time);
};

Angle.prototype.blocked = function(vec, source) {
  var target = (source === this.a) ? this.b : this.a;

  // assume Segment2 for now
  if (target.start.fixed && target.end.fixed) {

    // Only block this request if it goes out of range of the angle
    var line = Line2.fromPoints(source.start.x, source.start.y, source.end.x, source.end.y);

    var p = line.closestPointTo(vec);
    vec.set(p.x, p.y, false)

  } else if (!target.end.fixed) {
    // TODO: ensure that the point can move

    //  apply the angle change
    var dt = target.end.subtract(target.start, true);
    var ds = source.end.subtract(source.start, true);
    var da = toTAU(dt.angleTo(ds)) - this.rads;

    dt.rotate(da);
    target.end.set(dt.x, dt.y, false);
  } else {
    console.error('target.start not implemented');
  }
};


module.exports = function(seg1, seg2, rads, locked, mouse) {
  return new Angle(seg1, seg2, rads)
};
