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
import { useStore } from "@/store";
import { mines, workingFaces } from "@/data/mock";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "总览" },
  { to: "/mine", icon: MapPin, label: "矿区详情" },
  { to: "/alerts", icon: AlertTriangle, label: "预警管理" },
  { to: "/geology", icon: FileSearch, label: "地质分析" },
  { to: "/reports", icon: BarChart3, label: "报表中心" },
];

const roleMap: Record<string, "group" | "mine" | "team"> = {
  集团: "group",
  矿级: "mine",
  班组: "team",
};
const roleLabels: Record<string, string> = { group: "集团", mine: "矿级", team: "班组" };
const roleKeys = Object.keys(roleMap);

export default function Layout() {
  const [time, setTime] = useState(new Date());
  const [roleOpen, setRoleOpen] = useState(false);
  const [mineOpen, setMineOpen] = useState(false);
  const [faceOpen, setFaceOpen] = useState(false);

  const userRole = useStore((s) => s.userRole);
  const roleMineId = useStore((s) => s.roleMineId);
  const roleFaceId = useStore((s) => s.roleFaceId);
  const setUserRole = useStore((s) => s.setUserRole);
  const setRoleMineId = useStore((s) => s.setRoleMineId);
  const setRoleFaceId = useStore((s) => s.setRoleFaceId);
  const pendingCount = useStore((s) => s.alerts.filter((a) => a.status === "pending").length);

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

  const currentLabel = roleLabels[userRole];
  const selectedMine = mines.find((m) => m.id === roleMineId);
  const currentFaces = roleMineId ? workingFaces[roleMineId] || [] : [];
  const selectedFace = currentFaces.find((f) => f.id === roleFaceId);

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
                  isActive ? "border-l-2 font-medium" : "hover:bg-white/5"
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

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => { setRoleOpen(!roleOpen); setMineOpen(false); }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-primary)", background: "var(--accent-dim)" }}
              >
                {currentLabel}
                <ChevronDown size={14} />
              </button>
              {roleOpen && (
                <div className="absolute right-0 mt-1 w-24 rounded-lg py-1 z-50" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                  {roleKeys.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setUserRole(roleMap[r]); setRoleOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: r === currentLabel ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {userRole !== "group" && (
              <div className="relative">
                <button
                  onClick={() => { setMineOpen(!mineOpen); setRoleOpen(false); setFaceOpen(false); }}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors max-w-48 truncate"
                  style={{ color: "var(--text-primary)", background: "var(--accent-dim)" }}
                >
                  {selectedMine?.name ?? "选择矿区"}
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                {mineOpen && (
                  <div className="absolute right-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg py-1 z-50" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                    {mines.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setRoleMineId(m.id); setMineOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5 truncate"
                        style={{ color: m.id === roleMineId ? "var(--accent)" : "var(--text-secondary)" }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {userRole === "team" && currentFaces.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setFaceOpen(!faceOpen); setRoleOpen(false); setMineOpen(false); }}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors max-w-40 truncate"
                  style={{ color: "var(--text-primary)", background: "var(--accent-dim)" }}
                >
                  {selectedFace?.name ?? "选择工作面"}
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                {faceOpen && (
                  <div className="absolute right-0 mt-1 w-48 max-h-48 overflow-y-auto rounded-lg py-1 z-50" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                    <button
                      onClick={() => { setRoleFaceId(null); setFaceOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: !roleFaceId ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      全部工作面
                    </button>
                    {currentFaces.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { setRoleFaceId(f.id); setFaceOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5 truncate"
                        style={{ color: f.id === roleFaceId ? "var(--accent)" : "var(--text-secondary)" }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="relative" style={{ color: "var(--text-secondary)" }}>
              <Bell size={18} />
              {pendingCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: "var(--danger)", color: "#fff" }}
                >
                  {pendingCount}
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
