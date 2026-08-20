# 构建阶段
FROM golang:1.24-alpine AS builder

WORKDIR /build

# 安装依赖
RUN apk add --no-cache git

# 复制 go mod 文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api

# 运行阶段
FROM alpine:latest

WORKDIR /opt/app

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata

# 从构建阶段复制二进制文件
COPY --from=builder /build/api ./api

# 创建必要的目录
RUN mkdir -p /app/run /app/etc/nginx/ssl /data

EXPOSE 8000

CMD ["/opt/app/api"]
