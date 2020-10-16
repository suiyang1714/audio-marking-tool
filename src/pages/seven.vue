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
            <label for="audio" class="fileBtn">
              上传音频
            </label>
            <input id="audio" type="file" @change="onAudioChange" multiple  style="display: none;">
          </div>
          <div class="fileUpload">
            <label for="file" class="fileBtn">
              上传标注
            </label>
            <input id="file" type="file" @change="onFileChange" multiple  style="display: none;">
          </div>
          <div class="filename">
            <div class="item" v-for="item in filenames" :key="item">{{item}}</div>
          </div>
          <div>
            <el-button @click="dialogVisible = true">下载标注</el-button>
          </div>
          <div>
            <el-button @click="onPlayVideo()">播放/暂停</el-button>
          </div>
        </el-aside>
        <el-container direction="vertical">
          <el-main>
            <div id="waveform"></div>
            <div class="markline" v-if="wavesurfer">
              <div class="line" v-for="(item, index) in tags" :key="index" :style="{left: item/wavesurfer.getDuration() * 100 + '%'}"></div>
            </div>
            <div class="echart" ref="echart" style="width: 100%; height: 500px;"></div>
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
            <audio src="https://qnimage.snailsleep.net/ding.mp3" ref="audio"></audio>
          </el-main>
          <el-footer>By Aditya</el-footer>
        </el-container>
      </el-container>
    </el-container>
    <el-dialog
        title="下载标注"
        :visible.sync="dialogVisible"
        width="50%">
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="震动效果">
          <el-select v-model="form.vibrationEffect">
            <el-option label="单次时长" value="simple"></el-option>
            <el-option label="震动模式" value="pattern"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="震动时长" v-if="form.vibrationEffect === 'simple'">
          <el-input v-model="form.vibratorTiming" placeholder="例如：1000，单位毫秒"></el-input>
        </el-form-item>
        <el-form-item label="震动模式" v-if="form.vibrationEffect === 'pattern'">
          <el-input v-model="form.vibratorPattern" placeholder="例如：200, 400, 200, 400"></el-input>
        </el-form-item>
        <el-form-item label="单次吸气时长">
          <el-input type="number" v-model="form.inspirationLen" placeholder="单位秒"></el-input>
        </el-form-item>
        <el-form-item label="单次呼气时长">
          <el-input type="number" v-model="form.expirationLen" placeholder="单位秒"></el-input>
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="form.version"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onDownloadFile()">确定下载</el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import  echarts from "echarts/lib/echarts"
import 'echarts/lib/chart/line'
import 'echarts/lib/component/markLine'
import 'echarts/lib/component/dataZoom'
import 'echarts/lib/component/brush'
import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/title'
import FileSaver from 'file-saver'

import { Container, Footer, Main, Tag,Header, Aside, Button, Dialog, Form, FormItem, Input, Message, Loading, Select, Option } from 'element-ui'

