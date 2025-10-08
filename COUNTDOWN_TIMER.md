# Temporizador de Countdown - Próxima Operación

## ¿Qué se implementó?

Ahora el bot muestra un **countdown en tiempo real** que indica exactamente cuánto tiempo falta para la próxima operación de trading.

---

## 🕐 Qué Muestra

### **Next Cycle Display:**

```
Next: 0x1a2b3c4d... will BUY in 4m 32s | Total: 15 buys, 12 sells (27 ops)
  ↑       ↑          ↑      ↑                    ↑
  Wallet  Dirección  Tipo   Tiempo              Total de operaciones
  que     corta      de     restante            pendientes en todas
  operará de wallet  op     exacto              las wallets
```

### **Desglose:**

1. **"Next: 0x1a2b3c4d..."**
   - Wallet que hará la próxima operación
   - Muestra los primeros 8 caracteres de la dirección

2. **"will BUY"** o **"will SELL"**
   - Tipo de operación que se ejecutará
   - Basado en la estrategia real de la wallet

3. **"in 4m 32s"**
   - Countdown exacto en tiempo real
   - Actualiza cada segundo
   - Formatos: "5h 30m 15s", "45m 20s", "30s"

4. **"| Total: 15 buys, 12 sells (27 ops)"**
   - Resumen de todas las wallets activas
   - Total de operaciones pendientes

---

## 🎯 Ejemplos de Uso

### **Ejemplo 1: Wallet Recién Activada**
```
Configuras:
- Buy Interval: 5 minutos
- No ha hecho ninguna operación

Muestra:
Next: 0x1a2b3c4d... will BUY in 5m 0s | Total: 5 buys, 5 sells (10 ops)
  ↓ (1 segundo después)
Next: 0x1a2b3c4d... will BUY in 4m 59s | Total: 5 buys, 5 sells (10 ops)
  ↓ (1 segundo después)
Next: 0x1a2b3c4d... will BUY in 4m 58s | Total: 5 buys, 5 sells (10 ops)
```

### **Ejemplo 2: Wallet Operando**
```
Último trade: Hace 3 minutos
Intervalo configurado: 5 minutos
Tiempo restante: 2 minutos

Muestra:
Next: 0x1a2b3c4d... will SELL in 2m 0s | Total: 3 buys, 4 sells (7 ops)
  ↓ (cuenta regresiva)
Next: 0x1a2b3c4d... will SELL in 1m 59s | Total: 3 buys, 4 sells (7 ops)
  ↓ (cuenta regresiva)
Next: 0x1a2b3c4d... will SELL in 1m 30s | Total: 3 buys, 4 sells (7 ops)
  ↓ (sigue hasta 0)
Next: 0x1a2b3c4d... will SELL in Ready now | Total: 3 buys, 4 sells (7 ops)
```

### **Ejemplo 3: Múltiples Wallets**
```
Wallet A: Próxima op en 10 minutos (BUY)
Wallet B: Próxima op en 3 minutos (SELL)
Wallet C: Próxima op en 1 minuto (BUY)

Muestra (la que está más cerca):
Next: 0xWalletC... will BUY in 1m 0s | Total: 8 buys, 7 sells (15 ops)

Después de que Wallet C opera:
Next: 0xWalletB... will SELL in 2m 0s | Total: 7 buys, 7 sells (14 ops)
```

---

## ⚙️ Cómo Funciona Internamente

### **Cálculo del Countdown:**

```typescript
1. Lee última operación de la wallet (last_operation_time)
2. Lee intervalo configurado para esa wallet
   - Si próxima op es BUY: usa buyInterval
   - Si próxima op es SELL: usa sellInterval
3. Calcula tiempo transcurrido desde última operación
4. Calcula tiempo restante:
   timeRemaining = intervalSeconds - timeSinceLastOp
5. Formatea y muestra
```

### **Ejemplo de Cálculo:**

