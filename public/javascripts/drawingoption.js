var DrawingOption = function(canvas) {
  this.canvas = canvas;
  this.drawingColorEl = $('#drawing-color');
  this.drawingLineWidthEl = $('#drawing-line-width');
  this.drawingShadowWidth = $('#drawing-shadow-width');
  this.init();
}

DrawingOption.prototype.init = function() {

  var canvas = this.canvas, self = this;
  
  if (fabric.PatternBrush) {
    var vLinePatternBrush = new fabric.PatternBrush(canvas);
    vLinePatternBrush.getPatternSrc = function() {

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.stroke();

      return patternCanvas;
    };

    var hLinePatternBrush = new fabric.PatternBrush(canvas);
    hLinePatternBrush.getPatternSrc = function() {

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(5, 10);
      ctx.closePath();
      ctx.stroke();

      return patternCanvas;
    };

    var squarePatternBrush = new fabric.PatternBrush(canvas);
    squarePatternBrush.getPatternSrc = function() {

      var squareWidth = 10, squareDistance = 2;

      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
      var ctx = patternCanvas.getContext('2d');

      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, squareWidth, squareWidth);

      return patternCanvas;
    };

    var diamondPatternBrush = new fabric.PatternBrush(canvas);
    diamondPatternBrush.getPatternSrc = function() {

      var squareWidth = 10, squareDistance = 5;
      var patternCanvas = fabric.document.createElement('canvas');
      var rect = new fabric.Rect({
        width: squareWidth,
        height: squareWidth,
        angle: 45,
        fill: this.color
      });

      var canvasWidth = rect.getBoundingRectWidth();

      patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance;
      rect.set({ left: canvasWidth / 2, top: canvasWidth / 2 });

      var ctx = patternCanvas.getContext('2d');
      rect.render(ctx);

      return patternCanvas;
    };
    
    /*
    var img = new Image();
    img.src = '../assets/honey_im_subtle.png';

    var texturePatternBrush = new fabric.PatternBrush(canvas);
    texturePatternBrush.source = img;
    */
  }

  $('#drawing-mode-selector').on('change', function() {

    if (this.value === 'hline') {
      canvas.freeDrawingBrush = vLinePatternBrush;
    } else if (this.value === 'vline') {
      canvas.freeDrawingBrush = hLinePatternBrush;
    } else if (this.value === 'square') {
      canvas.freeDrawingBrush = squarePatternBrush;
    } else if (this.value === 'diamond') {
      canvas.freeDrawingBrush = diamondPatternBrush;
    } else {
      canvas.freeDrawingBrush = new fabric[this.value + 'Brush'](canvas);
    }

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = $(self.drawingColorEl).val();
      canvas.freeDrawingBrush.width = parseInt($(self.drawingLineWidthEl).val(), 10) || 1;
      canvas.freeDrawingBrush.shadowBlur = parseInt($(self.drawingShadowWidth).val(), 10) || 0;
    }
  });

  $(this.drawingColorEl).on('change', function(e){
    canvas.freeDrawingBrush.color = $(e.target).val();
  });
  $(this.drawingLineWidthEl).on('change', function(e){
    canvas.freeDrawingBrush.width = parseInt($(self.drawingLineWidthEl).val(), 10) || 1;
  });
  $(this.drawingColorEl).on('change', function(e){
    canvas.freeDrawingBrush.shadowBlur = parseInt($(self.drawingShadowWidth).val(), 10) || 0;
  });

  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = $(this.drawingColorEl).val();
    canvas.freeDrawingBrush.width = parseInt($(this.drawingLineWidthEl).val(), 10) || 1;
    canvas.freeDrawingBrush.shadowBlur = 0;
  }

};