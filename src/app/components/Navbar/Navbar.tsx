'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from "./Navbar.module.scss";
import { FaBars } from "react-icons/fa";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className={styles.navbar}>
            <div className={styles["navbar-container-desktop"]}>
                <div>
                    <Image src="/isotipoAlejoParaCanva.png" alt="Logo" width={220} height={70} />
                </div>
                <div className={styles["nav-links"]}>
                    <Link href="/alejo-tools">Alejo Tools</Link>
                    <Link href="/privacy">Privacy Policy</Link>
                </div>
            </div>
            <div className={styles["navbar-container-mobile"]}>
                <div>
                    <Image src="/isotipoAlejoParaCanva.png" alt="Logo" width={160} height={50} />
                </div>
                <button className={styles["menu-toggle"]} onClick={toggleMenu}>
                    <FaBars size={24} />
                </button>
                <div className={styles["mobile-menu"] + (isOpen ? " " + styles.open : "")}>
                    <Link href="/alejo-tools">Alejo Tools</Link>
                    <Link href="/privacy">Privacy Policy</Link>
                </div>
            </div>
        </nav>
    );
}