```
Configuración:
- Buy Interval: 5 minutos (300 segundos)
- Última operación: 14:30:00
- Ahora: 14:33:15

Cálculo:
- Tiempo transcurrido: 3 minutos 15 segundos = 195 segundos
- Tiempo restante: 300 - 195 = 105 segundos
- Formato: 1m 45s

Muestra:
Next: 0x1a2b3c4d... will BUY in 1m 45s | Total: ...
```

---

## 🔄 Actualización en Tiempo Real

### **Frecuencia:**
- Actualiza **cada 1 segundo**
- Countdown fluido y preciso
- No hay delay visible

### **Lógica de Actualización:**

```typescript
useEffect(() => {
  if (user) {
    const interval = setInterval(() => {
      updateCycleInfo(); // Recalcula countdown
    }, 1000); // 1 segundo

    return () => clearInterval(interval);
  }
}, [user]);
```

---

## 📊 Formato de Tiempo

### **Formatos Automáticos:**

```typescript
5h 30m 15s  → Más de 1 hora
45m 20s     → Menos de 1 hora, más de 1 minuto
30s         → Menos de 1 minuto
Ready now   → Tiempo cumplido (≤ 0 segundos)
```

### **Función de Formato:**

```typescript
const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Ready now';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
```

---

## 🎯 Wallet Prioritaria

**Siempre muestra la wallet con el countdown más corto:**

```
3 Wallets activas:

Wallet A: Próxima en 10m → No se muestra
Wallet B: Próxima en 3m  → No se muestra
Wallet C: Próxima en 30s → ✅ SE MUESTRA (más cercana)

Display:
Next: 0xWalletC... will BUY in 30s | Total: ...
```

### **Lógica de Prioridad:**

```typescript
let closestTimeRemaining = Infinity;

for (const wallet of activeWallets) {
  // ... calcula timeRemaining para esta wallet

  if (timeRemaining < closestTimeRemaining) {
    closestTimeRemaining = timeRemaining;
    nextOperationInfo = `...esta wallet...`;
  }
}
```

---

## 🔧 Integración con Sistema Existente

### **Datos que Lee:**

1. **wallet_strategies.last_operation_time**
   - Timestamp de última operación
   - Se actualiza después de cada trade

2. **wallet_configurations**
   - buyIntervalHours/Minutes/Seconds
   - sellIntervalHours/Minutes/Seconds

3. **wallet_strategies.operations**
   - Array con orden de operaciones
   - Primera posición = próxima operación
   - Determina si es BUY o SELL

### **Sin Romper Lógica:**

✅ **Lógica de trading intacta**
- Edge Function opera igual
- Intervalos respetados
- Estrategias preservadas

✅ **Solo lectura de datos**
- No modifica estrategias
- No afecta ciclos
- Solo muestra información

---

## 📱 Estados del Display

### **1. Sin Login**
```
Current Cycle: Not logged in
Next Cycle: Not logged in
```

### **2. Sin Wallets Activas**
```
Current Cycle: No active wallets
Next Cycle: Activate a wallet to start trading
```

### **3. Con Wallets Activas**
```
Current Cycle: 3 active wallets - Running...
Next Cycle: Next: 0x1a2b3c4d... will BUY in 2m 30s | Total: 15 buys, 12 sells (27 ops)
```

### **4. Error**
```
Current Cycle: Error loading wallet info
Next Cycle: Check console for details
```

---

## 🐛 Debugging

### **Logs en Consola:**

```javascript
console.log('[BotContext] Error updating cycle info:', error);
```

### **Verificar Cálculos:**

```javascript
// En updateCycleInfo(), agrega:
console.log('Wallet:', wallet.address);
console.log('Last op time:', strategy.lastOperationTime);
console.log('Interval seconds:', intervalSeconds);
console.log('Time remaining:', timeRemaining);
console.log('Formatted:', formatTimeRemaining(timeRemaining));
```

