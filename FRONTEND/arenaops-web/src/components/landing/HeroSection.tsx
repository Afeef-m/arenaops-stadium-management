"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./HeroSection.module.scss";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Theme = "morning" | "evening" | "night";

export function HeroSection() {
  const getCurrentTheme = (): Theme => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 16) return "morning";
    if (hour >= 16 && hour < 19) return "evening";
    return "night";
  };

  const [theme] = useState<Theme>(() => getCurrentTheme());

  const imageMap = {
    morning: "/stadium-morning.jpg",
    evening: "/stadium-evening.jpg",
    night: "/stadium-night.jpg",
  };
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.heroContainer} data-theme={theme}>
      <Image
        src={imageMap[theme]}
        alt="stadium background"
        fill
        className="object-cover"
      />
      <div className={styles.centerSpotlight} />
      <div className="fixed top-20 right-6 z-50 -rotate-90 origin-right">
        <div
          className="
    px-10 py-4
    bg-black
    rounded-xl 
    border-4 border-[#10b981]
    shadow-[0_0_40px_rgba(59,130,246,0.7)]
  "
        >
          <span
            className="
      text-[#10b981]
      text-2xl
      font-mono
      tracking-widest
      drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]
    "
          >
            {time}
          </span>
        </div>
      </div>

      {/* Content Layer */}
      <div className={styles.contentLayer}>
        {/* Event Badge */}
        <div
          className={cn(
            "inline-flex mt-20 items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-foreground mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary),0.3)]",
            styles.liveBadge,
          )}
        >
          <span className="relative flex h-2 w-2 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          NEXT MATCH: RED DRAGONS vs BLUE KNIGHTS
        </div>

        <div className="flex flex-col items-center mb-8 animate-fade-in-up delay-100">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-heading tracking-tighter text-transparent bg-clip-text uppercase leading-none">
            EXPERIENCE THE
          </h1>



          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold font-heading tracking-tighter text-transparent bg-clip-text  mt-2 uppercase leading-none">
            IMPOSSIBLE
          </h1>
        </div>



        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full sm:w-auto mb-16 animate-fade-in-up delay-200 z-50">
          <Link href={"/events"}>
            <Button
              variant="outline"
              size="sm"
              className="
  h-14 px-10 text-lg font-medium
  border border-green-600
  text-[#10b981]
  hover:bg-[#10b981]
  hover:text-white
  transition-all duration-300
  rounded-full group cursor-pointer
  "
            >
              Explore Events
              <PlayCircle className="ml-2 h-5 w-5 transition-colors group-hover:text-current" />
            </Button>
          </Link>
          
          <Link href={"/event-manager"}>
            <Button
              variant="outline"
              size="sm"
              className="
  h-14 px-10 text-lg font-medium
  border border-white/20 bg-black/40 backdrop-blur-md
  text-white
  hover:bg-white
  hover:text-black
  transition-all duration-300
  rounded-full group cursor-pointer
  "
            >
              Become an Event Manager
            </Button>
          </Link>
        </div>
      </div>
      <div className={styles.footerFade} />
    </section>
  );
}
