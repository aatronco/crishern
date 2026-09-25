# Crishern

Jacked & Tan 2.0: los cuatro días y las doce semanas de la hoja **J&T2.0 KGS**, con los máximos de Cristóbal.

## Fuente y cargas

El Excel entregado está en `source/GZCL-Free-Compendium.xlsx`. `scripts/import-spreadsheet.py` extrae cada fila del programa, las fórmulas de carga y las instrucciones; `js/spreadsheet-data.js` conserva las coordenadas originales y el SHA-256 del archivo. No se sustituyen ejercicios ni se completan celdas vacías.

Máximos de entrenamiento (2RM diario estimado): sentadilla 140 kg, banca 60 kg, peso muerto 140 kg, press militar 30 kg y frontal **98 kg** (estimada al 70% de la sentadilla). Las cargas se redondean al múltiplo de 2,5 kg más cercano. El máximo de frontal permanece en 98 kg antes de aplicar porcentajes.

Ambos bloques comienzan con estos valores. La sección «Máximos de Cristóbal» permite modificarlos por bloque, como las dos tablas del Excel; se guardan en este dispositivo. En las semanas 7–11, los porcentajes de T1 se aplican al RM encontrado ese día, mientras T2 usa el TM del segundo bloque.

La primera serie que establece el RM precede a las MRS adicionales. El signo `+` indica AMRAP opcional en la última serie, sin sumar otra. Se conservan los tests de T2 de banca cerrada y frontal en la semana 12, y los cambios y ausencias de accesorios del segundo bloque.

El original contiene particularidades que se mantienen: `Find 7RM` para Sling Shot Bench en semana 7; fila 105 con reps/series pero sin ejercicio en semanas 8–11; menos accesorios en ciertas semanas. Las celdas sin ejercicio no se convierten en trabajo. La guía de descanso repite «T1» en E146; la interfaz muestra únicamente las indicaciones inequívocas de E144/E145 y ofrece un temporizador manual.

## Temas y música

Kawaii conserva el diseño original. **Brasil** agrega verde, amarillo y azul, y «Sol de treino», una composición original inspirada en samba: 32 compases, 112 BPM, guitarra de nylon, bajo, flauta y percusión. La partitura de `js/brasil-score.js` alimenta tanto el sintetizador Web Audio como el MIDI descargable. La música comienza al pulsar el botón y se detiene al cambiar de tema o salir de la pestaña. Tema y máximos persisten; el programa y la música funcionan sin conexión después de la primera carga.

Favicon: 🍑.

## Comprobaciones

```sh
python3 scripts/import-spreadsheet.py --check
npm test
npm run midi
python3 -m http.server 8766
```

En macOS, si el Python de Homebrew tiene un error de `pyexpat`, el importador también funciona con `/usr/bin/python3` y no necesita dependencias externas.

Con Chrome en modo headless y depuración en el puerto 9223:

```sh
node scripts/smoke-brasil.mjs http://127.0.0.1:8766/ crishern
```

La prueba recorre las 48 sesiones a 320 px, comprueba cargas guardadas, tema, audio, MIDI, favicon, temporizador y recarga sin conexión.
