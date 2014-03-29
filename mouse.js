var vec2 = require('vec2');

module.exports = function(el, scene) {

  var ret = vec2(0, 0);
  el.addEventListener('mousemove', function(ev) {
    ret.set(ev.clientX - el.innerWidth/2, el.innerHeight/2 - ev.clientY);

    if (ret.target) {
      var blocked = false;
      if (typeof ret.target.blocked === 'function') {
        blocked = ret.target.blocked(ret);
      }

      !blocked && ret.target.set(ret.x, ret.y);
    }

  });

  el.addEventListener('mousedown', function(ev) {
    ret.down = true;
    ret.target = null;
  });

  el.addEventListener('mouseup', function(ev) {
    ret.down = false;
    ret.target = null;
  });

  return ret;
};
