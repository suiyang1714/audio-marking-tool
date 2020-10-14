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
        </el-aside>
        <el-container direction="vertical">
          <el-main>
            <div class="echart" ref="echart" style="width: 100%; height: 500px;"></div>
            <audio src="" ref="audio"></audio>
          </el-main>
          <el-footer>By Aditya</el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
  // import axios from 'axios'
  import  echarts from "echarts"

  export default {
        name: "three",
    data () {
          return {
            area: [],
            filenames: [],
            changeArea: [0, 0]
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
      mounted() {
        // this.onInitAudio()
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
         let audio, textGrid
         files.forEach(item => {
           if (/audio\//.test(item.type)) {
             audio = item
           } else if (/.TextGrid/.test(item.name)) {
             textGrid = item
           }
         })
         if (audio && textGrid) {
           let reader = new FileReader();
           let _this = this
           reader.onload = function(){
             let reg = /intervals\[[0-9]+\]:(xmin=[0-9]*\.*[0-9]*)(xmax=[0-9]*\.*[0-9]*)(text="[0-9]+")/g

             let array = []
             let str = this.result.replace(/\s/g, '')
             str.replace(reg, function (match, p1, p2, p3) {
               let obj = {
                 'xmin': p1.replace('xmin=', ''),
                 'xmax': p2.replace('xmax=', ''),
                 'text': p3.replace('text=', '')
               }
               array.push(obj)
               return match
             })

             array.forEach((item) => {
               _this.area.push([
                 {
                   name: JSON.parse(item.text),
                   xAxis: item.xmin * 1000,
                   itemStyle: {
                     color: _this.Color()
                   }
                 },
                 {
                   xAxis: item.xmax * 1000
                 }
               ])
             })

             console.log(_this.area)
             _this.onInitAudio(audio)
           };
           reader.readAsText(textGrid);
         }
       },
       async onInitAudio (audio) {
         const fileReader  = new FileReader;
         const _this = this
         this.audio.src =URL.createObjectURL(audio);
         this.audio.load()
         fileReader.onload = async function(){
           let arrayBuffer = this.result;


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
                 value: count / (channelData.duration * 1000),
                 index: idx
               })
               idx++
               count = 0
             } else {
               count += waveData[i+1]
             }
           }
           console.log(data)
           _this.onInit(data, channelData.duration * 1000)
         }
         fileReader.readAsArrayBuffer(audio);
         // const res = await axios({
         //   method: 'GET',
         //   // url: 'http://musicqn.snailsleep.net/0uPSl5V5B5txhfvb2Ns5jvWTuTjD.mp3?e=1599644640&token=rQcRBAkqtWPhdgHLBDb76yzJHVtUo_aARwvAPNIm:2OOJVfXUgFMcfO_5kFv47RmOYqM=',
         //   url: '/mh1002.wav',
         //   responseType: 'arraybuffer'
         // })

       },
          onInit (data, max) {
            var myChart = echarts.init(this.echart);
            // 绘制图表
            myChart.setOption({
              title: {
                text: 'Audio frequency/ms'
              },
              tooltip: {
                trigger: 'axis'
              },
              grid: [
                {
                  left: '10%',
                  right: '8%',
                  height: '50%'
                },
                {
                  left: '10%',
                  right: '8%',
                  top: '72%',
                  height: '10%'
                }
              ],
              xAxis: [
                {
                  // type: 'value',
                  data: data.map(function (item) {
                    return item.index;
                  }),
                  min: 0,
                  max: max,
                },
                {
                  type: 'category',
                  gridIndex: 1,
                  data: data.map(function (item) {
                    return item.index;
                  }),
                  scale: true,
                  boundaryGap: false,
                  axisLine: {onZero: false},
                  axisTick: {show: false},
                  splitLine: {show: false},
                  axisLabel: {show: false},
                  splitNumber: 20,
                  min: 'dataMin',
                  max: 'dataMax'
                }
              ],
              yAxis: [
                {
                  type: 'value',
                  // min: '-0.03',
                  // max: 0.03,
                },
                {
                  scale: true,
                  gridIndex: 1,
                  splitNumber: 2,
                  axisLabel: {show: false},
                  axisLine: {show: false},
                  axisTick: {show: false},
                  splitLine: {show: false}
                }

              ],
              dataZoom: [
                {
                  type: 'inside',
                  xAxisIndex: [0, 1],
                  start: 0,
                  end: 100
                },
                {
                  show: true,
                  xAxisIndex: [0, 1],
                  type: 'slider',
                  top: '85%',
                  start: 98,
                  end: 100
                }
              ],
              brush: {
                xAxisIndex: 'all',
                brushLink: 'all',
                outOfBrush: {
                  colorAlpha: 0.1
                }
              },
              series: [
                {
                  type: 'line',
                  data: data.map(function (item) {
                    return item.value;
                  }),
                  showSymbol: false,
                  sampling: 'average',
                  showAllSymbol: false,
                  markArea: {
                    data: this.area
                  }

                },
                {
                  name: 'Volume',
                  type: 'line',
                  barCategoryGap: 0,
                  xAxisIndex: 1,
                  yAxisIndex: 1,
                  data: data.map(function () {
                    return 0;
                  }),
                  showSymbol: false,
                  sampling: 'average',
                  showAllSymbol: false,
                  areaStyle: {},
                  markArea: {
                    data: this.area
                  }
                }
              ]
            });
            const _this = this
            myChart.on('click', function (params) {
              console.log(params)
              let start = params.data.coord[0][0]
              _this.end = params.data.coord[1][0]
              _this.audio.currentTime = start / 1000
              _this.audio.play()
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
</style>
