'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from "./Navbar.module.scss";
import { FaBars } from "react-icons/fa";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <nav className={styles.navbar}>
            <div className={styles["navbar-container-desktop"]}>
                <div>
                    <Image src="/Alejo-Logo3.svg" alt="Logo" width={220} height={70} priority />
                </div>
                <div className={styles["nav-links"]}>
                    <Link href="/alejo-tools" className={isActive('/alejo-tools') ? styles.activeLink : undefined}>Alejo Tools</Link>
                    <Link href="/privacy" className={isActive('/privacy') ? styles.activeLink : undefined}>Privacy Policy</Link>
                </div>
            </div>
            <div className={styles["navbar-container-mobile"]}>
                <div>
                    <Image src="/Alejo-Logo3.svg" alt="Logo" width={160} height={50} priority />
                </div>
                <button className={styles["menu-toggle"]} onClick={toggleMenu}>
                    <FaBars size={24} />
                </button>
                <div className={styles["mobile-menu"] + (isOpen ? " " + styles.open : "")}>
                    <Link href="/alejo-tools" className={isActive('/alejo-tools') ? styles.activeLink : undefined}>Alejo Tools</Link>
                    <Link href="/privacy" className={isActive('/privacy') ? styles.activeLink : undefined}>Privacy Policy</Link>
                </div>
            </div>
        </nav>
    );
}
