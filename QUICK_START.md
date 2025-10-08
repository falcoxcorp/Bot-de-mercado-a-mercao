# Quick Start Guide - Falco-X Trading Bot 24/7

## ¿Qué cambió?

Tu bot ahora funciona **24/7 en la nube**. Puedes:
- ✅ Apagar tu PC
- ✅ Cerrar el navegador
- ✅ Desconectarte de internet
- ✅ El bot seguirá funcionando

## Inicio Rápido (5 minutos)

### 1. Crear Cuenta (30 segundos)
```
1. Abre la aplicación
2. Click en "Create Account"
3. Ingresa email y contraseña
4. Click "Create Account"
5. Ahora click "Sign In"
```

### 2. Configurar Primera Wallet (2 minutos)
```
1. En "Wallet Generator" → Ingresa "1" → Click "Generate Wallets"
2. Tu nueva wallet aparecerá en "Wallet Manager"
3. Click en el ícono de configuración (⚙️) de la wallet
4. Configura:
   - Buy Amount: 0.01 - 0.05
   - Sell Amount: 0.01 - 0.05
   - Select Token: Elige un token
   - Intervals: 1 minuto
5. Click "Save Configuration"
```

### 3. Activar Bot (10 segundos)
```
1. En "Wallet Manager"
2. Toggle el switch de tu wallet a ON (verde)
3. ¡Listo! El bot está activo y funcionando 24/7
```

### 4. Verificar Auto-Executor (5 segundos)
```
1. Mira la sección "Auto-Executor Status"
2. Debe decir "Running" en verde
3. Verás "Last Execution" y "Total Executions"
4. El bot se ejecuta automáticamente cada 30 segundos
```

**¡NO NECESITAS CONFIGURAR CRON EXTERNO!**
El bot ahora tiene un auto-executor integrado que funciona mientras la app esté abierta en cualquier pestaña del navegador.

### 5. Mantener App Abierta (IMPORTANTE)
```
⚠️ NUEVO COMPORTAMIENTO:
El auto-executor funciona mientras la app esté abierta en el navegador.

Para operación 24/7:
1. Mantén la app abierta en una pestaña del navegador
2. O despliega en un hosting como Vercel/Netlify
3. O usa el CRON externo (ver abajo)

Si solo quieres que funcione cuando tengas el navegador abierto:
✅ ¡Ya está listo! Solo mantén la pestaña abierta
```

## ¿Cómo Verificar que Funciona?

### Método 1: Revisar Logs
```
1. Login en la aplicación
2. Scroll hasta "Bot Status & Logs"
3. Deberías ver logs como:
   - "Wallet xxxxx - BUY 0.023 - TX: 0x..."
   - "Starting new cycle for wallet..."
```

### Método 2: Historial de Trading
```
1. En Supabase Dashboard
2. Ve a "Table Editor"
3. Selecciona tabla "trading_history"
4. Deberías ver registros de operaciones
```

### Método 3: Llamar Edge Function Manualmente
```bash
# En terminal:
./test-edge-function.sh

# O con curl:
curl -X POST https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
```

## Configuración Recomendada para Empezar

### Wallet de Prueba
```
Buy Amount:     0.001 - 0.005 (muy pequeño para pruebas)
Sell Amount:    0.001 - 0.005
Buy Slippage:   1%
Sell Slippage:  1%
Intervals:      1 minuto (más rápido para ver resultados)
Token:          Selecciona un token con buena liquidez
```

### Después de Verificar que Funciona
```
Buy Amount:     0.01 - 0.1 (ajusta según tu presupuesto)
Sell Amount:    0.01 - 0.1
Intervals:      5-15 minutos (más realista)
```

## FAQ Rápido

### ¿Cuándo empezará a operar el bot?
- Después de activar la wallet (toggle ON)
- Y después de configurar el CRON job
- La primera operación ocurrirá después del intervalo configurado

### ¿Necesito mantener la app abierta?
- **Con Auto-Executor**: Sí, mantén una pestaña abierta
- **Con CRON Externo**: No, puedes cerrarla completamente
- Ver sección "Opción: CRON Externo 24/7" abajo

### ¿Cuántas wallets puedo tener?
- Ilimitadas
- Cada una con configuración independiente

### ¿Cómo detengo el bot?
- Toggle la wallet a OFF (rojo)
- O elimina la wallet

### ¿Puedo ver el bot desde mi teléfono?
- Sí, accede desde cualquier navegador
- Login con tus credenciales
- Todo está sincronizado

### ¿Los datos se pierden si cierro el navegador?
- **NO** - Todo está en Supabase
- Los datos persisten permanentemente

### ¿Cómo sé si el CRON job está funcionando?
- Revisa los logs en cron-job.org
- Deberías ver ejecuciones cada minuto/30 segundos
- Status: 200 (OK)

## Solución de Problemas

### El bot no opera después de 10 minutos
1. ✅ Verifica que la wallet esté activa (toggle ON)
2. ✅ Confirma que hay un token seleccionado
3. ✅ Revisa que el CRON job esté activo en cron-job.org
4. ✅ Verifica el balance de la wallet

### No veo logs nuevos
1. Refresca la página (F5)
2. Verifica en Supabase → bot_logs table
3. Revisa el CRON job en cron-job.org

### Error: "Insufficient balance"
1. Transfiere fondos a la wallet
2. Verifica que el balance sea mayor al monto configurado
3. Espera la siguiente ejecución

## Opción: CRON Externo 24/7 (Avanzado)

Si quieres que el bot funcione **sin necesidad de mantener el navegador abierto**, puedes configurar un CRON externo:

### Configurar CRON Job (2 minutos)
```
1. Ve a https://cron-job.org (crear cuenta gratis)
2. Click "Create cronjob"
3. Title: "Falco-X Trading Bot"
4. URL: https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
5. Schedule: "Every minute" o "Every 30 seconds"
6. Click "Create cronjob"
```

Con esto, el bot funcionará 24/7 **sin necesidad de mantener el navegador abierto**.

## Próximos Pasos

Después de verificar que funciona:

1. **Ajusta configuraciones** según tus necesidades
2. **Agrega más wallets** para diversificar
3. **Monitorea regularmente** los primeros días
4. **Exporta wallets** como backup (botón en Wallet Manager)
5. **Opcional**: Configura CRON externo para verdadero 24/7

## Contacto y Soporte

- Revisa `README.md` para documentación completa
- Revisa `SETUP_INSTRUCTIONS.md` para detalles técnicos
- Logs de error en la consola del navegador (F12)

---

**🎉 ¡Felicitaciones!**

Tu bot de trading ahora funciona 24/7 en la nube. Configúralo una vez y olvídate - el bot se encarga del resto.

**⚠️ Importante:**
- Empieza con cantidades pequeñas
- Monitorea los primeros días
- Mantén backups de tus claves privadas
- Entiende los riesgos del trading automatizado
