import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  FileSearch,
  BarChart3,
  Bell,
  ChevronDown,
  Shield,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "总览" },
  { to: "/mine", icon: MapPin, label: "矿区详情" },
  { to: "/alerts", icon: AlertTriangle, label: "预警管理" },
  { to: "/geology", icon: FileSearch, label: "地质分析" },
  { to: "/reports", icon: BarChart3, label: "报表中心" },
];

const roles = ["集团", "矿级", "班组"];

export default function Layout() {
  const [time, setTime] = useState(new Date());
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState("集团");
  const [alertCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = time.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <aside className="w-60 flex flex-col shrink-0" style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-2 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <Shield size={24} style={{ color: "var(--accent)" }} />
          <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            矿山安全监测
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "border-l-2 font-medium"
                    : "hover:bg-white/5"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { color: "var(--accent)", background: "var(--accent-dim)", borderLeftColor: "var(--accent)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 text-xs" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}>
          v1.0.0
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header
          className="h-14 flex items-center justify-between px-6 shrink-0"
          style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}
        >
          <span className="font-din text-sm tracking-wide" style={{ color: "var(--text-secondary)" }}>
            {formatted}
          </span>

          <div className="flex items-center gap-5">
            <div className="relative">
              <button
                onClick={() => setRoleOpen(!roleOpen)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-primary)", background: "var(--accent-dim)" }}
              >
                {role}
                <ChevronDown size={14} />
              </button>
              {roleOpen && (
                <div
                  className="absolute right-0 mt-1 w-24 rounded-lg py-1 z-50"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                >
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setRoleOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: r === role ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="relative" style={{ color: "var(--text-secondary)" }}>
              <Bell size={18} />
              {alertCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: "var(--danger)", color: "#fff" }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
