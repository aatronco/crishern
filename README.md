# Crishern

App personal de hipertrofia para Cristobal. HTML/CSS/JS sin dependencias de
ejecución; PWA sin login. Hermana de [Brute](https://github.com/aatronco/brute)
— mismo motor genérico, datos y tema propios (ver
`docs/superpowers/specs/2026-09-02-crishern-adonain-design.md` en el repo de
Brute para el origen del proyecto y el cuestionario que lo generó).

## Bloque actual

Programa **J&T 2.0 (Jacked & Tan, método GZCL)** — 12 semanas en 2 mesociclos
de 6, tomado de la planilla oficial *GZCL Free Compendium* (hoja "J&T2.0").
Reemplaza al bloque anterior de Full Body × 3 (6 semanas).

4 días de entrenamiento full-body-ish, rotando Sentadilla / Banca / Peso
Muerto / Militar. Cada día tiene:
- **T1**: el patrón pesado del día. Bloque 1 (semanas 1-6) sube de intensidad
  semana a semana con la última serie AMRAP; la semana 6 es un test real de
  1RM. Bloque 2 (semanas 7-12) trabaja denso al 85-90% del 1RM que
  encontraste en la semana 6; la semana 12 vuelve a testear el 1RM — ese
  resultado es tu Training Max para el próximo ciclo.
- **T2**: una variante cercana al T1 del día (T2a, también a % de Training
  Max) más dos accesorios de patrón (T2b/T2c) a reps máximas (MRS) con el
  peso que elijas en el calentamiento.
- **T3**: accesorios de alto volumen (MRS), bajando de reps cada semana.

A diferencia de Brute, esta app **no calcula ni redondea kg**: muestra el %
o el rango de reps objetivo y tú anotas el peso real cada semana. Es la
única forma fiel de seguir J&T, porque el Bloque 1 y el Bloque 2 dependen de
un número (tu 1RM real) que no existe hasta que lo levantas — no se puede
precalcular de antemano. Declara tu Training Max de cada movimiento (doble
cómodo de un día normal, no tu máximo absoluto) antes de empezar cada
bloque.

Distribución (fiel a los 4 días de la planilla oficial):
- Día 1: T1 Sentadilla.
- Día 2: T1 Press Banca — punto débil declarado (PR 60 kg vs 140 kg de
  Sentadilla/Peso Muerto), recibe volumen extra de empuje.
- Día 3: T1 Sentadilla Frontal en el Bloque 1, T1 Peso Muerto en el Bloque 2
  — la planilla oficial cambia de movimiento entre bloques en este día.
- Día 4: T1 Press Militar + Press Banca con Pausa. La planilla oficial usa
  "Sling Shot Bench" como segundo T1 de este día; sin ese implemento, se
  reemplaza por Press Banca con Pausa — mismo criterio que ya usa Brute en
  su propio día 4.

## Ejecutar y comprobar

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

## Publicación

GitHub Pages publica desde `main` en la raíz. Incrementar la versión de
caché en `sw.js` cuando cambien recursos de la app.
