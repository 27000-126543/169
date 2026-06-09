import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export default function GlassCard({ children, className, glow = false, onClick, style }: GlassCardProps) {
  return (
    <div
      className={cn(glow ? "glass-card-glow" : "glass-card", "p-5", onClick && "cursor-pointer", className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
