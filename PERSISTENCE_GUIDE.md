# Guía de Persistencia - Bot de Trading

## ¿Qué cambió?

Tu bot ahora **guarda automáticamente TODO en Supabase**. Ya no necesitas preocuparte por perder datos al cerrar el navegador.

---

## Persistencia Automática ✨

### 1. **Estado de las Wallets**
✅ **Se guarda automáticamente:**
- Si la wallet está activa (ON/OFF)
- Nombre de la wallet
- Métricas (total buys, sells, volume, errors)
- Claves privadas (encriptadas)

✅ **Se restaura automáticamente al hacer login**

### 2. **Configuración de cada Wallet**
✅ **Se guarda automáticamente cuando haces clic en "Save Configuration":**
- Montos de compra (min/max)
- Montos de venta (min/max)
- Slippage (buy/sell)
- Intervalos (horas/minutos/segundos)
- Token seleccionado
- Network seleccionada
- DEX seleccionado

✅ **Se carga automáticamente al hacer login**

### 3. **Estrategias de Trading**
✅ **Se guardan automáticamente:**
- Ciclos de operaciones
- Órdenes aleatorias
- Variabilidad de montos
- Variabilidad de tiempos
- Probabilidades de éxito

✅ **Persisten entre sesiones**

---

## Cómo Funciona

### Al Hacer Login
```
1. Te autenticas con Supabase Auth
2. El sistema carga automáticamente:
   ✓ Todas tus wallets
   ✓ Configuración de cada wallet
   ✓ Estrategias de cada wallet
   ✓ Estado activo/inactivo
3. Las wallets aparecen exactamente como las dejaste
```

### Al Hacer Cambios
```
Cualquier cambio se guarda INMEDIATAMENTE en Supabase:
- Activas/desactivas wallet → Guarda en la nube
- Cambias configuración → Guarda en la nube
- Agregas nueva wallet → Guarda en la nube
- Cambias nombre → Guarda en la nube
```

### Al Cerrar Sesión
```
1. Cierras el navegador/app
2. Todos los datos están seguros en Supabase
3. Nada se pierde
```

### Al Volver a Entrar
```
1. Haces login
2. Todo se restaura automáticamente
3. Bot continúa donde lo dejaste
4. Wallets activas siguen activas
```

---

## Escenarios de Uso

### Escenario 1: Configurar y Salir
```
Tú:
1. Login
2. Generas 3 wallets
3. Configuras cada wallet
4. Activas las 3 wallets
5. Cierras el navegador
6. Te vas a dormir 😴

Al día siguiente:
1. Abres la app
2. Haces login
3. ✅ Las 3 wallets están ahí
4. ✅ Las 3 wallets están activas (ON)
5. ✅ Toda la configuración está guardada
6. ✅ Auto-Executor reanuda trading inmediatamente
```

### Escenario 2: Editar Configuración
```
Tú:
1. Abres wallet config (⚙️)
2. Cambias min buy amount de 0.01 a 0.05
3. Cambias selected token
4. Click "Save Configuration"
5. Cierras la app

Más tarde:
1. Vuelves a entrar
2. Abres wallet config (⚙️)
3. ✅ Los cambios están ahí
4. ✅ Token seleccionado está guardado
5. ✅ Todo como lo dejaste
```

### Escenario 3: Usar desde Múltiples Dispositivos
```
En tu PC:
1. Login
2. Configuras wallets
3. Activas trading
4. Cierras la app

En tu teléfono:
1. Login con la misma cuenta
2. ✅ Ves todas tus wallets
3. ✅ Ves todo configurado
4. ✅ Puedes editar desde el teléfono
5. ✅ Cambios se sincronizan

De vuelta en tu PC:
1. Login
2. ✅ Ves los cambios del teléfono
```

---

## Qué Datos se Guardan

### Tabla: wallets
```
- address (dirección de la wallet)
- encrypted_private_key (clave privada encriptada)
- name (nombre personalizado)
- active (estado ON/OFF)
- is_imported (si fue importada o generada)
- total_buys (total de compras)
- total_sells (total de ventas)
- total_volume (volumen total)
- errors (contador de errores)
```

### Tabla: wallet_configurations
```
- min_buy_amount
- max_buy_amount
- buy_slippage
- buy_interval_hours
- buy_interval_minutes
- buy_interval_seconds
- min_sell_amount
- max_sell_amount
- sell_slippage
- sell_interval_hours
- sell_interval_minutes
- sell_interval_seconds
- selected_token
- selected_network
- selected_dex
```

### Tabla: wallet_strategies
```
- remaining_buys
- remaining_sells
- operations_left
- operations (array de operaciones)
- consecutive_buys
- consecutive_sells
- amount_variability
- time_variability
- base_success_prob
- market_bias
- last_operation_time
```

---

## Seguridad

### Claves Privadas
✅ **Encriptadas antes de guardar**
- Usamos AES-256-GCM
- Solo tú puedes desencriptarlas
- Nunca se guardan en texto plano

### Row Level Security (RLS)
✅ **Solo tú puedes ver tus datos**
```sql
-- Ejemplo de política RLS
CREATE POLICY "Users can only see their own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```
- Cada usuario solo ve sus propias wallets
- Imposible ver datos de otros usuarios
- Supabase garantiza el aislamiento

