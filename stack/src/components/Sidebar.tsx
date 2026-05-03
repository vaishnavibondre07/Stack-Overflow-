import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import {
  Bookmark,
  Bot,
  Building,
  FileText,
  Home,
  MessageSquare,
  MessageSquareIcon,
  Tag,
  Trophy,
  Users,
  Globe,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Badge } from "./ui/badge";

const Sidebar = ({ isopen }: any) => {
  const { t } = useLanguage();
  const router = useRouter();

  const isActive = (href: string) => {
    return router.pathname === href || router.asPath === href;
  };

  const linkClass = (href: string) =>
    cn(
      "flex items-center px-2 py-2 rounded text-sm transition-colors",
      isActive(href)
        ? "bg-gray-200 text-gray-900 font-medium"
        : "text-gray-700 hover:bg-gray-100"
    );

  return (
    <aside
      className={cn(
        "fixed lg:sticky top-[53px] left-0 z-50 w-52 lg:w-56 min-h-[calc(100vh-53px)] bg-white shadow-sm border-r transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto flex-shrink-0",
        isopen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="p-2 lg:p-3">
        <ul className="space-y-0.5">
          <li>
            <Link href="/" className={linkClass("/")}>
              <Home className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              {t("home")}
            </Link>
          </li>
          <li>
            <Link href="/questions" className={linkClass("/questions")}>
              <MessageSquareIcon className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              {t("questions")}
            </Link>
          </li>
          <li>
            <button
              className="flex items-center w-full px-2 py-2 text-gray-400 rounded text-sm cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Bot className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              AI Assist
              <Badge variant="secondary" className="ml-auto text-xs">
                Labs
              </Badge>
            </button>
          </li>
          <li>
            <Link href="/tags" className={linkClass("/tags")}>
              <Tag className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              {t("tags")}
            </Link>
          </li>
          <li>
            <Link href="/users" className={linkClass("/users")}>
              <Users className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              {t("users")}
            </Link>
          </li>
          <li>
            <Link href="/public-space" className={linkClass("/public-space")}>
              <Globe className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Public Space
            </Link>
          </li>
          <li>
            <Link href="/subscription" className={linkClass("/subscription")}>
              <Crown className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Subscription
            </Link>
          </li>
          <li>
            <button
              className="flex items-center w-full px-2 py-2 text-gray-400 rounded text-sm cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Bookmark className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Saves
            </button>
          </li>
          <li>
            <button
              className="flex items-center w-full px-2 py-2 text-gray-400 rounded text-sm cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Trophy className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Challenges
              <Badge
                variant="secondary"
                className="ml-auto text-xs bg-orange-100 text-orange-800"
              >
                NEW
              </Badge>
            </button>
          </li>
          <li>
            <Link href="/chat" className={linkClass("/chat")}>
              <MessageSquare className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Chat
            </Link>
          </li>
          <li>
            <button
              className="flex items-center w-full px-2 py-2 text-gray-400 rounded text-sm cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <FileText className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Articles
            </button>
          </li>
          <li>
            <button
              className="flex items-center w-full px-2 py-2 text-gray-400 rounded text-sm cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <Building className="w-4 h-4 mr-2 lg:mr-3 flex-shrink-0" />
              Companies
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
