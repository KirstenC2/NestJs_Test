FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install @nestjs/typeorm typeorm pg @nestjs/cli @nestjs/common @types/multer

COPY . .

RUN npx run build