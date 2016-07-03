function version(v=1) {
  var x = 1;
  var y = x;
  var z = x + y;
}

function version(v=2) {
  var x = 2;
}

function version(v=3) {
  var a = function version(v=3){ x } + function version(v=2){ x } + function version(v=1){ x };
}
