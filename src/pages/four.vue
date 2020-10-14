<template>
  <div class="page">

    <el-container direction="vertical" style="height: 100vh;">
      <el-header>
        <p>蜗牛睡眠</p>
        <div class="right">

        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <div class="fileUpload">
            <label for="file" class="fileBtn">
              上传文件
            </label>
            <input id="file" type="file" @change="onchange" multiple  style="display: none;">
          </div>
          <div class="filename">
            <div class="item" v-for="item in filenames" :key="item">{{item}}</div>
          </div>
          <el-button @click="onDownloadFile()">下载标注</el-button>
        </el-aside>
        <el-container direction="vertical">
          <el-main>
            <div id="waveform"></div>
            <div class="echart" ref="echart" style="width: 100%; height: 500px;"></div>
            <audio src="" ref="audio"></audio>
            <el-tag
                v-for="tag in tags"
                :key="tag">
              {{tag}}
            </el-tag>

          </el-main>
          <el-footer>By Aditya</el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
  // import axios from 'axios'
  import WaveSurfer from 'wavesurfer.js';
  import  echarts from "echarts"
  import FileSaver from 'file-saver'

  export default {
        name: "three",
    data () {
          return {
            area: [],
            markArea: [],
            filenames: [],
            changeArea: [0, 0],
            tags: []
          }
    },
    computed:  {
      echart(){
        return this.$refs.echart
      },
      audio(){
        return this.$refs.audio
      }
    },
      async created() {
      },
      mounted() {this.wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: "#f00",
        progressColor: "#f00",
        cursorColor: "#f00",
        height: 200,
        // barWidth: 2,
        // hideScrollbar: true,
        // barGap: 2,
        // plugins: [RegionsPlugin.create()]
      });
        // this.onInitAudio()
        this.wavesurfer.load(require('../../public/8min.mp3'))
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
         console.log(files)
         let audio
         files.forEach(item => {
           if (/audio\//.test(item.type)) {
             audio = item
           }
         })
         if (audio) {
           this.onInitAudio(audio)
         }
       },
       async onInitAudio (audio) {
         const fileReader  = new FileReader;
         const _this = this
         this.audio.src =URL.createObjectURL(audio);
         this.audio.load()

         fileReader.onload = async function(){
           let arrayBuffer = this.result;
         // 音频buffer
         // const res = await axios({
         //   method: 'GET',
         //   // url: 'http://musicqn.snailsleep.net/0uPSl5V5B5txhfvb2Ns5jvWTuTjD.mp3?e=1599644640&token=rQcRBAkqtWPhdgHLBDb76yzJHVtUo_aARwvAPNIm:2OOJVfXUgFMcfO_5kFv47RmOYqM=',
         //   url: '/mh1002.wav',
         //   responseType: 'arraybuffer'
         // })
           const audioContent = new AudioContext()
           const channelData = await audioContent.decodeAudioData(arrayBuffer)
           console.log(channelData)
           const waveData = channelData.getChannelData(0)

           console.log(waveData.length)

           let data = []
           let num = parseInt(waveData.length / (channelData.duration * 1000))
           console.log(num)

           let idx = 0
           let count = 0
           for (let i = 0 ; i < waveData.length; i++) {
             if (i % num === 0) {
               data.push({
                 value: count / (channelData.duration * 1000) * 100000,
                 index: idx
               })
               idx++
               count = 0
             } else {
               count += waveData[i+1]
             }
           }
           console.log(data)
            _this.markArea.push([
              {
                xAxis: 0,
                itemStyle: {
                  color: _this.Color()
                }
              },
              {
                xAxis: channelData.duration * 1000
              }
            ])
           _this.onInit(data, channelData.duration * 1000)
         }
         fileReader.readAsArrayBuffer(audio);

       },
          onInit (data, max) {
            var myChart = echarts.init(this.echart);
            // 绘制图表
            let option = {
              title: {
                text: 'Audio frequency/ms'
              },
              tooltip: {
                trigger: 'axis'
              },
              grid: {
                left: 66,
                right: 34
              },
              xAxis: {
                // type: 'value',
                data: data.map(function (item) {
                  return item.index;
                }),
                min: 0,
                max: max,
                triggerEvent: true,
                axisLabel: {
                  // interval: 500
                }
              },
              yAxis: {
                type: 'value',
              },
              brush: {
                xAxisIndex: 'all',
                brushLink: 'all',
                outOfBrush: {
                  colorAlpha: 0.1
                }
              },
              dataZoom: [{
                type: 'inside',
                filterMode: 'none',
                xAxisIndex: [0],
                // startValue: 0,
                // endValue: max,
                minValueSpan: 1000
              }],
              series: {
                type: 'line',
                data: data.map(function (item) {
                  return item.value;
                }),
                // showSymbol: false,
                sampling: 'average',
                showAllSymbol: false,
                // markArea: {
                //   data: this.markArea
                // },
                markLine: {
                  symbol: ['none', 'none'],
                  label: {show: false},
                  data: this.area
                },
                smooth: true
              }
            }
            myChart.setOption(option);

            const _this = this
            myChart.on('click', function (params) {
              console.log(params)
              if (params.value <= max) {
                let num = params.value / 1000
                console.log(_this.tags)
                if (_this.tags.indexOf(num) === -1) {
                  console.log(_this.tags.indexOf(num))
                  _this.area.push({
                    xAxis: params.value
                  })

                  option.series.markLine.data = _this.area
                  myChart.setOption(option)
                  _this.tags.push(num)
                } else {
                  console.log('已存在')
                  _this.area.splice(_this.tags.indexOf(num), 1);
                  _this.onRemoveTag(num)
                  option.series.markLine.data = _this.area
                  option.dataZoom = [{
                    type: 'inside',
                    filterMode: 'none',
                    xAxisIndex: [0],
                    minValueSpan: 1000
                  }]
                  myChart.setOption(option)
                }
              }
            });
            this.audio.addEventListener('timeupdate', () => {
              this.changeArea = [this.audio.currentTime * 1000 - 1, this.audio.currentTime * 1000]
              myChart.dispatchAction({
                type: 'brush',
                areas: [
                  {
                    brushType: 'lineX',
                    coordRange: this.changeArea,
                    xAxisIndex: 0
                  }
                ]
              });
              console.log(this.audio.currentTime)
              if (this.audio.currentTime >= this.end / 1000) {
                this.audio.pause()
                myChart.dispatchAction({
                  type: 'brush',
                  areas: [
                    {
                      brushType: 'lineX',
                      coordRange: [-1, 0],
                      xAxisIndex: 0
                    }
                  ]
                });
              }
            })
            window.addEventListener('keydown', (e) => {
              e.stopPropagation()
              console.log('点击了', this.audio.paused)
              const event = e || window.event;  // 标准化事件对象
              console.log(event.keyCode)
              if (event.keyCode === 32) {
                if (this.audio.paused) {
                  this.audio.play()
                } else {
                  this.audio.pause()
                }
              }
            })
            console.log(myChart)
            let chartWidth = myChart.getWidth() - 100
            myChart.getZr().on('click', (params) => {
              console.log(params)
              this.audio.currentTime = (params.offsetX - 66) / chartWidth * max / 1000
              this.audio.play()
            })
          },
       onRemoveTag (tag) {
         this.tags.splice(this.tags.indexOf(tag), 1);
       },
       onDownloadFile () {
         let arr = []
         this.tags.forEach(item => {
           arr.push({
             time: item
           })
         })
         let content = JSON.stringify(arr)
         var blob = new Blob([content ], {type: "text/plain;charset=utf-8"});
         FileSaver.saveAs(blob, "audioFile.json.json");
       }
     }
  }
</script>

<style scoped lang="scss">
  .el-header, .el-footer {
    background-color: #B3C0D1;
    color: #333;
    line-height: 60px;
  }

  .el-aside {
    background-color: #D3DCE6;
    color: #333;
    padding: 10px;
  }

  .el-main {
    background-color: #E9EEF3;
    color: #333;
  }
  .el-header {
    display: flex;
    justify-content: space-between;
    .right {
      display: flex;
      align-items: center;
      font-size: 18px;
      .name {
        font-size: 14px;
      }
      div {
        margin: 0 20px;
        cursor: pointer;
      }
    }
  }
  .fileBtn {
    border-radius: 4px;
    color: #ffffff;
    display: block;
    width: 100px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    background-color: #1989fa;
    cursor: pointer;
  }
  #waveform {
    background-color: #ffffff;
  }
</style>
