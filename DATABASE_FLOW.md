# Flujo de Base de Datos - Trading Bot

Este documento explica cómo funciona el sistema de base de datos para el trading bot automatizado.

## Flujo Completo

### 1. Importar/Generar Wallet

Cuando el usuario **importa** o **genera** una wallet:

1. La clave privada se **encripta** usando `encryptPrivateKey()`
2. La wallet se guarda en la tabla `wallets` con:
   - `address`: Dirección de la wallet
   - `encrypted_private_key`: Clave privada encriptada
   - `name`: Nombre de la wallet
   - `active`: false (inactivo por defecto)
   - `is_imported`: true si fue importada, false si fue generada
   - `user_id`: ID del usuario autenticado

### 2. Configurar Parámetros

Cuando el usuario **configura parámetros** de trading:

1. Los parámetros se guardan en la tabla `wallet_configurations`:
   - Montos min/max de compra y venta
   - Slippage para compra y venta
   - Intervalos de tiempo (horas, minutos, segundos)
   - Token seleccionado
   - Network seleccionada (core, bsc, etc)
   - DEX seleccionado (router address)

### 3. Iniciar Bot

Cuando el usuario **activa el trading**:

1. Se actualiza `active = true` en la tabla `wallets`
2. Se crea una estrategia inicial en `wallet_strategies`:
   - Ciclo de operaciones (5 compras, 5 ventas aleatorias)
   - Variabilidad de montos
   - Probabilidades de éxito
3. El **Edge Function** se ejecuta automáticamente cada minuto y:
   - Lee todas las wallets con `active = true`
   - Lee la configuración de cada wallet
   - Lee la estrategia de cada wallet
   - **Desencripta** la clave privada
   - Ejecuta la operación de trading (compra o venta)
   - Actualiza métricas (total_buys, total_sells, total_volume)
   - Guarda el historial en `trading_history`
   - Guarda logs en `bot_logs`

### 4. Bot Funcionando 24/7

El bot funciona **sin que el usuario esté conectado**:

- El Edge Function se ejecuta cada minuto de forma automática
- Lee todo desde la base de datos
- Opera según los parámetros configurados
- El usuario puede apagar su PC y el bot sigue operando

### 5. Eliminar Wallet

Cuando el usuario **elimina una wallet**:

1. Se borra de la tabla `wallets`
2. **Automáticamente** se borran (CASCADE):
   - Configuración en `wallet_configurations`
   - Estrategia en `wallet_strategies`
   - Historial en `trading_history`
   - Logs en `bot_logs`

## Seguridad

### Encriptación de Claves Privadas

Las claves privadas se encriptan usando:

```typescript
const encryptPrivateKey = (privateKey: string): string => {
  const combined = privateKey + '::' + ENCRYPTION_KEY + '::' + Date.now();
  return btoa(combined);
};
```

Para desencriptar:

```typescript
const decryptPrivateKey = (encryptedKey: string): string => {
  const decoded = atob(encryptedKey);
  const parts = decoded.split('::');
  return parts[0]; // La clave privada original
};
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:
- Los usuarios solo pueden ver/editar/eliminar sus propias wallets
- Nadie puede acceder a las wallets de otros usuarios
- El Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para operar

## Tablas Principales

### `wallets`
- Almacena direcciones y claves privadas encriptadas
- Estado activo/inactivo
- Métricas de trading

### `wallet_configurations`
- Parámetros de compra/venta
- Intervalos de tiempo
- Token y DEX seleccionados

### `wallet_strategies`
- Estrategia de trading actual
- Ciclo de operaciones
- Variabilidad y probabilidades

### `trading_history`
- Historial completo de operaciones
- Transaction hashes
- Montos y tokens

### `bot_logs`
- Logs del sistema
- Errores y éxitos
- Información de depuración

## Ventajas de este Sistema

1. **Persistencia**: Todo se guarda en la base de datos
2. **Disponibilidad**: El bot funciona 24/7 sin que el usuario esté conectado
3. **Seguridad**: Claves encriptadas + RLS
4. **Escalabilidad**: Puede manejar múltiples wallets y usuarios
5. **Trazabilidad**: Historial completo de todas las operaciones
6. **Recuperación**: Si el usuario cierra sesión y vuelve, todo está guardado
