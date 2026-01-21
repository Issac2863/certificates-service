# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copiamos explícitamente para evitar ambigüedades
COPY package.json package-lock.json ./
# Debug: Listar archivos para verificar que se copiaron
RUN ls -la

# Instalamos dependencias
RUN npm install

COPY . .

# Construimos la aplicación
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# Instalamos solo dependencias de producción
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto
EXPOSE 3003

# Comando de inicio
CMD ["node", "dist/main"]
