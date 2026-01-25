import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

/**
 * Servicio de gestión de llaves criptográficas y seguridad.
 * Maneja el cifrado/descifrado de datos usando JWE (JSON Web Encryption) y JWS (JSON Web Signature).
 * 
 * @description Este servicio implementa un sistema de doble protección:
 * 1. JWE para confidencialidad (cifrado con RSA-OAEP-256)
 * 2. JWS para integridad y autenticidad (firma con PS256)
 */
@Injectable()
export class KeyVaultService implements OnModuleInit {
  private readonly logger = new Logger(KeyVaultService.name);
  private readonly keyCache = new Map<string, any>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa y carga las llaves criptográficas en memoria al arrancar el módulo.
   * 
   * @description Carga las siguientes llaves:
   * - Llave privada del servicio (para descifrar JWE)
   * - Llave pública del gateway (para verificar JWS)
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Inicializando sistema de llaves criptográficas...');
      
      await this.cacheKey('CERTIFICATE_PRIVATE_KEY_BASE64', 'private');
      await this.cacheKey('CENSUS_PUBLIC_KEY_BASE64', 'public');
      
      this.logger.log('Llaves criptográficas cargadas y optimizadas en memoria');
    } catch (error) {
      this.logger.error('Error crítico cargando llaves criptográficas:', error.message);
      throw new Error('Fallo en inicialización de seguridad del microservicio');
    }
  }

  /**
   * Carga una llave criptográfica desde variables de entorno y la almacena en cache.
   * 
   * @param envVar - Nombre de la variable de entorno que contiene la llave en base64
   * @param type - Tipo de llave: 'private' para descifrado o 'public' para verificación
   * @throws Error si la variable de entorno no existe o la llave es inválida
   * @private
   */
  private async cacheKey(envVar: string, type: 'private' | 'public'): Promise<void> {
    try {
      const base64 = this.configService.get<string>(envVar);
      
      if (!base64) {
        throw new Error(`Variable de entorno requerida no encontrada: ${envVar}`);
      }

      const keyStr = Buffer.from(base64, 'base64').toString();
      
      // Los algoritmos deben coincidir EXACTAMENTE con los del Gateway
      const key = type === 'private'
        ? await jose.importPKCS8(keyStr, 'RSA-OAEP-256')
        : await jose.importSPKI(keyStr, 'PS256');

      this.keyCache.set(envVar, key);
    } catch (error) {
      this.logger.error(`Error cargando llave ${type} (${envVar}):`, error.message);
      throw error;
    }
  }

  /**
   * Desempaqueta y verifica un sobre de seguridad que contiene datos encriptados y firmados.
   * 
   * @param envelope - Sobre JWE que contiene un JWS firmado
   * @returns Datos descifrados y verificados como objeto JSON
   * @throws BadRequestException si el sobre es inválido o las llaves no están inicializadas
   * 
   * @description Proceso de seguridad de doble capa:
   * 1. Descifra el JWE usando la llave privada del servicio (confidencialidad)
   * 2. Verifica la firma JWS usando la llave pública del gateway (integridad/autenticidad)
   */
  async unpack(envelope: string): Promise<any> {
    try {      
      const myPrivKey = this.keyCache.get('CERTIFICATE_PRIVATE_KEY_BASE64');
      const gatewayPubKey = this.keyCache.get('CENSUS_PUBLIC_KEY_BASE64');

      if (!myPrivKey || !gatewayPubKey) {
        this.logger.error('Llaves criptográficas no disponibles en cache');
        throw new Error('Sistema de seguridad no inicializado correctamente');
      }

      // Paso 1: Descifrar el JWE (Confidencialidad)
      const { plaintext } = await jose.compactDecrypt(envelope, myPrivKey);
      const jws = new TextDecoder().decode(plaintext);

      // Paso 2: Verificar la firma JWS (Integridad y Autenticidad)
      const { payload } = await jose.compactVerify(jws, gatewayPubKey);

      // Paso 3: Convertir el payload a objeto JSON
      const decodedPayload = new TextDecoder().decode(payload);
      const result = JSON.parse(decodedPayload);
      
      return result;
    } catch (error) {
      this.logger.error(`Error de seguridad en unpack: ${error.message}`, error.stack);
      throw new BadRequestException(
        'Sobre de seguridad inválido, corrupto o sistema de llaves comprometido'
      );
    }
  }
}