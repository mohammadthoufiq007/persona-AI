import React from "react";
import { cn } from "@/lib/utils";

interface HeroProps {
  className?: string;
  children?: React.ReactNode;
}

export const Hero = ({ className, children }: HeroProps) => {
  return (
    <div className={cn("w-full relative h-screen", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24"
          style={{
            background: 'radial-gradient(125% 125% at 50% 10%, #000000 30%, #31135e 65%, #4c1d95 100%)'
          }}
        />
      </div>
      {children}
    </div>
  );
};
