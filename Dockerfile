# 使用官方的Node.js基础镜像
FROM node:14

# 在容器中创建一个工作目录
WORKDIR /app

# 将本地的package.json和package-lock.json文件复制到容器中
COPY package*.json ./

# 安装应用程序的依赖项
RUN npm install

# 将本地的所有文件复制到容器中（除了.dockerignore中指定的文件和目录）
COPY . .

# 构建Vue.js应用程序
RUN npm run build

# 暴露容器的80端口，可以根据应用程序的配置进行修改
EXPOSE 8080

# 定义容器启动时运行的命令
CMD ["npm", "run", "serve"]
