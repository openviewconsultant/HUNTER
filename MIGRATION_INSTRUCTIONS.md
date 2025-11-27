# Instrucciones para Ejecutar la Migración de Base de Datos

## ⚠️ Importante
Debes ejecutar la migración SQL en Supabase para crear la tabla `company_contracts` antes de poder usar la funcionalidad de contratos.

## Opción 1: Ejecutar desde el Dashboard de Supabase (Recomendado)

1. **Abre tu proyecto en Supabase**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto HUNTER

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Ejecuta el script de migración**
   - Abre el archivo `/supabase/migrations/add_company_contracts.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en "Run" o presiona `Ctrl+Enter` (Cmd+Enter en Mac)

4. **Verificación**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver una nueva tabla llamada `company_contracts`
   - Verifica que la tabla tenga todas las columnas: id, company_id, contract_number, client_name, etc.

## Opción 2: Ejecutar con Supabase CLI (Si lo tienes instalado)

```bash
# En la raíz del proyecto HUNTER
supabase db push
```

## ¿Qué hace esta migración?

1. ✅ Crea la tabla `company_contracts` para almacenar contratos individuales
2. ✅ Configura Row Level Security (RLS) para que los usuarios solo vean sus propios contratos
3. ✅ Crea triggers automáticos que calculan `experience_summary` desde los contratos
4. ✅ Agrega índices para mejorar el rendimiento de consultas

## Después de ejecutar la migración

Una vez completada la migración, el sistema estará listo para:
- ✨ Agregar contratos desde el modal "Editar Indicadores Financieros"
- 📄 Subir documentos PDF como soporte de cada contrato
- 🔢 Calcular automáticamente el resumen de experiencia
- 🗑️ Eliminar contratos (también elimina el archivo del bucket)

## Solución de Problemas

**Error: "relation already exists"**
- La tabla ya existe en tu base de datos
- No necesitas ejecutar la migración nuevamente

**Error: "permission denied"**
- Asegúrate de tener permisos de administrador en el proyecto de Supabase
- Contacta al propietario del proyecto para que ejecute la migración

**Error: "function update_company_experience_summary already exists"**
- Puedes ignorar este error, significa que la función ya está creada
- O puedes agregar `drop function if exists update_company_experience_summary CASCADE;` al inicio del script
