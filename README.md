# DevSec

安全漏洞验证平台 - 一个用于演示和验证常见 Web 安全漏洞的实验环境。

## 项目简介

DevSec 用于演示常见 Web 安全漏洞（如 RCE、SQL 注入）的原理及修复方法。平台包含：

- **前端**: React + TypeScript
- **后端 API**: Go + Echo
- **漏洞服务**: Java Spring Boot (用于演示漏洞代码)
- **修复服务**: Java Spring Boot (用于演示修复后的安全代码)

## 项目结构

```
DevSec/
├── docker-compose.yml      # Docker 编排配置
├── dev.sh                 # 本地开发启动脚本
│
├── frontend/              # 前端项目 (React)
│   ├── src/
│   ├── package.json
│   └── ...
│
├── java/                  # Java 漏洞验证服务
│   ├── java-vul-verify/  # 漏洞演示服务 (不安全)
│   └── java-vul-fixed/   # 修复演示服务 (安全)
│
├── server/                # Go API 网关
│   ├── main.go
│   ├── handlers.go
│   └── ...
│
└── data/                  # 漏洞演示数据 (Markdown)
    ├── RCE.md
    └── SQL注入.md
```

## 快速开始

### Docker Compose 在线模式（推荐）

```bash
# 构建并启动服务（仅 Go 服务器，无漏洞验证服务）
docker compose up --build

# 后台运行
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

服务启动后访问: http://localhost:8080

### Docker Compose 本地模式（包含漏洞验证服务）

```bash
# 启动包含 Java 漏洞验证服务的完整环境
docker compose up --profile local --build

# 后台运行
docker compose up -d --profile local

# 停止
docker compose down
```

### 本地开发

> ⚠️ 该启动方式使用本地模式运行，若手动指定端口将自动切换为在线模式，保证安全的前提下可以手动设置`LOCAL_MODE`变量为 true 切换为本地安全模式
```bash
# 安装依赖并启动所有服务
./dev.sh start

# 停止所有服务
./dev.sh stop

# 查看状态
./dev.sh status

# 查看日志
./dev.sh logs all
```

## 两种运行模式

### 在线模式（默认）

仅启动 Go 服务器，不包含 Java 漏洞验证服务：
- 无法使用"一键验证对比"功能
- 前端会显示提示信息，建议本地部署使用验证功能
- 适合部署到公网或不需要漏洞验证的场景

### 本地模式

启动完整环境，包含：
- Go 服务器 (8080)
- Java 漏洞验证服务 (8081)
- Java 修复演示服务 (8082)
- 可使用"一键验证对比"功能

启动方式：
- Docker: `docker compose up --profile local`
- 本地开发: `./dev.sh start`

## 架构说明

```
                    ┌──────────────────┐
                    │   Go Server      │
                    │    (8080)        │
                    │  API Gateway     │
                    └────────┬─────────┘
                             │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │Frontend  │    │  Java    │    │  Java    │
       │(Dist)    │    │ vul-verify│   │ vul-fixed│
       └──────────┘    │(8081)   │    │(8082)   │
                       └─────────┘    └──────────┘

              ↑ 仅本地模式启用 ↑
```


## 技术栈

- **前端**: React 19, TypeScript, Vite, Monaco Editor
- **后端**: Go 1.24, Echo v4
- **漏洞服务**: Java 17, Spring Boot 3.2
- **数据库**: H2 (内存数据库)
- **容器**: Docker, Docker Compose

## 注意事项

⚠️ **警告**: 本项目仅用于安全教育和研究目的。漏洞服务**故意设计为不安全的**，请勿以**本地模式**在生产环境中部署。