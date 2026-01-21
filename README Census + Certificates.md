# sevotec-certificates
SEVOTEC Certificate Service - Listen to CensusService and export certificates

Este proyecto implementa una arquitectura de votación electrónica segura y desacoplada utilizando **NestJS** y comunicación por **TCP**.

El sistema consta de dos microservicios independientes que se comunican mediante un patrón orientado a eventos (Event-Driven Architecture).

## 🏗️ Arquitectura

El flujo de datos es unidireccional y asíncrono para garantizar la integridad del voto y la generación de certificados sin bloquear al usuario.

[![](https://mermaid.ink/img/pako:eNptkr-O2kAQxl9ltBUo4LO9HGAXSBEHlyYBCUKRkGJjD7AB75L12ro7xDNckXSJlCpKlT59Hih5hMxiiO50uPLOfr_55s_uWKJTZDHL8WOBKsErKZZGZHMF9G2FsTKRW6EsvM7RgMihv5GoLEJtkhi5tRdDo5WtP9X3UeVF7oi_3-6__Pl1f4pM0JQyoQTc98OzoLEV9unr4SAXMhHk-BDkZ8BBJuTmSP6AycvpGGrXLnYxKuxG6zUxFeV6afZ6VUExBB4kK0zWzdwKW-RnNaEHdGtss9RWquVZDSeNKNFJ8KygRUZaLaTJHmhe0R_okqZ7kg3IKdWQiOy9FCBgNpqOKm2laDbrbi4xNfr5OwxK2oeGaX8cw1uX1jt6YPoOnsFUr1E9pns9V1cMczbTRA5upNW5nrOn9TiTmdjIVFR5IHVrWBaGIukpKQ3Ftei016jQCBhfDaE2xGQl4BZeaCPqj7SHRVGbqvz9U0BfG4PaDQaepx8K6oU12JIcWGxNgQ2WoSGAjmzn0syZXWGGc-YaSIVZu8L3xNAjeKN1dsKMLpYrFi_EJqdTsU3pDR1f9_-oQZWi6WtyZXG7e8jB4h27YXHQCj2_7UdhEAXtqB35lw12S-GAe91uGLY6kc95i3fDfYPdHWx9r8NbfkSxgPOQR53L_T80lxwx?type=png)](https://mermaid.live/edit#pako:eNptkr-O2kAQxl9ltBUo4LO9HGAXSBEHlyYBCUKRkGJjD7AB75L12ro7xDNckXSJlCpKlT59Hih5hMxiiO50uPLOfr_55s_uWKJTZDHL8WOBKsErKZZGZHMF9G2FsTKRW6EsvM7RgMihv5GoLEJtkhi5tRdDo5WtP9X3UeVF7oi_3-6__Pl1f4pM0JQyoQTc98OzoLEV9unr4SAXMhHk-BDkZ8BBJuTmSP6AycvpGGrXLnYxKuxG6zUxFeV6afZ6VUExBB4kK0zWzdwKW-RnNaEHdGtss9RWquVZDSeNKNFJ8KygRUZaLaTJHmhe0R_okqZ7kg3IKdWQiOy9FCBgNpqOKm2laDbrbi4xNfr5OwxK2oeGaX8cw1uX1jt6YPoOnsFUr1E9pns9V1cMczbTRA5upNW5nrOn9TiTmdjIVFR5IHVrWBaGIukpKQ3Ftei016jQCBhfDaE2xGQl4BZeaCPqj7SHRVGbqvz9U0BfG4PaDQaepx8K6oU12JIcWGxNgQ2WoSGAjmzn0syZXWGGc-YaSIVZu8L3xNAjeKN1dsKMLpYrFi_EJqdTsU3pDR1f9_-oQZWi6WtyZXG7e8jB4h27YXHQCj2_7UdhEAXtqB35lw12S-GAe91uGLY6kc95i3fDfYPdHWx9r8NbfkSxgPOQR53L_T80lxwx)

## 🧩 Servicios

### 1. Census Service (Puerto 3002)
* **Rol:** Autoridad Electoral.
* **Responsabilidad:** Gestiona el padrón electoral, valida la identidad y controla la máquina de estados del voto (`NO_VOTO` -> `VOTANDO` -> `VOTO`).
* **Seguridad:** Emite eventos firmados con un token secreto compartido.

### 2. Certificate Service (Puerto 3003)
* **Rol:** Worker de Notificaciones.
* **Responsabilidad:** Escucha eventos de votación, genera certificados PDF en tiempo real y envía correos electrónicos.
* **Tecnologías:** `pdfkit`, `nodemailer`.

---

## 🚀 Instalación y Configuración

### Prerrequisitos
* Node.js (v16 o superior)
* Una cuenta de correo (Gmail con "App Password" recomendada).

### 1. Clonar y preparar dependencias

```bash
# Instalar dependencias para el servicio de Censo
cd census-service
npm install

# Instalar dependencias para el servicio de Certificados
cd ../certificate-service
npm install
```

### 2. Configuración de Entorno (`.env`)

Debes crear un archivo `.env` en la raíz de **CADA** microservicio.

#### En `census-service/.env`:
```env
CENSUS_PORT=3002
CERTIFICATE_HOST=127.0.0.1
CERTIFICATE_PORT=3003
# 🛡️ Token de seguridad compartido (Debe coincidir en ambos servicios)
INTERNAL_SECRET=SuperSecretoSeguro2026
```

#### En `certificate-service/.env`:
```env
PORT=3003
INTERNAL_SECRET=SuperSecretoSeguro2026

# Configuración SMTP (Ejemplo Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_password_de_aplicacion_16_letras
```

---

## ▶️ Ejecución

Para probar el sistema completo, necesitas **3 terminales** abiertas:

**Terminal 1: Levantar Certificate Service (Receptor)**
```bash
cd certificate-service
npm run start:dev
```

**Terminal 2: Levantar Census Service (Emisor)**
```bash
cd census-service
npm run start:dev
```

**Terminal 3: Simular un Votante (Script de Prueba)**
Dentro de la carpeta `census-service`, ejecuta el script de prueba que simula el ciclo de vida de un voto:
```bash
# Asegúrate de haber editado el mock en census.service.ts con tu email real
npx ts-node test-voto.ts
```

---

## 🔒 Seguridad Implementada

1.  **Shared Secret Token:** El microservicio de certificados rechaza cualquier petición TCP que no incluya el token definido en `INTERNAL_SECRET`.
2.  **Environment Variables:** Las credenciales SMTP y puertos no están hardcodeados en el código fuente.
3.  **State Machine:** El servicio de censo impide votos dobles mediante bloqueo de estados.

---

## 🛠️ Stack Tecnológico

* [NestJS](https://nestjs.com/) - Framework principal.
* **Microservices (TCP)** - Protocolo de comunicación interna.
* **Nodemailer** - Envío de correos transaccionales.
* **PDFKit** - Generación de documentos PDF en memoria.
* **RxJS** - Manejo de eventos asíncronos.