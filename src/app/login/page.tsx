"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Header() {
  return <><div className="topbar"><div className="socials"><span>t</span><span>f</span><span>◎</span><span>▶</span><span>p</span></div><div className="phone">+56 9 0000 0000</div></div><header className="navbar"><Link className="brand" href="/"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><nav className="navlinks"><Link href="/">INICIO</Link><Link href="/login">INGRESAR</Link><Link href="/admin">ADMINISTRADOR</Link><span>CLIENTE</span></nav></header></>;
}

function Footer() {
  return <footer className="footer"><div className="container"><div className="footer-grid"><Link className="brand" href="/"><span className="brand-mark">DV</span><span className="brand-copy"><strong>DUVEL</strong><small>CONSULTING</small></span></Link><div><h4>Plataforma</h4><Link href="/login">Ingresar</Link><span>Mis empresas</span><span>Mis proyectos</span></div><div><h4>Ayuda</h4><span>Preguntas frecuentes</span><span>Tutoriales</span><span>Contacto</span></div><div><h4>Contáctanos</h4><input className="input" placeholder="Nombre" /><input className="input" placeholder="Mensaje" /><button className="btn btn-sm">Enviar</button></div></div><div className="copyright">© 2026 Duvel Consulting</div></div></footer>;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (loginError || !data.user) { setLoading(false); return setError("Credenciales inválidas. Revisa el correo y la contraseña."); }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    setLoading(false);
    if (!profile?.role) return setError("No encontramos un perfil asociado a esta cuenta. Contacta a Duvel para habilitar tu acceso.");
    router.replace(["admin", "superadmin"].includes(profile.role) ? "/admin" : "/cliente"); router.refresh();
  }

  async function recover() {
    const email = (document.querySelector<HTMLInputElement>('input[name="email"]')?.value ?? "").trim();
    if (!email) return setError("Ingresa tu correo antes de solicitar recuperación.");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (resetError) return setError("No fue posible enviar el correo de recuperación.");
    setError(""); setNotice("Si el correo está registrado, recibirás un enlace de recuperación.");
  }

  return <><Header /><div className="titlebar">INGRESO A LA PLATAFORMA</div><main className="page"><div className="container grid-2"><div className="login-card"><h1 className="display" style={{ fontSize: 42 }}>Bienvenido a <span>Duvel</span></h1><p className="lead">Ingresa tus credenciales. Te llevaremos automáticamente a la vista que corresponde a tu cuenta.</p>{error && <div className="error show">{error}</div>}{notice && <div className="hint">{notice}</div>}<form onSubmit={submit}><div className="field"><label>Correo</label><input name="email" type="email" required placeholder="nombre@empresa.cl" /></div><div className="field"><label>Contraseña</label><input name="password" type="password" required placeholder="••••••••" /></div><div className="actions"><button className="btn" type="submit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button><button className="btn btn-outline" type="button" onClick={recover}>Recuperar contraseña</button></div></form></div><img className="illus" src="/assets/images/login.jpg" alt="Acceso a la plataforma" /></div></main><Footer /></>;
}
