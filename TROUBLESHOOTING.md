# Troubleshooting Guide

## Error: "Failed to resolve import @supabase/supabase-js"

### Causa
Este error aparece cuando el servidor de desarrollo necesita ser reiniciado después de instalar nuevas dependencias.

### Solución
El servidor se reinicia automáticamente. Si persiste el error:

```bash
# Detener el servidor (Ctrl+C)
# Reinstalar dependencias
npm install

# Limpiar cache de Vite
rm -rf node_modules/.vite

# Iniciar servidor nuevamente
npm run dev
```

### Verificar que todo está correcto
```bash
# El build debe funcionar sin errores
npm run build
```

Si el build funciona (✓), entonces todo está correcto y solo necesitas esperar a que el dev server se reinicie.

---

## Error: "No active wallets found"

### Causa
- No hay wallets con el toggle activado (ON)
- El CRON job está llamando a la Edge Function pero no hay wallets activas

### Solución
1. Ve a "Wallet Manager"
2. Activa al menos una wallet (toggle a ON/verde)
3. Asegúrate de que la wallet tenga configuración guardada

---

## Error: "No config or token"

### Causa
La wallet está activa pero no tiene configuración o no tiene token seleccionado

### Solución
1. Click en el ícono de configuración (⚙️) de la wallet
2. Configura todos los parámetros:
   - Buy/Sell amounts
   - Slippage
   - Intervals
   - **Select Token** (IMPORTANTE)
3. Click "Save Configuration"
4. Activa la wallet (toggle ON)

---

## Error: "Insufficient balance"

### Causa
La wallet no tiene suficiente balance nativo para ejecutar la compra

### Solución
1. Transfiere fondos a la wallet
2. El balance debe ser mayor que:
   - Monto máximo de compra
   - + Gas fees estimados
3. Verifica el balance en un explorer de la blockchain

---

## Error: "Failed to decrypt private key"

### Causa
- La clave privada está corrupta en la DB
- Error en el proceso de encriptación

### Solución
1. Elimina la wallet problemática
2. Vuelve a importar la wallet con la private key correcta
3. O genera una nueva wallet

---

## Bot no ejecuta operaciones

### Checklist de Verificación:

#### 1. ✅ Wallet activa
```
- Ve a "Wallet Manager"
- Verifica que el toggle esté en ON (verde)
- Debe decir "Trading Active"
```

#### 2. ✅ Configuración completa
```
- Click en ⚙️ de la wallet
- Verifica que todos los campos estén llenos
- Especialmente "Selected Token"
```

#### 3. ✅ CRON job funcionando
```
- Ve a cron-job.org (o tu servicio de CRON)
- Verifica que el job esté "Enabled"
- Revisa los logs - debe mostrar ejecuciones
- Status debe ser 200 (OK)
```

#### 4. ✅ Balance suficiente
```
- La wallet debe tener fondos nativos (CORE, BNB, etc)
- Balance > Monto máximo de compra + gas
```

#### 5. ✅ Intervalo transcurrido
```
- Si configuraste 5 minutos, espera 5 minutos
- La primera operación toma el tiempo del intervalo
```

---

## No veo logs actualizados

### Solución 1: Refrescar
```
1. Refresca la página (F5)
2. Si no funciona, cierra sesión y vuelve a entrar
```

### Solución 2: Verificar en Supabase directamente
```
1. Ve a Supabase Dashboard
2. Table Editor → bot_logs
3. Deberías ver los logs ahí
4. Si no hay logs, el CRON job no está funcionando
```

---

## CRON Job no funciona

### Verificación:

#### En cron-job.org:
```
1. Ve a "Cronjobs"
2. Click en tu job
3. Ve a "History"
4. Deberías ver ejecuciones cada minuto/30 segundos
5. Status debe ser 200
```

#### Si ves Status 500:
```
- Hay un error en la Edge Function
- Ve a Supabase Dashboard → Edge Functions → Logs
- Revisa el error específico
```

#### Si no hay ejecuciones:
```
- El job está deshabilitado
- Click en "Enable" en cron-job.org
```

---

## Edge Function errors

### Ver logs de Edge Function:

```
1. Supabase Dashboard
2. Edge Functions → trading-bot-executor
3. Logs
4. Filtra por "Error"
```

### Errores comunes:

#### "Could not connect to any nodes"
```
- El RPC está caído
- Cambia a otro RPC en el código
- O espera a que el RPC se recupere
```

#### "Transaction failed"
```
- Slippage muy bajo
- Aumenta el slippage en la configuración
- O revisa la liquidez del token
```

#### "Insufficient token balance" (en sell)
```
- La wallet no tiene el token para vender
- Ejecuta algunas compras primero
- O ajusta el monto de venta
```

---

## Problemas de autenticación

### No puedo hacer login
```
1. Verifica email y contraseña
2. Intenta "Forgot password" (si implementado)
3. Crea una cuenta nueva
4. Limpia localStorage: F12 → Application → Local Storage → Clear
```

### Sesión expirada
```
1. Cierra sesión (Logout)
2. Vuelve a iniciar sesión
3. Supabase Auth mantiene la sesión por 1 hora por defecto
```

---

## Verificar que todo funciona

### Test Manual de Edge Function:

```bash
# Opción 1: Usar el script
./test-edge-function.sh

# Opción 2: Curl directo
curl -X POST https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
```

### Respuesta esperada:
```json
{
  "message": "Trading bot executed",
  "processed": 1,
  "results": [
    {
      "wallet": "0x1234567",
      "status": "processed"
    }
  ]
}
```

O si no hay wallets activas:
```json
{
  "message": "No active wallets found",
  "processed": 0
}
```

---

## Problemas de rendimiento

### Build muy lento
```bash
# Limpiar cache
rm -rf node_modules/.vite
rm -rf dist

# Rebuild
npm run build
```

### App muy lenta
```
1. Revisa la consola del navegador (F12)
2. Busca errores o warnings
3. Puede que haya muchas wallets activas
4. Considera desactivar wallets que no uses
```

---

## Preguntas Frecuentes

### ¿Cuánto tarda en ejecutar la primera operación?
- Depende del intervalo configurado
- Si configuraste 5 minutos, tardará 5 minutos
- El timer comienza cuando activas la wallet

### ¿Puedo cambiar configuración con el bot activo?
- Sí, pero desactiva la wallet primero
- Cambia la configuración
- Vuelve a activar la wallet

### ¿Los cambios se aplican inmediatamente?
- Sí, la Edge Function lee la DB cada vez que se ejecuta
- Los cambios se aplican en la siguiente ejecución

### ¿Puedo tener diferentes tokens por wallet?
- Sí, cada wallet puede tener su propio token configurado
- Configura cada wallet independientemente

---

## Contacto

Si ninguna de estas soluciones funciona:

1. Revisa README.md para más detalles
2. Revisa SETUP_INSTRUCTIONS.md
3. Consulta la documentación de Supabase
4. Revisa los logs del navegador (F12 → Console)
5. Revisa los logs de Supabase Edge Functions

---

**Nota**: La mayoría de los problemas se resuelven verificando:
1. ✅ Wallet activa (toggle ON)
2. ✅ Token seleccionado
3. ✅ CRON job funcionando
4. ✅ Balance suficiente
