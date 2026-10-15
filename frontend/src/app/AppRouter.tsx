import {Routes, Route, BrowserRouter} from "react-router-dom";
import HomePage from "../pages/HomePage";
import Dashboard from "../pages/Dashboard";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import VenuesPage from "../pages/VenuesPage";
import MainLayout from "../layout/MainLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
// import RoleGuard from "../components/auth/RoleGuard";
import ProfilPage from "../pages/ProfilPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    
                    

                    <Route path="/venues" element={<VenuesPage />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<ProfilPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* <Route element={<RoleGuard allowedRoles={["OWNER"]} />}>
                            <Route path="/owner/venues" element={<VenuesPage />} />
                        </Route> */}

                        {/* <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
                            <Route path="/admin" element={<AdminPage />} />
                        </Route> */}
                    </Route>
                </Route>
                
                
            </Routes>
        </BrowserRouter>
    );
}
