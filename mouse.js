var vec2 = require('vec2');

module.exports = function(el, scene) {

  var ret = vec2(0, 0);
  el.addEventListener('mousemove', function(ev) {

    ret.set(ev.clientX - el.innerWidth/2, el.innerHeight/2 - ev.clientY);
  });

  return ret;
};