### Aislamiento
✅ **Datos completamente separados**
- Cada usuario tiene su propio espacio
- Imposible mezclar datos entre usuarios
- Base de datos protege tu privacidad

---

## Troubleshooting

### Problema: "No veo mis wallets"
**Solución:**
1. Verifica que estás logueado
2. Abre la consola del navegador (F12)
3. Busca: `[WalletContext] Loaded wallets:`
4. Deberías ver cuántas wallets se cargaron
5. Si ves `0`, significa que no hay wallets en Supabase

### Problema: "La configuración no se guarda"
**Solución:**
1. Asegúrate de hacer clic en "Save Configuration"
2. Verifica el mensaje de éxito (toast verde)
3. Abre consola (F12)
4. Busca: `[WalletContext] Config saved to Supabase`
5. Si ves error, revisa la conexión a internet

### Problema: "Wallet activa se desactiva al recargar"
**Esto ya NO debería pasar**
- Antes: El estado se perdía
- Ahora: El estado persiste en Supabase
- Si pasa: Es un bug, repórtalo

### Problema: "Perdí mis datos"
**Imposible si:**
1. Hiciste login correctamente
2. Viste el mensaje de éxito al guardar
3. Los datos llegaron a Supabase

**Para verificar:**
1. Ve a Supabase Dashboard
2. Table Editor → wallets
3. Table Editor → wallet_configurations
4. Busca tus datos por email/user_id

---

## Logs de Debugging

Para ver qué está pasando, abre la consola (F12) y busca:

### Al Cargar Wallets
```
[WalletContext] Loading wallets from Supabase...
[WalletContext] Loaded wallets: 3
[WalletContext] Loaded config for 0x1234... { minBuyAmount: 0.01, ... }
[WalletContext] Loaded configs: 3
```

### Al Guardar Configuración
```
[WalletContext] Saving config for 0x1234... { minBuyAmount: 0.05, ... }
[WalletContext] Config saved to Supabase
```

### Al Activar/Desactivar Wallet
```
[WalletContext] Wallet active state saved to Supabase: true
```

### Al Agregar Wallet
```
[WalletContext] Wallet saved to Supabase: 0x1234...
```

---

## Migración de localStorage a Supabase

### ¿Qué pasa con mis datos en localStorage?

**Antes:**
- Todo se guardaba en localStorage del navegador
- Datos se perdían al cambiar de navegador
- No había sincronización

**Ahora:**
- Todo se guarda en Supabase
- localStorage se mantiene como backup local
- Sincronización automática en la nube

### ¿Necesito hacer algo?

**NO** - Todo es automático:
1. Al hacer login, se cargan datos de Supabase
2. Al hacer cambios, se guardan en Supabase
3. localStorage se actualiza también (como backup)

### ¿Qué pasa si tenía datos en localStorage?

**Primera vez después de la actualización:**
1. Datos viejos están en localStorage
2. Al agregar/editar wallets, se guardan en Supabase
3. Datos nuevos reemplazan los viejos
4. De ahí en adelante, todo viene de Supabase

**Si quieres importar wallets viejas:**
1. Usa la función "Import Wallet"
2. Pega la clave privada
3. La wallet se agrega a Supabase automáticamente

---

## Ventajas de la Nueva Persistencia

### 1. Confiabilidad
✅ Base de datos en la nube
✅ Backups automáticos de Supabase
✅ Alta disponibilidad (99.9% uptime)

### 2. Sincronización
✅ Accede desde cualquier dispositivo
✅ Cambios se reflejan instantáneamente
✅ Múltiples sesiones simultáneas

### 3. Seguridad
✅ Claves encriptadas
✅ Row Level Security
✅ Aislamiento por usuario

### 4. Escalabilidad
✅ Soporta miles de wallets
✅ Rendimiento constante
✅ Sin límites de storage

### 5. Simplicidad
✅ Todo automático
✅ No necesitas configurar nada
✅ Funciona "out of the box"

---

## Resumen

### Antes 😞
```
- Datos en localStorage
- Se perdían al cambiar navegador
- No había sincronización
- Configuración no persistía
- Estado de wallets se reseteaba
```

### Ahora 🎉
```
- ✅ Datos en Supabase (nube)
- ✅ Accesibles desde cualquier dispositivo
- ✅ Sincronización automática
- ✅ Configuración persiste
- ✅ Estado de wallets persiste
- ✅ Todo se guarda automáticamente
- ✅ Nada se pierde
```

---

## FAQ

### ¿Se guardan los datos sin internet?
No, necesitas internet para guardar en Supabase. Pero:
- Los datos se guardan también en localStorage (backup)
- Cuando vuelva la conexión, se sincroniza

### ¿Cuánto espacio tengo?
- Plan gratuito de Supabase: 500MB
- Suficiente para miles de wallets
- No te preocupes por espacio

### ¿Los datos expiran?
No, los datos persisten indefinidamente mientras:
- Mantengas tu cuenta activa
- No los borres manualmente

### ¿Puedo ver mis datos en Supabase?
Sí:
1. Ve a https://supabase.com
2. Login
3. Selecciona tu proyecto
4. Table Editor
5. Explora las tablas

### ¿Puedo exportar mis datos?
Sí, usa el botón "Export All Wallets" en la interfaz.

---

**🎉 ¡Disfruta de la persistencia automática!**

Tu bot ahora es verdaderamente "set and forget". Configura una vez, y todo se mantiene para siempre.
