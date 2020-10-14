<template>
    <div class="page">
      <div id="content">
        <canvas id="canvas"></canvas>
        <audio ref="audio" id="audio" controls src="//m8.music.126.net/21180815163607/04976f67866d4b4d11575ab418904467/ymusic/515a/5508/520b/f0cf47930abbbb0562c9ea61707c4c0b.mp3?infoId=92001" crossOrigin="anonymous"></audio>
        <a  v-if="isBtnShow" href="javascript:;" id="play-btn" @click="onPlay">PLAY</a>
      </div>
    </div>
</template>

<script>
    export default {
        name: "draw",
        mounted() {
          console.log(this.audio)
        },
      data () {
          return {
            isBtnShow: true
          }
      },
      computed:{
        audio(){
          return this.$refs.audio
        }
      },
      methods: {
          onPlay () {

            this.isBtnShow = false
            this.audio.play();
            this.onLoadAudio();
          },
        onLoadAudio () {
          var context = new(window.AudioContext || window.webkitAudioContext)();
          var analyser = context.createAnalyser();
          analyser.fftSize = 512;
          var source = context.createMediaElementSource(this.audio);

          source.connect(analyser);
          analyser.connect(context.destination);

          var bufferLength = analyser.frequencyBinCount;
          var dataArray = new Uint8Array(bufferLength);

          var canvas = document.getElementById("canvas");
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          var ctx = canvas.getContext("2d");
          var WIDTH = canvas.width;
          var HEIGHT = canvas.height;

          var barWidth = WIDTH / bufferLength * 1.5;
          var barHeight;

          function renderFrame() {
            requestAnimationFrame(renderFrame);

            analyser.getByteFrequencyData(dataArray);
            console.log(dataArray)
            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            for (var i = 0, x = 0; i < bufferLength; i++) {
              barHeight = dataArray[i];

              var r = barHeight + 25 * (i / bufferLength);
              var g = 250 * (i / bufferLength);
              var b = 50;

              ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
              ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

              x += barWidth + 2;
            }
          }

          renderFrame();
          // setInterval(renderFrame, 44);
        }
      }
    }
</script>

<style scoped>
  html, body {
    margin: 0;
    overflow: hidden;
    font-family: sans-serif;
    background: #13091B;
    height: 100%;
  }

  body {
    background: url(https://p1.music.126.net/gAmIGjlWnYXE_0O8LFp5-w==/109951164382001054.jpg) no-repeat;
    background-size: cover;
  }

  #canvas {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }

  audio {
    visibility: hidden;
  }

  #play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #13091B;
    background: #007A99;
    display: block;
    width: 150px;
    height: 45px;
    line-height: 45px;
    font-size: 18px;
    cursor: pointer;
    border-radius: 4px;
    letter-spacing: 0.1em;
    z-index: 1;
    text-align: center;
    text-decoration: none;
  }
</style>
