# 🛡️ Certificate Service - SEVOTEC

Microservicio para la generación y envío automatizado de certificados de votación en el sistema electoral SEVOTEC.

## 📋 Descripción

Este servicio maneja la generación de certificados PDF personalizados y su envío por email cuando un voto es confirmado en el sistema. Implementa un sistema robusto de seguridad con cifrado de doble capa.

## 🏗️ Arquitectura

### Componentes Principales

- **AppController**: Maneja eventos `vote.confirmed` del sistema
- **AppService**: Lógica de negocio para generación y envío de certificados
- **KeyVaultService**: Gestión de llaves criptográficas y descifrado de datos
- **InternalApiKeyGuard**: Validación de API Keys para comunicación interna
- **EnvelopeOpenerInterceptor**: Descifrado automático de sobres de seguridad

## 🔐 Seguridad

### Sistema de Doble Protección

1. **JWE (JSON Web Encryption)**: Confidencialidad con RSA-OAEP-256
2. **JWS (JSON Web Signature)**: Integridad y autenticidad con PS256

### Flujo de Seguridad

```
Gateway → [JWE[JWS[data]]] → Certificate Service
         ↓
1. Validar API Key (InternalApiKeyGuard)
2. Descifrar JWE (KeyVaultService)
3. Verificar JWS (KeyVaultService)
4. Procesar datos descifrados
```

## 📄 Generación de Certificados

### Proceso

1. Recepción del evento `vote.confirmed`
2. Validación de datos requeridos
3. Generación de PDF personalizado
4. Envío por email con adjunto
5. Logging de resultados

### Formato del PDF

- Certificado en formato A4
- Información del votante (nombres, cédula)
- Fecha de emisión en zona horaria de Ecuador
- Recinto de votación
- Diseño profesional con tipografías Helvetica

## 📧 Sistema de Email

### Proveedor: Resend

- Plantilla HTML profesional responsiva
- Adjunto PDF automático
- Tracking de envíos exitosos
- Manejo robusto de errores

### Configuración

```env
RESEND_API_KEY=your_resend_api_key
```

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+
- npm/yarn
- Variables de entorno configuradas

### Variables de Entorno Requeridas

```env
# Servidor
PORT=3003

# Seguridad
CERTIFICATE_PRIVATE_KEY_BASE64=your_private_key_base64
CENSUS_PUBLIC_KEY_BASE64=gateway_public_key_base64
CERTIFICATE_INTERNAL_API_KEY=your_internal_api_key

# Email
RESEND_API_KEY=your_resend_api_key
```

### Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm test
```

## 🔌 API

### Eventos

#### `vote.confirmed`

**Descripción**: Procesa la generación de certificado cuando un voto es confirmado

**Datos requeridos**:
```typescript
interface VoteData {
  nombres: string;    // Nombre completo del votante
  cedula: string;     // Cédula de identidad
  email: string;      // Email para envío
  recinto?: string;   // Recinto de votación (opcional)
}
```

**Respuesta**:
```typescript
interface ProcessResult {
  success: boolean;
  message: string;
}
```

## 📊 Logging

### Niveles de Log

- **LOG**: Operaciones exitosas importantes
- **DEBUG**: Detalles de debugging (solo en desarrollo)
- **WARN**: Situaciones que requieren atención
- **ERROR**: Errores con stack trace completo

### Ejemplos de Logs

```
[CertificateService] Procesando certificado para Juan Pérez (1234567890)
[CertificateService] PDF generado exitosamente para 1234567890
[CertificateService] Certificado enviado a juan@email.com con ID: abc123
```

## 🧪 Testing

El servicio incluye validaciones robustas:

- Datos de entrada requeridos
- Formato de email válido
- Generación exitosa de PDF
- Confirmación de envío de email

## 🐳 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3003
CMD ["node", "dist/main"]
```

## 📈 Monitoreo

### Métricas Importantes

- Certificados generados exitosamente
- Fallos de envío de email
- Tiempo de procesamiento promedio
- Errores de descifrado

### Health Check

El servicio responde en `http://localhost:3003` cuando está activo.

## 🤝 Integración

### Microservicios Relacionados

- **API Gateway**: Enrutamiento y cifrado inicial
- **Census Service**: Validación de votantes
- **Voting Service**: Confirmación de votos

### Flujo Completo

```
Usuario vota → Voting Service → vote.confirmed → Certificate Service → Email enviado
```

## 📞 Soporte

Para issues o mejoras, contactar al equipo de desarrollo de SEVOTEC.