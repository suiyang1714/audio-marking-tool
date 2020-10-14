<template>
  <div class="page">
    <div id="waveform"></div>
    <div id="mark"></div>
    <label for="file" @change="onchange">
      <input id="file" type="file">
      导入textgrid
    </label>
    <p id="text"></p>
  </div>
</template>

<script>
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
  export default {
    name: "index",
    created() {

    },
    mounted() {
      this.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: "#368666",
        progressColor: "#6d9e8b",
        cursorColor: "#fff",
        height: 200,
        // barWidth: 2,
        // hideScrollbar: true,
        // barGap: 2,
        plugins: [RegionsPlugin.create()]
      });

      // this.currentRegion =
      this.wavesurfer.load(require('../assets/test.wav'))
      // this.wavesurfer.load(require('../assets/audio.mp3'))
    },
    methods: {
      // 随机颜色
      Color(){
        let r = Math.floor(Math.random()*255);
        let g = Math.floor(Math.random()*255);
        let b = Math.floor(Math.random()*255);
        return 'rgba('+ r +','+ g +','+ b +',0.3)';
      },
      onchange (event) {
        let files = event.target.files || event.dataTransfer.files;
        if(files.length){
          let file = files[0];
          console.log(file)
          let reader = new FileReader();
          let _this = this
          reader.onload = function(){
            document.getElementById('text').innerHTML = this.result.replace(/\s/g, '');
            let reg = /intervals\[[0-9]+\]:(xmin=[0-9]*\.*[0-9]*)(xmax=[0-9]*\.*[0-9]*)(text="[0-9]+")/g

            let array = []
            let str = this.result.replace(/\s/g, '')
            let text = str.replace(reg, function (match, p1, p2, p3) {
              let obj = {
                'xmin': p1.replace('xmin=', ''),
                'xmax': p2.replace('xmax=', ''),
                'text': p3.replace('text=', '')
              }
              array.push(obj)
              return match
            })

            console.log(text)
            console.log(array)
            array.forEach((item, index) => {
              let doc = document.getElementById('mark')
              let bg = _this.Color()
              var childNode = document.createElement('div');
              childNode.innerText = Number(JSON.parse(item.text))
              let width = (item.xmax - item.xmin) / _this.wavesurfer.getDuration() * 100
              childNode.style.width = width + '%'
              childNode.style.textAlign = 'center'
              childNode.style.backgroundColor = bg
              childNode.style.fontSize = '24px'
              doc.appendChild(childNode)
              let obj = _this.wavesurfer.addRegion({
                id: index,
                start: item.xmin,
                end: item.xmax,
                loop: false,
                drag: false,
                resize: false,
                color: bg
                // color: "rgba(254, 255, 255, 0.4)"
              });
              obj.on('click', function () {
                obj.play()
              })
              obj.on('dblclick', function () {
                _this.wavesurfer.pause()
              })
            })
          };
          reader.readAsText(file);
        }
      }
    }
  }
</script>

<style scoped>
  #mark {
    height: 200px;
    line-height: 200px;
    display: flex;
    border-top: 1px solid grey;
  }
</style>
