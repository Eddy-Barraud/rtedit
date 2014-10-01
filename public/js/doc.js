/* global sharejs, io, ace, MathJax, Markdown */

(function() {

  var left = document.getElementById('left');
  var right = document.getElementById('right');
  var container = document.getElementById('container');
  var dragHandle = document.getElementById('drag-handle');

  var editor;
  var socket;

  var resize = function(r) {
    left.style.right = (1 - r) * 100 + '%';
    right.style.left = r * 100 + '%';
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
          console.log('htmling');
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
          console.log('markdowning');
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
    return editor;
  };

  var log = function(message, error) {
    if (error) {
      console.error(message);
      alert(message);
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
      }
      // document.getElementById('spinner').style.display = 'none';
    });
  };

  var initResize = function() {
    // Resize left and right pane by click and drag.
    setUpResizeByDrag(left, right, container, dragHandle, function() {
      editor.resize(); // Recalculate editor dimensions (draw scrollbar etc).
    });
  };

  var onEditorUpdate;
  var onModeSelect = function(e) {
    right.innerHTML = '';
    resize(1);
    toggleDragHandle(false);
    editor.session.setMode('ace/mode/' + e.target.value);
    if (rtedit.onMode[e.target.value]) {
      editor.removeListener('change', onEditorUpdate);
      onEditorUpdate = rtedit.onMode[e.target.value](right);
      editor.on('change', onEditorUpdate);
      onEditorUpdate();
    }
  };

  var initListeners = function() {
    document.getElementById('select-mode').addEventListener('change', onModeSelect);
    onModeSelect({target:document.getElementById('select-mode')}); // TODO: Save mode with socket.io
  };

  rtedit.init = function() {
    rtedit.editor = editor = initAce('editor');
    initShare(window.location.pathname.split('/').pop());
    initListeners();
    initResize();
  };

  // window.rtedit = {
  //   previousFile: null,
  //   visitedFiles: {}, // Restore cursor position when visiting an already visited file.
  //   doc: null, // The current share.js document.
  // };

}());

window.rtedit.init();

// Set up the ACE Editor


// // Makes a smooth transition to a new document, by filename.
// // (Position cursor at top, clear undo history, handle errors and things like that.)
// function setDoc(filename) {
//   if (!filename) return;
//   if (doc && doc.name === filename) return;
//   socket.emit('open', filename);
//   editor.setReadOnly(true);
//   document.title = filename;
//   window.location.hash = filename;
//   document.getElementById('filename').value = filename;
//   sharejs.open(filenameEncode(filename), 'text', function(error, newDoc) {
//     if (error) {
//       console.error(error);
//       alert(error);
//       return;
//     }
//     if (doc !== null) {
//       previousFile = filenameDecode(doc.name);
//       visitedFiles[previousFile] = editor.getCursorPosition();
//       doc.close();
//       doc.detach_ace();
//     }
//     // Set editor mode based on file name extension.
//     editor.session.setMode(modelist.getModeForPath(filename).mode);
//     doc = newDoc;
//     doc.attach_ace(editor);
//     setTimeout(function() {
//       if (visitedFiles[filename]) {
//         editor.getSession().getSelection().moveCursorToPosition(visitedFiles[filename]);
//       } else {
//         editor.getSession().getSelection().moveCursorToPosition({row: 0, column: 0});
//       }
//       editor.clearSelection();
//       editor.focus();
//       editor.setReadOnly(false);
//       editor.session.getUndoManager().reset();
//     }, 0);
//   });
// }


// // Pressing enter or ctrl+enter in the file selector opens that file.
// document.getElementById('filename').addEventListener('keydown', function(e) {
//   setTimeout(function() {
//     if (e.keyCode === 13 && e.target.value) {
//       if (e.ctrlKey) { // ctrl+enter go to exat file name (creates new file if file does not exist).
//         setDoc(e.target.value);
//       } else { // enter opens top suggestion, if one exists.
//         var filename = filterFilenameSuggestions(e.target.value);
//         if (filename) setDoc(filename);
//       }
//       filterFilenameSuggestions(null);
//     } else {
//       filterFilenameSuggestions(e.target.value);
//     }
//   }, 0);
// });


// // Save current file to disk by pressing ctrl+s.
// window.addEventListener('keydown', function(e) {
//   if (e.ctrlKey && e.keyCode === 83) { // ctrl+s
//     if (doc) {
//       socket.emit('save', {
//         name: filenameDecode(doc.name),
//         content: doc.getText()
//       });
//     }
//     e.preventDefault();
//   }
// });