---

## 💡 Casos Especiales

### **Caso 1: Primera Operación**
```
Wallet recién activada, no tiene last_operation_time

Resultado:
- lastOpTime = 0
- timeSinceLastOp = muy grande
- timeRemaining = 0
- Muestra: "Ready now"
```

### **Caso 2: Intervalo Muy Largo**
```
Configurado: 24 horas
Última op: Hace 1 hora

Muestra:
Next: 0x1a2b3c4d... will BUY in 23h 0m 0s | Total: ...
```

### **Caso 3: Múltiples Ops Simultáneas**
```
3 wallets llegan a 0 al mismo tiempo

Resultado:
- Muestra la primera que encuentra
- Todas operarán en la próxima ejecución del bot
```

---

## 📊 Rendimiento

### **Optimización:**

✅ **Carga Eficiente**
- Lee datos solo de wallets activas
- Cache en memoria (actualiza cada 1s)
- No consulta innecesariamente

✅ **Actualización Suave**
- Intervalo de 1 segundo
- No impacta rendimiento
- UI fluida

✅ **Manejo de Errores**
- Try/catch en updateCycleInfo
- No rompe la aplicación
- Muestra mensaje de error claro

---

## 🎉 Beneficios

### **Para el Usuario:**

✅ **Visibilidad Total**
- Sabes exactamente cuándo operará cada wallet
- No hay sorpresas
- Control completo

✅ **Planificación**
- Puedes anticipar operaciones
- Ajustar intervalos en tiempo real
- Monitoreo preciso

✅ **Confianza**
- Ves que el bot está funcionando
- Countdown demuestra actividad
- Transparencia total

### **Para el Desarrollo:**

✅ **Debugging Fácil**
- Logs claros en consola
- Información detallada
- Fácil de troubleshoot

✅ **Extensible**
- Código modular
- Fácil de agregar features
- Bien documentado

---

## 📝 Archivos Modificados

### **1. src/context/BotContext.tsx**
```typescript
✅ Agregado: formatTimeRemaining()
✅ Actualizado: updateCycleInfo()
   - Cálculo de countdown
   - Detección de próxima operación
   - Formato de tiempo
✅ Cambiado: Intervalo de 5s a 1s
```

### **2. src/types/wallet.ts**
```typescript
✅ Agregado: lastOperationTime?: string | null
   - En interface WalletStrategy
```

### **3. src/services/walletService.ts**
```typescript
✅ Actualizado: loadWalletStrategy()
   - Retorna lastOperationTime
```

---

## 🚀 Resultado Final

### **Display Completo:**

```
┌─────────────────────────────────────────────────┐
│ Bot Status                                      │
├─────────────────────────────────────────────────┤
│ Current Cycle: 3 active wallets - Running...   │
│                                                 │
│ Next Cycle:                                     │
│ Next: 0x1a2b3c4d... will BUY in 2m 30s |       │
│ Total: 15 buys, 12 sells (27 ops)              │
└─────────────────────────────────────────────────┘
      ↓ (1 segundo después)
┌─────────────────────────────────────────────────┐
│ Bot Status                                      │
├─────────────────────────────────────────────────┤
│ Current Cycle: 3 active wallets - Running...   │
│                                                 │
│ Next Cycle:                                     │
│ Next: 0x1a2b3c4d... will BUY in 2m 29s |       │
│ Total: 15 buys, 12 sells (27 ops)              │
└─────────────────────────────────────────────────┘
```

### **Actualización Fluida:**
- Cuenta regresiva suave
- Sin parpadeos
- Sin delays
- Precisión de 1 segundo

---

## ✅ Build Exitoso

```bash
npm run build
# ✓ built in 10.39s
# Sin errores
```

---

**🎉 ¡Countdown implementado exitosamente!**

Ahora tienes **control total** sobre cuándo y cómo operará cada wallet, con información precisa en tiempo real.
