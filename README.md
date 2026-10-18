# Plataforma Duvel

Administración de empresas, proyectos, presupuestos e ítems; y rendición documental de clientes.

## Ejecutar localmente

```bash
cp .env.example .env.local
npm run dev
```

## Configuración externa

1. Crea un proyecto en Supabase. En **SQL Editor**, ejecuta los archivos de `supabase/migrations/` en orden cronológico de nombre. El flujo de cliente requiere también `202610180001_client_expense_metadata.sql`.
2. En Authentication > Providers, habilita Email. Durante desarrollo puedes desactivar temporalmente la confirmación de correo.
3. En Cloudflare > R2, crea el bucket privado `duvel-documentos-dev` y un token limitado a ese bucket, con permiso **Object Read & Write**.
4. Copia en `.env.local` la URL y Publishable key de Supabase, y Account ID / Access Key ID / Secret de R2.
5. Para completar automáticamente el monto desde PDFs o imágenes, agrega `OPENAI_API_KEY`. La lectura se ejecuta solo al adjuntar el documento principal, prioriza el campo **TOTAL** y deja el monto editable. Sin esta clave, el usuario puede ingresarlo manualmente.

No subas `.env.local` ni claves secretas al repositorio. Los adjuntos se guardan en R2 y solo se entregan mediante URLs firmadas de 10 minutos; la base de datos almacena únicamente su referencia y metadata.

## Flujo de cliente

Un usuario con rol `client` debe estar asociado al proyecto en `project_members`. Tras iniciar sesión puede seleccionar uno de sus proyectos, consultar el presupuesto, cargar un gasto y revisar sus rendiciones. Cada archivo admite PDF, JPG o PNG hasta 5 MB; la solicitud completa admite hasta 25 MB.
