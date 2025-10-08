# Auto-Executor - Trading Bot Automatizado

## ¿Qué es el Auto-Executor?

El Auto-Executor es un sistema integrado que ejecuta automáticamente tu bot de trading cada 30 segundos, **sin necesidad de configurar servicios externos**.

## Características Principales

### ✅ Automático
- Se inicia cuando haces login
- Se ejecuta cada 30 segundos
- No requiere configuración adicional

### ✅ Visible
- Panel de estado en tiempo real
- Muestra última ejecución
- Contador de ejecuciones totales
- Contador de errores

### ✅ Inteligente
- Se detiene automáticamente después de 5 errores consecutivos
- Solo ejecuta wallets activas (toggle ON)
- Respeta los intervalos configurados en cada wallet

## Cómo Funciona

```
Usuario hace LOGIN
    ↓
Auto-Executor INICIA automáticamente
    ↓
Cada 30 segundos:
    ↓
Lee wallets activas de Supabase
    ↓
Para cada wallet activa:
    - Verifica si pasó el intervalo
    - Si pasó → Ejecuta BUY o SELL
    - Si no → Espera
    ↓
Guarda logs en Supabase
    ↓
Repite cada 30 segundos
```

## Ventajas vs CRON Externo

| Característica | Auto-Executor | CRON Externo |
|----------------|---------------|--------------|
| Configuración | ✅ Ninguna | ❌ Manual |
| Costo | ✅ Gratis | ✅ Gratis |
| Navegador abierto | ⚠️ Sí | ✅ No |
| Visualización estado | ✅ En tiempo real | ❌ No |
| Errores visibles | ✅ Sí | ❌ Solo en logs |

## Desventajas

### 🚨 Requiere Navegador Abierto

El Auto-Executor funciona **mientras tengas la app abierta en el navegador**. Si cierras todas las pestañas, el executor se detiene.

**Soluciones:**

1. **Mantener pestaña abierta**: La forma más simple
2. **CRON Externo**: Configura cron-job.org (ver QUICK_START.md)
3. **Deploy a hosting**: Despliega en Vercel/Netlify con un worker

## Panel de Estado

El panel "Auto-Executor Status" muestra:

```
┌─────────────────────────────────────────┐
│ 🟢 Auto-Executor Status     [Running]   │
├─────────────────────────────────────────┤
│ Last Execution:    23:45:12             │
│ Total Executions:  127                  │
│ Error Count:       0                    │
│ Interval:          30 seconds           │
├─────────────────────────────────────────┤
│ ℹ️ 24/7 Auto-Execution: The bot        │
│    automatically executes trades...     │
└─────────────────────────────────────────┘
```

## Cómo Usar

### 1. Login
```
- El Auto-Executor se inicia automáticamente
- Verás "Auto-executor started" en los logs
```

### 2. Activar Wallets
```
- Ve a "Wallet Manager"
- Toggle wallets a ON (verde)
- Configura cada wallet (⚙️ icon)
```

### 3. Monitorear
```
- Mira "Auto-Executor Status"
- Debe decir "Running" (verde)
- "Last Execution" se actualiza cada 30s
```

### 4. Verificar Operaciones
```
- Revisa "Bot Status & Logs"
- Deberías ver logs de operaciones
- O revisa Supabase → bot_logs table
```

## Troubleshooting

### No veo ejecuciones

**Problema**: "Last Execution" dice "Never"

**Soluciones**:
1. Verifica que estés logueado
2. Refresca la página (F5)
3. Mira la consola del navegador (F12)
4. Revisa que la Edge Function esté desplegada

### Muchos errores

**Problema**: "Error Count" es alto

**Causas comunes**:
1. No hay wallets activas → Activa al menos una
2. Wallets sin configuración → Configura cada wallet
3. RPC caído → Cambia el RPC en las constantes
4. Sin balance → Transfiere fondos a las wallets

**Auto-detención**: Después de 5 errores consecutivos, el executor se detiene automáticamente para evitar spam.

### Executor se detuvo

**Problema**: Dice "Stopped" en lugar de "Running"

**Soluciones**:
1. Cierra sesión (Logout)
2. Vuelve a hacer login
3. El executor se reiniciará automáticamente

## Logs del Executor

El Auto-Executor escribe logs a la consola del navegador:

```javascript
[BotExecutor] Starting bot executor (30s interval)...
[BotExecutor] Executing trading bot...
[BotExecutor] Execution successful: { processed: 1, ... }
[BotExecutor] Processed 1 active wallet(s)
```

Para ver estos logs:
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Filtra por "BotExecutor"

## Integración con Edge Function

El Auto-Executor llama a la Edge Function cada 30 segundos:

```
URL: https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
Method: POST
Headers:
  - Authorization: Bearer {ANON_KEY}
  - Content-Type: application/json
```

La Edge Function:
1. Lee todas las wallets activas del usuario
2. Para cada wallet, verifica si pasó el intervalo
3. Si pasó, ejecuta la operación (BUY o SELL)
4. Guarda logs en Supabase
5. Retorna resultado al Auto-Executor

## Código Fuente

El Auto-Executor está implementado en:

```
src/services/botExecutor.ts    - Lógica del executor
src/context/BotContext.tsx     - Integración con React
src/components/AutoExecutorStatus.tsx - Panel de estado
```

## Próximos Pasos

1. **Prueba el Auto-Executor**:
   - Login
   - Activa una wallet
   - Espera 30 segundos
   - Verifica ejecuciones

2. **Monitorea los primeros días**:
   - Revisa logs frecuentemente
   - Verifica transacciones en blockchain
   - Ajusta configuración según resultados

3. **Opcional - CRON Externo**:
   - Si quieres 24/7 sin navegador abierto
   - Configura cron-job.org
   - Ver QUICK_START.md para instrucciones

## Resumen

El Auto-Executor te permite operar el bot **inmediatamente** sin configuración externa. Solo:

1. ✅ Login
2. ✅ Activa wallets
3. ✅ Listo - El bot funciona automáticamente

**⚠️ Recuerda**: Mantén la pestaña abierta o configura CRON externo para verdadero 24/7.

---

**🎉 ¡Disfruta del trading automatizado!**
