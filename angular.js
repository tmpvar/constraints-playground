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

  this.change(function() {
    this.computePivot();
  }.bind(this));


  a.addConstraint(this);
  b.addConstraint(this);
}


Angle.prototype = Object.create(Vec2.prototype);

Angle.prototype.computePivot = function() {
  this.pivot = Line2.fromPoints(
    this.a.start.x,
    this.a.start.y,
    this.a.end.x,
    this.a.end.y
  ).intersect(
    Line2.fromPoints(
      this.b.start.x,
      this.b.start.y,
      this.b.end.x,
      this.b.end.y
    )
  );
}

Angle.prototype.lastRender = 0;

Angle.prototype.lockPosition = Vec2(50, 5);

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
  //this.set(diff.normalize().multiply(this.radius));

  ctx.save()
    ctx.beginPath();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.arc(0, 0, this.radius, TAU-this.angle, false);
      ctx.strokeStyle = "green";
      ctx.stroke();
  ctx.restore();

  ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, -1);
    ctx.fillStyle = "white";
    var textPos = Vec2(this.radius, 0).rotate(this.angle/2);
    //this.set(textPos.x, textPos.y, false);
    ctx.fillText(Number(this.angle * 360/TAU).toFixed(2), textPos.x, -textPos.y);
  ctx.restore();

  //this._render(mouse, ctx, dt, time);
};

Angle.prototype.blocked = function(vec, source) {

  var target = (source === this.a) ? this.b : this.a;

  var dt = target.end.subtract(target.start, true);
  var ds = source.end.subtract(source.start, true);
  var da = toTAU(dt.angleTo(ds)) - this.rads;

  var seen = {};
  var points = [source.end, source.start, target.start, target.end].filter(function(a) {
    if (!seen[a.toString()]) {
      seen[a.toString()] = true;
      return true;
    }
    return false;
  });

  // assume Segment2 for now
  if (target.start.fixed && target.end.fixed) {
    if (this.fixed) {
      // Only block this request if it goes out of range of the angle
      var line = Line2.fromPoints(source.start.x, source.start.y, source.end.x, source.end.y);

      var p = line.closestPointTo(vec);
      vec.set(p.x, p.y)
    } else {
      this.rads = da;
    }
  } else if (!source.end.fixed && !source.start.fixed) {
    var pivots = points.filter(function(a) {
        return a.fixed;
    });

    if (this.fixed) {
      var pivot = null;

      var toRotate = points.filter(function(a) {
        // TODO: vec.target is mouse.target and we're seriously crossing
        //       some boundaries to get here.
        return !a.fixed && a !== vec.target;
      })

      if (pivots.length === 1) {
        var pivot = pivots[0];

        var now = pivot.subtract(vec.target, true);
        var next = pivot.subtract(vec, true);

        var angle = now.angleTo(next);

        toRotate.forEach(function(v) {
          var n = v.subtract(pivot, true).rotate(angle);
          v.set(pivot.add(n, true));
        });
      } else if (!pivots.length) {
        var move = vec.subtract(vec.target, true);
        points.map(function(p) {
          p.add(move);
        });

        this.add(move);
        return true;
      }
    }

  } else if (!target.end.fixed && !target.start.fixed) {
    var pivot = null, end = null;
    if (target.start.equal(source.end) || target.end.equal(source.end)) {
      pivot = source.end;
      end = source.start;
    } else if (target.start.equal(source.start) || target.end.equal(source.start)) {
      pivot = source.start;
      end = source.end;
    }

    // Apply the rotation down the line

    var d = pivot.subtract(end, true);

    console.log(pivot);

  } else if (!target.end.fixed) {

    if (this.fixed && (target.end.equal(source.start) || target.end.equal(source.end))) {
      return true;
    }

    // Note: this will attempt to maintain the angle

    // TODO: ensure that the point can move

    //  apply the angle change
    var o = (vec.target === source.start) ? source.end : source.start;
    var a = o.subtract(vec.target, true).angleTo(o.subtract(vec, true));
    var d = target.end.subtract(target.start);

    d.rotate(a);
    target.end.set(target.start.add(d, true));
  } else if (!target.start.fixed) {

    if (this.fixed && (target.start.equal(source.start) || target.start.equal(source.end))) {
      return true;
    }

    console.error('target.start not implemented');
  }
};


module.exports = function(seg1, seg2, rads, locked, mouse) {
  return new Angle(seg1, seg2, rads)
};
