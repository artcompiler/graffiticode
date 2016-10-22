process.argv.forEach(function (val, index, array) {
  if (index < 2) return
  console.log(val + " : " + num2dot(val));
});

function num2dot(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;}
  return d;
}
