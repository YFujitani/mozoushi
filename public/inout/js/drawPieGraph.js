//::::::::::::::::::::::::::::::
// 円グラフ作成
//::::::::::::::::::::::::::::::
var PieGraph = function() {
  this.initialize.apply(this,arguments);
};
 
PieGraph.prototype.initialize = function(id, options) {
  this.canvas = document.getElementById(id);
  //this.pList = [];
  this.sum     = 0;
  this.margin  = 5;
  this.options = {"strokeStyle": "#fff7cd", "fillStyle": "#ffe9ae"};
  for (var i in options) {
	this.options[i] = options[i];
  }
};
 
/*PieGraph.prototype.add = function(key, value) {
  this.sum += value;
  var p = {"key":key,"value": value};
  this.pList.push(p);
};*/
 
PieGraph.prototype.stroke = function(temp_sa, temp_ea) {
  this.size   = {w: this.canvas.offsetWidth, h: this.canvas.offsetHeight};
  this.center = {x: this.size.w/2, y: this.size.h/2};
  this.radius = Math.min(this.size.w/2, this.size.h/2) - this.margin;
  var context = this.canvas.getContext("2d");
  context.clearRect(0,0,this.size.w,this.size.h);
  this._oneStroke("fill", temp_sa, temp_ea);
  this._oneStroke("stroke", temp_sa, temp_ea);
};

/*PieGraph.prototype._defaultStroke = function(type) {
  var c = this.center;
  var context = this.canvas.getContext("2d");
  context[type + "Style"] = this.options[type + "Style"] || "#888888";
  context.moveTo(c.x, c.y);
  context.lineWidth = 3;
  
   var sa = -90 / 360 * 2 * Math.PI;
   var ea = 270 / 360 * 2 * Math.PI;
   context.arc(c.x, c.y, this.radius, sa, ea, 0);
   context.lineTo(c.x, c.y);
   context[type]();
   context.closePath();
}*/
 
PieGraph.prototype._oneStroke = function(type, temp_sa, temp_ea) {
  var c = this.center;
  var context = this.canvas.getContext("2d");
  context.beginPath();
  context[type + "Style"] = this.options[type + "Style"] || "#888888";
  context.moveTo(c.x, c.y);
  context.lineWidth = 2;
  var sa = (temp_sa -90) / 360 * 2 * Math.PI;
  var ea = (3.6 * temp_ea - 90) / 360 * 2 * Math.PI;
  context.arc(c.x, c.y, this.radius, sa, ea, 0);
  context.lineTo(c.x, c.y);
  context[type]();
  context.closePath();
};


