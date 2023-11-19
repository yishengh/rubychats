<template>
  <el-upload :action="action" :headers="uploadHeaders" :accept="fileTypes == null ? '' : fileTypes.join(',')"
             :show-file-list="false" :on-success="onSuccess" :on-error="onError" :disabled="disabled" :before-upload="beforeUpload">
    <slot></slot>
  </el-upload>
</template>

<script>
export default {
  name: "fileUpload",
  data() {
    return {
      loading: null,
      uploadHeaders: { "accessToken": sessionStorage.getItem('accessToken') }
    }
  },
  props: {
    action: {
      type: String,
      required: true
    },
    fileTypes: {
      type: Array,
      default: null
    },
    maxSize: {
      type: Number,
      default: null
    },
    showLoading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onSuccess(res, file) {
      this.loading && this.loading.close();
      if (res.code == 200) {
        this.$emit("success", res.data, file);
      } else {
        this.$message.error(res.message);
        this.$emit("fail", res, file);
      }
    },
    onError(err, file) {
      this.$emit("fail", err, file);
    },
    beforeUpload(file) {
      // Validate file type
      if (this.fileTypes && this.fileTypes.length > 0) {
        let fileType = file.type;
        let t = this.fileTypes.find((t) => t.toLowerCase() === fileType);
        if (t === undefined) {
          this.$message.error(`File format error. Please upload files in the following formats: ${this.fileTypes.join("、")}`);
          return false;
        }
      }
      // Validate size
      if (this.maxSize && file.size > this.maxSize) {
        this.$message.error(`File size cannot exceed ${this.fileSizeStr}!`);
        return false;
      }
      // Show loading bar
      if (this.showLoading) {
        this.loading = this.$loading({
          lock: true,
          text: 'Uploading...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
      }
      this.$emit("before", file);
      return true;
    }
  },
  computed: {
    fileSizeStr() {
      if (this.maxSize > 1024 * 1024) {
        return Math.round(this.maxSize / 1024 / 1024) + "M";
      }
      if (this.maxSize > 1024) {
        return Math.round(this.maxSize / 1024) + "KB";
      }
      return this.maxSize + "B";
    }
  }
}
</script>

<style>
</style>
