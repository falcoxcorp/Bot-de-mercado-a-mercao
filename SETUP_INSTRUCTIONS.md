# Falco-X Trading Bot - Setup Instructions

## Sistema Implementado

Tu bot de trading ahora funciona con **Supabase** y puede ejecutarse **24/7 sin necesidad de mantener tu PC encendida**.

## Arquitectura

### 1. **Frontend (React)**
- Sistema de autenticación (login/registro)
- Panel de control para configurar wallets
- Visualización en tiempo real del estado del bot
- **Puedes cerrar el navegador** después de configurar

### 2. **Supabase Database**
- Almacena todas las configuraciones de trading
- Guarda métricas e historial de operaciones
- Administra wallets y estrategias
- Base de datos segura con Row Level Security (RLS)

### 3. **Edge Function (Corazón del Sistema 24/7)**
- Se ejecuta en la nube de Supabase
- **NO necesita tu PC encendida**
- Ejecuta operaciones de trading automáticamente
- Actualiza métricas en tiempo real

## Cómo Funciona

### Flujo Completo:

```
1. Usuario se registra/logea
   ↓
2. Configura wallets y estrategias de trading
   ↓
3. Activa las wallets que quiere que operen
   ↓
4. Cierra la aplicación y apaga su PC
   ↓
5. Edge Function se ejecuta cada 30 segundos en la nube
   ↓
6. Lee configuraciones desde la base de datos
   ↓
7. Ejecuta operaciones según las estrategias
   ↓
8. Guarda resultados en la base de datos
   ↓
9. Usuario puede volver desde cualquier dispositivo y ver resultados
```

## Configuración del CRON Job (IMPORTANTE)

Para que el bot funcione 24/7 automáticamente, necesitas configurar un **CRON job** que llame a la Edge Function regularmente.

### Opción 1: Usar un servicio CRON externo (RECOMENDADO)

Usa servicios como **cron-job.org**, **EasyCron** o **UptimeRobot**:

1. Registrate en [cron-job.org](https://cron-job.org)
2. Crea un nuevo CRON job con esta URL:
   ```
   https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
   ```
3. Configura la frecuencia: **Cada 30 segundos** o **Cada 1 minuto**
4. Activa el job

### Opción 2: Usar Supabase Database Webhooks

1. Ve a tu dashboard de Supabase
2. Navega a **Database** → **Webhooks**
3. Crea un webhook que se dispare en intervalos regulares
4. URL del webhook: La URL de tu Edge Function

### Opción 3: Configurar pg_cron (Avanzado)

Si tienes acceso a pg_cron en Supabase:

```sql
-- Ejecutar cada 30 segundos
SELECT cron.schedule(
  'trading-bot-executor',
  '*/30 * * * * *',
  $$
  SELECT net.http_post(
    url:='https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor',
    headers:='{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## Seguridad

### Claves Privadas
Las claves privadas se almacenan **encriptadas** en la base de datos usando encriptación básica. Para producción se recomienda:

1. **Usar una contraseña maestra** por usuario
2. **Implementar encriptación AES-256** más robusta
3. **Considerar hardware wallets** para operaciones críticas

### Row Level Security (RLS)
- Cada usuario **solo puede ver y modificar sus propios datos**
- Las políticas de seguridad están configuradas en todas las tablas
- La Edge Function usa el **service_role_key** para operaciones administrativas

## Uso de la Aplicación

### 1. Registro e Inicio de Sesión
- Abre la aplicación
- Crea una cuenta o inicia sesión
- Tu sesión se mantiene automáticamente

### 2. Configurar Wallets
- **Genera nuevas wallets** o **importa existentes**
- Cada wallet puede tener su propia configuración
- Configura parámetros de compra/venta
- Selecciona el token pair para trading

### 3. Activar Trading
- Toggle el switch de cada wallet que quieras activar
- Las wallets activas aparecerán marcadas
- El bot comenzará a operar automáticamente

### 4. Monitorear
- Ve logs en tiempo real
- Revisa historial de operaciones
- Consulta métricas por wallet
- **Todo se actualiza incluso si cierras la app**

### 5. Desactivar
- Simplemente desactiva el toggle de la wallet
- El bot dejará de operar esa wallet
- Los datos se mantienen guardados

## Características Principales

### ✅ Trading 24/7
- El bot funciona continuamente en la nube
- No necesitas mantener tu PC encendida
- No necesitas mantener el navegador abierto

### ✅ Multi-Wallet
- Gestiona múltiples wallets simultáneamente
- Cada wallet con su propia estrategia
- Operaciones independientes por wallet

### ✅ Estrategias Inteligentes
- Ciclos de 10 operaciones (5 compras, 5 ventas)
- Orden aleatorio para simular comportamiento orgánico
- Cantidades variables dentro de rangos configurados
- Intervalos de tiempo con variabilidad aleatoria

### ✅ Multi-Dispositivo
- Inicia sesión desde cualquier dispositivo
- Configuración sincronizada en la nube
- Accede a tus datos desde cualquier lugar

### ✅ Historial Completo
- Todas las operaciones se registran
- Logs detallados por wallet
- Métricas de rendimiento

## Base de Datos

### Tablas Principales:

1. **user_profiles** - Perfiles de usuario
2. **wallets** - Wallets y sus métricas
3. **wallet_configurations** - Parámetros de trading por wallet
4. **wallet_strategies** - Estrategias y ciclos de operación
5. **trading_history** - Historial completo de trades
6. **bot_logs** - Logs del sistema

## Troubleshooting

### El bot no ejecuta operaciones
1. Verifica que la wallet esté **activa** (toggle ON)
2. Confirma que hay un **token seleccionado**
3. Revisa que la wallet tenga **suficiente balance**
4. Verifica que el **CRON job esté funcionando**

### No veo actualizaciones
1. Refresca la página
2. Cierra sesión y vuelve a entrar
3. Revisa la consola del navegador por errores

### Error de autenticación
1. Verifica tus credenciales
2. Intenta restablecer tu contraseña
3. Limpia el localStorage del navegador

## Próximos Pasos Recomendados

### Mejoras de Seguridad
1. Implementar encriptación AES-256 para claves privadas
2. Agregar autenticación de dos factores (2FA)
3. Implementar contraseña maestra por usuario

### Mejoras Funcionales
1. Notificaciones por email/Telegram
2. Dashboard de analíticas avanzadas
3. Backtesting de estrategias
4. Stop-loss y take-profit automáticos

### Optimizaciones
1. Implementar caché para precios de tokens
2. Batch operations para múltiples wallets
3. Retry logic con exponential backoff

## Soporte

Para cualquier problema o pregunta:
1. Revisa los logs en la aplicación
2. Consulta la documentación de Supabase
3. Revisa la consola de Supabase para errores en Edge Functions

---

**Nota Importante**: Este bot ejecuta operaciones reales en blockchain. Asegúrate de:
- Probar con cantidades pequeñas primero
- Entender los riesgos de trading automatizado
- Mantener respaldos de tus claves privadas
- Monitorear regularmente el comportamiento del bot
