# ---- 開發階段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package 檔案以進行安裝
COPY package*.json ./

# 安裝nestjs 的dependencies
RUN npm install @nestjs/typeorm typeorm pg @nestjs/cli


# 複製
COPY . .

# 編譯 NestJS 專案（TypeScript -> JavaScript）
RUN npm run build