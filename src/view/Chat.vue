<template>
  <el-container class="chat-page">
    <el-aside width="260px" class="chat-list-box">
      <div class="chat-list-header">
        <el-input width="200px" placeholder="Search" v-model="searchText" class="ruby-input">
          <el-button slot="append" icon="el-icon-search" class="ruby-button"></el-button>
        </el-input>
      </div>
      <div class="chat-list-loading" v-if="loading" v-loading="true" element-loading-text="Receiving messages..."
           element-loading-spinner="el-icon-loading" element-loading-background="#eee">
        <div class="chat-loading-box"></div>
      </div>
      <el-scrollbar class="chat-list-items">
        <div v-for="(chat, index) in chatStore.chats" :key="index">
          <chat-item v-show="chat.showName.startsWith(searchText)" :chat="chat" :index="index"
                     @click.native="onActiveItem(index)" @delete="onDelItem(index)" @top="onTop(index)"
                     :active="index === chatStore.activeIndex" class="ruby-chat-item"></chat-item>
        </div>
      </el-scrollbar>
    </el-aside>
    <el-container class="chat-box">
      <chat-box v-show="activeChat.targetId > 0" :chat="activeChat" class="ruby-chat-box"></chat-box>
    </el-container>
  </el-container>
</template>

<script>
import ChatItem from "../components/chat/ChatItem.vue";
import ChatBox from "../components/chat/ChatBox.vue";

export default {
  name: "chat",
  components: {
    ChatItem,
    ChatBox
  },
  data() {
    return {
      searchText: "",
      messageContent: "",
      group: {},
      groupMembers: []
    };
  },
  methods: {
    onActiveItem(index) {
      this.$store.commit("activeChat", index);
    },
    onDelItem(index) {
      this.$store.commit("removeChat", index);
    },
    onTop(chatIdx) {
      this.$store.commit("moveTop", chatIdx);
    },
  },
  computed: {
    chatStore() {
      return this.$store.state.chatStore;
    },
    activeChat() {
      let index = this.chatStore.activeIndex;
      let chats = this.chatStore.chats
      if (index >= 0 && chats.length > 0) {
        return chats[index];
      }
      // When no conversation is active, create an empty conversation to avoid console errors
      let emptyChat = {
        targetId: -1,
        showName: "",
        headImage: "",
        messages: []
      }
      return emptyChat;
    },
    loading() {
      return this.chatStore.loadingGroupMsg || this.chatStore.loadingPrivateMsg
    }
  }
}
</script>

<style lang="scss">
.chat-page {
  .chat-list-box {
    display: flex;
    flex-direction: column;
    border: #ddd solid 1px;
    background: white;
    width: 260px;

    .chat-list-header {
      padding: 10px;
      background-color: #fff;

      .ruby-input {
        border-radius: 15px;
        input {
          border: 1px solid #ddd;
          border-radius: 15px;
          background-color: #f5f5f5;
          color: #333;
        }
      }

      .ruby-button {
        border-radius: 10px;
        transition: transform 0.3s ease;
        background-color: #ff334f;
        color: #fff;
        //margin-left: -1px; /* Adjust the position of the button to align with the input */
        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .chat-list-loading {
      height: 50px;
      background-color: #eee;

      .chat-loading-box {
        height: 100%;
      }
    }

    .chat-list-items {
      flex: 1;
    }

    .ruby-chat-item {
      // Add styles specific to the chat item component, if needed
    }
  }

  .chat-box {
    // Add styles specific to the chat box component, if needed
  }
}
</style>
