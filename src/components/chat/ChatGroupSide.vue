<template>
  <div class="chat-group-side">
    <div class="group-side-search">
      <el-input placeholder="Search group members" v-model="searchText">
        <el-button slot="append" icon="el-icon-search"></el-button>
      </el-input>
    </div>
    <el-scrollbar class="group-side-scrollbar">
      <div class="group-side-member-list">
        <div class="group-side-invite">
          <div class="invite-member-btn" title="Invite friends to group chat" @click="showAddGroupMember=true">
            <i class="el-icon-plus"></i>
          </div>
          <div class="invite-member-text">Invite</div>
          <add-group-member :visible="showAddGroupMember" :groupId="group.id" :members="groupMembers" @reload="$emit('reload')"
                            @close="showAddGroupMember=false"></add-group-member>
        </div>
        <div v-for="(member) in groupMembers" :key="member.id">
          <group-member class="group-side-member" v-show="!member.quit && member.aliasName.startsWith(searchText)" :member="member"
                        :showDel="false"></group-member>
        </div>
      </div>
      <el-divider content-position="center"></el-divider>
      <el-form labelPosition="top" class="group-side-form" :model="group">
        <el-form-item label="Group Name">
          <el-input v-model="group.name" disabled maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="Group Owner">
          <el-input :value="ownerName" disabled></el-input>
        </el-form-item>
        <el-form-item label="Group Announcement">
          <el-input v-model="group.notice" disabled type="textarea" maxlength="1024" placeholder="Group owner has not set"></el-input>
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="group.remark" :disabled="!editing" placeholder="Remarks visible only to yourself" maxlength="20"></el-input>
        </el-form-item>
        <el-form-item label="My Nickname in this Group">
          <el-input v-model="group.aliasName" :disabled="!editing" placeholder="xx" maxlength="20"></el-input>
        </el-form-item>

        <div class="btn-group">
          <el-button v-show="editing" type="success" @click="onSaveGroup()">Submit</el-button>
          <el-button v-show="!editing" type="primary" @click="editing=!editing">Edit</el-button>
          <el-button type="danger" v-show="!isOwner" @click="onQuit()">Leave Group</el-button>
        </div>
      </el-form>
    </el-scrollbar>

  </div>
</template>

<script>
import AddGroupMember from '../group/AddGroupMember.vue';
import GroupMember from '../group/GroupMember.vue';

export default {
  name: "chatGroupSide",
  components: {
    AddGroupMember,
    GroupMember
  },
  data() {
    return {
      searchText: "",
      editing: false,
      showAddGroupMember: false
    }
  },
  props: {
    group: {
      type: Object
    },
    groupMembers: {
      type: Array
    }
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    loadGroupMembers() {
      this.$http({
        url: `/group/members/${this.group.id}`,
        method: "get"
      }).then((members) => {
        this.groupMembers = members;
      })
    },
    onSaveGroup() {
      let vo = this.group;
      this.$http({
        url: "/group/modify",
        method: "put",
        data: vo
      }).then((group) => {
        this.$store.commit("updateGroup", group);
        this.$emit('reload');
        this.$message.success("Modification successful");
      })
    },
    onQuit() {
      this.$confirm('After leaving the group, you will no longer receive messages in the group. Are you sure you want to leave?', 'Confirm leave?', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/group/quit/${this.group.id}`,
          method: 'delete'
        }).then(() => {
          this.$store.commit("removeGroup", this.group.id);
          this.$store.commit("activeGroup", -1);
          this.$store.commit("removeGroupChat", this.group.id);
        });
      })
    },

  },
  computed: {
    ownerName() {
      let member = this.groupMembers.find((m) => m.userId == this.group.ownerId);
      return member && member.aliasName;
    },
    isOwner() {
      return this.group.ownerId == this.$store.state.userStore.userInfo.id;
    }

  }
}
</script>

<style lang="scss">
.chat-group-side {
  position: relative;

  .group-side-member-list {
    padding: 10px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 16px;
    text-align: center;

    .group-side-member {
      margin-left: 15px;
    }

    .group-side-invite {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 50px;
      margin-left: 15px;

      .invite-member-btn {
        width: 100%;
        height: 50px;
        line-height: 50px;
        border: #cccccc solid 1px;
        font-size: 25px;
        cursor: pointer;
        box-sizing: border-box;

        &:hover {
          border: #aaaaaa solid 1px;
        }
      }

      .invite-member-text {
        font-size: 16px;
        text-align: center;
        width: 100%;
        height: 30px;
        line-height: 30px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden
      }
    }
  }

  .group-side-form {
    text-align: left;
    padding: 10px;
    height: 30%;

    .el-form-item {
      margin-bottom: 12px;

      .el-form-item__label {
        padding: 0;
        line-height: 30px;
      }

      .el-textarea__inner {
        min-height: 100px !important;
      }
    }

    .btn-group {
      text-align: center;
    }
  }

}
</style>
