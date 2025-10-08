# Falco-X Market to Market Trading Bot v2.0

## Descripción

Bot de trading automatizado que funciona **24/7 en la nube**. Configura tus wallets, activa el bot y **apaga tu PC** - el bot seguirá funcionando indefinidamente.

## Características Principales

### 🚀 Trading Automatizado
- **Auto-Executor Integrado**: Funciona mientras la app esté abierta
- **CRON Externo (Opcional)**: Verdadero 24/7 sin navegador abierto
- El bot se ejecuta en Supabase Edge Functions
- Configuración inmediata - sin setup externo requerido

### 💼 Multi-Wallet Support
- Gestiona múltiples wallets simultáneamente
- Configuración independiente por wallet
- Estrategias personalizadas por wallet

### 🎯 Estrategias Inteligentes
- Ciclos de 10 operaciones (5 compras, 5 ventas)
- Orden aleatorio para comportamiento orgánico
- Cantidades variables con distribución gaussiana
- Intervalos con variabilidad aleatoria

### 🔐 Seguridad
- Autenticación con Supabase Auth
- Row Level Security en base de datos
- Claves privadas encriptadas
- Aislamiento completo de datos por usuario

### 📊 Monitoreo en Tiempo Real
- **Panel Auto-Executor**: Estado en vivo del ejecutor
- Logs detallados de todas las operaciones
- Historial completo de trades
- Métricas por wallet
- Acceso desde cualquier dispositivo

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **Blockchain**: Web3.js
- **Styling**: TailwindCSS + Framer Motion
- **UI**: Lucide Icons + React Toastify

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Instalar dependencias
npm install

# Configurar variables de entorno
# Las variables de Supabase ya están configuradas en .env

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## Configuración del Bot 24/7

### 1. Base de Datos
✅ Ya configurada - Las tablas ya están creadas en Supabase

### 2. Edge Function
✅ Ya desplegada - `trading-bot-executor` está lista

### 3. CRON Job (IMPORTANTE)
Para que el bot funcione automáticamente, configura un CRON job:

**Opción Recomendada: cron-job.org**
1. Ve a https://cron-job.org
2. Crea un nuevo job
3. URL: `https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor`
4. Frecuencia: Cada 30 segundos o 1 minuto
5. Activa el job

**Otras opciones:**
- EasyCron
- UptimeRobot (con monitoring)
- Cualquier servicio de CRON HTTP

Ver `SETUP_INSTRUCTIONS.md` para más detalles.

## Uso

### 1. Crear Cuenta
- Abre la aplicación
- Haz clic en "Create Account"
- Ingresa email y contraseña
- Inicia sesión

### 2. Configurar Wallets
- **Generar Nuevas Wallets**: Usa el generador automático
- **Importar Wallets**: Importa por private key o address
- Configura parámetros de trading:
  - Montos mínimos y máximos de compra/venta
  - Slippage
  - Intervalos de tiempo
  - Token pair

### 3. Activar Trading
- Toggle el switch de cada wallet
- El bot comenzará a operar automáticamente
- **Puedes cerrar la aplicación**

### 4. Monitorear
- Inicia sesión desde cualquier dispositivo
- Revisa logs en tiempo real
- Consulta historial de operaciones
- Verifica métricas

### 5. Desactivar
- Desactiva el toggle de la wallet
- El bot dejará de operar esa wallet

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── AuthPage.tsx    # Página de login/registro
│   ├── Header.tsx      # Header con info de usuario
│   └── ...             # Otros componentes
├── context/            # React Contexts
│   ├── AuthContext.tsx # Autenticación
│   ├── BotContext.tsx  # Estado del bot
│   └── ...             # Otros contexts
├── lib/
│   ├── supabase.ts     # Cliente de Supabase
│   └── encryption.ts   # Encriptación de claves
├── services/
│   └── walletService.ts # Servicios de wallet
├── types/
│   └── wallet.ts       # Tipos TypeScript
└── ...

supabase/
└── functions/
    └── trading-bot-executor/  # Edge Function principal
        └── index.ts
```

## Base de Datos

### Tablas Principales

- **user_profiles** - Perfiles de usuario
- **wallets** - Wallets y métricas
- **wallet_configurations** - Configuraciones de trading
- **wallet_strategies** - Estrategias por wallet
- **trading_history** - Historial de operaciones
- **bot_logs** - Logs del sistema

Todas las tablas tienen **Row Level Security** activado.

## Testing

### Probar Edge Function Manualmente
```bash
./test-edge-function.sh
```

O con curl:
```bash
curl -X POST https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor
```

### Verificar CRON Job
1. Activa una wallet con configuración
2. Espera el intervalo configurado
3. Revisa los logs en la aplicación
4. Verifica el historial de operaciones

## Seguridad

### Claves Privadas
- Se almacenan **encriptadas** en la base de datos
- Solo el dueño puede acceder a sus wallets
- Encriptación básica implementada (mejorar para producción)

### Recomendaciones
1. Usa contraseñas fuertes
2. No compartas tus credenciales
3. Mantén backup de tus claves privadas
4. Empieza con cantidades pequeñas

## Troubleshooting

### Bot no ejecuta operaciones
- Verifica que la wallet esté activa (toggle ON)
- Confirma que hay un token seleccionado
- Revisa el balance de la wallet
- Verifica que el CRON job esté funcionando

### No veo actualizaciones
- Refresca la página
- Cierra sesión y vuelve a entrar
- Revisa los logs del navegador

### Errores de transacción
- Verifica el balance de la wallet
- Aumenta el slippage si hay mucha volatilidad
- Revisa que el DEX esté funcionando
- Consulta los logs para detalles

## Roadmap

### v2.1 (Próximo)
- [ ] Notificaciones por Telegram
- [ ] Dashboard de analíticas
- [ ] Stop-loss automático
- [ ] Take-profit automático

### v2.2
- [ ] Backtesting de estrategias
- [ ] Múltiples redes (BSC, Ethereum, etc)
- [ ] Copy trading
- [ ] API pública

### v3.0
- [ ] AI-powered trading strategies
- [ ] Portfolio management
- [ ] Social trading features
- [ ] Mobile app

## Contribuir

Las contribuciones son bienvenidas! Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License - Ver LICENSE file para detalles

## Soporte

Para soporte y preguntas:
- Email: support@falco-x.com
- Telegram: @FalcoXSupport
- Discord: discord.gg/falcox

---

**⚠️ Disclaimer**: Este bot ejecuta operaciones reales en blockchain. Úsalo bajo tu propio riesgo. Los creadores no son responsables por pérdidas financieras.

**💡 Tip**: Empieza con cantidades pequeñas y monitorea el bot regularmente durante los primeros días.
