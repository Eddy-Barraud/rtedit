/* global sharejs, io, ace, MathJax, Markdown */

// (function() {

  var left = document.getElementById('left');
  var right = document.getElementById('right');
  var container = document.getElementById('container');
  var dragHandle = document.getElementById('drag-handle');

  var editor;
  var socket;
  var state;

  var resize = function(r) {
    left.style.right = (1 - r) * 100 + '%';
    right.style.left = r * 100 + '%';
    editor.resize();
  };

  var toggleDragHandle = function(state) {
    if (state) {
      dragHandle.classList.add('enabled');
    } else {
      dragHandle.classList.remove('enabled');
    }
  };

  var rtedit = window.rtedit = {
    onMode: {
      'html': function(el) {
        resize(0.55);
        toggleDragHandle(true);

        // Create preview element.
        var iframe = document.createElement('iframe');
        iframe.setAttribute('seamless', true);
        iframe.setAttribute('id', 'preview-iframe');
        el.appendChild(iframe);
        var previewDoc = iframe.contentWindow.document;

        // Updates the preview with content from editor.
        return function() {
          previewDoc.open();
          previewDoc.write(editor.getValue());
          previewDoc.close();
        };
      },
      'markdown': function(el) {
        resize(0.55);
        toggleDragHandle(true);
        var md2html = (new Markdown.Converter()).makeHtml;
        var inner = document.createElement('div');
        inner.setAttribute('id', 'preview-text');
        el.appendChild(inner);
        return function() {
          inner.innerHTML = md2html(editor.getValue().replace(/\\\[/g, '\\\\[').replace(/\\\]/g, '\\\\]'));
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, inner]);
        };
      }
    }
  };


  var initAce = function(id) {
    var editor = ace.edit(id);
    var editorSession = editor.getSession();
    // var modelist = ace.require('ace/ext/modelist');
    editor.setReadOnly(true); // Is unset when a file gets loaded.
    editor.setShowPrintMargin(false);
    editor.setTheme('ace/theme/monokai');
    editorSession.setTabSize(2);
    editorSession.setUseSoftTabs(true);
    editorSession.setUseWrapMode(true);
    editor.resize();
    return editor;
  };

  var log = function(message, error) {
    if (error) {
      console.error('ERROR: ' + message);
      alert('ERROR: ' + message);
    } else {
      console.log(message);
    }
  };

  var initSocket = function(room) {
    socket = io();
    socket.emit('room', room);
  };

  var initShare = function(room) {
    sharejs.open(room, 'text', function(error, doc) {
      if (error) {
        log(error, true);
      } else {
        doc.attach_ace(editor);
        editor.setReadOnly(false);
        editor.moveCursorTo(0, 0);
        editor.focus();
        editor.resize();
      }
      // document.getElementById('spinner').style.display = 'none';
    });
    sharejs.open(room + '\\meta', 'json', function(error, doc) {
      if (error) {
        log(error, true);
      } else {
        state = doc;
        if (!state.get()) {
          state.set({mode: 'text'});
        }
        document.getElementById('select-mode').value = state.at('mode').get();
        selectMode(state.at('mode').get());
        if (window.location.search.match(/hide-editor/) && left.style.right !== '0%') {
          resize(0);
        }
        state.at().on('replace', function(path, was, now) {
          if (was !== now) {
            document.getElementById('select-mode').value = now;
            selectMode(now);
          }
        });
      }
    });
  };

  var initResize = function() {
    // Resize left and right pane by click and drag.
    setUpResizeByDrag(left, right, container, dragHandle, function() {
      editor.resize(); // Recalculate editor dimensions (draw scrollbar etc).
    });
  };

  var onEditorUpdate;
  var selectMode = function(mode) {
    right.innerHTML = '';
    resize(1);
    toggleDragHandle(false);
    editor.session.setMode('ace/mode/' + mode);
    state.at('mode').set(mode);
    if (rtedit.onMode[mode]) {
      editor.removeListener('change', onEditorUpdate);
      onEditorUpdate = rtedit.onMode[mode](right);
      editor.on('change', onEditorUpdate);
      onEditorUpdate();
    }
  };

  var initListeners = function() {
    document.getElementById('select-mode').addEventListener('change', function(e) {selectMode(e.target.value);});
  };

  rtedit.init = function() {
    rtedit.editor = editor = initAce('editor');
    initListeners();
    initShare(window.location.pathname.split('/').pop());
    initResize();
  };


// }());

window.rtedit.init();



// Helper method to resize elements by dragging.
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function setUpResizeByDrag(left, right, container, dragHandle, afterResizeCallback) {

  var getPositionRelativeElement = function(event, relativeEl) {
    return {
      x: event.clientX - relativeEl.offsetLeft,
      y: event.clientY - relativeEl.offsetTop
    };
  };

  var onmouseleavepage = function(cb) {
    // Todo: Make it work when leaving iframe, but not browser (entering other iframe).
    document.addEventListener('mouseout', function(e) {
      e = e ? e : window.event;
      var from = e.relatedTarget || e.toElement;
      if (!from) {
        cb && cb();
      }
    });
  };

  var resizeStateEnable = function() {
    if (dragHandle.classList.contains('enabled')) {
      dragHandle.classList.add('dragging');
      document.body.classList.add('resizing');
    }
  };
  var resizeStateDisable = function() {
    dragHandle.classList.remove('dragging');
    document.body.classList.remove('resizing');
  };

  dragHandle.addEventListener('mousedown', resizeStateEnable);
  dragHandle.addEventListener('mouseup', resizeStateDisable);
  onmouseleavepage(resizeStateDisable);

  dragHandle.addEventListener('mousemove', function(event) {
    if (dragHandle.classList.contains('dragging')) {
      var x = getPositionRelativeElement(event, container).x;
      if ((0 <= x) && (x <= container.offsetWidth)) {
        // Set size in percent so that resizing window looks nice.
        left.style.right = 100 * (container.offsetWidth - x) / container.offsetWidth + '%';
        right.style.left = 100 * x / container.offsetWidth + '%';
        afterResizeCallback && afterResizeCallback();
      }
    }
  });

}
