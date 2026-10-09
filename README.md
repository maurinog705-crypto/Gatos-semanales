# Mi semana de plata

Control semanal de gastos: uso personal ($100.000 por semana) y cuenta Macro (gastos para cobrarle a papá).

## Sincronizar celu y compu (Vercel)

1. Importar este repositorio en Vercel y desplegar.
2. En el proyecto de Vercel: Storage → crear una base Upstash Redis y conectarla al proyecto. Después, Redeploy.
3. Abrir la página, elegir una contraseña. En el otro dispositivo, poner la misma.

`api/datos.js` guarda los datos en Redis; la primera contraseña que se usa queda fija.

En GitHub Pages la página funciona igual, pero guarda solo en el navegador (usar "Descargar copia" / "Cargar copia").
