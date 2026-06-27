---
title: 从零开始的 Hexo 博客搭建
description: 一个 Hexo 博客的搭建教程，顺便记录一路折腾过去的东西
pubDatetime: 2025-02-13
slug: hexo-blog-setup
tags: ["教程"]
---

一个 Hexo 博客的搭建教程，顺便记录我一路折腾过去的东西

## 前置说明

操作系统：Windows 11

Hexo 版本：7.3.0

Node 版本：22.13.0

## 环境搭建

### Scoop

[Scoop](https://scoop.sh/) 是一个适用于 Windows 平台的命令行软件包管理器，类似于 Linux 的 `apt` 或 MacOS 的 `brew`

**它能够帮我们很好的简化环境搭建的过程**

所以在开始一切之前，可以看这篇文章下载 scoop

> [如何用 scoop 简化你的软件安装以及环境搭建](https://v1hz.blog/post/9382a5ca.html)

### Git

```bash
scoop install git
```

### Node.js

先下载 nodejs 的环境管理器

```bash
scoop install nvm
```

然后使用 nvm 下载 nodejs 的 LTS 版本并启用

```bash
nvm install lts
nvm list
nvm use <version>
```

如下

```bash
~
❯ nvm list

  * 22.13.0 (Currently using 64-bit executable)

~
❯ nvm use 22
Now using node v22.13.0 (64-bit)

~ took 2s
❯ node -v
v22.13.0
```

### Hexo

安装 `hexo-cli` 并检查是否安装成功

```bash
npm install -g hexo-cli
hexo -v
```

在你想存放博客的目录下执行以下命令，这会在目录下创建一个名为 blog 的文件夹，你也可以自定义文件夹的名字

```bash
hexo init blog
cd blog
npm install
```

然后在博客目录下运行 hexo 并访问 `http://localhost:4000/` 就可以看到一个最简单的博客页面

```bash
hexo s
```

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502130232164.png)

## 将博客部署到 Github Pages 上

> GitHub Pages 是 GitHub 提供的免费静态网站托管服务
>
> 可以直接从 GitHub 仓库部署 HTML、CSS 和 JavaScript 文件
>
> 用于个人博客、项目文档或其他静态网站

### 将 Git 和自己的 Github 账号关联

xxxxxxxxxx3 1extends:2 head:3   - <link rel="stylesheet" href="/css/custom.css">yml

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

使用 ssh 和 Github 通信，运行以下命令生成密钥

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

查看并复制密钥内容

```bash
cat ~/.ssh/id_ed25519.pub
```

登录 Github，在个人主页找到 `SSH and GPG keys`，点击 `New SSH key`，

随便写个名称然后将刚才复制的公钥内容粘贴到 `Key` 框内，最后点击 `Add SSH key`

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502130314161.png)

运行以下命令检查是否配置正确

```bash
ssh -T git@github.com
```

看到类似下面的信息就说明配置成功

```
Hi yourusername! You've successfully authenticated, but GitHub does not provide shell access.
```

之后你就可以通过 git 向仓库中提交文件了

### 创建博客仓库并与其关联

#### 创建 GitHub 仓库

在 Github 上创建一个公开的仓库，仓库名字为 `<your_github_name>.github.io`

其中 `your_github_name` 填写自己的 Github 用户名

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502130258147.png)

#### 获取 token

在 `Settings` 中找到 `Developer Settings` 然后按照如图所示进行选择

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502131440136.png)

然后 Note 栏随便填，Expiration 选择 never（也可以不选 never，但是后面 token 过期了要手动更新）

Select scopes 中勾选 repo 和 workflow

点击 Generate token，完成创建，复制生成的 token

> 注意：生成的 token 只会在创建时显示一次，所以要复制保存好

#### 配置 hexo

进入自己的博客目录，运行以下命令安装部署插件

```bash
npm install hexo-deployer-git --save
```

> npm 下载软件包有两种方式，一种为全局安装 `npm install <package> -g`，一种为本地安装 `npm install <package>`
>
> 全局安装时，npm 会将软件包安装在全局目录下，在系统任何位置都能调用安装的软件
>
> 本地安装时，npm 会将软件安装在当前目录下，只能在当前目录下调用安装的软件，
>
> 本地安装时，若加上 `--save`，安装的软件包会记录在当前目录下的 `package.json` 中，运行 `npm install` 便可一键安装所有被记录的软件包

编辑博客目录下的 `_config.yml` 文件，找到 `deploy` 项，修改为如下

其中 `<your_github_name>` 替换为自己的 Github 用户名，`<token>` 替换为刚才复制的 token

