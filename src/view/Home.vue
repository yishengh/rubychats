<template>
  <el-container class="home-page">
    <el-aside width="80px" class="navi-bar">
      <div class="user-head-image">
        <head-image
            :name="$store.state.userStore.userInfo.nickName"
            :url="$store.state.userStore.userInfo.headImageThumb"
            :size="60"
            @click.native="showSettingDialog = true"
        ></head-image>
      </div>

      <el-menu>
        <el-menu-item title="Chat">
          <router-link :to="'/home/chat'">
            <span class="el-icon-chat-dot-round"></span>
            <div v-show="unreadCount > 0" class="unread-text">{{ unreadCount }}</div>
          </router-link>
        </el-menu-item>
        <el-menu-item title="Friends">
          <router-link :to="'/home/friend'">
            <span class="el-icon-user"></span>
          </router-link>
        </el-menu-item>
        <el-menu-item title="Group Chat">
          <router-link :to="'/home/group'">
            <span class="icon iconfont icon-group_fill"></span>
          </router-link>
        </el-menu-item>

        <el-menu-item title="Settings" @click="showSetting()">
          <span class="el-icon-setting"></span>
        </el-menu-item>
      </el-menu>

      <div class="exit-box" @click="onExit()" title="Exit">
        <span class="el-icon-circle-close"></span>
      </div>
    </el-aside>
    <el-main class="content-box">
      <router-view></router-view>
    </el-main>
    <setting :visible="showSettingDialog" @close="closeSetting()"></setting>
    <user-info
        v-show="uiStore.userInfo.show"
        :pos="uiStore.userInfo.pos"
        :user="uiStore.userInfo.user"
        @close="$store.commit('closeUserInfoBox')"
    ></user-info>
    <full-image
        :visible="uiStore.fullImage.show"
        :url="uiStore.fullImage.url"
        @close="$store.commit('closeFullImageBox')"
    ></full-image>
    <chat-private-video
        ref="privateVideo"
        :visible="uiStore.chatPrivateVideo.show"
        :friend="uiStore.chatPrivateVideo.friend"
        :master="uiStore.chatPrivateVideo.master"
        :offer="uiStore.chatPrivateVideo.offer"
        @close="$store.commit('closeChatPrivateVideoBox')"
    ></chat-private-video>
    <chat-video-acceptor
        ref="videoAcceptor"
        v-show="uiStore.videoAcceptor.show"
        :friend="uiStore.videoAcceptor.friend"
        @close="$store.commit('closeVideoAcceptorBox')"
    ></chat-video-acceptor>
  </el-container>
</template>

<script>
import HeadImage from '../components/common/HeadImage.vue';
import Setting from '../components/setting/Setting.vue';
import UserInfo from '../components/common/UserInfo.vue';
import FullImage from '../components/common/FullImage.vue';
import ChatPrivateVideo from '../components/chat/ChatPrivateVideo.vue';
import ChatVideoAcceptor from '../components/chat/ChatVideoAcceptor.vue';

