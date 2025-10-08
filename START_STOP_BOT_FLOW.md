# Flujo Start/Stop Bot

Este documento explica cómo funciona el sistema de inicio y detención del bot de trading.

## Flujo Completo

### 1. Preparación
Antes de iniciar el bot, debes:

1. **Login** → Autenticarte en la aplicación
2. **Importar o Generar Wallets** → En el Wallet Manager
3. **Configurar Parámetros** → Establecer montos, slippage, intervalos
4. **Guardar Parámetros** → Click en "Save Trading Parameters"

### 2. Iniciar el Bot (Start Bot)

Cuando haces clic en **"Start Bot"**:

#### Validaciones
1. Verifica que estés autenticado
2. Verifica que hayas seleccionado un token
3. Busca todas tus wallets en la base de datos
4. Verifica que tengas al menos una wallet
5. Verifica que las wallets tengan configuración guardada

#### Proceso
1. **Actualiza la base de datos**:
   ```sql
   UPDATE wallets
   SET active = true
   WHERE user_id = 'tu_user_id'
   ```

2. **Activa TODAS las wallets** del usuario

3. **Actualiza el estado local**:
   - `isTrading = true`
   - Muestra el indicador verde "Bot Active"
   - Inicia simulación de ciclos

4. **Mensaje de éxito**:
   - "Bot started for X wallet(s)"

#### Lo que sucede después
- El **Edge Function** se ejecuta cada minuto automáticamente
- Lee todas las wallets con `active = true` de la base de datos
- Ejecuta trades según los parámetros guardados
- Funciona **24/7** aunque cierres el navegador

### 3. Detener el Bot (Stop Bot)

Cuando haces clic en **"Stop Bot"**:

#### Proceso
1. **Actualiza la base de datos**:
   ```sql
   UPDATE wallets
   SET active = false
   WHERE user_id = 'tu_user_id'
   ```

2. **Desactiva TODAS las wallets** del usuario

3. **Actualiza el estado local**:
   - `isTrading = false`
   - Muestra el indicador rojo "Bot Inactive"
   - Detiene simulación de ciclos

4. **Mensaje informativo**:
   - "Bot stopped for all wallets"

#### Lo que sucede después
- El **Edge Function** ya no ejecutará trades para tus wallets
- Las wallets se mantienen en la base de datos con `active = false`
- Puedes reiniciar el bot cuando quieras

### 4. Persistencia del Estado

#### Al recargar la página
Cuando recargas la página o vuelves a entrar:

1. El sistema **verifica automáticamente** el estado en la base de datos
2. Lee todas las wallets con `active = true`
3. Si encuentra wallets activas:
   - `isTrading = true`
   - Muestra "X wallet(s) are actively trading"
   - Reanuda la simulación de ciclos
4. Si no encuentra wallets activas:
   - `isTrading = false`
   - Muestra "Bot Inactive"

#### Ventajas
- ✅ El bot **mantiene su estado** entre sesiones
- ✅ Puedes cerrar el navegador y el bot sigue activo
- ✅ Al volver a entrar, ves el estado real del bot
- ✅ No necesitas reactivar manualmente después de recargar

## Código Relevante

### startBot en BotContext.tsx

```typescript
const startBot = async () => {
  if (!user) {
    toast.error('Please login first');
    return;
  }

  // Validar que haya token seleccionado
  if (!tradingParameters.selectedToken) {
    toast.error('Please select a trading pair first');
    return;
  }

  // Buscar wallets del usuario
  const { data: wallets } = await walletService.supabase
    .from('wallets')
    .select('id, address, encrypted_private_key')
    .eq('user_id', user.id);

  if (!wallets || wallets.length === 0) {
    toast.error('No wallets found. Import or generate a wallet first.');
    return;
  }

  // Verificar que tengan configuración
  const { data: configs } = await walletService.supabase
    .from('wallet_configurations')
    .select('wallet_id')
    .eq('user_id', user.id);

  if (!configs || configs.length === 0) {
    toast.warning('Please save trading parameters first');
    return;
  }

  // Activar todas las wallets
  await walletService.supabase
    .from('wallets')
    .update({ active: true })
    .eq('user_id', user.id);

  setIsTrading(true);
  toast.success(`Bot started for ${wallets.length} wallet(s)`);
};
```

### stopBot en BotContext.tsx

```typescript
const stopBot = async () => {
  if (!user) {
    toast.error('Please login first');
    return;
  }

  // Desactivar todas las wallets
  await walletService.supabase
    .from('wallets')
    .update({ active: false })
    .eq('user_id', user.id);

  setIsTrading(false);
  setCurrentCycle('Not running');
  setNextCycle('Not running');
  toast.info('Bot stopped for all wallets');
};
```

### checkActiveBots (verificación automática)

```typescript
const checkActiveBots = async () => {
  if (!user) return;

  const { data: activeWallets } = await walletService.supabase
    .from('wallets')
    .select('id, address')
    .eq('user_id', user.id)
    .eq('active', true);

  if (activeWallets && activeWallets.length > 0) {
    setIsTrading(true);
    addLog(`${activeWallets.length} wallet(s) are actively trading`, 'info');
    simulateCycles();
  } else {
    setIsTrading(false);
  }
};

// Se ejecuta automáticamente cuando el usuario inicia sesión
useEffect(() => {
  if (user) {
    checkActiveBots();
  }
}, [user]);
```

## Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario hace click en "Start Bot"                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Validaciones:                                              │
│  ✓ Usuario autenticado                                      │
│  ✓ Token seleccionado                                       │
│  ✓ Wallets existentes                                       │
│  ✓ Configuración guardada                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  UPDATE wallets SET active = true                          │
│  WHERE user_id = 'user_id'                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Estado guardado en BD ✓                                    │
│  isTrading = true (estado local)                            │
│  Indicador: "Bot Active" (verde)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Function ejecuta cada minuto:                         │
│  1. Lee wallets con active = true                           │
│  2. Desencripta claves privadas                             │
│  3. Ejecuta trades según parámetros                         │
│  4. Guarda resultados en BD                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Bot funciona 24/7                                          │
│  Aunque cierres el navegador                                │
└─────────────────────────────────────────────────────────────┘
```

## Mensajes de Error Comunes

### "Please login first"
- **Causa**: No estás autenticado
- **Solución**: Inicia sesión primero

### "Please select a trading pair first"
- **Causa**: No has seleccionado un token en Token Pair Manager
- **Solución**: Selecciona un token y un DEX

### "No wallets found. Import or generate a wallet first."
- **Causa**: No tienes wallets en la base de datos
- **Solución**: Importa o genera al menos una wallet

### "Please save trading parameters first"
- **Causa**: Las wallets no tienen configuración guardada
- **Solución**: Configura los parámetros y haz click en "Save Trading Parameters"

## Resumen

1. **Start Bot** → Activa todas las wallets en la BD (`active = true`)
2. **Stop Bot** → Desactiva todas las wallets en la BD (`active = false`)
3. **Persistencia** → El estado se mantiene entre sesiones
4. **Edge Function** → Opera automáticamente leyendo desde la BD
5. **24/7** → Funciona aunque cierres el navegador
