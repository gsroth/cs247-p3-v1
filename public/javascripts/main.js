var socket = null;
var cur_video_blob = null;
$(document).ready(function(){
  connect_to_chat();
});

function connect_to_chat(){
  socket = io.connect('http://localhost:3000');
  socket.on('connected',function (data){
    var username = window.prompt("username?");
    if(username){
      socket.emit('new_user', { username: username });
    }else{
      socket.emit('new_user', { username: "anonymous"+Math.floor(Math.random()*1111) });
    }
    bind_submission();
    connect_webcam();
  });
  socket.on('to_all', function (data) {
    console.log(data);
    display_msg(data)
  });
}

function display_msg(data){
  $("#conversation").append("<div class='msg'>"+data.m+"</div>");
  if(data.v){
    var source = document.createElement("source");
    source.src =  URL.createObjectURL(base64_to_blob(data.v));
    source.type =  "video/webm";
    var video = document.createElement("video");
    video.autoplay = true;
    video.controls = true; // optional
    video.class = "hidden";
    video.appendChild(source);
    document.getElementById("conversation").appendChild(video);
  }
}

function bind_submission(){
  $("#submission input").keydown(function( event ) {
    if (event.which == 13) {
      socket.emit('user_msg', {m:$(this).val()});
    }
    if($(this).val() == "lol"){
      socket.emit('user_vid', {v:cur_video_blob});
    }
  });
}

function connect_webcam(){
  var mediaConstraints = {
    video: true,
    audio: false
  };

  var onMediaSuccess = function(stream) {
    // create video element, attach webcam stream to video element
    var video_width= 160;
    var video_height= 120;
    var webcam_stream = document.getElementById('webcam_stream');
    var video = document.createElement('video');
    webcam_stream.innerHTML = "";
    video = mergeProps(video, {
        controls: false,
        width: video_width,
        height: video_height,
        src: URL.createObjectURL(stream)
    });
    video.play();
    webcam_stream.appendChild(video);

    // counter
    var time = 0;
    var second_counter = document.getElementById('second_counter');
    var second_counter_update = setInterval(function(){
      second_counter.innerHTML = time++;
    },1000);

    // now record stream in 5 seconds interval
    var video_container = document.getElementById('video_container');
    var mediaRecorder = new MediaStreamRecorder(stream);
    var index = 1;

    mediaRecorder.mimeType = 'video/webm';
    //mediaRecorder.mimeType = 'image/gif';
    mediaRecorder.video_width = video_width;
    mediaRecorder.video_height = video_height;

    mediaRecorder.ondataavailable = function (blob) {
        // POST/PUT "Blob" using FormData/XHR2
        console.log("new data available!");
        video_container.innerHTML = "";
        blob_to_b64(blob,function(b64_data){
          cur_video_blob = b64_data;
        });


        // display

        // for href
        // var a = document.createElement('a');
        // a.target = '_blank';
        // a.innerHTML = 'Open Recorded Video No. ' + (index++);
        // a.href = URL.createObjectURL(blob);
        // video_container.appendChild(a);

        // for video
        // var source = document.createElement("source");
        // source.src =  URL.createObjectURL(blob);
        // source.type =  "video/webm";
        // var video = document.createElement("video");
        // video.autoplay = true;
        // video.class = "hidden";
        // video.appendChild(source);
        // video_container.appendChild(video);

        // for gif
        // var img = document.createElement('img');
        // img.src = URL.createObjectURL(blob);
        // video_container.appendChild(img);
    };
    mediaRecorder.start(3000);
    console.log("connect to media stream!");
  }

  var onMediaError = function(e) {
    console.error('media error', e);
  }

  // see https://github.com/streamproc/MediaStreamRecorder
  navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
}

 var blob_to_b64 = function(blob, callback) {
  var reader = new FileReader();
  reader.onload = function() {
    var buffer = reader.result;
    var view = new Uint8Array(buffer);
    var binary = String.fromCharCode.apply(window, view);
    var base64 = btoa(binary);
    callback(base64);
  };
  reader.readAsArrayBuffer(blob);
};

var base64_to_blob = function(base64) {
  var binary = atob(base64);
  var len = binary.length;
  var buffer = new ArrayBuffer(len);
  var view = new Uint8Array(buffer);
  for (var i = 0; i < len; i++) {
    view[i] = binary.charCodeAt(i);
  }
  var blob = new Blob([view]);
  return blob;
};
