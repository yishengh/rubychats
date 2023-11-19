<template>
  <div class="register-view">
    <el-form :model="registerForm" status-icon :rules="rules" ref="registerForm" label-width="80px" class="login-form">
      <div class="login-brand">Sign In to Your Account</div>
      <el-form-item label="Username" prop="userName">
        <el-input type="userName" v-model="registerForm.userName" autocomplete="off" placeholder="Username" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item label="NickName" prop="nickName">
        <el-input type="nickName" v-model="registerForm.nickName" autocomplete="off" placeholder="NickName" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item label="Password" prop="password">
        <el-input type="password" v-model="registerForm.password" autocomplete="off" placeholder="Password" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item label="Re-enter" prop="confirmPassword">
        <el-input type="password" v-model="registerForm.confirmPassword" autocomplete="off" placeholder="Confirm Password" class="ruby-input"></el-input>
      </el-form-item>
      <el-form-item class="form-buttons">
        <el-button type="primary" @click="submitForm('registerForm')" class="ruby-button">Register</el-button>
        <el-button @click="resetForm('registerForm')" class="ruby-button">Clear</el-button>
      </el-form-item>
      <div class="register">
        <router-link to="/login" class="ruby-link">Already have an account? Log in here!</router-link>
      </div>
    </el-form>
  </div>
</template>

<script>
export default {
  name: "login",
  data() {
    var checkUserName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('Please enter a username'));
      }
      callback();
    };
    var checkNickName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('Please enter a nickname'));
      }
      callback();
    };
    var checkPassword = (rule, value, callback) => {
      if (value === '') {
        return callback(new Error('Please enter a password'));
      }
      callback();
    };

    var checkConfirmPassword = (rule, value, callback) => {
      console.log("checkConfirmPassword");
      if (value === '') {
        return callback(new Error('Please enter a password'));
      }
      if (value != this.registerForm.password) {
        return callback(new Error('The two passwords entered do not match'));
      }
      callback();
    };

    return {
      registerForm: {
        userName: '',
        nickName: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        userName: [{
          validator: checkUserName,
          trigger: 'blur'
        }],
        nickName: [{
          validator: checkNickName,
          trigger: 'blur'
        }],
        password: [{
          validator: checkPassword,
          trigger: 'blur'
        }],
        confirmPassword: [{
          validator: checkConfirmPassword,
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
            url: "/register",
            method: 'post',
            data: this.registerForm
          })
              .then((data) => {
                this.$message.success("Registration successful!");
              })
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  }
}
</script>

<style scoped lang="scss">
.register-view {
  position: fixed;
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
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
      background-color: #ff334f;
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
      margin: 0 10px;
    }

    .register {
      margin-top: 20px;
      font-size: 14px;
      color: #ff334f;
    }

    .ruby-link {
      color: #ff334f;
      text-decoration: underline;
    }
  }
}
</style>