export default {
  components: {
    HeadImage,
    Setting,
    UserInfo,
    FullImage,
    ChatPrivateVideo,
    ChatVideoAcceptor,
  },
  data() {
    return {
      showSettingDialog: false,
      lastPlayAudioTime: new Date() - 1000,
    };
  },
  methods: {
    init() {
      this.$store.dispatch("load").then(() => {
        // Load offline messages
        this.loadPrivateMessage(this.$store.state.chatStore.privateMsgMaxId);
        this.loadGroupMessage(this.$store.state.chatStore.groupMsgMaxId);
        // Initialize WebSocket
        this.$wsApi.connect(process.env.VUE_APP_WS_URL, sessionStorage.getItem("accessToken"));
        this.$wsApi.onMessage((cmd, msgInfo) => {
          if (cmd == 2) {
            // Close WebSocket
            this.$wsApi.close(3000);
            // Remote login, force logout
            this.$alert("You have logged in elsewhere and will be forcibly logged out.", "Force Logout Notification", {
              confirmButtonText: 'OK',
              callback: action => {
                location.href = "/";
              }
            });
          } else if (cmd == 3) {
            // Insert private chat message
            this.handlePrivateMessage(msgInfo);
          } else if (cmd == 4) {
            // Insert group chat message
            this.handleGroupMessage(msgInfo);
          }
        });
        this.$wsApi.onClose((e) => {
          console.log(e);
          if (e.code != 3000) {
            // Reconnect on disconnection
            this.$message.error("Connection closed, attempting to reconnect...");
            this.$wsApi.reconnect(process.env.VUE_APP_WS_URL, sessionStorage.getItem("accessToken"));
          }
        });
      }).catch((e) => {
        console.log("Initialization failed", e);
      });
    },
    loadPrivateMessage(minId) {
      this.$store.commit("loadingPrivateMsg", true);
      this.$http({
        url: "/message/private/loadMessage?minId=" + minId,
        method: 'get'
      }).then((msgInfos) => {
        msgInfos.forEach((msgInfo) => {
          msgInfo.selfSend = msgInfo.sendId == this.$store.state.userStore.userInfo.id;
          let friendId = msgInfo.selfSend ? msgInfo.recvId : msgInfo.sendId;
          let friend = this.$store.state.friendStore.friends.find((f) => f.id == friendId);
          if (friend) {
            this.insertPrivateMessage(friend, msgInfo);
          }
        });
        if (msgInfos.length == 100) {
          // Continue fetching
          this.loadPrivateMessage(msgInfos[99].id);
        } else {
          this.$store.commit("loadingPrivateMsg", false);
        }
      });
    },
    loadGroupMessage(minId) {
      this.$store.commit("loadingGroupMsg", true);
      this.$http({
        url: "/message/group/loadMessage?minId=" + minId,
        method: 'get'
      }).then((msgInfos) => {
        msgInfos.forEach((msgInfo) => {
          msgInfo.selfSend = msgInfo.sendId == this.$store.state.userStore.userInfo.id;
          let groupId = msgInfo.groupId;
          let group = this.$store.state.groupStore.groups.find((g) => g.id == groupId);
          if (group) {
            this.insertGroupMessage(group, msgInfo);
          }
        });
        if (msgInfos.length == 100) {
          // Continue fetching
          this.loadGroupMessage(msgInfos[99].id);
        } else {
          this.$store.commit("loadingGroupMsg", false);
        }
      });
    },
    handlePrivateMessage(msg) {
      // Mark whether this message is sent by oneself
      msg.selfSend = msg.sendId == this.$store.state.userStore.userInfo.id;
      // Friend ID
      let friendId = msg.selfSend ? msg.recvId : msg.sendId;
      // Message read handling
      if (msg.type == this.$enums.MESSAGE_TYPE.READED) {
        if (msg.selfSend) {
          // I've read the other party's message, reset the unread count
          let chatInfo = {
            type: 'PRIVATE',
            targetId: friendId
          };
          this.$store.commit("resetUnreadCount", chatInfo);
        } else {
          // The other party has read my message, change the message status to read
          this.$store.commit("readedMessage", friendId);
        }
        return;
      }

      this.loadFriendInfo(friendId).then((friend) => {
        this.insertPrivateMessage(friend, msg);
      });
    },
    insertPrivateMessage(friend, msg) {
      // WebRTC signaling
      if (msg.type >= this.$enums.MESSAGE_TYPE.RTC_CALL &&
          msg.type <= this.$enums.MESSAGE_TYPE.RTC_CANDIDATE) {
        // Call
        if (msg.type == this.$enums.MESSAGE_TYPE.RTC_CALL ||
            msg.type == this.$enums.MESSAGE_TYPE.RTC_CANCEL) {
          this.$store.commit("showVideoAcceptorBox", friend);
          this.$refs.videoAcceptor.handleMessage(msg);
        } else {
          this.$refs.videoAcceptor.close();
          this.$refs.privateVideo.handleMessage(msg);
        }
        return;
      }

      let chatInfo = {
        type: 'PRIVATE',
        targetId: friend.id,
        showName: friend.nickName,
        headImage: friend.headImage
      };
      // Open chat session
      this.$store.commit("openChat", chatInfo);
      // Insert message
      this.$store.commit("insertMessage", msg);
      // Play notification sound
      if (!msg.selfSend && msg.status != this.$enums.MESSAGE_STATUS.READED) {
        this.playAudioTip();
      }
    },
    handleGroupMessage(msg) {
      // Mark whether this message is sent by oneself
      msg.selfSend = msg.sendId == this.$store.state.userStore.userInfo.id;
      let groupId = msg.groupId;
      // Message read handling
      if (msg.type == this.$enums.MESSAGE_TYPE.READED) {
        // I've read the other party's message, reset the unread count
        let chatInfo = {
          type: 'GROUP',
          targetId: groupId
        };
        this.$store.commit("resetUnreadCount", chatInfo);
        return;
      }
      this.loadGroupInfo(groupId).then((group) => {
        // Insert group chat message
        this.insertGroupMessage(group, msg);
      });
    },
    insertGroupMessage(group, msg) {
      let chatInfo = {
        type: 'GROUP',
        targetId: group.id,
        showName: group.remark,
        headImage: group.headImageThumb
      };
      // Open chat session
      this.$store.commit("openChat", chatInfo);
      // Insert message
      this.$store.commit("insertMessage", msg);
      // Play notification sound
      if (!msg.selfSend && msg.status != this.$enums.MESSAGE_STATUS.READED) {
        this.playAudioTip();
      }
    },
    onExit() {
      this.$wsApi.close(3000);
      sessionStorage.removeItem('accessToken');
      location.href = '/';
    },
    playAudioTip() {
      if (new Date() - this.lastPlayAudioTime > 1000) {
        this.lastPlayAudioTime = new Date();
        let audio = new Audio();
        let url = require(`@/assets/audio/tip.wav`);
        audio.src = url;
        audio.play();
      }
    },
    showSetting() {
      this.showSettingDialog = true;
    },
    closeSetting() {
      this.showSettingDialog = false;
    },
    loadFriendInfo(id) {
      return new Promise((resolve, reject) => {
        let friend = this.$store.state.friendStore.friends.find((f) => f.id == id);
        if (friend) {
          resolve(friend);
        } else {
          this.$http({
            url: `/friend/find/${id}`,
            method: 'get'
          }).then((friend) => {
            this.$store.commit("addFriend", friend);
            resolve(friend);
          });
        }
      });
    },
    loadGroupInfo(id) {
      return new Promise((resolve, reject) => {
        let group = this.$store.state.groupStore.groups.find((g) => g.id == id);
        if (group) {
          resolve(group);
        } else {
          this.$http({
            url: `/group/find/${id}`,
            method: 'get'
          }).then((group) => {
            resolve(group);
            this.$store.commit("addGroup", group);
          });
        }
      });
    }
  },
  computed: {
    uiStore() {
      return this.$store.state.uiStore;
    },
    unreadCount() {
      let unreadCount = 0;
      let chats = this.$store.state.chatStore.chats;
      chats.forEach((chat) => {
        unreadCount += chat.unreadCount;
      });
      return unreadCount;
    }
  },
  watch: {
    unreadCount: {
      handler(newCount, oldCount) {
        let tip = newCount > 0 ? `${newCount} unread` : "";
        this.$elm.setTitleTip(tip);
      },
      immediate: true
    }
  },
  mounted() {
    this.init();
  },
  unmounted() {
    this.$wsApi.close();
  }
}
</script>

