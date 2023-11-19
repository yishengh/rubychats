<template>
  <el-container class="friend-page">
    <el-aside width="260px" class="friend-list-box">
      <div class="friend-list-header">
        <div class="friend-list-search">
          <el-input width="200px" placeholder="Search friends" v-model="searchText">
            <el-button slot="append" icon="el-icon-search"></el-button>
          </el-input>
        </div>
        <el-button plain icon="el-icon-plus" style="border: none; padding:12px; font-size: 20px;color: black;"
                   title="Add Friend" @click="onShowAddFriend()"></el-button>
        <add-friend :dialogVisible="showAddFriend" @close="onCloseAddFriend">
        </add-friend>
      </div>
      <el-scrollbar class="friend-list-items">
        <div v-for="(friend,index) in $store.state.friendStore.friends" :key="index">
          <friend-item v-show="friend.nickName.startsWith(searchText)" :index="index"
                       :active="index === $store.state.friendStore.activeIndex" @chat="onSendMessage(friend)"
                       @delete="onDelItem(friend,index)" @click.native="onActiveItem(friend,index)">
          </friend-item>
        </div>
      </el-scrollbar>
    </el-aside>
    <el-container class="friend-box">
      <div class="friend-header" v-show="userInfo.id">
        {{userInfo.nickName}}
      </div>
      <div v-show="userInfo.id">
        <div class="friend-detail">
          <head-image :size="200"
                      :name="userInfo.nickName"
                      :url="userInfo.headImage"
                      @click.native="showFullImage()"></head-image>
          <div>
            <div class="info-item">
              <el-descriptions title="Friend Information" class="description" :column="1">
                <el-descriptions-item label="Username">{{ userInfo.userName }}
                </el-descriptions-item>
                <el-descriptions-item label="Nickname">{{ userInfo.nickName }}
                </el-descriptions-item>
                <el-descriptions-item label="Gender">{{ userInfo.sex==0?"Male":"Female" }}</el-descriptions-item>
                <el-descriptions-item label="Signature">{{ userInfo.signature }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <div class="friend-btn-group">
              <el-button v-show="isFriend" icon="el-icon-chat-dot-round" type="primary"  @click="onSendMessage(userInfo)">Send Message</el-button>
              <el-button v-show="!isFriend" icon="el-icon-plus" type="primary"  @click="onAddFriend(userInfo)">Add as Friend</el-button>
              <el-button v-show="isFriend" icon="el-icon-delete"  type="danger" @click="onDelItem(userInfo,friendStore.activeIndex)">Remove Friend</el-button>
            </div>
          </div>
        </div>
        <el-divider content-position="center"></el-divider>
      </div>
    </el-container>
  </el-container>
</template>

<script>
import FriendItem from "../components/friend/FriendItem.vue";
import AddFriend from "../components/friend/AddFriend.vue";
import HeadImage from "../components/common/HeadImage.vue";

export default {
  name: "friend",
  components: {
    FriendItem,
    AddFriend,
    HeadImage
  },
  data() {
    return {
      searchText: "",
      showAddFriend: false,
      userInfo: {}
    };
  },
  methods: {
    onShowAddFriend() {
      this.showAddFriend = true;
    },
    onCloseAddFriend() {
      this.showAddFriend = false;
    },
    onActiveItem(friend, index) {
      this.$store.commit("activeFriend", index);
      this.loadUserInfo(friend, index);
    },
    onDelItem(friend, index) {
      this.$confirm(`Are you sure you want to remove the friend '${friend.nickName}'?`, 'Confirm Removal', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/friend/delete/${friend.id}`,
          method: 'delete'
        }).then((data) => {
          this.$message.success("Friend removed successfully");
          this.$store.commit("removeFriend", index);
          this.$store.commit("removePrivateChat", friend.id);
        });
      });
    },
    onAddFriend(user) {
      this.$http({
        url: "/friend/add",
        method: "post",
        params: {
          friendId: user.id
        }
      }).then((data) => {
        this.$message.success("Added successfully, the other person is now your friend");
        let friend = {
          id: user.id,
          nickName: user.nickName,
          headImage: user.headImage,
          online: user.online
        };
        this.$store.commit("addFriend", friend);
      });
    },
    onSendMessage(user) {
      let chat = {
        type: 'PRIVATE',
        targetId: user.id,
        showName: user.nickName,
        headImage: user.headImage,
      };
      this.$store.commit("openChat", chat);
      this.$store.commit("activeChat", 0);
      this.$router.push("/home/chat");
    },
    showFullImage() {
      if (this.userInfo.headImage) {
        this.$store.commit('showFullImageBox', this.userInfo.headImage);
      }
    },
    updateFriendInfo(friend, user, index) {
      // Cannot directly modify store data, create a deep copy of store data
      friend = JSON.parse(JSON.stringify(friend));
      friend.headImage = user.headImageThumb;
      friend.nickName = user.nickName;
      this.$http({
        url: "/friend/update",
        method: "put",
        data: friend
      }).then(() => {
        this.$store.commit("updateFriend", friend);
        this.$store.commit("updateChatFromFriend", user);
      });
    },
    loadUserInfo(friend, index) {
      this.$http({
        url: `/user/find/${friend.id}`,
        method: 'get'
      }).then((user) => {
        this.userInfo = user;
        // If the friend's avatar and nickname have changed, update them
        if (user.headImageThumb != friend.headImage ||
            user.nickName != friend.nickName) {
          this.updateFriendInfo(friend, user, index);
        }
      });
    }
  },
  computed: {
    friendStore() {
      return this.$store.state.friendStore;
    },
    isFriend() {
      return this.friendStore.friends.find((f) => f.id == this.userInfo.id);
    }
  },
  mounted() {
    if (this.friendStore.activeIndex >= 0) {
      let friend = this.friendStore.friends[this.friendStore.activeIndex];
      this.loadUserInfo(friend, this.friendStore.activeIndex);
    }
  }
}
</script>

<style scoped lang="scss">
.friend-page {
  .friend-list-box {
    display: flex;
    flex-direction: column;
    border: #dddddd solid 1px;
    background: white;

    .friend-list-header {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 5px;
      background-color: white;

      .friend-list-search {
        flex: 1;
      }
    }

    .friend-list-items {
      flex: 1;
    }
  }

  .friend-box {
    display: flex;
    flex-direction: column;
    border: #dddddd solid 1px;

    .friend-header {
      width: 100%;
      height: 50px;
      padding: 5px;
      line-height: 50px;
      font-size: 20px;
      text-align: left;
      text-indent: 10px;
      font-weight: 600;
      background-color: white;
      border: #dddddd solid 1px;
    }

    .friend-detail {
      display: flex;
      padding: 50px 80px 20px 80px;
      text-align: center;

      .info-item {
        margin-left: 20px;
        background-color: #ffffff;
      }

      .description {
        padding: 20px 20px 0px 20px;
      }
    }

    .friend-btn-group {
      text-align: left !important;
      padding: 20px;
    }
  }
}
</style>