// // Focus filename input with shortcut, for convenience this also clears the file selector.
// window.addEventListener('keydown', function(e) {
//   if (e.ctrlKey && e.keyCode === 81) { // ctrl+q
//     document.getElementById('filename').value = '';
//     document.getElementById('filename').focus();
//     e.preventDefault();
//     return false;
//   }
// });


// // Open filename suggestions when focusing file selector.
// document.getElementById('filename').addEventListener('focus', function(e) {
//   filterFilenameSuggestions(e.target.value);
// });


// // Reset filename input if leaving the input without pressing enter.
// document.getElementById('filename').addEventListener('blur', function(e) {
//   e.target.value = doc ? filenameDecode(doc.name) : '';
//   setTimeout(function() {
//     filterFilenameSuggestions(null);
//   }, 50); // Delay is needed so that the click event on each filename suggestion can go through. Unfortunately 0 ms is not sufficient, 50 ms is rather arbitrary; seems to be sufficient.
// });


// // Toggle previous file.
// window.addEventListener('keydown', function(e) {
//   if (e.altKey && e.keyCode === 81 && previousFile) { // alt+q
//     e.preventDefault();
//     setDoc(previousFile);
//   }
// });


// // Change file from hash.

// function setDocByHash() {
//   if (window.location.hash) {
//     setDoc(window.location.hash.substr(1));
//   }
// }

// // Initially load file from hash.
// setDocByHash();

// // Listen to changes in hash.
// window.addEventListener('hashchange', setDocByHash);


// // Listen to whats going on.

// // Display log message in log output for 3 seconds.
// var lastLogMessageTimeout;
// socket.on('log', function(msg) {
//   console.log(msg);
//   document.getElementById('log').textContent = msg;
//   clearTimeout(lastLogMessageTimeout);
//   lastLogMessageTimeout = setTimeout(function() {
//     document.getElementById('log').textContent = '';
//   }, 3000);
// });

// socket.on('error', function(msg) {
//   console.error(msg);
//   alert(msg);
// });


// // Synchronize state

// var state = {
//   existingFiles: [],
//   userCount: 0
// };

// socket.on('update', function(data) {
//   for (var property in data) {
//     if (data.hasOwnProperty(property)) {
//       state[property] = data[property];
//       if (property === 'userCount') {
//         document.getElementById('user-count').textContent = data[property];
//       } else if (property === 'existingFiles' && !doc) {
//         // Focus file selector at launch.
//         document.getElementById('filename').focus();
//         filterFilenameSuggestions('');
//       }
//     }
//   }
// });


// // File name suggestions.

// var filenameSuggestionsElement = document.getElementById('filename-suggestions');
// function filterFilenameSuggestions(partialFilename) {
//   filenameSuggestionsElement.innerHTML = '';
//   if (partialFilename === null) return;
//   var suggestions = [];
//   if (partialFilename === '' ) {
//     suggestions = state.existingFiles.map(function(e) {return [e, []];});
//   } else {
//     var regex = new RegExp(partialFilename.split('').map(function(c) {return '('+c+')';}).join('.*?'), 'i');
//     state.existingFiles.forEach(function(existingFile) {
//       var match = existingFile.match(regex);
//       if (match && match[1]) {
//         suggestions.push([existingFile, match.splice(1)]);
//       }
//     });
//   }
//   var metric = function(suggestion) {
//     var n = 0;
//     var i = 0;
//     var prevIdx;
//     suggestion[0].split('').forEach(function(char, idx) {
//       if (char === suggestion[1][i]) {
//         if (prevIdx)
//           n += (idx - prevIdx);
//         prevIdx = idx;
//         i++;
//       }
//     });
//     return n;
//   };
//   suggestions = suggestions.sort(function(a, b) {
//     var n = metric(a) - metric(b);
//     if (n === 0) return a[0].length - b[0].length;
//     else return n;
//   });
//   suggestions.forEach(function(suggestion) {
//     var displayHtml = '';
//     var i = 0;
//     suggestion[0].split('').forEach(function(char) {
//       if (char === suggestion[1][i]) {
//         displayHtml += '<strong>' + suggestion[1][i] + '</strong>';
//         i++;
//       } else {
//         displayHtml += char;
//       }
//     });
//     var child = document.createElement('div');
//     child.innerHTML = displayHtml;
//     filenameSuggestionsElement.appendChild(child);
//     child.addEventListener('click', function(e) {
//       setDoc(e.target.textContent);
//       filterFilenameSuggestions(null);
//     });
//   });
//   return suggestions[0] ? suggestions[0][0] : null;
// }


// // Since share.js does not allow slashes in the filename, we represent slashes by backslashes internally.

// function filenameEncode(filename) {
//   return filename.replace(/\//g, '\\');
// }

// function filenameDecode(filename) {
//   return filename.replace(/\\/g, '/');
// }



































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
