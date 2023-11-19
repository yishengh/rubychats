module.exports = {

  devServer: {
    proxy: {
      '/api': {
        target: 'http://173.249.206.87:8888',
        changeOrigin: true,
        ws: false,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
 
}
