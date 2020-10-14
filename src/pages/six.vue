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
            <div class="tags">
              <el-tag
                  v-for="tag in tags"
                  :key="tag"
                  closable
                  :disable-transitions="false"
                  @close="onRemoveTag(tag)">
                {{tag}}
              </el-tag>
            </div>

          </el-main>
          <el-footer>By Aditya</el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
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
      tags: [],
      current: 0, // 当前区域
      active: true, // 标记

      onRemove: null
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
  async mounted() {
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: "#f00",
      progressColor: "rgba(254, 255, 255, 0.4)",
      cursorColor: "#f00",
      height: 200,
      // barWidth: 2,
      // hideScrollbar: true,
      // barGap: 2,
      plugins: [RegionsPlugin.create()]
    });
    this.wavesurfer.load(require('../../public/8min.mp3'))

    //音频buffer
    const res = await axios({
      method: 'GET',
      // url: 'http://musicqn.snailsleep.net/0uPSl5V5B5txhfvb2Ns5jvWTuTjD.mp3?e=1599644640&token=rQcRBAkqtWPhdgHLBDb76yzJHVtUo_aARwvAPNIm:2OOJVfXUgFMcfO_5kFv47RmOYqM=',
      url: '/8min.mp3',
      responseType: 'arraybuffer'
    })

    this.onInitAudio(res.data)

  },
  methods: {
    // 随机颜色
    Color(){
      let r = Math.floor(Math.random()*255);
      let g = Math.floor(Math.random()*255);
      let b = Math.floor(Math.random()*255);
      return 'rgba('+ r +','+ g +','+ b +',0.3)';
    },
    // 时间转换
    onResultFormat(result) {
      var h = Math.floor(result/3600%24);
      var m = Math.floor(result/60%60);
      if (h < 1) {
        return result = '00:' + m;
      } else {
        return result = h + ":" + m;
      }
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
      // const fileReader  = new FileReader;
      const _this = this
      // this.audio.src = URL.createObjectURL(audio);
      // this.audio.load()

      // fileReader.onload = async function(){
      //   let arrayBuffer = this.result;
      let arrayBuffer = audio
      const audioContent = new AudioContext()
      const channelData = await audioContent.decodeAudioData(arrayBuffer)
      console.log(channelData)
      const waveData = channelData.getChannelData(0)

      console.log(waveData.length)

      let data = []
      let num = parseInt(waveData.length / (channelData.duration * 100))
      console.log(num)

      let idx = 0
      let count = 0
      for (let i = 0 ; i < waveData.length; i++) {
        if (i % num === 0) {
          data.push({
            value: count / (channelData.duration * 100) * 100000,
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
          xAxis: channelData.duration * 100
        }
      ])


      _this.onInit(data, 2000)
      // }
      // fileReader.readAsArrayBuffer(audio);

    },
    onInit (data, max) {
      // 初次渲染数据
      let first = data.slice(0, 2000)
      let clickIndex
      var myChart = echarts.init(this.echart);
      // 绘制图表
      let option = {
        title: {
          text: 'Audio frequency/ms'
        },
        tooltip: {
          trigger: 'axis',
          triggerOn: 'click',
          formatter: val => {
            console.log(val)
            clickIndex = val[0].axisValue
            // return 'tooltip'
          }
        },
        grid: {
          left: 66,
          right: 34
        },
        xAxis: {
          // type: 'value',
          data: first.map((item) => {
            return (item.index/ 100).toFixed(2);
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
          min: -50,
          max: 50
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
          minValueSpan: 500
        }],
        series: {
          type: 'line',
          data: first.map(function (item) {
            return item.value;
          }),
          showSymbol: false,
          // sampling: 'average',
          showAllSymbol: false,
          // markArea: {
          //   data: this.markArea
          // },
          markLine: {
            symbol: ['none', 'none'],
            label: {show: false},
            data: this.area,
            animation: false
          },
          smooth: true
        }
      }
      myChart.setOption(option);

      /*
      * 标注线
      * */
      const _this = this
      // myChart.on('click', function () {
        // if (params.value <= max) {
        //   let num = params.value
        //   let index = _this.tags.indexOf(num)
        //   if (index === -1) {
        //     _this.area.push({
        //       xAxis: num
        //     })
        //
        //     option.series.markLine.data = _this.area
        //     myChart.setOption(option)
        //     _this.tags.push(num)
        //   } else {
        //     _this.area.splice(index, 1)
        //     // _this.onRemoveTag(num)
        //     _this.tags.splice(index, 1);
        //     option.series.markLine.data = _this.area
        //     option.dataZoom = [{
        //       type: 'inside',
        //       filterMode: 'none',
        //       xAxisIndex: [0],
        //       minValueSpan: 1000
        //     }]
        //     myChart.setOption(option)
        //   }
        // }
      // });

      this.onRemove = (index) => {
        this.area.splice(index, 1);
        option.series.markLine.data = this.area
        option.dataZoom = [{
          type: 'inside',
          filterMode: 'none',
          xAxisIndex: [0],
          minValueSpan: 500
        }]
        myChart.setOption(option)
      }

      /*
      * 监听键盘空格
      * 音频播放、暂停
      * */
      window.addEventListener('keydown', (e) => {
        e.stopPropagation()
        const event = e || window.event;  // 标准化事件对象
        if (event.keyCode === 32) {
          console.log(this.wavesurfer.isPlaying())
          if (this.wavesurfer.isPlaying()) {
            this.active = false
            this.wavesurfer.pause() // 停止播放并回到音频文件的起始处
          } else {
            this.active = true
            this.wavesurfer.regions.list[this.current].play() // 当前region重新播放
            // this.wavesurfer.play() // 音频继续播放 脱离region
          }
        }
      })
      /*
      * 点击 chart 空白处事件
      * */
      // let chartWidth = myChart.getWidth() - 100
      myChart.getZr().on('click', () => {
        console.log(clickIndex)
        if (clickIndex <= max) {
          let num = clickIndex
          let index = _this.tags.indexOf(num)
          if (index === -1) {
            _this.area.push({
              xAxis: num
            })

            option.series.markLine.data = _this.area
            myChart.setOption(option)
            _this.tags.push(num)
          } else {
            _this.area.splice(index, 1)
            // _this.onRemoveTag(num)
            _this.tags.splice(index, 1);
            option.series.markLine.data = _this.area
            option.dataZoom = [{
              type: 'inside',
              filterMode: 'none',
              xAxisIndex: [0],
              minValueSpan: 500
            }]
            myChart.setOption(option)
          }
        }
      })

      /*
      * region 绘制
      * */
      let regionNum = Math.ceil(this.wavesurfer.getDuration() / 20)
      for (let i = 0; i < regionNum; i++) {
        // 标注区域
        let obj = this.wavesurfer.addRegion({
          id: i,
          start: 20 * i,
          end: 20 * (i + 1),
          loop: false,
          drag: false,
          resize: false,
          // color: "rgba(254, 255, 255, 0.4)"
          color: this.Color()
        });

        // 标注区域点击事件
        obj.on('click', function () {
          _this.active = true
          _this.current = i
          let array = data.slice(i * 2000, (i + 1) * 2000)

          option.series.data = array.map(function (item) {
            return item.value;
          })
          myChart.setOption(option)
          option.xAxis.data = array.map(function (item) {
            return (item.index/ 100).toFixed(2);
          })
          myChart.setOption(option)
          // obj.play()
        })
      }
      /*
      * 监听音频暂停
      * active 区别空格暂停和region播放完暂停
      * myChart.setOption 重新渲染下一阶段波形
      * */
      this.wavesurfer.on('pause', () => {
        if (this.current < regionNum && this.active) {
          // this.current++
          // let array = data.slice(this.current * 2000, (this.current + 1) * 2000)
          // option.series.data = array.map(function (item) {
          //   return item.value;
          // })
          // myChart.setOption(option)
          // option.xAxis.data = array.map(function (item) {
          //   return (item.index/ 100).toFixed(2);
          // })
          // myChart.setOption(option)
          this.wavesurfer.regions.list[this.current].play()
        }
      })
      /*
      * 音频播放
      * */
      this.wavesurfer.on('audioprocess', (params) => {
        let current = params.toFixed(2)
        console.log(current)

        this.changeArea = [current, current]
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
      })
    },
    onRemoveTag (tag) {
      let index = this.tags.indexOf(tag)
      this.tags.splice(index, 1);
      this.onRemove(index)
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
  background-color: #000;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  .el-tag {
    margin: 0 10px 10px 0;
  }
}
</style>
