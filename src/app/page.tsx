import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6f3] px-6 py-16 text-[#1e2d2b] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold tracking-[0.22em] text-[#b46c42]">DUVEL CONSULTING</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Plataforma de rendiciones</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52615f]">Base técnica creada. El siguiente hito es conectar Supabase y Cloudflare R2 para activar el acceso de administradores y clientes.</p>
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5"><p className="text-sm font-medium text-[#b46c42]">ADMINISTRACIÓN</p><h2 className="mt-2 text-xl font-semibold">Duvel configura el proyecto</h2><p className="mt-3 text-[#52615f]">Empresas, proyectos, usuarios cliente, presupuesto, ítems y requisitos documentales.</p></article>
          <article className="rounded-2xl bg-[#1e2d2b] p-7 text-white shadow-sm"><p className="text-sm font-medium text-[#e2ad7e]">CLIENTE</p><h2 className="mt-2 text-xl font-semibold">Rinde y adjunta respaldos</h2><p className="mt-3 text-[#d5dddb]">Carga gastos, facturas y documentos solicitados. Duvel revisa y deja observaciones.</p></article>
        </section>
        <section className="mt-8 rounded-2xl border border-dashed border-[#b9c3be] p-6 text-[#52615f]"><strong className="text-[#1e2d2b]">Conexión configurada:</strong> los adjuntos se almacenarán de forma privada en R2 mediante enlaces firmados. <Link className="ml-2 font-medium text-[#b46c42] underline" href="/login">Ir al acceso</Link></section>
      </div>
    </main>
  );
}
