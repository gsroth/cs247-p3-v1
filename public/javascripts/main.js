var socket = null;
var cur_video_blob = null;
$(document).ready(function(){
  connect_to_chat_firebase();
  //connect_to_chat();
});

function connect_to_chat_firebase(){
  var fb_instance = new Firebase("https://cs247ps3.firebaseio.com");

  // generate new chatroom id or use existing id
  var url_segments = document.location.href.split("/#");
  if(url_segments[1]){
    fb_chat_room_id = url_segments[1];
  }else{
    fb_chat_room_id = Math.random().toString(36).substring(7);
  }
  display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

  var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
  var fb_instance_users = fb_new_chat_room.child('users');
  var fb_instance_stream = fb_new_chat_room.child('stream');
  var my_color = "#"+((1<<24)*Math.random()|0).toString(16);

  // listen to events
  fb_instance_users.on("child_added",function(snapshot){
    display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
  });
  fb_instance_stream.on("child_added",function(snapshot){
    display_msg(snapshot.val());
  });

  // block until username is answered
  var username = window.prompt("Welcome, warrior! please declare your name?");
  if(!username){
    username = "anonymous"+Math.floor(Math.random()*1111);
  }
  fb_instance_users.push({ name: username,c: my_color});
  $("#waiting").remove();

  // bind submission box
  $("#submission input").keydown(function( event ) {
    if (event.which == 13) {
      if(has_emotions($(this).val())){
        fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color});
      }else{
        fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
      }
      $(this).val("");
      scroll_to_bottom(0);
    }
  });

  // scroll to bottom in case there is already content
  scroll_to_bottom(1300);
  connect_webcam();
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
}

function scroll_to_bottom(wait_time){
  // scroll to bottom of div
  setTimeout(function(){
    $("html, body").animate({ scrollTop: $(document).height() }, 200);
  },wait_time);
}

// used for node js backend
// function bind_submission_box(){
//   $("#submission input").keydown(function( event ) {
//     if (event.which == 13) {
//       if(has_emotions($(this).val())){
//         socket.emit('user_vid', {m:$(this).val(),v:cur_video_blob});
//       }else{
//         socket.emit('user_msg', {m:$(this).val()});
//       }
//       $(this).val("");
//       scroll_to_bottom(0);
//     }
//   });
// }

// used for node js backend
// function connect_to_chat(){
//   //socket = io.connect('http://localhost:3000');
//   socket = io.connect(document.location.origin);
//   socket.on('connected',function (data){
//     var username = window.prompt("Welcome, warrior! please declare your name?");
//     if(username){
//       socket.emit('new_user', { username: username });
//     }else{
//       socket.emit('new_user', { username: "anonymous"+Math.floor(Math.random()*1111) });
//     }
//     bind_submission_box();
//     connect_webcam();
//     $("#waiting").remove();
//   });
//   socket.on('to_all', function (data) {
//     //console.log(data);
//     display_msg(data)
//   });
// }

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
    // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
    mediaRecorder.video_width = video_width/2;
    mediaRecorder.video_height = video_height/2;

    mediaRecorder.ondataavailable = function (blob) {
        //console.log("new data available!");
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
// note useing String.fromCharCode.apply can cause callstack error
var blob_to_base64 = function(blob, callback) {
  var reader = new FileReader();
  reader.onload = function() {
    var dataUrl = reader.result;
    var base64 = dataUrl.split(',')[1];
    callback(base64);
  };
  reader.readAsDataURL(blob);
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


