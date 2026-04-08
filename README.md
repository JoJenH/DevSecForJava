# DevSec

安全漏洞验证平台 - 一个用于演示和验证常见 Web 安全漏洞的实验环境。

## 项目简介

DevSec 是一个教育性的安全实验平台，用于演示常见 Web 安全漏洞（如 RCE、SQL 注入）的原理及修复方法。平台包含：

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

### Docker Compose (推荐)

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

服务启动后访问: http://localhost:8080

### 本地开发

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

## 架构说明

```
                    ┌──────────────────┐
                    │   Go Server      │
                    │    (8080)        │
                    │  API Gateway     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │Frontend  │  │  Java    │  │  Java    │
       │(Dist)    │  │ vul-verify│  │ vul-fixed│
       └──────────┘  │(8081)   │  │(8082)   │
                      └─────────┘  └──────────┘
```

### 网络隔离

- **frontend**: 可访问外网，用于用户访问
- **backend**: 内部网络，Java 漏洞服务无法访问外网或横向扩展

## 安全特性

所有容器均采用最严格的安全配置：

| 安全措施 | 说明 |
|---------|------|
| 非 root 用户 | 所有容器以 appuser (UID 1000) 运行 |
| 只读文件系统 | 漏洞容器使用 read_only=true |
| 能力丢弃 | cap_drop: ALL，移除所有 Linux 能力 |
| 网络隔离 | 漏洞容器无法访问外网或横向渗透 |
| 禁止权限提升 | no-new-privileges: true |

## 漏洞示例

### RCE (远程代码执行)

- **漏洞代码**: 直接拼接用户输入执行命令
- **修复代码**: 使用命令数组 + 输入验证

### SQL 注入

- **漏洞代码**: 字符串拼接 SQL
- **修复代码**: 参数化查询

## 技术栈

- **前端**: React 19, TypeScript, Vite, Monaco Editor
- **后端**: Go 1.24, Echo v4
- **漏洞服务**: Java 17, Spring Boot 3.2
- **数据库**: H2 (内存数据库)
- **容器**: Docker, Docker Compose

## 注意事项

⚠️ **警告**: 本项目仅用于安全教育和研究目的。漏洞服务**故意设计为不安全的**，请勿在生产环境中部署。

## License

MIT
