# Plataforma Duvel

Administración de empresas, proyectos, presupuestos e ítems; y rendición documental de clientes.

## Ejecutar localmente

```bash
cp .env.example .env.local
npm run dev
```

## Configuración externa

1. Crea un proyecto en Supabase. En **SQL Editor**, ejecuta `supabase/migrations/202610120001_initial_schema.sql`.
2. En Authentication > Providers, habilita Email. Durante desarrollo puedes desactivar temporalmente la confirmación de correo.
3. En Cloudflare > R2, crea el bucket privado `duvel-documentos-dev` y un token limitado a ese bucket, con permiso **Object Read & Write**.
4. Copia en `.env.local` la URL y Publishable key de Supabase, y Account ID / Access Key ID / Secret de R2.

No subas `.env.local` ni claves secretas al repositorio. Los adjuntos se guardan en R2 y solo se entregan mediante URLs firmadas de 10 minutos; la base de datos almacena únicamente su referencia y metadata.
