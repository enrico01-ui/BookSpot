import { Outlet} from 'react-router-dom'
import Navbar from '../components/ui/navbar'

export default function MainLayout() {
    return (
        <div>
            <Navbar />
            <main>
                <Outlet />
            </main>
            <footer>
                <p>© 2026 BookSpot. Find your perfect space.</p>
            </footer>
        </div>
    )
}