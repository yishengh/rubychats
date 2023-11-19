<template>
  <el-dialog title="Invite Friends" :visible.sync="visible" width="50%" :before-close="onClose">
    <div class="agm-container">
      <div class="agm-l-box">
        <el-input width="200px" placeholder="Search friends" class="input-with-select" v-model="searchText" @keyup.enter.native="onSearch()">
          <el-button slot="append" icon="el-icon-search" @click="onSearch()"></el-button>
        </el-input>
        <el-scrollbar style="height:400px;">
          <div v-for="(friend,index) in friends" :key="friend.id">
            <friend-item v-show="friend.nickName.startsWith(searchText)" :showDelete="false" @click.native="onSwitchCheck(friend)"
                         :menu="false" :friend="friend" :index="index" :active="index === activeIndex">
              <el-checkbox :disabled="friend.disabled" @click.native.stop="" class="agm-friend-checkbox" v-model="friend.isCheck"
                           size="medium"></el-checkbox>
            </friend-item>
          </div>
        </el-scrollbar>
      </div>
      <div class="agm-r-box">
        <div class="agm-select-tip"> Selected {{checkCount}} friends</div>
        <el-scrollbar style="height:400px;">
          <div v-for="(friend,index) in friends" :key="friend.id">
            <friend-item v-if="friend.isCheck && !friend.disabled" :friend="friend"
                         :index="index" :active="false" @del="onRemoveFriend(friend,index)"
                         :menu="false">
            </friend-item>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
			<el-button @click="onClose()">Cancel</el-button>
			<el-button type="primary" @click="onOk()">Confirm</el-button>
		</span>
  </el-dialog>
</template>

<script>
import FriendItem from '../friend/FriendItem.vue';

export default {
  name: "addGroupMember",
  components: {
    FriendItem
  },
  data() {
    return {
      searchText: "",
      activeIndex: -1,
      friends: []
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    onOk() {

      let inviteVO = {
        groupId: this.groupId,
        friendIds: []
      }
      this.friends.forEach((f) => {
        if (f.isCheck && !f.disabled) {
          inviteVO.friendIds.push(f.id);
        }
      })
      if (inviteVO.friendIds.length > 0) {
        this.$http({
          url: "/group/invite",
          method: 'post',
          data: inviteVO
        }).then(() => {
          this.$message.success("Invite successful");
          this.$emit("reload");
          this.$emit("close");
        })
      }
    },
    onRemoveFriend(friend, index) {
      friend.isCheck = false;
    },
    onSwitchCheck(friend) {
      if (!friend.disabled) {
        friend.isCheck = !friend.isCheck
      }
    }
  },
  props: {
    visible: {
      type: Boolean
    },
    groupId: {
      type: Number
    },
    members: {
      type: Array
    }
  },
  computed: {
    checkCount() {
      return this.friends.filter((f) => f.isCheck && !f.disabled).length;
    }
  },
  watch: {
    visible: function(newData, oldData) {
      if (newData) {
        this.friends = [];
        this.$store.state.friendStore.friends.forEach((f) => {
          let friend = JSON.parse(JSON.stringify(f))
          let m = this.members.filter((m) => !m.quit)
              .find((m) => m.userId == f.id);
          console.log(m);
          if (m) {
            // Friend is already in the group
            friend.disabled = true;
            friend.isCheck = true
          } else {
            friend.disabled = false;
            friend.isCheck = false;
          }
          this.friends.push(friend);
        })
      }
    }
  }

}
</script>

<style lang="scss">
.agm-container {
  display: flex;

  .agm-l-box {
    flex: 1;
    border: #dddddd solid 1px;

    .el-checkbox {
      display: flex;
      align-items: center;

      // Modify the checkbox size
      .el-checkbox__inner {
        width: 20px;
        height: 20px;

        // Modify the size and position of the checkmark
        &::after {
          height: 12px;
          left: 7px;
        }
      }

      // Modify the text color when clicked
      .el-checkbox__input.is-checked+.el-checkbox__label {
        color: #333333;
      }

      .el-checkbox__label {
        line-height: 20px;
        padding-left: 8px;
      }
    }

    .agm-friend-checkbox {
      margin-right: 20px;
    }
  }

  .agm-r-box {
    flex: 1;
    border: #dddddd solid 1px;

    .agm-select-tip {
      text-align: left;
      height: 40px;
      line-height: 40px;
      text-indent: 5px;
    }
  }
}
</style>
