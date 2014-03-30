var Vec2 = require('vec2');

module.exports = function(v, mouse, locked) {
  console.log(v.lockPosition);
  var lockPos = v.lockPosition || new Vec2(-20, 0);

  var pos = v.add(lockPos, true);


  v.fixed = locked !== false;
  var ret = function(mouse, ctx, dt, time) {
    pos.set(v.add(lockPos, true));
    color = v.fixed ? 'red' : 'green';

    color = ret.hovering(mouse) ? "orange" : color;

    ctx.save();
      ctx.translate(pos.x, pos.y);

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
    v.render(mouse, ctx, dt, time);
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
