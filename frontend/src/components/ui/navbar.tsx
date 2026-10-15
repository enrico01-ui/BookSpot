import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Logomark({ tone }: { tone: "dark" | "light" }) {
  const bg = tone === "dark" ? "bg-accent" : "bg-primary";
  const line = tone === "dark" ? "border-ink" : "border-white";

  return (
    <span
      aria-hidden
      className={`relative inline-block size-7 shrink-0 rounded-lg ${bg}`}
    >
      <span className={`absolute inset-1.5 rounded-[3px] border-2 ${line}`} />
      <span className={`absolute inset-y-1.5 left-1/2 border-l-2 ${line}`} />
    </span>
  );
}

export default function Navbar() {
    //cara cekapakah user sudah login atau belum
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const handleLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            navigate("/login");
            setIsLoading(false);
        }, 1000);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    }

    return (
        <nav className=" flex items-center justify-between gap-4 px-6 py-4 bg-ink">
            <div className="flex items-center gap-2">
                <Logomark tone="dark" />
                <span className="text-lg font-bold text-white">BookSpot</span>
            </div>

            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <>
                        
                        <a href="/explore" className="text-sm font-medium text-white hover:underline hover:text-[0.9rem] hover:text-accent">
                            Jelajahi
                        </a>
                        <a href="/bookings" className="text-sm font-medium text-white hover:underline hover:text-[0.9rem] hover:text-accent">
                            Booking Saya
                        </a>
                        <DropdownMenu >
                            <DropdownMenuTrigger >
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarImage src={user?.avatarUrl ?? undefined} alt="User Avatar" />
                                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className='mt-4' >
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    Profil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>   
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        <span className="text-sm font-medium text-gray-500">
                            Daftar
                        </span>

                        <Button
                            onClick={handleLogin}
                            variant="outline"
                            disabled={isLoading}
                            className="h-10 w-24 bg-accent rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none "
                        >
                            {isLoading ? "Memuat..." : "Login"}
                        </Button>
                    </>
                )}
            </div>
        </nav>
    );
}