import { Link, Outlet} from 'react-router-dom'
import Navbar from '../components/ui/navbar'

export default function MainLayout() {
    const CURRENT_YEAR = new Date().getFullYear();
    return (
        <div>
            <Navbar />
            <main>
                <Outlet />
            </main>
             <footer className="bg-ink text-white">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Brand */}
                    <div className="lg:col-span-2">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-ink">
                        <span className="text-lg font-black">B</span>
                        </span>
                        <span className="text-xl font-bold tracking-tight">
                        BookSpot
                        </span>
                    </Link>

                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-dark">
                        Temukan dan booking tempat olahraga favoritmu dengan
                        mudah. Cek ketersediaan, pilih jadwal, dan bayar
                        langsung dalam satu platform.
                    </p>
                    </div>

                    {/* Navigation */}
                    <div>
                    <h3 className="text-sm font-semibold text-accent">
                        Navigasi
                    </h3>

                    <ul className="mt-4 space-y-3 text-sm text-on-dark">
                        <li>
                        <Link
                            to="/"
                            className="transition hover:text-accent"
                        >
                            Beranda
                        </Link>
                        </li>

                        <li>
                        <Link
                            to="/login"
                            className="transition hover:text-accent"
                        >
                            Masuk
                        </Link>
                        </li>
                        <li>
                        <Link
                            to="/register"
                            className="transition hover:text-accent"
                        >
                            Daftar
                        </Link>
                        </li>
                    </ul>
                    </div>

                    {/* Categories */}
                    <div>
                    <h3 className="text-sm font-semibold text-accent">
                        Kategori
                    </h3>

                    <ul className="mt-4 space-y-3 text-sm text-on-dark">
                        <li>Futsal</li>
                        <li>Badminton</li>
                        <li>Basket</li>
                        <li>Tenis</li>
                        <li>Padel</li>
                    </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-on-dark sm:flex-row sm:items-center sm:justify-between">
                    <p>
                    © {CURRENT_YEAR} BookSpot. All rights reserved.
                    </p>

                    <p>
                    Find your perfect space. Play without limits.
                    </p>
                </div>
                </div>
            </footer>
        </div>
    )
}