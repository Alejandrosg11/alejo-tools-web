"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import YellowButton from "../../YellowButton/YellowButton";
import { FaCloudUploadAlt } from "react-icons/fa";
import styles from "./ImageDropzone.module.scss";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageDropzone() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	const onSelectImage = () => {
		inputRef.current?.click();
	};

	const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];

		if (!selectedFile) {
			setErrorMessage("");
			return;
		}

		if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
			setErrorMessage("Solo se permiten imágenes JPG, PNG o WebP.");
			event.target.value = "";
			return;
		}

		setErrorMessage("");

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		const objectUrl = URL.createObjectURL(selectedFile);
		setPreviewUrl(objectUrl);
	};

	return (
		<section className={styles.dropzoneWrapper}>
			<input
				ref={inputRef}
				type="file"
				accept="image/png, image/jpeg, image/webp"
				onChange={onImageChange}
				className={styles.hiddenInput}
			/>

			{previewUrl ? (
				<>
					<button
						type="button"
						onClick={onSelectImage}
						className={styles.imagePreview}
						aria-label="Cambiar imagen seleccionada"
					>
						<Image
							src={previewUrl}
							alt="Imagen seleccionada"
							fill
							unoptimized
							sizes="(max-width: 767px) 100vw, 600px"
							className={styles.previewImage}
						/>
					</button>
					<p className={styles.previewHint}>Toca la imagen para cambiarla</p>
				</>
			) : (
				<div className={styles.dropzoneInner}>
					<FaCloudUploadAlt className={styles.uploadIcon} />
					<p className={styles.dropText}>Arrastra una imagen aqui</p>
					<YellowButton
						Clickable={true}
						text="Selecciona una imagen"
						Action={onSelectImage}
					/>
				</div>
			)}

			<p className={styles.supportedFormats}>
				Formatos soportados: JPG, PNG, WebP |
				<span className={styles.maxSize}> Máximo 8MB</span>
			</p>
			{errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
		</section>
	);
}
