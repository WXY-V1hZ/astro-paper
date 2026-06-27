---
title: 前后端分离与 Swagger 接口文档
description: 前后端分离开发模式与 Swagger 接口文档的使用
pubDatetime: 2025-02-12
tags: ["Swagger", "Nginx 前端部署"]
---

## 前后端分离

![前后端分离开发](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121612831.png)

![前后端分离开发流程](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121612705.png)

## YApi

### 什么是 YApi

- api 管理平台，为开发、产品、测试人员提供接口管理服务
- https://github.com/YMFE/yapi

整了半天没部署下来，润去用 [Apifox](https://apifox.com/) 了...

## Swager

### 什么是 Swager

- API 文档生成和测试工具
- 自动生成 API 文档
- 交互式 API 测试
- 生成多种格式的 API 规范
- 支持代码自动生成
- https://swagger.io

### 通过 knife4 使用 Swagger

#### 导入 Maven 坐标

在 `pom.xml` 中加入

```xml
<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

#### 编写配置类

为 `WebMvcConfig` 添加如下配置

```java
@Configuration
@EnableSwagger2 // 两个需要添加的注解
@EnableKnife4j
public class WebMvcConfig implements WevMvcConfiguer {
    
    @Bean // 固定写法，需要配置一下 controller 包的位置（因为生成接口需要扫描 controller 包）
    public Docket createRestApi() {
        return new Docket (DocumentationType.SWAGGER_2)
            .apiInfo(apiInfo())
            .select()
            .apis(RequestHandlerSelectors.basePackage("com.v1hz.project.controller"))
            .paths(PathSelectors.any())
            .build();
    }
    
    // 用于给 createRestApi 方法提供接口文档的描述
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
            .title("项目名称")
            .version("版本号")
            .description("接口文档")
            .build();
    }
}
```

#### 设置静态资源，用于访问接口文档

在 `WebMvbConfig` 类中重写 `addResourceHandlers` 方法

```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("doc.html").addResourceLocations("classpath:/META-INF/resources/");
    registry.addResourceHandler("/webjars/***").addResourceLocations("classpath:/META-INF/resources/webjars/");
}
```

#### 在 `LoginCheckFilter` 中设置不需要处理的请求路径

```java
@WebFilter(filterName = "loginCheckFilter", urlPatterns = "/*")
public class LoginCheckFilter implements Filter {
	@Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // ...

        // 定义不需要处理的路径
        String[] urls = new String[] {
                "/doc.html",
                "/swagger-resources/**",
                "/webjars/**",
                "v2/api-docs",
        };
        
        // ...
}
```

#### 运行项目，查看接口文档

项目运行成功后，就可以前往目标地址的 `/doc.html` 中进行查看生成的接口文档了

![](https://fastly.jsdelivr.net/gh/V1hZ/img@main/PicGo/202502121857627.png)

#### Swagger 常用注解

| 注解                 | 说明                                                         |
| -------------------- | ------------------------------------------------------------ |
| `@Api`               | 用在请求的类上，例如 Controller，表示对类的说明              |
| `@ApiModel`          | 用在类上，通常是实体类，表示一个返回响应数据的信息           |
| `@ApiModelProperty`  | 用在属性上，描述响应类的属性                                 |
| `@ApiOperation`      | 用在请求的方法上，说明方法的用途、作用                       |
| `@ApiImplicitParams` | 用在请求的方法上，表示一组参数说明                           |
| `@ApiImplicitParam`  | 用在 `@ApiImplicitParams` 注解中，指定一个请求参数的各个方面 |

## 前端的部署

将前端的打包文件上传到服务器，然后修改 Nginx 配置

我是将前端资源部署在虚拟机上，然后宿主机运行后端项目

```nginx
server {
    listen 81;
    server_name localhost;
    
    location / {
        root /var/www/html/dist;
        index index.html;
    }

    location ^~ /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://192.168.1.6:8080;
    }
}
```

这样当访问我的虚拟机的 IP 地址的 81 端口后，发送的请求都会被转发到主机的后端项目端口上，实现前后端分离

懒得再整一台虚拟机做后端部署了遂润