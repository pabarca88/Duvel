export function requireEnv(...names: string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  return Object.fromEntries(names.map((name) => [name, process.env[name]!])) as Record<string, string>;
}
