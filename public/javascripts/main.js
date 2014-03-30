var socket = null;
var cur_video_blob = null;
$(document).ready(function(){
  connect_to_chat();
});

function connect_to_chat(){
  //socket = io.connect('http://localhost:3000');
  socket = io.connect(document.location.origin);
  socket.on('connected',function (data){
    var username = window.prompt("Welcome, warrior! please declare your name?");
    if(username){
      socket.emit('new_user', { username: username });
    }else{
      socket.emit('new_user', { username: "anonymous"+Math.floor(Math.random()*1111) });
    }
    bind_submission_box();
    connect_webcam();
  });
  socket.on('to_all', function (data) {
    console.log(data);
    display_msg(data)
  });
}

function display_msg(data){
  $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
  if(data.v){
    var source = document.createElement("source");
    source.src =  URL.createObjectURL(base64_to_blob(data.v));
    source.type =  "video/webm";
    var video = document.createElement("video");
    video.autoplay = true;
    video.controls = false; // optional
    video.loop = true;
    video.width = 120;
    video.appendChild(source);
    document.getElementById("conversation").appendChild(video);
  }
  // scroll to bottom of div
  setTimeout(function(){
    $("html, body").animate({ scrollTop: $(document).height() }, 200);
  },0);
}

function bind_submission_box(){
  $("#submission input").keydown(function( event ) {
    if (event.which == 13) {
      if(has_emotions($(this).val())){
        alert("emit")
        socket.emit('user_vid', {m:$(this).val(),v:cur_video_blob});
      }else{
        socket.emit('user_msg', {m:$(this).val()});
      }
      $(this).val("");
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
    mediaRecorder.video_width = video_width/2;
    mediaRecorder.video_height = video_height/2;

    mediaRecorder.ondataavailable = function (blob) {
        console.log("new data available!");
        video_container.innerHTML = "";

        // convert data into base 64 blocks
        blob_to_base64(blob,function(b64_data){
          cur_video_blob = b64_data;
        });


        // if you want to display the captured frame

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

var has_emotions = function(msg){
  var options = ["lol",": )",": ("];
  for(var i=0;i<options.length;i++){
    if(msg.indexOf(options[i])!= -1){
      return true;
    }
  }
  return false;
}

// some handy methods for converting blob to base 64 and vice versa
// for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
var blob_to_base64 = function(blob, callback) {
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


