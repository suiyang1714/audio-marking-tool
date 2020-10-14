# vue-video-system
## 引子
> 为音频标注而开发的小工具, 持续开发更新ing   
> Github地址：[vue-video-system](https://github.com/suiyang1714/audio-marking-tool)

![工具截图](https://blogqiniu.adityasui.com/audiotool.png)

1. wavesurfer视图为 audio.duration / 20 个region,点击每个region会刷新echart；
2. echarts 视图为20s长度的region，可点击视图进行标注；
3. 上传文件按钮可上传音频，wavesurfer或者下载标注json和音频一起上传，绘制视图；
4. 播放/暂停按钮为整段播放；
5. 空格键支持region的播放暂停，播放结束后自动循环该region；
6. 下载标注是下载此次标注的数据，可二次标注...

## #6 seven.vue
这一版主要修改标注线不精确问题、加入标注校对（ding.mp3）、标注文件新增震动时长与版本号

```
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
```
这里再次缩减音频波形数据，从 **channelData.duration * 1000** 缩减至 **channelData.duration * 100**，
去除echart优化配置:

```
// showSymbol: false,
// sampling: 'average',
// showAllSymbol: false,
```

**这样就解决了上篇博文所讲的方法**

### #6.1 ECharts点击非图表区域的点击事件不触发问题

1. 通过 myChart.getZr().on('click', fn) 监听整个图表的点击事件，注册回调；
2. 在 tooltip 的 formatter 函数中，每次调用都记录下需要的参数，在回调中使用参数

```
let option = {
    ...
    tooltip: {
      trigger: 'axis',
      // triggerOn: 'click',
      formatter: val => {
        console.log(val)
        clickIndex = val[0].axisValue
        // return 'tooltip'
      }
    },
    ...        
}

myChart.getZr().on('click', () => {
    //拿到index即可取出被点击数据的所有信息
    console.log(clickIndex)
})
```

但这个方法并不能解决我所面临的问题，因为我的配置中要解决数据量过大问题采用了

```
showSymbol: false,
sampling: 'average',
showAllSymbol: false,
```
导致很多点被合并隐藏了，当triggerOn: click 的时候，点击空白区域，并不能获取到tooltip, 即使 triggerOn: mousemove 还是会漏掉许多点，但相当于click 好很多。

但最终目的事利用其标注的用途，由于不灵敏性，所以还是不采纳，依旧选择 xAxis 横坐标点击事件。

### #6.2 校对标注
监听音频播放，当播放到标注时，播放 ding.mp3

```
      /*
      * 音频播放进度监测
      * */
      this.wavesurfer.on('audioprocess', (params) => {
        let current = parseFloat(params).toFixed(2)

        ...

        // ding
        if (current.slice(0,-1) == this.audioCurrent) {
          this.audioIdx++
          this.audioCurrent = this.tags[this.audioIdx].slice(0,-1)
          this.audio.play()
        }

      })
```
> 使用 **toFixed(2)** 来保留两位小数会因为四舍五入，使得 current 并不能准确对比标注点，所以再对比标注点的时候通过slice舍弃最后一位

播放过去 audioIdx 与 audioCurrent 会自动更新，所以当点击 wavesurfer视图的region 重新播放或者跳到后面时，相应的 audioIdx 与 audioCurrent 也应该要重置或者更新

## #5 five、six.vue
第五版与第六版优化了各类方法，支持下载的标注文件再次上传修改，element-ui与echart 优化为按需引用

## #4 four.vue
这一版本提供了标注下载功能、监听空格键暂停播放功能、echart空白区域点击播放功能
### #4.1 file-saver
利用 file-saver 库来实现这一功能：
```
yarn add file-saver
```
例子：
```
var FileSaver = require('file-saver'); 
let data = {
          name:"hanmeimei",
          age:88
      }
var content = JSON.stringify(data);
var blob = new Blob([content ], {type: "text/plain;charset=utf-8"}); 
FileSaver.saveAs(blob, "hello world.txt");
```
### #4.2 myChart.getZr().on('click', () => {})

通过 myChart.getZr().on('click', fn) 监听整个图表的点击事件，注册回调


```
let chartWidth = myChart.getWidth() - 100
myChart.getZr().on('click', (params) => {
  console.log(params)
  this.audio.currentTime = (params.offsetX - 66) / chartWidth * max / 1000
  this.audio.play()
})
```
这个方法在图表不缩放的情况下，根据点击坐标/图表宽度来计算音频seek的进度。
> 缩放情况下就乱了套，没找到获取缩放比例方式

这一版的使用反馈emmmm

## #3 three.vue
第三版通过echart来绘制音频波形
```
const fileReader  = new FileReader;
fileReader.onload = async function(){
    let arrayBuffer = this.result;
    
    
    const audioContent = new AudioContext()
    const channelData = await audioContent.decodeAudioData(arrayBuffer)
    console.log(channelData)
    const waveData = channelData.getChannelData(0)
    
    console.log(waveData.length)
}
fileReader.readAsArrayBuffer(audio);
// or
const res = await axios({
    method: 'GET',
    url: '/mh1002.wav',
    responseType: 'arraybuffer'
})
```
通过 FileReader 对象来读取 音频file 获取的 arrayBuffer 或者用axios来获取本地的音频buffer

然后通过 **getChannelData** 拿到音频波形数据

将**waveData**倒入echarts的时候，绘制的折线图异常卡顿，打印了一下**waveData**，8min的音频竟有2400w个数据点
即使通过
```
showSymbol: false,
sampling: 'average',
showAllSymbol: false,
```
来优化也因为数据量过大效果不是特别明显

后面来做横坐标的时候，根据ms来显示，所以将优化数据
```
let data = []
let num = parseInt(waveData.length / (channelData.duration * 1000))
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
```
根据最小单位ms只取 音频长度（秒） * 1000个数据，最大程度还原波形

其他echart配置项不再叙述

## #2 draw.vue
第二版是 AudioContext的createAnalyser()方法能创建一个AnalyserNode，可以用来获取音频时间和频率数据，以及实现数据可视化。

思路错误。

## #1 index.vue
第一版通过 **wavesurfer.js** 可视化波形，并解析textgrid文件进行标注

不能缩放，不能二次标注。