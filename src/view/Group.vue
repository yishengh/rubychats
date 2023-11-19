<template>
  <el-container class="group-page">
    <el-aside width="260px" class="group-list-box">
      <div class="group-list-header">
        <div class="group-list-search">
          <el-input width="200px" placeholder="Search group chat" v-model="searchText">
            <el-button slot="append" icon="el-icon-search"></el-button>
          </el-input>
        </div>
        <el-button plain icon="el-icon-plus" style="border: none; padding: 12px; font-size: 20px;color: black;"
                   title="Create group chat" @click="onCreateGroup()"></el-button>
      </div>
      <el-scrollbar class="group-list-items">
        <div v-for="(group,index) in groupStore.groups" :key="index">
          <group-item v-show="group.remark.startsWith(searchText)" :group="group"
                      :active="index === groupStore.activeIndex" @click.native="onActiveItem(group,index)">
          </group-item>
        </div>
      </el-scrollbar>
    </el-aside>
    <el-container class="group-box">
      <div class="group-header" v-show="activeGroup.id">
        {{activeGroup.remark}} ({{groupMembers.length}})
      </div>
      <el-scrollbar class="group-container">
        <div v-show="activeGroup.id">
          <div class="group-info">
            <div>
              <file-upload v-show="isOwner" class="avatar-uploader" :action="imageAction"
                           :showLoading="true" :maxSize="maxSize" @success="onUploadSuccess"
                           :fileTypes="['image/jpeg', 'image/png', 'image/jpg','image/webp']">
                <img v-if="activeGroup.headImage" :src="activeGroup.headImage" class="avatar">
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </file-upload>
              <head-image v-show="!isOwner" class="avatar" :size="200"
                          :url="activeGroup.headImage"
                          :name="activeGroup.remark">
              </head-image>
              <el-button class="send-btn" icon="el-icon-chat-dot-round" type="primary" @click="onSendMessage()">Send Message</el-button>
            </div>
            <el-form class="group-form" label-width="130px" :model="activeGroup" :rules="rules"
                     ref="groupForm">
              <el-form-item label="Group Name" prop="name">
                <el-input v-model="activeGroup.name" :disabled="!isOwner" maxlength="20"></el-input>
              </el-form-item>
              <el-form-item label="Group Owner">
                <el-input :value="ownerName" disabled></el-input>
              </el-form-item>
              <el-form-item label="Remark">
                <el-input v-model="activeGroup.remark" placeholder="Remarks visible only to yourself"
                          maxlength="20"></el-input>
              </el-form-item>
              <el-form-item label="My Nickname">
                <el-input v-model="activeGroup.aliasName" placeholder="" maxlength="20"></el-input>
              </el-form-item>
              <el-form-item label="Group Notice">
                <el-input v-model="activeGroup.notice" :disabled="!isOwner" type="textarea"
                          maxlength="1024" placeholder="Not set by the group owner"></el-input>
              </el-form-item>
              <div>
                <el-button type="success" @click="onSaveGroup()">Submit</el-button>
                <el-button type="danger" v-show="!isOwner" @click="onQuit()">Leave Group</el-button>
                <el-button type="danger" v-show="isOwner" @click="onDissolve()">Dissolve Group</el-button>
              </div>
            </el-form>
          </div>
          <el-divider content-position="center"></el-divider>
          <el-scrollbar style="height:200px;">
            <div class="group-member-list">
              <div v-for="(member) in groupMembers" :key="member.id">
                <group-member v-show="!member.quit" class="group-member" :member="member"
                              :showDel="isOwner&&member.userId!=activeGroup.ownerId"
                              @del="onKick"></group-member>
              </div>
              <div class="group-invite">
                <div class="invite-member-btn" title="Invite friends to the group chat" @click="onInviteMember()">
                  <i class="el-icon-plus"></i>
                </div>
                <div class="invite-member-text">Invite</div>
                <add-group-member :visible="showAddGroupMember" :groupId="activeGroup.id"
                                  :members="groupMembers" @reload="loadGroupMembers"
                                  @close="onCloseAddGroupMember"></add-group-member>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </el-scrollbar>
    </el-container>
  </el-container>
</template>

<script>
import GroupItem from '../components/group/GroupItem';
import FileUpload from '../components/common/FileUpload';
import GroupMember from '../components/group/GroupMember.vue';
import AddGroupMember from '../components/group/AddGroupMember.vue';
import HeadImage from '../components/common/HeadImage.vue';