```yml
deploy:
  type: git
  repository: git@github.com:<your_github_name>/<your_github_name>.github.io.git
  branch: main
  token: <token>
```

然后运行以下命令即可将博客部署到 Github Pages

```bash
hexo g
hexo d
```

等待一小会儿，打开浏览器，访问 `http://your_github_name.github.io` 就可以看到自己的博客页面了

> hexo 的常用命令有
>
> `hexo s`：启动本地服务器，默认在 `http://localhost:4000/` 访问博客，可实时预览修改效果
>
> `hexo g`：生成静态文件，将 Markdown 文章转换为 HTML 并存放在 `public/` 目录中
>
> `hexo d`：部署博客，用于推送到 GitHub Pages
>
> `hexo clean`：清理 `public/` 和 `.deploy_git/` 目录，避免旧文件影响新的生成结果
>
> 一般要推送一次，通常会运行 `hexo clean && hexo g && hexo d`

## 使用与基本配置

### 配置博客页面

先了解一下 Hexo 的博客目录结构

```
blog/  # 你的 Hexo 博客根目录
├── .deploy_git/         # Hexo Git 部署时的缓存目录，存储远程仓库的 Git 相关数据
├── .github/             # GitHub 相关的配置文件（如 CI/CD 工作流）
├── node_modules/        # 依赖包目录，Hexo 及插件的所有依赖文件都存储在此
├── public/              # 生成的静态网页文件，`hexo generate` 生成的内容存放于此
├── scaffolds/           # 文章模板目录，创建新文章时会使用这些模板
├── source/              # 源文件目录，存放你的博客文章和资源
│   ├── _posts/          # 文章文件夹，存放 Markdown 格式的博文
│   └── images/          # 博客图片资源
├── themes/              # 主题目录，存放你的 Hexo 主题（如 Eureka 或 Solitude）
│   ├── eureka/          # Eureka 主题目录
│   └── solitude/        # Solitude 主题目录
├── _config.eureka.yml   # Eureka 主题的配置文件
├── _config.solitude.yml # Solitude 主题的配置文件
├── _config.yml          # Hexo 的全局配置文件，控制博客的基本设置
├── .gitignore           # Git 忽略文件，防止不必要的文件被提交
├── db.json              # Hexo 的缓存数据库，加快生成速度
├── package-lock.json    # 记录确切的 npm 依赖版本，保证环境一致
├── package.json         # 项目依赖描述文件，定义了 Hexo 及插件
```

博客页面的基础配置就是 `blog/_config.yml` ，里面配置各种博客信息

比如修改 `title` 为 `V1hZ's Blog`，顶部的标签页就会有相应的显示

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502131420161.png)

### 进行写作

如果你还不知道什么是 markdown，请看这个文档

> [Markdown 教程](https://markdown.com.cn/intro.html)

#### 创建一篇新文章

运行以下命令来创建一篇新文章，这会在 `blog/source/_post` 下创建一个 markdown 文件

```bash
hexo new "title"
```

在新建的 markdown 文件中完成写作后，运行 `hexo s` 就可以预览自己的新文章了

#### 使用 Typora 进行写作

推荐使用 [Typora](https://typora.io/) 进行 markdown 的写作

Typora 主题推荐 [Onelight](https://github.com/caolib/typora-onelight-theme) 和 [Phycat](https://github.com/sumruler/typora-theme-phycat)

![Onelight](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502131318963.png)

![Phycat](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502131318078.png)

Typora 还可以搭配 [PicGo](https://molunerfinn.com/PicGo/) 实现自动上传图片至图床，可以看这篇文章

> [搭建 PicGo 图床并在 Typora 中使用](https://v1hz.blog/post/a320eb10.html)

## 主题配置

### 下载并安装主题

在 [Hexo Themes](https://hexo.io/themes/) 中可以浏览已有的主题，进入主题的主页可以查看安装方法

一般都是将主题的仓库 clone 进 `blog/themes` 里

然后在 `blog/_config.yml` 中修改 `theme` 为 clone 下来的文件夹名

### Solitude 主题配置

我使用的是主题的是博主 [**陵长镜**](https://r1n.top/) 基于 [**Solitude**](https://github.com/everfu/hexo-theme-solitude) 魔改的 [**Eureka**](https://github.com/r1i1na/hexo-theme-eureka)

可以到这篇文章看我的修改记录

> [主题的修改记录](http://localhost:4000/post/c29c2b2c.html)

## 其他配置

### 自定义域名

想要让自己的博客地址更容易被别人记住？为你的博客设置一个自定义域名，可以看这篇文章

> [Github Pages 自定义域名（Hexo）](https://v1hz.blog/post/d0f380b1.html)
