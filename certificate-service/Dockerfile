# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Instalamos dependencias de sistema necesarias para compilación (si hubiera)
# Para nestjs standard no suele hacer falta nada extra, pero a veces python/make para node-gyp
# RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Instalamos dependencias (usamos install en lugar de ci para mayor flexibilidad si falta lockfile)
RUN npm install

COPY . .

# Construimos la aplicación
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instalamos solo dependencias de producción
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto (útil para documentación, aunque Railway lo maneja)
EXPOSE 3003

# Comando de inicio
CMD ["node", "dist/main"]
