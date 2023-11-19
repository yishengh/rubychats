<template>
  <el-dialog v-dialogDrag :title="title" top="5vh" :close-on-click-modal="false" :close-on-press-escape="false"
             :visible.sync="visible" width="50%" height="70%" :before-close="handleClose">
    <div class="chat-video">
      <div class="chat-video-box">
        <div class="chat-video-friend" v-loading="loading" element-loading-text="Waiting for the other party to answer..."
             element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.5)">
          <head-image class="friend-head-image"
                      :id="friend.id" :size="80" :name="friend.nickName"
                      :url="friend.headImage">
          </head-image>
          <video ref="friendVideo" autoplay=""></video>
        </div>
        <div class="chat-video-mine">
          <video ref="mineVideo" autoplay=""></video>
        </div>
      </div>
      <div class="chat-video-controllbar">
        <div v-show="state=='CONNECTING'" title="Cancel Call" class="icon iconfont icon-phone-reject reject"
             style="color: red;" @click="cancel()"></div>
        <div v-show="state=='CONNECTED'" title="Hang Up" class="icon iconfont icon-phone-reject reject"
             style="color: red;" @click="handup()"></div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import HeadImage from '../common/HeadImage.vue';

export default {
  name: 'chatVideo',
  components: {
    HeadImage
  },
  props: {
    visible: {
      type: Boolean
    },
    friend: {
      type: Object
    },
    master: {
      type: Boolean
    },
    offer: {
      type: Object
    }
  },
  data() {
    return {
      callerId: null,
      stream: null,
      audio: new Audio(),
      loading: false,
      peerConnection: null,
      videoTime: 0,
      videoTimer: null,
      state: 'NOT_CONNECTED',
      candidates: [],
      configuration: {
        iceServers: []
      }
    }
  },
  methods: {
    init() {
      if (!this.hasUserMedia() || !this.hasRTCPeerConnection()) {
        this.$message.error("Your browser does not support WebRTC");
        if (!this.master) {
          this.sendFailed("The other party's browser does not support WebRTC")
        }
        return;
      }
      // Open the camera
      this.openCamera((stream) => {
        // Initialize the WebRTC connection
        this.setupPeerConnection(stream);
        if (this.master) {
          // Initiate the call
          this.call();
        } else {
          // Accept the call
          this.accept(this.offer);
        }
      });
    },
    openCamera(callback) {
      navigator.getUserMedia({
            video: true,
            audio: true
          },
          (stream) => {
            this.stream = stream;
            console.log(this.stream)
            this.$refs.mineVideo.srcObject = stream;
            this.$refs.mineVideo.muted = true;
            callback(stream)
          },
          (error) => {
            this.$message.error("Failed to open the camera: " + error);
            callback()
          });
    },
    closeCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach((track) => {
          track.stop();
        });
        this.$refs.mineVideo.srcObject = null;
        this.stream = null;
      }
    },
    setupPeerConnection(stream) {
      this.peerConnection = new RTCPeerConnection(this.configuration);
      this.peerConnection.ontrack = (e) => {
        this.$refs.friendVideo.srcObject = e.streams[0];
      };
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          if (this.state == 'CONNECTED') {
            // Already connected, send directly
            this.sendCandidate(event.candidate);
          } else {
            // Not connected, cache it, and send later
            this.candidates.push(event.candidate)
          }
        }
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          this.peerConnection.addTrack(track, stream);
        });
      }
      this.peerConnection.oniceconnectionstatechange = (event) => {
        let state = event.target.iceConnectionState;
        console.log("ICE connection status changed: " + state)
        if (state == 'connected') {
          this.resetTime();
        }
      };
    },
    handleMessage(msg) {
      if (msg.type == this.$enums.MESSAGE_TYPE.RTC_ACCEPT) {
        if (msg.selfSend) {
          // I accepted the call on another device
          this.$message.success("Answered on another device");
          this.close();
        } else {
          // The other party accepted my call
          this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.content)));
          // Close the waiting prompt
          this.loading = false;
          // State is connected
          this.state = 'CONNECTED';
          // Stop playing the audio
          this.audio.pause();
          // Send candidates
          this.candidates.forEach((candidate) => {
            this.sendCandidate(candidate);
          })
        }

      } else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_REJECT) {
        if (msg.selfSend) {
          // I rejected the call on another device
          this.$message.success("Call rejected on another device");
          this.close();
        } else {
          // The other party rejected my call
          this.$message.error("The other party rejected your video request");
          this.close();
        }
      } else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_FAILED) {
        this.$message.error(msg.content)
        this.close();
      } else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_CANDIDATE) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(msg.content)));
      } else if (msg.type == this.$enums.MESSAGE_TYPE.RTC_HANDUP) {
        this.$message.success("The other party hung up the video call");
        this.close();
      }
    },
    call() {
      this.peerConnection.createOffer((offer) => {
        this.peerConnection.setLocalDescription(offer);
        this.$http({
          url: `/webrtc/private/call?uid=${this.friend.id}`,
          method: 'post',
          data: JSON.stringify(offer)
        }).then(() => {
          this.callId = this.$store.state.userStore.userInfo.id;
          this.loading = true;
          this.state = 'CONNECTING';
          this.audio.play();
        })
      },(error) => {
        this.$message.error(error);
      });
    },
    accept(offer) {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      this.peerConnection.createAnswer((answer) => {
            this.peerConnection.setLocalDescription(answer);
            this.$http({
              url: `/webrtc/private/accept?uid=${this.friend.id}`,
              method: 'post',
              data: JSON.stringify(answer)
            }).then(() => {
              this.state = 'CONNECTED';
              this.callerId = this.friend.id;
            })
          },
          (error) => {
            this.$message.error(error);
          });
    },
    handup() {
      this.$http({
        url: `/webrtc/private/handup?uid=${this.friend.id}`,
        method: 'post'
      })
      this.close();
      this.$message.success("Video call hung up")
    },
    cancel() {
      this.$http({
        url: `/webrtc/private/cancel?uid=${this.friend.id}`,
        method: 'post'
      })
      this.close();
      this.$message.success("Call stopped")
    },
    sendFailed(reason) {
      this.$http({
        url: `/webrtc/private/failed?uid=${this.friend.id}&reason=${reason}`,
        method: 'post'
      })
    },
    sendCandidate(candidate) {
      this.$http({
        url: `/webrtc/private/candidate?uid=${this.friend.id}`,
        method: 'post',
        data: JSON.stringify(candidate)
      })
    },
    close() {
      this.$emit("close");
      this.closeCamera();
      this.loading = false;
      this.state = 'NOT_CONNECTED';
      this.videoTime = 0;
      this.videoTimer && clearInterval(this.videoTimer);
      this.audio.pause();
      this.candidates = [];
      this.$store.commit("setUserState", this.$enums.USER_STATE.FREE);
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection.onicecandidate = null;
        this.peerConnection.onaddstream = null;
      }
      if (this.$refs.friendVideo) {
        this.$refs.friendVideo.srcObject = null;
      }
    },
    resetTime() {
      this.videoTime = 0;
      this.videoTimer && clearInterval(this.videoTimer);
      this.videoTimer = setInterval(() => {
        this.videoTime++;
      }, 1000)
    },
    handleClose() {
      if (this.state == 'CONNECTED') {
        this.handup()
      } else if (this.state == 'CONNECTING') {
        this.cancel();
      } else {
        this.close();
      }
    },
    hasUserMedia() {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator
              .mozGetUserMedia ||
          navigator.msGetUserMedia;
      return !!navigator.getUserMedia;
    },
    hasRTCPeerConnection() {
      window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window
          .mozRTCPeerConnection;
      window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window
          .mozRTCSessionDescription;
      window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window
          .mozRTCIceCandidate;
      return !!window.RTCPeerConnection;
    },
    initAudio() {
      let url = require(`@/assets/audio/call.wav`);
      this.audio.src = url;
      this.audio.loop = true;
    },
    initICEServers() {
      this.$http({
        url: '/webrtc/private/iceservers',
        method: 'get'
      }).then((servers) => {
        this.configuration.iceServers = servers;
      })
    }
  },
  watch: {
    visible: {
      handler(newValue, oldValue) {
        if (newValue) {
          this.init();
          // User is busy
          this.$store.commit("setUserState", this.$enums.USER_STATE.BUSY);
        }
      }
    }
  },
  computed: {
    title() {
      let strTitle = `Video Chat-${this.friend.nickName}`;
      if (this.state == 'CONNECTED') {
        strTitle += `(${this.currentTime})`;
      } else if (this.state == 'CONNECTING') {
        strTitle += `(Calling)`;
      }
      return strTitle;
    },
    currentTime() {
      let currentTime = 0;
      if (this.state == 'CONNECTED' && this.videoTime) {
        currentTime = Math.floor(this.videoTime);
      }
      let min = Math.floor(currentTime / 60);
      let sec = currentTime % 60;
      let strTime = min < 10 ? "0" : "";
      strTime += min;
      strTime += ":"
      strTime += sec < 10 ? "0" : "";
      strTime += sec;
      return strTime;
    }
  },
  mounted() {
    this.initAudio();
    this.initICEServers();
  }
}
</script>

<style lang="scss" scoped>
.chat-video {
  position: relative;

  .chat-video-box {
    position: relative;
    border: #4880b9 solid 1px;
    background-color: #eeeeee;

    .chat-video-friend {
      height: 70vh;

      .friend-head-image {
        position: absolute;
      }

      video {
        width: 100%;
        height: 100%;
        object-fit: fill;
      }
    }

    .chat-video-mine {
      position: absolute;
      z-index: 99999;
      width: 25vh;
      right: 0;
      bottom: 0;
      box-shadow: 0px 0px 5px #ccc;
      background-color: #cccccc;

      video {
        width: 100%;
      }
    }
  }

  .chat-video-controllbar {
    display: flex;
    justify-content: space-around;
    padding: 10px;

    .icon {
      font-size: 50px;
      cursor: pointer;
    }
  }
}
</style>
