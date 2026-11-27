# Radar Creativo

Radar Creativo será una sección de [AlejoDraws.com](https://alejodraws.com) en `/radar` para consultar convocatorias, concursos de ilustración, manga y cómic, becas, exposiciones y eventos. Reúne los enlaces, fechas y detalles que la comunidad pide al ver los reels de Alejo Draws. Busca convertirse en un punto de consulta recurrente para artistas hispanohablantes, atraer tráfico orgánico y fortalecer el posicionamiento de la marca.

Alejo Draws cura y difunde oportunidades. La información oficial, las inscripciones y las decisiones sobre cada convocatoria corresponden a su organizador.

## Publicación y mantenimiento

- Crear el repositorio público `Alejandrosg11/radar-creativo-contenido`, bajo la misma cuenta de GitHub que `alejo-tools-web`. La versión publicada del catálogo estará en `radar.json`, en la raíz de la rama `main`. Alejo podrá editarlo desde la web de GitHub y revertir cambios desde el historial.
- Configurar `RADAR_JSON_URL` en el servidor de Next.js con la URL de lectura `https://raw.githubusercontent.com/Alejandrosg11/radar-creativo-contenido/main/radar.json`. El repositorio de contenido se mantendrá separado de `alejo-tools-web` y sin integración de despliegue con Vercel.
- Validar el JSON antes de publicar un cambio. Comprobar campos requeridos, identificadores únicos, categorías, enlaces HTTPS y fechas de calendario válidas. Si hay fecha de apertura, debe ser igual o anterior al cierre.
- Leer el archivo desde el servidor de Next.js en el despliegue existente de Vercel. Usar cinco minutos como intervalo inicial de revalidación de los datos. Las publicaciones se reflejan sin un nuevo despliegue. Calcular la vigencia con la hora actual al renderizar, incluso cuando los datos provengan de caché. En una pestaña abierta, actualizar los indicadores al cruzar un umbral o al volver a la página.
- El MVP aprovecha GitHub Free y el despliegue actual. El costo incremental esperado es cero dentro del uso incluido. El tráfico y el alojamiento de imágenes pueden generar cargos según el plan y el consumo. El MVP funciona con Next.js y el JSON remoto, sin un servicio nuevo en NestJS o Railway.
- La primera automatización será la validación del archivo. Si la edición manual se vuelve incómoda, un editor o una hoja podría generar el mismo JSON con revisión editorial antes de publicar.
- Dejar la publicación más rápida para una versión posterior. El MVP conserva la revalidación de cinco minutos y la última copia válida si falla GitHub. La primera visita después del intervalo puede mostrar la copia anterior mientras se actualiza en segundo plano. Para la próxima versión, evaluar reducir el intervalo a 30 segundos. Si se necesita que guardar en GitHub dispare la actualización, evaluar un webhook autenticado.

## Contenido de una convocatoria

El catálogo seguirá la estructura del `radar.json` de ejemplo, con `version` y una lista `convocatorias`. Cada entrada alimenta una tarjeta con los siguientes campos.

| Campo | Uso |
| --- | --- |
| `id` | Identificador interno, estable y único. |
| `titulo`, `descripcion` | Nombre y descripción breve que se muestran en la tarjeta. |
| `categoria` | Una o varias categorías separadas por comas, según el formato editorial actual. Cada una se muestra como una etiqueta y podrá usarse en el filtro de la segunda fase. |
| `organizador`, `alcance` | Responsable y cobertura, por ejemplo «Nacional · México», «Nacional · Argentina» o «Internacional». El ámbito geográfico se captura en `alcance`. |
| `premios`, `costo` | Texto breve para beneficios y costo, por ejemplo «Publicación impresa» y «Gratis». Son opcionales cuando el organizador no facilita el dato. |
| `cierre` | Último día de participación en formato `AAAA-MM-DD`. |
| `apertura` | Primer día de participación, opcional, con el mismo formato. |
| `visible` | Booleano opcional. Con `false`, la tarjeta se oculta aunque siga vigente. Si se omite, se toma como `true`. |
| `enlaceOficial` | Destino de la tarjeta completa, con «Ver convocatoria oficial» como indicación visible. |
| `imagen` | Objeto opcional. Si falta el objeto o su URL está ausente o vacía, se usa la portada neutra de la categoría. Si hay URL, debe ser HTTPS e incluir un `alt`. La imagen predeterminada queda para más adelante. |

El JSON guarda únicamente fechas. El Radar usa el calendario de Ciudad de México (`America/Mexico_City`) como referencia común. La convocatoria permanece visible durante su último día y vence al comenzar el día siguiente. Una hora de cierre específica puede consultarse en la convocatoria oficial.

El archivo de ejemplo requiere corregir el identificador duplicado de **Premio Trazo Joven** y **Cortometraje Animado** y sustituir las imágenes y enlaces de ejemplo antes de publicar.

## Colores y vigencia de las tarjetas

La interfaz aplica estas reglas contando los días de calendario entre hoy y `cierre`.

| Tiempo restante hasta el cierre | Resultado |
| --- | --- |
| 7 días o más | Verde. |
| De 3 a 6 días | Amarillo. |
| Hoy, mañana o en 2 días | Rojo. |
| La fecha de cierre es anterior a hoy | La tarjeta se oculta automáticamente. |

El estado y el color se calculan a partir de las fechas. Antes de `apertura`, la tarjeta aparece como **Próxima**. Desde la apertura, o cuando se omite `apertura`, aparece como **Abierta** hasta el cierre. Cada color se acompaña de una etiqueta de texto y de la fecha relevante para facilitar la lectura. Las convocatorias finalizadas pueden conservarse en el JSON como registro editorial.

## Galería de carteles

- Usar el fondo oscuro con grano, las superficies carbón, los acentos amarillos y la tipografía Plus Jakarta Sans de Alejo Draws. Aplicar la guía [UI/UX Pro Max](.agents/skills/ui-ux-pro-max/SKILL.md) del frontend para contraste, navegación con teclado, foco visible y controles táctiles de al menos 44 × 44 px.
- Usar una cuadrícula de exactamente tres columnas en escritorio y una sola columna en móvil. Todas las tarjetas de un mismo tamaño de pantalla tienen el mismo ancho y alto, incluso entre filas o cuando quedan columnas vacías. Reservar la misma área para el cartel y mantener la acción alineada al pie de cada tarjeta.
- Igualar la altura de todas las filas a la altura que necesita la tarjeta visible con más contenido. Usar filas de igual tamaño con CSS Grid, también en móvil, y recalcular según el ancho disponible y las tarjetas visibles. El contenido puede crecer sin recortarse.
- En escritorio, reservar encima de cada título la altura del estado y fecha más altos de la galería. Recalcular si cambia el ancho o se actualiza el catálogo. En móvil, cada bloque de estado usa su altura natural.
- Cada ficha presenta el cartel, el estado y la fecha, el título, las categorías, la descripción, el organizador, el alcance, el premio, el costo y la indicación «Ver convocatoria oficial». Si falta el cartel, mostrar una portada neutra con la categoría.
- Hacer de la tarjeta completa un único enlace a `enlaceOficial`. Cualquier clic o toque en la tarjeta abre la convocatoria oficial. La tarjeta tiene un solo punto de foco y se puede activar con Enter.
- En escritorio, la tarjeta aumenta sutilmente de tamaño al pasar el cursor y recupera su escala al retirarlo. La animación conserva la posición de las demás fichas y se desactiva cuando el usuario prefiere reducir el movimiento.
- Añadir **Radar Creativo** a la navegación móvil y de escritorio. Mostrar primero las abiertas que cierran antes y después las próximas que abren antes.
- Reutilizar la tarjeta de Ko-fi de Alejo Tools. En escritorio se alinea con la tercera columna, encima de la galería. En móvil aparece después de la introducción y antes de las convocatorias.
- Dejar los filtros fuera del MVP. Se esperan unas cinco convocatorias o menos al inicio. En la segunda fase, añadir filtros por categoría y estado (**Todas**, **Abiertas**, **Próximas**) y ofrecer limpiarlos cuando no haya coincidencias.

## Carga, catálogo vacío y fallos

| Escenario | Qué ve el usuario |
| --- | --- |
| Primera carga o reintento pendiente | La NavBar y el encabezado permanecen visibles. En la cuadrícula aparece un esqueleto de tres tarjetas en escritorio y una en móvil, con el mismo ancho y proporción del cartel que las fichas reales y una altura aproximada para el cuerpo. Los esqueletos son decorativos y la galería comunica «Cargando convocatorias…» mediante un mensaje de estado accesible. |
| Carga correcta con convocatorias vigentes | Se muestra la galería. |
| Carga correcta con catálogo vacío o todas las convocatorias vencidas | «Por ahora no hay convocatorias disponibles. Vuelve pronto para ver nuevas oportunidades.» |
| Falla la actualización y hay una copia válida disponible en caché | Se sigue mostrando la última copia válida, con la vigencia recalculada a la hora actual. Una tarjeta vencida se oculta aunque la fuente no esté disponible. Si la copia ya no contiene fichas vigentes, mostrar el mensaje de fallo con el botón de reintento. |
| Falla la carga y no hay copia válida disponible | «No pudimos cargar las convocatorias en este momento.» Mostrar el botón **Reintentar**, que solicita de nuevo la galería y muestra su estado de carga. |

Tratar como fallos los errores de red, el tiempo de espera agotado, las respuestas HTTP sin éxito y el JSON ilegible o inválido. Aplicar un límite de espera inicial de cinco segundos a la petición remota. Conservar en caché únicamente versiones validadas del catálogo. Registrar el motivo del fallo en el servidor y mostrar al visitante el mensaje anterior.

## Seguridad del catálogo

- **Publicación de cambios.** Activar 2FA en GitHub, limitar el acceso de escritura y ejecutar la validación antes de incorporar cambios a `main`. Aceptar enlaces oficiales HTTPS y revisar editorialmente que el dominio y el destino correspondan al organizador. Toda la tarjeta dirige al visitante a ese enlace.
- **Lecturas remotas e imágenes.** Configurar `RADAR_JSON_URL` en el servidor. Si se usa el optimizador de Next.js, permitir únicamente los orígenes y rutas de imágenes aprobados. Para el MVP, preferir un origen de carteles controlado por Alejo Draws.
- **Validación en tiempo de lectura.** Limitar el tamaño del archivo y la longitud de sus campos, validar la estructura y las URLs, y renderizar el contenido editorial como texto. Un archivo inválido se trata como un fallo de carga y se conserva la última versión válida si está disponible.
- **Retirada urgente.** Cambiar `visible` a `false` en `radar.json`. La retirada se aplica cuando el sitio lee la versión actualizada. Para una retirada urgente, usar una invalidación explícita de la caché del Radar tras publicar el cambio y verificar la vista pública. Definir ese mecanismo antes del lanzamiento. Si GitHub falla después de invalidar, mostrar el estado de error en lugar de recuperar la copia que podía contener la tarjeta retirada.
- **Datos públicos.** Guardar únicamente información destinada a publicación. El repositorio y su historial son públicos, incluidos los cambios revertidos.

Antes de lanzar, comprobar que un JSON inválido no sustituya la última copia válida y que una convocatoria retirada de urgencia deje de aparecer aunque exista una copia anterior en caché.

## SEO

Renderizar el catálogo en el servidor y mantener `/radar` como página indexable en producción. Añadir título, descripción, URL canónica y metadatos para compartir en redes sociales. Mantener los ambientes de prueba fuera del índice.

## Organización del frontend

Radar Creativo seguirá el patrón de Alejo Tools, con una ruta propia y los componentes de la sección agrupados bajo `src/app/components/`. La NavBar seguirá siendo compartida. `/radar` la montará desde su página, como ya hacen Alejo Tools y Privacy.

| Ubicación propuesta | Responsabilidad |
| --- | --- |
| `src/app/radar/page.tsx` | Página de servidor para `/radar`. Monta la NavBar y el encabezado, define los metadatos y usa un límite de `Suspense` alrededor de la carga del catálogo para mostrar el esqueleto mientras espera. |
| `src/app/components/radar/RadarGallery/` | Cuadrícula, esqueleto y estados de catálogo vacío o fallo con reintento. Actualiza la vigencia mientras la página permanece abierta. Los filtros se añadirán en la segunda fase. |
| `src/app/components/radar/RadarCard/` | Cartel, datos y enlace de la convocatoria. Su módulo SCSS define el área del cartel, la alineación del contenido, el foco visible y la ampliación al pasar el cursor en escritorio. |
| `src/lib/radar/` | Tipos, validación del JSON y funciones para calcular el estado y el color. La carga remota y la revalidación se mantienen en un módulo exclusivo del servidor. |
| `src/app/components/Navbar/Navbar.tsx` | Añade el enlace **Radar Creativo** a `/radar` en los menús de escritorio y móvil. Reutiliza el resaltado de la ruta activa y el cierre del menú móvil al seleccionar un enlace. |

### Orden de implementación

1. Definir el contrato y la validación del catálogo a partir de `radar.json`. Verificar la visibilidad manual, el día de apertura y los límites de siete días, dos días y el día posterior al cierre.
2. Construir la galería y la tarjeta. Comprobar tres columnas en escritorio y una en móvil, dimensiones uniformes incluso en la última fila, tarjeta completa como enlace, foco visible y efecto de ampliación con movimiento reducido.
3. Conectar la página con el JSON remoto y añadir el enlace a la NavBar. Verificar ambos menús, la navegación por teclado, el esqueleto con una respuesta lenta, el catálogo vacío, los fallos con y sin copia válida, el reintento y la actualización sin un nuevo despliegue.

## Avances de implementación

- Implementadas la ruta `/radar`, la NavBar en escritorio y móvil, la galería de tarjetas uniformes, los metadatos SEO, el esqueleto y los estados de vacío y error con reintento. Los filtros siguen reservados para la segunda fase.
- Implementadas la lectura en el servidor mediante `RADAR_JSON_URL`, la validación, el límite de 256 KiB y 100 registros, y la revalidación de la copia válida cada cinco minutos. Las imágenes se cargan directamente en el navegador, con una portada neutra si faltan o fallan.
- Verificados con pruebas automatizadas los días de apertura y cierre, los límites del semáforo, la zona horaria, la visibilidad manual y el rechazo de datos inválidos.
- Pasaron lint, TypeScript, la compilación de producción y las 48 pruebas automatizadas. Una prueba HTTP local de `/radar` con datos simulados verificó el esqueleto, una tarjeta con enlace oficial, la exclusión de una tarjeta oculta y los estados de catálogo vacío y JSON inválido.
- Pendiente configurar `RADAR_JSON_URL` en QA y producción, verificar el catálogo real y probar la galería en escritorio y móvil. La invalidación urgente de caché sigue pendiente antes del lanzamiento público.
- Consultar el documento raíz local `WORKFLOW_DESARROLLO_QA_Y_PRODUCCION.md` antes de iniciar una implementación. Registrar el visto bueno del usuario en localhost antes de avanzar a QA.
- Revisión local habilitada con `npm run dev` en `http://127.0.0.1:3000/radar`. La ruta respondió HTTP 200 y mostró el estado de error ante un `cierre` incompatible en GitHub. La vista temporal `http://127.0.0.1:3002/radar` respondió HTTP 200 con tres tarjetas de ejemplo adaptadas en memoria. El visto bueno local y el PR de revisión siguen pendientes.
- El catálogo real ya carga en localhost con tres tarjetas. La URL de imagen ausente o vacía usa la portada neutra. Lint y las 49 pruebas pasaron tras el ajuste.
- Para revisar desde otro dispositivo del Wi-Fi, iniciar Next.js con `--hostname 0.0.0.0` y configurar `DEV_LAN_HOST` con el hostname o la IP de la PC, sin esquema ni puerto. Se comprobó que Next.js acepta la conexión de desarrollo desde la IP local. La interacción en iPad y celular queda pendiente de revisión manual.
- El 26 de noviembre de 2026, Alejo aprobó Radar Creativo en `http://localhost:3000/radar` y confirmó que pudo completar un análisis en Alejo Tools desde `http://localhost:3000/alejo-tools`. La API local en `localhost:3001` sirvió el commit `4940788f08d3533c25d866b21f896e21dd58daf2`. El error Turnstile 110200 observado con `127.0.0.1` correspondió a la autorización del hostname en el widget. La revisión de código del candidato sigue pendiente antes de integrar a staging.
- `/radar` y `/alejo-tools` comparten las reglas de ancho, padding y título de `src/app/styles/_page-layout.scss`. Reutilizar este módulo al crear nuevas páginas y secciones. El título de Radar conserva el nivel semántico `h1` y toma el tamaño del encabezado de Alejo Tools.
