import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingPage from "../feedback/LoadingPage";

export default function ProtectedRoute(){
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingPage />;
    }

    if(!isAuthenticated){
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}