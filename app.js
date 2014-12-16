
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    inout = require('./routes/inout'),
    util = require('util'),
    http = require('http'),
    fs = require('fs'),
    cronJob = require('cron').CronJob,
    path = require('path');

/* objects */
var rooms = [], paths = [], bgImgs = [], currentImg = undefined;

function Room(id) {
  this.id = id;
  this.participants = [];
  this.paths = [];
  this.bgImgs = [];
  this.currentImg = undefined;
}

var app = express();
app.set('port', process.env.PORT || 30011);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  res.redirect('inout/user_select.html');
  console.dir(rooms);
});
app.get('/inout/teacher', function(req, res){
  //res.redirect('inout/room_select.html');
  console.dir(rooms);
  // TODO 連想配列からlength:8のboolean配列に変換して返す。
  var sendArray = [];
  for (var props in rooms) {
    if (rooms.hasOwnProperty(props)) {
      sendArray.push(true);
    }
  }
  res.render('inout/room_select',{
    rooms: sendArray
  });
});
app.get('/inout/teacherSelectRoom', function(req, res){
  var roomIndex = req.param('room');
  console.log('input roomIndex -> ' + roomIndex);
  var count = 0;
  for (var props in rooms) {
    if (rooms.hasOwnProperty(props)) {
      count++;
    }
  }
  console.log('already exist rooms length -> ' + count);
  if (roomIndex > count) {
    res.redirect('inout/pin_output.html');
  } else {
    res.redirect('inout/room_select.html');
  }
});
app.get('/inout/teacherIn', function(req, res){
  var roomId = req.param('roomId');
  var room = new Room(roomId);
  rooms[roomId] = room;
  res.redirect('/participate?role=1&roomId=' + roomId);
});
app.get('/inout/child', function(req, res){
  res.redirect('inout/pin_input.html');
});
app.get('/inout/childIn', function(req, res){
  var roomId = req.param('roomId');
  if (!rooms[roomId]) {
    res.redirect('inout/pin_input.html');
    return false;
  }
  res.redirect('/participate?role=0&roomId=' + roomId);
});
app.get('/clearAll', function(req, res){
  rooms = [];
  res.redirect('inout/user_select.html');
});

function Participant(id, role) {
  this.id = id;
  this.role = role;
}
// 参加処理
app.get('/participate',function(req,res){
  console.log('参加処理')
  var role = req.param('role'),
      roomId = req.param('roomId'),
      room = rooms[roomId],
      userId = Math.round( Math.random() * 1e15 ).toString(36);
      participant = new Participant(userId, role);
      
  for (var key in room.participants) {
    if (room.participants[key].role == 1 && role == 1) {
      console.log("開催者の重複");
      res.redirect('/');
      return false;
    }
  }
  room.participants[userId] = participant;
  console.log("new participant -> role: " + role + "  roomId: " + roomId + "  userId: " + userId);
  res.redirect('index?role=' + role + "&roomId=" + roomId + "&userId=" + userId);
});

// もぞうし画面の初期化
app.get('/index',function(req,res){
  res.render('index', {
      locals: { message: 'Organaizer start:' },
        role: req.param('role'),
	    userId: req.param('userId'),
	    roomId: req.param('roomId'),
        title: 'もぞうし'
  });
});

// 夜間クリア処理
var job = new cronJob({
  cronTime: "0  4  *  *  *",
  onTick: function() {
    console.log("cron call at " + new Date());
    rooms = [];
  },
  start: true,
  timeZone: "Asia/Tokyo"
});

app.get('/users', user.list);

var server = http.createServer(app);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
  
  console.log('new Connection');
  console.dir(rooms);
  var sendArray = [];
  for (var props in rooms) {
    if (rooms.hasOwnProperty(props)) {
      sendArray.push(rooms[props]);
    }
  }
  socket.emit('init', {rooms: sendArray});
  
  socket.on('clear', function(data){
    var room = rooms[data.roomId];
    console.log('clear');
    room.paths = [];
    room.currentImg = undefined;
    socket.broadcast.emit('clear', data);
  });
  
  socket.on('move', function(data){
    var room = rooms[data.roomId];
    console.log('move');
    console.log(data.index);
    console.dir(data.path);
    var path = undefined;
    if (room.paths[data.index]) {
      room.paths.splice(data.index, 1, data.path)
    }
    socket.broadcast.emit('move', data);
  });
  
  socket.on('delete', function(data){
  	var room = rooms[data.roomId];
    console.log('delete');
    console.dir(data);
    if (room.paths[data.index]) {
      room.paths.splice(data.index, 1);
    }
    socket.broadcast.emit('delete', data);
  });

  socket.on('leave', function(data){
    console.log(data);
  	var room = rooms[data.roomId],
        index = undefined,
        leaveUser = undefined;
    
    console.log('leave');
    console.dir(room);
    
    leaveUser = room.participants[data.userId];
    if (!leaveUser) {
      console.log("user not fond  userId -> " + data.userId);
      return false;
    }
    if (leaveUser.role == 1) {
      delete rooms[data.roomId];
      socket.broadcast.emit('close', data);
    } else {
      delete room.participants[data.userId];
    }
  });
  
  socket.on('draw', function(data){
  	var room = rooms[data.roomId];
    room.paths.push(data.path);
    console.log('draw');
    console.dir(data.path);
    socket.broadcast.emit('draw', data);
  });
  
  socket.on('toFront', function(data){
  	var room = rooms[data.roomId];
    console.log('toFront');
    var path = undefined;
    if (room.paths[data.index]) {
      path = room.paths[data.index];
      console.dir(path);
      room.paths.splice(data.index, 1);
      room.paths.push(path);
    }
    socket.broadcast.emit('toFront', data);
  });
  
  socket.on('upload', function(data){
    var room = rooms[data.roomId];
    console.log('upload');
    console.dir(data);
    var fs = require('fs'),
        writeFile = data.file;
        
    var writePath = __dirname + '/public/images/upload/' + data.roomId + '__' + data.name,
        writeStream = fs.createWriteStream(writePath);
      
    writeStream.on('drain', function(){})
      .on('error', function(exception){
        console.dir(exception);
      }).on('close', function(){
        data.url = '/images/upload/' + data.roomId + '__' + data.name;
        socket.emit('upload', data);
        socket.broadcast.emit('upload', data);
        room.currentImg = data.url;
        room.bgImgs.push(data.url);
      }).on('pipe', function(exception){});
    writeStream.write(writeFile,'binary');
    writeStream.end();    
  });
  
});

server.listen(app.get('port'),function(){
  console.log("Express server listning on port " + app.get('port'));
});
