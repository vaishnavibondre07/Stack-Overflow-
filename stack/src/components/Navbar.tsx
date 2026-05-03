import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { Menu, Search, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const Navbar = ({ handleslidein }: any) => {
  const { user, Logout } = useAuth();
  const { t } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const handlelogout = () => {
    Logout();
  };
  return (
    <div className="sticky top-0 z-50 w-full min-h-[53px] bg-white border-t-[3px] border-[#ef8236] shadow-[0_1px_5px_#00000033] flex items-center justify-center">
      <div className="w-full sm:w-[90%] max-w-[1440px] flex items-center justify-between mx-auto px-2 sm:px-4 py-1">
        <button
          aria-label="Toggle sidebar"
          className="lg:hidden p-2 rounded hover:bg-gray-100 transition flex-shrink-0"
          onClick={handleslidein}
        >
          <Menu className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex items-center gap-1 sm:gap-2 flex-grow min-w-0">
          <Link href="/" className="px-1 sm:px-3 py-1 flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="h-5 sm:h-6 w-auto" />
          </Link>

          <div className="hidden md:flex gap-1">
            {["About", "Products", "For Teams"].map((item) => (
              <Link
                key={item}
                href="/"
                className="text-xs sm:text-sm text-[#454545] font-medium px-2 sm:px-4 py-2 rounded hover:bg-gray-200 transition whitespace-nowrap"
              >
                {item}
              </Link>
            ))}
          </div>
          <form className="hidden lg:block flex-grow relative px-3 max-w-[600px]">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-600" />
          </form>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {!hasMounted ? null : !user ? (
            <Link
              href="/auth"
              className="text-xs sm:text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-2 sm:px-4 py-1.5 rounded transition whitespace-nowrap"
            >
              {t("login")}
            </Link>
          ) : (
            <>
              <Link
                href={`/users/${user._id}`}
                className="flex items-center justify-center bg-orange-600 text-white text-xs sm:text-sm font-semibold w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>

              <button
                onClick={handlelogout}
                className="hidden sm:block text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-4 py-1.5 rounded transition whitespace-nowrap"
              >
                {t("logout")}
              </button>
              {/* Mobile logout button */}
              <button
                onClick={handlelogout}
                className="sm:hidden p-2 rounded hover:bg-gray-100 transition"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
