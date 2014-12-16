$(function(){
  var Paint = function(id) {
    this.id = id;
    this.init();
  };

  Paint.prototype.init = function() {
    this.canvas = new fabric.Canvas('canvas-node', { isDrawingMode: true });
    this.color = this.getRandomColor();
    this.canvas.freeDrawingBrush.color = this.color;
    this.roomId = $.url().param('roomId');
    this.userId = $.url().param('userId');
    this.role = $.url().param('role');
    this.lineWidth = 10;
    this.setEvents();
    this.setModeChangeEvent();
    this.hasDeleteIcon = false;
  };

  Paint.prototype.getRandomColor = function() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };

  Paint.prototype.setEvents = function() {
    
    var self = this;
    var drawingOption = new DrawingOption(this.canvas);
    
	$('.input-load-bg').change(function(event){
	  var file = event.target.files[0];
	  self.upload(file);
	});
	
    $('a.btn-clear').click(function(){
      self.clear();
    });
    
    $('a.btn-back').click(function(){
      $("#back-dialog").dialog({
        buttons:[
          {
          	text: "OK",
          	click: function(){
              self.socket.emit('leave', {userId: self.userId, roomId: self.roomId, role: self.role});
              location.href = location.origin;
          	  //$( this ).dialog( "close" );
          	}
          },
          {
          	text: "NG",
          	click: function(){
          	  $( this ).dialog( "close" );
          	}
          }
        ]
      });
    });
    
    $('a.btn-pen').click(function(){
      if ($('#drawing-mode-options').css('display') == 'none') {
        $('#drawing-mode-options').css('display', 'block');
      } else {
        $('#drawing-mode-options').css('display', 'none');
      }
    });
    
    
    function isRoleAdmin() {
	  return (self.role && self.role == 1);
    }
	
    // 描画後のイベント処理をオーバーライド
    var org_finalizeAndAddPath = fabric.PencilBrush.prototype._finalizeAndAddPath;
        
    fabric.PencilBrush.prototype._finalizeAndAddPath = (function() {
      return function() {
        var pathData = this._getSVGPathData().join('');
        var originLeft = this.box.minx + (this.box.maxx - this.box.minx) / 2;
        var originTop = this.box.miny + (this.box.maxy - this.box.miny) / 2;
        var path = this.createPath(pathData);
        path.set({
          left: originLeft,
          top: originTop,
          originX: 'center',
          originY: 'center',
          cornerSize: 24
        });
        self.socket.emit('draw', {roomId: self.roomId, userId: self.userId, path: path});
        org_finalizeAndAddPath.call(this);
        
        $(self.canvas.getObjects()).each(function(i,v){
          v.set({cornerSize: 24});
        });
      };
    })();
    
    // 選択クリック時のイベント処理をオーバーライド
    var org_beforeTransform = fabric.Canvas.prototype._beforeTransform;
    fabric.Canvas.prototype._beforeTransform = (function(e, target) {
      return function(e, target) {
        if (target.id && target.id == 'deleteIcon') {
          var index = self.canvas.getObjects().indexOf(self.canvas.getActiveObject());
          self.socket.emit('delete', {roomId: self.roomId, userId: self.userId, index: index, obj: self.canvas.getActiveObject()});
          self.canvas.remove(target);
          self.canvas.remove(self.canvas.getActiveObject());
          self.hasDeleteIcon = false;
          return false;
        }
        var index = target.canvas.getObjects().indexOf(target);
        if (self.hasDeleteIcon) {
          target.moveTo(this.getObjects().length - 2);
        } else {
          target.moveTo(this.getObjects().length - 1);
        }
        org_beforeTransform.call(this, e, target);
        if (!self.hasDeleteIcon) {
          fabric.Image.fromURL(location.origin + '/images/btn_delete.png', function(deleteIcon){
            setDeleteIcon(target, deleteIcon);
            target.canvas.add(deleteIcon);
            self.hasDeleteIcon = true;
          });
        }
        self.socket.emit('toFront', {roomId: self.roomId, userId: self.userId, index: index});
      };
    })();
    
    // 選択確定時のイベント処理をオーバーライド
    var org_finalizeCurrentTransform = fabric.Canvas.prototype._finalizeCurrentTransform;
    fabric.Canvas.prototype._finalizeCurrentTransform = (function() {
      return function() {
        var transform = this._currentTransform, target = transform.target;
        var index = target.canvas.getObjects().indexOf(target);
        org_finalizeCurrentTransform.call(this);
        if (target.id == "deleteIcon") return false;
        var deleteIcon = null;
        for (var i in target.canvas.getObjects()) {
          var object = target.canvas.getObjects()[i];
          if (object.id && object.id == "deleteIcon") {
            deleteIcon = object;
            target.canvas.remove(deleteIcon);
            fabric.Image.fromURL(location.origin + '/images/btn_delete.png', function(deleteIcon){
              setDeleteIcon(target, deleteIcon);
              target.canvas.add(deleteIcon);
              self.hasDeleteIcon = true;
            });
          }
        }
        self.socket.emit('move', {roomId: self.roomId, userId: self.userId, index: index, path: target});
      };
    })();
    
    // 選択解除時のイベント処理をオーバーライド
    var org_clearSelection = fabric.Canvas.prototype._clearSelection;
    fabric.Canvas.prototype._clearSelection = (function(e, target, pointer) {
      return function(e, target, pointer) {
        for (var i in self.canvas.getObjects()) {
          var object = self.canvas.getObjects()[i];
          if (object.id && object.id == "deleteIcon") {
            self.canvas.remove(object);
            self.hasDeleteIcon = false;
          }
        }
        org_clearSelection.call(this, e, target, pointer);
      }
    })();
    
    var setDeleteIcon = function(target, deleteIcon) {
      var tr = target.oCoords.tr, // 選択枠右上
          bl = target.oCoords.bl, // 選択枠左下
          tr2bl = Math.sqrt(Math.pow(tr.x - bl.x, 2) + Math.pow(tr.y - bl.y, 2)), // 上記2点間の距離
          distance = 30; // 選択枠右上からの削除アイコンの距離
      deleteIcon.left = (-distance * bl.x + (tr2bl + distance) * tr.x) / tr2bl;
      deleteIcon.top  = (-distance * bl.y + (tr2bl + distance) * tr.y) / tr2bl;
      deleteIcon.id = "deleteIcon";
    }
    
    // iPadの描画DEBUG用
    var org_onMouseMove = fabric.PencilBrush.prototype.onMouseMove;
    fabric.PencilBrush.prototype.onMouseMove = (function(pointer) {
      return function(pointer) {
        // fabricjs line 1616 see #getPointer
        //console.dir(pointer)
        org_onMouseMove.call(this, pointer);
      };
    })();
  };
  
  Paint.prototype.setModeChangeEvent = function() {
    var self = this;
    $('a.btn-edit').bind('click', function(e){
      var imgSrc = $(e.target).attr('src');
      if (imgSrc == 'images/btn_edit.png') {
        self.canvas.isDrawingMode = false;
        $(e.target).attr('src', 'images/btn_edit_on.png');
      } else if (imgSrc == 'images/btn_edit_on.png') {
        self.canvas.isDrawingMode = true;
        $(e.target).attr('src', 'images/btn_edit.png');
        for (var i in self.canvas.getObjects()) {
          var object = self.canvas.getObjects()[i];
          if (object.id && object.id == "deleteIcon") {
            self.canvas.remove(object);
            self.canvas.deactivateAll();
            self.hasDeleteIcon = false;
          }
        }
        self.canvas.renderAll();
      }
    });
    $('input[name=delete]').bind('click', function(e){
      var index = self.canvas.getObjects().indexOf(self.canvas.getActiveObject());
      self.socket.emit('delete', {roomId: self.roomId, userId: self.userId, index: index, obj: self.canvas.getActiveObject()});
      self.canvas.remove(self.canvas.getActiveObject());
    });
  };
  
  Paint.prototype.drawLine = function(data) {
    var self = this,
        path = data.path
    fabric.Path.fromObject(path, function(newPath){
      self.canvas.add(newPath);
      newPath.setCoords();
      self.canvas.clearContext(self.canvas.contextTop);
      self.canvas.renderAll();
      self.canvas.fire('path:created', { path: newPath });    
    });
  };
　　
  Paint.prototype.clear = function(socket) {
    if (this.socket) {
      this.socket.emit('clear', {roomId: this.roomId, userId: this.userId});
    }
    this.canvas.clear().renderAll();
    //this.init();
    location.reload();
  };
  Paint.prototype.upload = function(file) {
    var fileReader = new FileReader(),
        sendFile = file,
        type = sendFile.type,
        data = {},
        self = this;
    console.dir(sendFile);
    
    fileReader.readAsBinaryString(sendFile);
    fileReader.onload = function(event) {
      self.socket.emit('upload', {roomId: self.roomId, userId: self.userId, file: event.target.result, name: sendFile.name});
    }
  };

  Paint.prototype.setConnection = function(socket) {
    this.socket = socket;
    this.socket.onclose = function() {console.log('Close');};
    this.socket.onopen = function() {console.log('Connected');};
    var self = this;

    this.socket.on('clear', function(data){
      if (data.roomId != self.roomId) return false;
      self.canvas.clear().renderAll();
      //self.init();
      location.reload();
    });
    this.socket.on('close', function(data){
      alert('ROOMが終了しました。');
      location.href = location.origin;
    });
    this.socket.on('move', function(data){
      if (data.roomId != self.roomId) return false;
      fabric.Path.fromObject(data.path, function(newPath){
        var target = getTargetObject(self, data);
        target.angle = newPath.angle;
        target.scaleX = newPath.scaleX;
        target.scaleY = newPath.scaleY;
        target.left = newPath.left;
        target.top = newPath.top;
        self.canvas.clearContext(self.canvas.contextTop);
        self.canvas.renderAll();
      });
    });
    this.socket.on('delete', function(data){
      if (data.roomId != self.roomId) return false;
      var target = getTargetObject(self, data);
      self.canvas.remove(target);
    });
    function getTargetObject(self, data) {
      return (!self.canvas.getObjects()[data.index]) ? self.canvas.getObjects()[data.index-1] : self.canvas.getObjects()[data.index]
    }
    this.socket.on('draw', function(data){
      if (data.roomId != self.roomId) return false;
      self.drawLine(data);
    });
    this.socket.on('init', function(data){
      var rooms = data.rooms;
      for (var i in rooms) {
      	if (rooms[i].id == self.roomId) {
      	  console.dir(rooms[i]);
          self.canvas.setBackgroundImage(location.origin + rooms[i].currentImg, function(){
            self.canvas.renderAll();
          });
      	  for (var j in rooms[i].paths) {
      	    self.drawLine({path: rooms[i].paths[j]});
      	  }
      	}
      }
    });
    this.socket.on('upload', function(data){
      if (data.roomId != self.roomId) return false;
      self.canvas.setBackgroundImage(location.origin + data.url, function(){
	    self.canvas.renderAll();
      });
      $('input[type=file]').val('');
    });
    this.socket.on('toFront', function(data){
      if (data.roomId != self.roomId) return false;
      var target = self.canvas.getObjects()[data.index];
      target.moveTo(self.canvas.getObjects().length - 1);
    });

  };

  window.Paint = Paint;

});
