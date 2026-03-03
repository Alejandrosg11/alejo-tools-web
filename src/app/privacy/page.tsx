import Navbar from "@/app/components/Navbar/Navbar";
import styles from "./page.module.scss";

const LAST_UPDATED = "2 de marzo de 2026";

export default function PrivacyPage() {
	return (
		<div className={styles.pageShell}>
			<Navbar />
			<main className={styles.pageContent}>
				<header className={styles.header}>
					<h1>Política de Privacidad</h1>
					<p>
						Esta política explica qué datos tratamos en Alejo Tools, cómo los usamos
						y qué medidas aplicamos para protegerte.
					</p>
					<p className={styles.updatedAt}>Última actualización: {LAST_UPDATED}</p>
				</header>

				<section className={styles.section}>
					<h2>1. Alcance del servicio</h2>
					<p>
						Alejo Tools permite analizar imágenes para estimar si pudieron haber sido
						generadas por IA. El resultado es probabilístico y no constituye una
						prueba definitiva.
					</p>
				</section>

				<section className={styles.section}>
					<h2>2. Datos que recopilamos</h2>
					<ul>
						<li>
							Imagen que subes para análisis (formatos permitidos: JPG, PNG y WebP).
						</li>
						<li>
							Metadatos técnicos mínimos necesarios para operar el servicio (por
							ejemplo: tipo de archivo, tamaño, fecha/hora y eventos de error).
						</li>
						<li>
							Datos de seguridad y antiabuso, como el token de verificación anti-bot
							de Cloudflare Turnstile y datos técnicos asociados a la solicitud.
						</li>
					</ul>
				</section>

				<section className={styles.section}>
					<h2>3. Uso de proveedores terceros</h2>
					<p>
						Para ejecutar el análisis se envía la imagen al proveedor
						<strong> Sightengine </strong>(modelo de detección de contenido
						generado por IA). También usamos <strong>Cloudflare Turnstile</strong>
						para prevenir uso automatizado abusivo.
					</p>
					<p>
						Al utilizar esta herramienta, aceptas que esos proveedores procesen datos
						técnicos estrictamente necesarios para prestar sus servicios.
					</p>
					<p>
						Algunos de estos proveedores pueden procesar información fuera de México.
						Cuando exista transferencia internacional de datos, procuramos que se
						realice bajo medidas razonables de protección y conforme a la normativa
						aplicable.
					</p>
				</section>

				<section className={styles.section}>
					<h2>4. Finalidades del tratamiento</h2>
					<ul>
						<li>Analizar imágenes y mostrar el resultado de probabilidad.</li>
						<li>Prevenir fraude, abuso, automatización maliciosa y spam.</li>
						<li>Detectar incidentes técnicos y mejorar estabilidad y seguridad.</li>
						<li>Cumplir obligaciones legales aplicables.</li>
					</ul>
				</section>

				<section className={styles.section}>
					<h2>5. Conservación de datos</h2>
					<p>
						Las imágenes se procesan en memoria durante la solicitud y no se
						almacenan deliberadamente como historial del usuario en esta web.
					</p>
					<p>
						Podemos conservar registros técnicos mínimos por tiempo limitado para
						seguridad, diagnóstico y prevención de abuso. Los proveedores externos
						pueden aplicar sus propias políticas de retención.
					</p>
				</section>

				<section className={styles.section}>
					<h2>6. Seguridad</h2>
					<ul>
						<li>
							Aplicamos controles de tamaño y tipo de archivo para reducir riesgos.
						</li>
						<li>
							Usamos limitación de solicitudes (rate limiting) para mitigar abuso.
						</li>
						<li>
							Integramos verificación anti-bot para proteger la plataforma.
						</li>
						<li>
							Ningún sistema es 100% invulnerable, pero aplicamos medidas razonables
							de protección técnica y operativa.
						</li>
					</ul>
				</section>

				<section className={styles.section}>
					<h2>7. Uso aceptable y contenido prohibido</h2>
					<p>
						No debes usar la plataforma para cargar contenido ilegal, violatorio de
						derechos de terceros o que pueda causar daño. Podemos bloquear acceso o
						rechazar solicitudes en casos de abuso o incumplimiento.
					</p>
				</section>

				<section className={styles.section}>
					<h2>8. Menores de edad</h2>
					<p>
						Este servicio no está orientado a menores sin supervisión de un adulto.
						Si detectamos un uso incompatible con esta política, podremos limitar el
						servicio.
					</p>
				</section>

				<section className={styles.section}>
					<h2>9. Tus derechos</h2>
					<p>
						Si te encuentras en México, puedes ejercer tus derechos ARCO (Acceso,
						Rectificación, Cancelación y Oposición), así como solicitar la
						revocación de consentimiento o la limitación del uso/divulgación de tus
						datos, en términos de la LFPDPPP y su normativa relacionada.
					</p>
					<p>
						Para ejercer estos derechos, contáctanos por los canales oficiales del
						proyecto e indica claramente tu solicitud y medios de contacto para
						darte seguimiento.
					</p>
				</section>

				<section className={styles.section}>
					<h2>10. Legislación aplicable (México)</h2>
					<p>
						Para usuarios en México, este aviso se interpreta de conformidad con la
						Ley Federal de Protección de Datos Personales en Posesión de los
						Particulares (LFPDPPP), su Reglamento y demás disposiciones aplicables.
					</p>
					<p>
						Si consideras que tu derecho a la protección de datos personales ha sido
						vulnerado, puedes acudir ante la autoridad competente en materia de
						protección de datos en México.
					</p>
				</section>

				<section className={styles.section}>
					<h2>11. Cambios en esta política</h2>
					<p>
						Podemos actualizar esta política cuando cambie el servicio, la ley o
						nuestros procesos de seguridad. Publicaremos siempre la fecha de última
						actualización.
					</p>
				</section>
			</main>
		</div>
	);
}