<style scoped lang="scss">
// Define Ruby Gem color style
$ruby-red-base: #9b111e; // Ruby Red
$ruby-red-light: lighten($ruby-red-base, 15%); // Light Ruby Red
$cartoon-yellow: #ffd700; // Cartoon-style yellow for highlights
$ruby-text-color: #fff; // Text color in Ruby Gem style

.navi-bar {
  background: $ruby-red-base;
  padding: 10px;
  padding-top: 50px;

  .el-menu {
    border: none;
    flex: 1;
    background-color: $ruby-red-base;
    margin-top: 30px;

    .el-menu-item {
      margin: 25px 0;
      transition: transform 0.3s ease;
      color: $ruby-red-light !important;
      background-color: $ruby-red-base;
      &:hover {
        transform: scale(2.0);
      }

      span {
        font-size: 24px !important;
        color: $ruby-text-color;

        &:hover {
          color: $ruby-red-light !important;
        }
      }

      .unread-text {
        position: absolute;
        line-height: 20px;
        background-color: $cartoon-yellow;
        color: $ruby-red-base;
        box-shadow: 0 2px 4px rgba(0, 0, 0, .15);
        left: 36px;
        top: 7px;
        border-radius: 30px;
        padding: 0 5px;
        font-size: 10px;
        text-align: center;
        white-space: nowrap;
        border: 1px solid #f1e5e5;
      }
    }
  }

  .exit-box {
    position: absolute;
    width: 60px;
    bottom: 40px;
    color: $ruby-text-color;
    font-size: 24px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s ease;
    &:hover {
      color: $ruby-red-light !important;
      transform: scale(2.0);
    }
  }
}

.content-box {
  padding: 0;
  background-color: #E9EEF3;
  color: #333;
  text-align: center;
}

.head-image {
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.2);
  }
}
</style>
