# Flujo de Guardado de Parámetros

Este documento explica cómo funcionan los botones de guardado en el sistema.

## 1. Botón "Save Trading Parameters"

### Ubicación
- Componente: `ParameterControls.tsx`
- Se encuentra en la sección de parámetros de trading

### Qué hace
Cuando haces clic en **"Save Trading Parameters"**:

1. Lee todos los parámetros actuales:
   - Montos mínimos/máximos de compra
   - Montos mínimos/máximos de venta
   - Slippage de compra y venta
   - Intervalos de tiempo (horas, minutos, segundos)
   - Token seleccionado

2. Busca todas las wallets del usuario en la base de datos

3. Guarda estos parámetros en la tabla `wallet_configurations` para **TODAS las wallets**

4. Muestra un mensaje de éxito indicando cuántas wallets fueron actualizadas

### Ejemplo
Si tienes 5 wallets importadas/generadas, al hacer clic en "Save Trading Parameters", los parámetros se guardan para las 5 wallets en la base de datos.

## 2. Botón "Save Configuration" (en Bot Configuration)

### Ubicación
- Componente: `BotConfiguration.tsx`
- Se encuentra en la sección de configuración del bot

### Qué hace
Cuando haces clic en **"Save Credentials"**:

1. Verifica que hayas ingresado clave privada y dirección

2. Muestra un mensaje indicándote que uses el **Wallet Manager** para importar wallets

3. Esto es porque el sistema actual usa el Wallet Manager para manejar todas las wallets y claves privadas de forma segura

## 3. Flujo Recomendado

### Para guardar parámetros de trading:

1. **Importa o genera wallets** usando el Wallet Manager
   - Las wallets se guardan automáticamente en la BD con clave encriptada

2. **Configura los parámetros** de trading:
   - Ajusta montos de compra/venta
   - Ajusta slippage
   - Ajusta intervalos de tiempo
   - Selecciona el token a tradear

3. **Haz clic en "Save Trading Parameters"**
   - Los parámetros se guardan en la BD para todas tus wallets

4. **Activa el trading** en cada wallet
   - Marca la wallet como activa
   - El Edge Function ejecutará trades automáticamente

## 4. Persistencia en Base de Datos

Todos los datos se guardan en Supabase:

### Tabla: `wallets`
- Dirección de la wallet
- Clave privada encriptada
- Estado activo/inactivo
- Métricas

### Tabla: `wallet_configurations`
- Parámetros de compra/venta
- Intervalos de tiempo
- Token y DEX seleccionados
- Network seleccionada

### Ventajas
- **Persistencia**: Los datos no se pierden al cerrar el navegador
- **Disponibilidad**: El bot funciona 24/7 leyendo desde la BD
- **Sincronización**: Todos tus dispositivos pueden acceder a la misma configuración
- **Seguridad**: Claves encriptadas + Row Level Security

## 5. Código Relevante

### saveParameters en BotContext.tsx

```typescript
const saveParameters = async () => {
  if (!user) {
    toast.error('Please login first');
    return;
  }

  // Busca todas las wallets del usuario
  const { data: activeWallets } = await walletService.supabase
    .from('wallets')
    .select('id, address')
    .eq('user_id', user.id);

  // Guarda los parámetros para cada wallet
  for (const wallet of activeWallets) {
    await walletService.saveWalletConfig(user.id, wallet.id, {
      minBuyAmount: tradingParameters.minBuyAmount,
      maxBuyAmount: tradingParameters.maxBuyAmount,
      // ... más parámetros
    });
  }

  toast.success(`Parameters saved for ${savedCount} wallet(s)`);
};
```

## 6. Notas Importantes

- Debes estar **autenticado** para guardar parámetros
- Los parámetros se aplican a **todas las wallets** del usuario
- Si quieres parámetros diferentes por wallet, usa el sistema de configuración individual en WalletManager
- Los cambios se guardan inmediatamente en la base de datos
- No es necesario reiniciar el bot después de guardar parámetros