export default {
  name: "three",
  components: {
    'el-container': Container,
    'el-footer': Footer,
    'el-main': Main,
    'el-tag': Tag,
    'el-header': Header,
    'el-aside': Aside,
    'el-button': Button,
    'el-dialog': Dialog,
    'el-form': Form,
    'el-form-item': FormItem,
    'el-input': Input,
    'el-select': Select,
    'el-option': Option
  },
  data () {
    return {
      area: [],
      filenames: [],
      changeArea: [0, 0],
      tags: [],
      current: 0, // 当前区域
      active: true, // 标记

      onRemove: null,
      wavesurfer: null,

      regionArray: [], //
      currentRegion: 20,

      audioIdx: 0, //
      audioCurrent: -1,

      dialogVisible: false, // 对话框
      form: {
        vibrationEffect: '', // 震动效果
        vibratorTiming: '', //
        vibratorPattern: '', //
        expirationLen: '',
        inspirationLen: '',
        version: '0.0.1'
      },

      waveformData: null, // 波形数据

      vibratorMarkline: [], // 呼气、吸气标记

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
    // 上传音频文件
    onAudioChange (event) {
      let files = event.target.files || event.dataTransfer.files;
      if (this.wavesurfer) {
        this.wavesurfer.destroy()
      }
      // Loading
      this.loadingInstance = Loading.service({ fullscreen: true })
      let audio
      files.forEach(item => {
        if (/audio\//.test(item.type)) {
          audio = item
        } else {
          Message.error('请上传正确的音频文件');
        }
      })
      // 音频文件上传
      if (audio) {
        this.wavesurfer = WaveSurfer.create({
          container: '#waveform',
          waveColor: "#f00",
          progressColor: "rgba(254, 255, 255, 0.4)",
          cursorColor: "#f00",
          height: 200,
          plugins: [RegionsPlugin.create()]
        });
        this.wavesurfer.load(URL.createObjectURL(audio))
        this.wavesurfer.on('ready', () => {
          this.onDrawRegion() // region 绘制
          // 初始化音频
          this.onInitAudio(audio)
        })
      }
    },
    // 上传标注文件
    onFileChange (event) {
      let files = event.target.files || event.dataTransfer.files;

      // Loading
      this.loadingInstance = Loading.service({ fullscreen: true })
      let text
      files.forEach(item => {
        if (/application\/json/.test(item.type)) {
          text = item
        } else {
          Message.error('请上传正确的标注文件');
        }
      })
      // 标注文件上传
      if (text) {
        let reader = new FileReader();
        let _this = this
        reader.onload = function(){
          let obj = JSON.parse(this.result)
          let array = []
          obj.vibrateRange.forEach(item => {
            array.push(item.startTime, item.endTime)
            let len = Math.ceil((item.endTime - item.startTime) / (obj.expirationLen + obj.inspirationLen))
            let time = item.startTime * 1
            for(let i = 1; i <= len; i++) {
              let inspiration = obj.inspirationLen + time + ''
              let expiration = obj.inspirationLen + obj.expirationLen + time + ''
              let arr = [
                {
                  name: '呼气',
                  xAxis: inspiration,
                  lineStyle: {
                    type: 'dashed',
                    color: '#000'
                  },
                  label: {
                    show: true
                  }
                },
                {
                  name: '吸气',
                  xAxis: expiration,
                  lineStyle: {
                    type: 'dashed',
                    color: '#C3945B'
                  },
                  label: {
                    show: true
                  }
                }
              ]
              _this.vibratorMarkline.push(inspiration, expiration) //
              _this.area.push(...arr)
              time += obj.inspirationLen + obj.expirationLen
            }

            _this.area.unshift({
              name: '吸气',
              xAxis: item.startTime,
              lineStyle: {
                type: 'dashed',
                color: '#C3945B'
              },
              label: {
                show: true
              }
            })
            // _this.area.pop()
            _this.vibratorMarkline.unshift(item.startTime)
            _this.vibratorMarkline.pop()
          })
          _this.audioCurrent = _this.vibratorMarkline[0].slice(0,-1)
          console.log(_this.audioCurrent)
          _this.tags = array
           array.forEach(item => {
             _this.area.push({
               xAxis: item,
               lineStyle: {
                 type: 'solid',
                 color: '#3167E3'
               }
             })
          })

          console.log(_this.area)


          _this.wavesurfer.unAll()
          _this.onInit(_this.waveformData, 2000)
        };
        reader.readAsText(text);
      }
    },
    // 初始化音频
    async onInitAudio (audio) {
      const fileReader  = new FileReader;
      const _this = this

      fileReader.onload = async function(){
        let arrayBuffer = this.result;
        // let arrayBuffer = audio
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
        _this.waveformData = data
        window.removeEventListener('keydown', this.onKeydown)
        window.addEventListener('keydown', _this.onKeydown) // 空格监听
        _this.onInit(data, 2000) // 初始化
      }
      fileReader.readAsArrayBuffer(audio);

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
          minValueSpan: 500
        }],
        series: {
          type: 'line',
          data: first.map(function (item) {
            return item.value;
          }),
          showSymbol: false,
          showAllSymbol: false,
          markLine: {
            symbol: ['none', 'none'],
            label: {show: true},
            data: this.area,
            animation: false
          },
          smooth: true
        }
      }
      myChart.setOption(option);

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
      * 点击 chart 空白处事件
      * */
      // let chartWidth = myChart.getWidth() - 100
      myChart.getZr().on('click', () => {
        console.log(clickIndex)
        if (clickIndex <= max) {
          let num = clickIndex
          let index = this.tags.indexOf(num)
          if (index === -1) {
            this.area.push({
              xAxis: num,
              lineStyle: {
                type: 'solid',
                color: '#3167E3'
              }
            })

            option.series.markLine.data = this.area
            myChart.setOption(option)
            this.tags.push(num)
          } else {
            this.area.splice(index, 1)
            // _this.onRemoveTag(num)
            this.tags.splice(index, 1);
            option.series.markLine.data = this.area
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
      * region 添加点击事件
      * */
      let regionNum = Math.ceil(this.wavesurfer.getDuration() / 20)
      for (let i = 0; i < regionNum; i++) {
        // 标注区域点击事件
        this.wavesurfer.regions.list[i].on('click', () => {
          this.active = true
          this.current = i
          this.currentRegion = (i + 1) * 20
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

          // 重置当前播放标注index
          this.vibratorMarkline.some((item, index) => {
            if (item > i * 20) {
              this.audioIdx = index
              this.audioCurrent = item.slice(0,-1)

              return true
            }
          })
        })
      }
      /*
      * 监听音频暂停
      * active 区别空格暂停和region播放完暂停
      * myChart.setOption 重新渲染下一阶段波形
      * */
      this.wavesurfer.on('pause', () => {
        if (this.current < regionNum && this.active) {
          // 重置当前播放标注index
          this.vibratorMarkline.some((item, index) => {
            if (item > this.current * 20) {
              this.audioIdx = index
              this.audioCurrent = item.slice(0,-1)

              return  true
            }
          })
          this.wavesurfer.regions.list[this.current].play()
        }
      })
      /*
      * 音频播放进度监测
      * */
      this.wavesurfer.on('audioprocess', (params) => {
        let current = parseFloat(params).toFixed(2)

        // 图表播放进度条
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

        // 长播放刷新图表region
        if (!this.active && current > this.currentRegion) {
          this.current++
          this.currentRegion = (this.current + 1) * 20
          let array = data.slice(this.current * 2000, (this.current + 1) * 2000)

          option.series.data = array.map(function (item) {
            return item.value;
          })
          myChart.setOption(option)
          option.xAxis.data = array.map(function (item) {
            return (item.index/ 100).toFixed(2);
          })
          myChart.setOption(option)
        }

        // ding
        console.log(current.slice(0,-1), this.audioCurrent)
        if (current.slice(0,-1) == this.audioCurrent) {
          this.audioIdx++
          this.audio.play()
          if (this.audioIdx < this.vibratorMarkline.length) {
            this.audioCurrent = this.vibratorMarkline[this.audioIdx].slice(0,-1)
          }
        }

      })

      this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
        this.loadingInstance.close();
      });
    },
    // 标签删除
    onRemoveTag (tag) {
      let index = this.tags.indexOf(tag)
      this.tags.splice(index, 1);
      this.onRemove(index + this.vibratorMarkline.length)
    },
    // 标注文件下载
    onDownloadFile () {
      let obj = {
        vibrationEffect: this.form.vibrationEffect,
        vibratorTiming: Number(this.form.vibratorTiming),
        vibratorPattern: this.form.vibratorPattern ? this.form.vibratorPattern.split(',') : '',
        expirationLen: Number(this.form.expirationLen),
        inspirationLen: Number(this.form.inspirationLen),
        version: this.form.version
      }
      let arr = []
      let sort = this.tags.sort((a, b) => a - b)

      for (let i = 0; i < this.tags.length / 2; i++) {
        arr.push({
          startTime: sort[i * 2],
          endTime: sort[(i * 2) + 1]
        })
      }
      obj.vibrateRange = arr
      let content = JSON.stringify(obj)
      var blob = new Blob([content ], {type: "text/plain;charset=utf-8"});
      FileSaver.saveAs(blob, "audioFile.json");

      this.dialogVisible = false
    },
    // 长播放与暂停，区别region播放
    onPlayVideo () {
      this.active = false
      this.wavesurfer.playPause()
    },
    /*
    * 监听键盘空格
    * 音频播放、暂停
    * */
    onKeydown (e) {
      e.stopPropagation()
      const event = e || window.event;  // 标准化事件对象
      if (event.keyCode === 32) {
        event.preventDefault()
        if (this.wavesurfer.isPlaying()) {
          this.active = false
          this.wavesurfer.pause()
        } else {
          this.active = true
          // 重置当前播放标注index
          this.vibratorMarkline.some((item, index) => {
            if (item > this.current * 20) {
              this.audioIdx = index
              this.audioCurrent = item.slice(0,-1)

              return  true
            }
          })
          this.wavesurfer.regions.list[this.current].play() // 当前region重新播放
          // this.wavesurfer.play() // 音频继续播放 脱离region
        }
      }
    },
    // region绘制
    onDrawRegion () {
      let regionNum = Math.ceil(this.wavesurfer.getDuration() / 20)
      for (let i = 0; i < regionNum; i++) {
        this.regionArray.push(20 * (i + 1))
        // 标注区域
        this.wavesurfer.addRegion({
          id: i,
          start: 20 * i,
          end: 20 * (i + 1),
          loop: false,
          drag: false,
          resize: false,
          // color: "rgba(254, 255, 255, 0.4)"
          color: this.Color()
        });
      }
    },
    /*
    * 标注点 ding 更新
    * 分段标注加入吸气、呼气间隔 ding
    * 10.15
    * */
  },
  beforeDestroy() {
    if (this.wavesurfer) {
      console.log('销毁了')
      window.removeEventListener('keydown', this.onKeydown)
      this.wavesurfer.clearRegions()
      this.wavesurfer.destroy()
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
.markline {
  margin: 20px 0 ;
  height:40px;
  border-bottom: 1px solid red;
  position: relative;
  .line {
    position: absolute;
    top: 30px;
    width: 1px;
    height: 10px;
    background-color: #000;
  }
}
.el-input {
  width: 220px;
}
</style>
