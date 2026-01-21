# Certificate Service (Microservicio)

Este microservicio es un **Worker de Notificaciones** construido con [NestJS](https://nestjs.com/). Su función es escuchar eventos de votación, generar certificados oficiales en formato PDF y enviarlos por correo electrónico al ciudadano.

Funciona de manera asíncrona y se comunica vía **TCP** bajo una arquitectura orientada a eventos.

## Funcionalidades

* **Escucha TCP:** Recibe eventos bajo el patrón `vote.confirmed`.
* **Seguridad:** Valida un `INTERNAL_SECRET` para evitar peticiones no autorizadas.
* **Generación PDF:** Crea documentos PDF al vuelo con fecha y hora de emisión dinámica.
* **Envío de Correo:** Utiliza SMTP (Gmail/Outlook) para enviar el certificado como adjunto.

---

## Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-de-tu-repo>
    cd certificate-service
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

---

## Configuración (.env)

Debes crear un archivo `.env` en la raíz del proyecto. Copia el siguiente ejemplo y llena tus datos:

```env
# --- Configuración del Servicio ---
# Puerto TCP donde escuchará este microservicio
PORT=3003

# Token de seguridad (Debe coincidir con el servicio emisor/Census)
INTERNAL_SECRET=SuperSecretoSeguro2026

# --- Configuración Email (Resend) ---
# API Key de Resend (https://resend.com)
RESEND_API_KEY=re_123456789
```

> **Nota sobre SMTP:** Si usas el puerto **587**, el sistema utiliza `secure: false` (STARTTLS). Si usas el puerto **465**, el código debería ajustarse a `secure: true`.

---

## Ejecución

### Modo Desarrollo
```bash
npm run start:dev
```
*Deberías ver en la consola:* `🛡️ Certificate Service corriendo en puerto 3003`

### Modo Producción
```bash
npm run build
npm run start:prod
```

---

## 📡 Contrato de Comunicación (API)

Si deseas conectar otro servicio a este worker, debes cumplir con el siguiente contrato TCP:

* **Transporte:** TCP
* **Puerto:** 3003 (Defecto)
* **Message Pattern:** `vote.confirmed`

### Payload Esperado (JSON)

El objeto de datos (`data`) enviado en el evento debe tener esta estructura:

```json
{
  "token": "SuperSecretoSeguro2026",
  "cedula": "1712345678",
  "nombres": "JUAN PEREZ",
  "recinto": "COLEGIO CENTRAL",
  "email": "juan.perez@email.com"
}
```

* **token**: *String (Obligatorio)*. Si no coincide con el `.env`, la solicitud es ignorada.
* **email**: *String (Obligatorio)*. Dirección de destino.
* **nombres**: *String*. Se usará en el cuerpo del PDF.

---

## Testing

Para probar este servicio sin el Emisor (Census Service), puedes crear un script cliente temporal en Node.js:

```typescript
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { host: '127.0.0.1', port: 3003 },
});

client.emit('vote.confirmed', {
  token: 'SuperSecretoSeguro2026',
  cedula: '9999999999',
  nombres: 'USUARIO DE PRUEBA',
  recinto: 'TEST LAB',
  email: 'tu_correo_real@gmail.com' // <--- Cambia esto
});
```

---

## Stack Tecnológico

* [NestJS](https://docs.nestjs.com/microservices/basics) (Microservices Module)
* [PDFKit](https://pdfkit.org/) (Generación de documentos)
* [Nodemailer](https://nodemailer.com/) (Cliente SMTP)