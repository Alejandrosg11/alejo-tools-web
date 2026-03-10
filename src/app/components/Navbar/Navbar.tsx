'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from "./Navbar.module.scss";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);
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
                <button
                    className={styles["menu-toggle"]}
                    onClick={toggleMenu}
                    aria-label={isOpen ? 'Cerrar menu' : 'Abrir menu'}
                    aria-expanded={isOpen}
                >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                        {isOpen ? (
                            <>
                                <line x1="6" y1="6" x2="20" y2="20" stroke="#F3C623" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="20" y1="6" x2="6" y2="20" stroke="#F3C623" strokeWidth="2.5" strokeLinecap="round" />
                            </>
                        ) : (
                            <>
                                <line x1="3" y1="7" x2="23" y2="7" stroke="#F3C623" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="3" y1="13" x2="23" y2="13" stroke="#F3C623" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="3" y1="19" x2="23" y2="19" stroke="#F3C623" strokeWidth="2.5" strokeLinecap="round" />
                            </>
                        )}
                    </svg>
                </button>
                <div className={styles["mobile-menu"] + (isOpen ? " " + styles.open : "")}>
                    <Link href="/alejo-tools" onClick={closeMenu} className={isActive('/alejo-tools') ? styles.activeLink : undefined}>Alejo Tools</Link>
                    <Link href="/privacy" onClick={closeMenu} className={isActive('/privacy') ? styles.activeLink : undefined}>Privacy Policy</Link>
                </div>
            </div>
        </nav>
    );
}