export default {
  name: "group",
  components: {
    GroupItem,
    GroupMember,
    FileUpload,
    AddGroupMember,
    HeadImage
  },
  data() {
    return {
      searchText: "",
      maxSize: 5 * 1024 * 1024,
      activeGroup: {},
      groupMembers: [],
      showAddGroupMember: false,
      rules: {
        name: [{
          required: true,
          message: 'Please enter the group chat name',
          trigger: 'blur'
        }]
      }
    };
  },
  methods: {
    onCreateGroup() {
      this.$prompt('Please enter the group chat name', 'Create Group Chat', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        inputPattern: /\S/,
        inputErrorMessage: 'Please enter the group chat name'
      }).then((o) => {
        let userInfo = this.$store.state.userStore.userInfo;
        let data = {
          name: o.value,
          remark: o.value,
          aliasName: userInfo.name,
          ownerId: userInfo.id
        }
        this.$http({
          url: `/group/create?groupName=${o.value}`,
          method: 'post',
          data: data
        }).then((group) => {
          this.$store.commit("addGroup", group);
        })
      })
    },
    onActiveItem(group, index) {
      this.$store.commit("activeGroup", index);
      // Create a deep copy of the store data since we cannot directly modify it
      this.activeGroup = JSON.parse(JSON.stringify(group));
      // Reload group members
      this.loadGroupMembers();
    },
    onInviteMember() {
      this.showAddGroupMember = true;
    },
    onCloseAddGroupMember() {
      this.showAddGroupMember = false;
    },
    onUploadSuccess(res) {
      this.activeGroup.headImage = res.data.originUrl;
      this.activeGroup.headImageThumb = res.data.thumbUrl;
    },
    onSaveGroup() {
      this.$refs['groupForm'].validate((valid) => {
        if (valid) {
          let vo = this.activeGroup;
          this.$http({
            url: "/group/modify",
            method: "put",
            data: vo
          }).then((group) => {
            this.$store.commit("updateGroup", group);
            this.$message.success("Successfully modified");
          })
        }
      });
    },
    onDissolve() {
      this.$confirm('Are you sure you want to dissolve the group chat?', 'Confirm Dissolution', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/group/delete/${this.activeGroup.id}`,
          method: 'delete'
        }).then(() => {
          this.$message.success(`Group chat '${this.activeGroup.name}' dissolved`);
          this.$store.commit("removeGroup", this.activeGroup.id);
          this.$store.commit("removeGroupChat", this.activeGroup.id);
          this.reset();
        });
      })
    },
    onKick(member) {
      this.$confirm(`Are you sure you want to remove member '${member.aliasName}' from the group chat?`, 'Confirm Removal', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/group/kick/${this.activeGroup.id}`,
          method: 'delete',
          params: {
            userId: member.userId
          }
        }).then(() => {
          this.$message.success(`${member.aliasName} has been removed from the group chat`);
          member.quit = true;
        });
      })
    },
    onQuit() {
      this.$confirm('After leaving the group chat, you will no longer receive messages from the group. Are you sure you want to leave?', 'Confirm Exit', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: `/group/quit/${this.activeGroup.id}`,
          method: 'delete'
        }).then(() => {
          this.$store.commit("removeGroup", this.activeGroup.id);
          this.$store.commit("removeGroupChat", this.activeGroup.id);
          this.reset();
        });
      })
    },
    onSendMessage() {
      let chat = {
        type: 'GROUP',
        targetId: this.activeGroup.id,
        showName: this.activeGroup.remark,
        headImage: this.activeGroup.headImage,
      };
      this.$store.commit("openChat", chat);
      this.$store.commit("activeChat", 0);
      this.$router.push("/home/chat");
    },
    loadGroupMembers() {
      this.$http({
        url: `/group/members/${this.activeGroup.id}`,
        method: "get"
      }).then((members) => {
        this.groupMembers = members;
      })
    },
    reset() {
      this.activeGroup = {};
      this.groupMembers = [];
    }
  },
  computed: {
    groupStore() {
      return this.$store.state.groupStore;
    },
    ownerName() {
      let member = this.groupMembers.find((m) => m.userId == this.activeGroup.ownerId);
      return member && member.aliasName;
    },
    isOwner() {
      return this.activeGroup.ownerId == this.$store.state.userStore.userInfo.id;
    },
    imageAction() {
      return `${process.env.VUE_APP_BASE_API}/image/upload`;
    }
  },
  mounted() {
    if (this.groupStore.activeIndex >= 0) {
      let activeGroup = this.groupStore.groups[this.groupStore.activeIndex];
      // Create a deep copy of the store data since we cannot directly modify it
      this.activeGroup = JSON.parse(JSON.stringify(activeGroup));
      // Load group members
      this.loadGroupMembers();
    }
  }
}
</script>

<style lang="scss">
.group-page {
  .group-list-box {
    display: flex;
    flex-direction: column;
    border: #dddddd solid 1px;
    background: white;

    .group-list-header {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 5px;
      background-color: white;

      .group-list-search {
        flex: 1;
      }
    }

    .group-list-items {
      flex: 1;
    }
  }

  .group-box {
    display: flex;
    flex-direction: column;
    border: #dddddd solid 1px;

    .group-header {
      width: 100%;
      height: 50px;
      padding: 5px;
      line-height: 50px;
      font-size: 20px;
      font-weight: 600;
      text-align: left;
      text-indent: 10px;
      background-color: white;
      border: #dddddd solid 1px;
    }

    .group-container {
      padding: 20px;
      .group-info {
        display: flex;
        padding: 5px 20px;

        .group-form {
          flex: 1;
          padding-left: 40px;
          max-width: 700px;
        }

        .avatar-uploader {
          text-align: left;

          .el-upload {
            border: 1px dashed #d9d9d9 !important;
							border-radius: 6px;
							cursor: pointer;
							position: relative;
							overflow: hidden;
						}

						.el-upload:hover {
							border-color: #409EFF;
						}

						.avatar-uploader-icon {
							font-size: 28px;
							color: #8c939d;
							width: 200px;
							height: 200px;
							line-height: 200px;
							text-align: center;
						}

						.avatar {
							width: 200px;
							height: 200px;
							display: block;
						}
					}

					.send-btn {
						margin-top: 20px;
					}
				}

				.group-member-list {
					padding: 5px 20px;
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					font-size: 16px;
					text-align: center;

					.group-member {
						margin-right: 15px;
					}

					.group-invite {
						display: flex;
						flex-direction: column;
						align-items: center;
						width: 60px;

						.invite-member-btn {
							width: 100%;
							height: 60px;
							line-height: 60px;
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
			}
		}
	}
</style>