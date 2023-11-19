<template>
  <el-dialog class="chat-voice" title="Voice Recording" :visible.sync="visible" width="600px" :before-close="onClose">
    <div v-show="mode=='RECORD'">
      <div class="chat-voice-tip">{{stateTip}}</div>
      <div>Duration: {{state=='STOP'?0:parseInt(rc.duration)}}s</div>
    </div>
    <audio v-show="mode=='PLAY'" :src="url" controls ref="audio" @ended="onStopAudio()"></audio>
    <el-divider content-position="center"></el-divider>
    <el-row class="chat-voice-btn-group">
      <el-button round type="primary" v-show="state=='STOP'" @click="onStartRecord()">Start Recording</el-button>
      <el-button round type="warning" v-show="state=='RUNNING'" @click="onPauseRecord()">Pause Recording</el-button>
      <el-button round type="primary" v-show="state=='PAUSE'" @click="onResumeRecord()">Resume Recording</el-button>
      <el-button round type="danger" v-show="state=='RUNNING'||state=='PAUSE'" @click="onCompleteRecord()">
        Stop Recording</el-button>
      <el-button round type="success" v-show="state=='COMPLETE' && mode!='PLAY'" @click="onPlayAudio()">Play Recording
      </el-button>
      <el-button round type="warning" v-show="state=='COMPLETE' && mode=='PLAY'" @click="onStopAudio()">Stop Playback
      </el-button>
      <el-button round type="primary" v-show="state=='COMPLETE'" @click="onRestartRecord()">Restart Recording</el-button>
      <el-button round type="primary" v-show="state=='COMPLETE'" @click="onSendRecord()">Send Now</el-button>
    </el-row>
  </el-dialog>
</template>

<script>
import Recorder from 'js-audio-recorder';

export default {
  name: 'chatVoice',
  props: {
    visible: {
      type: Boolean
    }
  },
  data() {
    return {
      rc: new Recorder(),
      audio: new Audio(),
      state: 'STOP', // STOP, RUNNING, PAUSE, COMPLETE
      stateTip: "Not Started",
      mode: 'RECORD', // RECORD, PLAY
      duration: 0,
      url: ""
    }
  },
  methods: {
    onClose() {
      // Clear data before closing
      this.rc.destroy();
      this.rc = new Recorder();
      this.audio.pause();
      this.mode = 'RECORD';
      this.state = 'STOP';
      this.stateTip = 'Not Started';
      this.$emit("close");
    },
    onStartRecord() {
      this.rc.start().then((stream) => {
        this.state = 'RUNNING';
        this.stateTip = "Recording...";
      }).catch(error => {
        console.log(error);
        this.$message.error(error);
        console.log(error);
      });
    },
    onPauseRecord() {
      this.rc.pause();
      this.state = 'PAUSE';
      this.stateTip = "Recording paused";
    },
    onResumeRecord() {
      this.rc.resume();
      this.state = 'RUNNING';
      this.stateTip = "Recording...";
    },
    onCompleteRecord() {
      this.rc.pause();
      this.state = 'COMPLETE';
      this.stateTip = "Recording complete";
    },
    onPlayAudio() {
      let wav = this.rc.getWAVBlob();
      let url = URL.createObjectURL(wav);
      this.$refs.audio.src = url;
      this.$refs.audio.play();
      this.mode = 'PLAY';
    },
    onStopAudio() {
      console.log(this.$refs.audio);
      this.$refs.audio.pause();
      this.mode = 'RECORD';
    },
    onRestartRecord() {
      this.rc.destroy();
      this.rc = new Recorder()
      this.rc.start();
      this.state = 'RUNNING';
      this.mode = 'RECORD';
      this.stateTip = "Recording...";
    },
    onSendRecord() {
      let wav = this.rc.getWAVBlob();
      let name = new Date().getDate() + '.wav';
      var formData = new window.FormData()
      formData.append('file', wav, name);
      this.$http({
        url: '/file/upload',
        data: formData,
        method: 'post',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then((url) => {
        let data = {
          duration: parseInt(this.rc.duration),
          url: url
        }
        this.$emit("send", data);
        this.onClose();
      })
    }
  }
}
</script>

<style lang="scss">
.chat-voice {
  .chat-voice-tip {
    font-size: 18px;
  }

  .chat-voice-btn-group {
    margin-bottom: 20px;
  }
}
</style>
