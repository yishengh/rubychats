<template>
  <div class="login-view">
    <el-form class="login-form" :model="loginForm" status-icon :rules="rules" ref="loginForm" label-width="80px" @keyup.enter.native="submitForm('loginForm')">
      <div class="login-brand">Welcome to RubyChats</div>
      <el-form-item label="Username" prop="userName">
        <el-input type="userName" v-model="loginForm.userName" autocomplete="off" placeholder="Username" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item label="Password" prop="password">
        <el-input type="password" v-model="loginForm.password" autocomplete="off" placeholder="Password" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item class="form-buttons">
        <el-button type="primary" @click="submitForm('loginForm')" class="ruby-button">Log In</el-button>
        <el-button @click="resetForm('loginForm')" class="ruby-button">Clear</el-button>
      </el-form-item>
      <div class="register">
        <router-link to="/register" class="ruby-link">Sign up and get started!</router-link>
      </div>

      <!-- 版权信息 -->
      <div class="copyright-info">
        ©2023 Produced by Yisheng Huang
      </div>

      <!-- GitHub 标签 -->
      <div class="github-info">
        <i class="fab fa-github github-logo ruby-icon"></i> GitHub:
        <a href="https://github.com/yishengh/rubychats" target="_blank" class="ruby-link">yishengh/rubychats</a>
      </div>
    </el-form>
  </div>
</template>
<script>
export default {
  name: "login",
  data() {
    var checkUsername = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('Please enter your username'));
      }
      callback();
    };
    var checkPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please enter your password'));
      }
      callback();
    };
    return {
      loginForm: {
        terminal: this.$enums.TERMINAL_TYPE.WEB,
        userName: '',
        password: ''
      },
      rules: {
        userName: [{
          validator: checkUsername,
          trigger: 'blur'
        }],
        password: [{
          validator: checkPassword,
          trigger: 'blur'
        }]
      }
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$http({
            url: "/login",
            method: 'post',
            data: this.loginForm
          })
              .then((data) => {
                // Save password to cookie (not secure)
                this.setCookie('username', this.loginForm.userName);
                this.setCookie('password', this.loginForm.password);
                // Save tokens
                sessionStorage.setItem("accessToken", data.accessToken);
                sessionStorage.setItem("refreshToken", data.refreshToken);
                this.$message.success("Login successful");
                this.$router.push("/home/chat");
              });
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    // Get cookie
    getCookie(name) {
      let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
      let arr = document.cookie.match(reg);
      if (arr) {
        return unescape(arr[2]);
      }
      return '';
    },
    // Set cookie
    setCookie(name, value, expiredays) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + expiredays);
      document.cookie = name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate
          .toGMTString());
    },
    // Delete cookie
    delCookie(name) {
      var exp = new Date();
      exp.setTime(exp.getTime() - 1);
      var cval = this.getCookie(name);
      if (cval != null) {
        document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
      }
    }
  },
  mounted() {
    this.loginForm.userName = this.getCookie("username");
    // Storing passwords in cookies is not secure, but for temporary convenience
    this.loginForm.password = this.getCookie("password");
  }
};
</script>

<style scoped lang="scss">
.login-view {
  display: flex;
  flex-direction: column; /* 垂直布局 */
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: radial-gradient(circle, #ff5c4e, #ff7e5f, #ffbca1, #3498db);
  animation: gradientAnimation 10s infinite alternate;

  @keyframes gradientAnimation {
    0%, 100% {
      background-size: 150% 150%;
      background-position: 0% 0%;
    }
    50% {
      background-size: 200% 200%;
      background-position: 100% 100%;
    }
  }


  .login-form {
    font-family: 'Comic Sans MS', cursive, sans-serif;
    width: 300px;
    padding: 20px;
    background: #fff;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    overflow: hidden;
    text-align: center;

    .login-brand {
      background-color: #ff334f; // 红宝石卡通主题的品牌颜色
      color: #fff;
      border-bottom: 5px solid #ff1f3a;
      line-height: 1.5;
      margin-bottom: 15px;
      font-size: 20px;
      border-radius: 20px 20px 0 0;
      padding: 10px 0;
    }

    .el-form-item {
      margin-bottom: 20px;
    }


    .ruby-input {
      border-radius: 15px;
    }

    .ruby-button {
      border-radius: 15px;
      background-color: #ff334f;
      color: #fff;
      margin: 0 10px; // 为按钮添加间距
    }

    .register {
      margin-top: 20px;
      font-size: 14px;
      color: #ff334f;
    }

    .copyright-info,
    .github-info {
      text-align: center;
      color: #888;
      font-size: 12px;
      margin-top: 20px;
    }

    .ruby-link {
      color: #ff334f;
      text-decoration: underline;
    }

    .github-logo {
      // 可以根据需要替换为红宝石卡通主题的图标
    }

    .ruby-icon {
      color: #ff334f;
    }
  }
}
</style>
