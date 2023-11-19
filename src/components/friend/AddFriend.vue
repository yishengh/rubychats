<template>
  <el-dialog title="Add Friend" :visible.sync="dialogVisible" width="30%" :before-close="onClose">
    <el-input  placeholder="Enter username or nickname, show up to 20 results" class="input-with-select" v-model="searchText" @keyup.enter.native="onSearch()">
      <el-button slot="append" icon="el-icon-search" @click="onSearch()"></el-button>
    </el-input>
    <el-scrollbar style="height:400px">
      <div v-for="(user) in users" :key="user.id" v-show="user.id != $store.state.userStore.userInfo.id">
        <div class="item">
          <div class="avatar">
            <head-image :name="user.nickName"
                        :url="user.headImage"
                        :online="user.online"
            ></head-image>
          </div>
          <div class="add-friend-text">
            <div class="text-user-name">
              <div>{{user.userName}}</div>
              <div :class="user.online ? 'online-status  online':'online-status'">{{ user.online?"[Online]":"[Offline]"}}</div>
            </div>
            <div class="text-nick-name">
              <div>Nickname: {{user.nickName}}</div>
            </div>
          </div>
          <el-button type="success" size="small" v-show="!isFriend(user.id)" plain @click="onAddFriend(user)">Add</el-button>
          <el-button type="info" size="small" v-show="isFriend(user.id)" plain disabled>Added</el-button>
        </div>
      </div>
    </el-scrollbar>
  </el-dialog>
</template>

<script>
import HeadImage from '../common/HeadImage.vue'


export default {
  name: "addFriend",
  components:{HeadImage},
  data() {
    return {
      users: [],
      searchText: ""
    }
  },
  props: {
    dialogVisible: {
      type: Boolean
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    onSearch() {
      this.$http({
        url: "/user/findByName",
        method: "get",
        params: {
          name: this.searchText
        }
      }).then((data) => {
        this.users = data;
      })
    },
    onAddFriend(user){
      this.$http({
        url: "/friend/add",
        method: "post",
        params: {
          friendId: user.id
        }
      }).then((data) => {
        this.$message.success("Added successfully. The other person is now your friend");
        let friend = {
          id:user.id,
          nickName: user.nickName,
          headImage: user.headImage,
          online: user.online
        }
        this.$store.commit("addFriend",friend);
      })
    },
    isFriend(userId){
      let friends = this.$store.state.friendStore.friends;
      let friend = friends.find((f)=> f.id==userId);
      return friend != undefined;
    }
  }
}
</script>

<style  lang="scss">
.el-dialog {
  min-width: 400px;
}
.item {
  height: 65px;
  display: flex;
  position: relative;
  padding-left: 15px;
  align-items: center;
  padding-right: 25px;

  .add-friend-text {
    margin-left: 15px;
    flex: 3;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;

    .text-user-name{
      display: flex;
      flex-direction: row;
      font-weight: 600;
      font-size: 16px;
      line-height: 25px;

      .online-status{
        font-size: 12px;
        font-weight: 600;
        &.online{
          color: #5fb878;
        }
      }
    }

    .text-nick-name{
      display: flex;
      flex-direction: row;
      font-size: 12px;
      line-height: 20px;
    }

  }
}
</style>
