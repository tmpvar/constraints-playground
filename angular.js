var Vec2 = require('vec2');
var lock = require('./lock');
var Segment2 = require('segment2');
var Line2 = require('line2');

var TAU = Math.PI*2;
var toTAU = function(a) {
  while(a<0) {
    a+=Math.PI*2;
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
  return this.pivot;
};

Angle.prototype.lastRender = 0;

Angle.prototype.lockPosition = Vec2(50, 5);

Angle.prototype.render = function(mouse, ctx, dt, time) {
  // compute both angles, find smallest

  var pivot = this.computePivot();
  var points = this.points().filter(function(v) {
    return !v.equal(pivot);
  });

  var angles = points.map(function(p) {
    return toTAU(Vec2(1, 0).angleTo(p.subtract(pivot, true)));
  }).sort(function(a, b) {
    return (a < b) ? -1 : 1;
  });


  var da = angles[0] - angles[1];
  var anti = false;
  if (Math.abs(da) > Math.PI) {
    da = -da;
    anti = true;
  }

  ctx.save()
    ctx.beginPath();
      ctx.translate(this.x, this.y);
      //ctx.rotate(rotation);
      ctx.arc(0, 0, 100, angles[0], angles[1], anti);
      ctx.strokeStyle = "green";
      ctx.stroke();
  ctx.restore();

  ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, -1);
    ctx.fillStyle = "white";


    var textPos = Vec2(100, 0).rotate(angles[0] - (da/2));
    ctx.fillText(Number(toTAU(this.rads) * 360/TAU).toFixed(2), textPos.x, -textPos.y);
  ctx.restore();
};

Angle.prototype.apply = function(rads) {
  var pivot = this.computePivot();
  var points = this.points().filter(function(v) {
    return !v.equal(pivot) && !v.fixed;
  });

  var dr = this.rads - rads;
  if (!dr) {
    return;
  }

console.log(this.angle, this.rads, rads, dr);
  switch (points.length) {
    case 1:
      points[0].set(
        pivot.add(
          points[0].subtract(pivot, true).rotate(dr), true
        )
      );
    break;

    case 2:

      dr/=2;

      points[0].set(
        pivot.add(
          points[0].subtract(pivot, true).rotate(-dr), true
        )
      );

      points[1].set(
        pivot.add(
          points[1].subtract(pivot, true).rotate(dr), true
        )
      );
    break;
  }

  this.rads = rads;
};

Angle.prototype.points = function() {
  var seen = {};
  return [
    this.a.end,
    this.a.start,
    this.b.start,
    this.b.end
  ].filter(function(a) {
    if (!seen[a.toString()]) {
      seen[a.toString()] = true;
      return true;
    }
    return false;
  });
};

Angle.prototype.blocked = function(vec, source) {

  var target = (source === this.a) ? this.b : this.a;

  var dt = target.end.subtract(target.start, true);
  var ds = source.end.subtract(source.start, true);
  var da = toTAU(dt.angleTo(ds)) - this.rads;

  var points = this.points();

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
