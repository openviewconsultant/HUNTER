"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";

interface ShootingStar {
    id: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
    speed: number;
    distance: number;
}

interface ShootingStarsProps {
    minDelay?: number;
    maxDelay?: number;
    minSpeed?: number;
    maxSpeed?: number;
    starColor?: string;
    trailColor?: string;
    starWidth?: number;
    starHeight?: number;
    className?: string;
}

export const ShootingStars = ({
    minDelay = 1000,
    maxDelay = 3000,
    minSpeed = 10,
    maxSpeed = 30,
    starColor = "#9E00FF",
    trailColor = "#2EB9DF",
    starWidth = 10,
    starHeight = 1,
    className,
}: ShootingStarsProps) => {
    const [star, setStar] = useState<ShootingStar | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const createStar = () => {
            const { innerWidth, innerHeight } = window;
            const x = Math.random() * innerWidth;
            const y = Math.random() * innerHeight;
            const angle = Math.random() * 45 + 135; // Angle between 135 and 180 degrees
            const scale = Math.random() * 1 + 0.5;
            const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
            const distance = Math.random() * 300 + 100; // Distance the star travels

            const newStar: ShootingStar = {
                id: Date.now(),
                x,
                y,
                angle,
                scale,
                speed,
                distance,
            };

            setStar(newStar);

            const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
            setTimeout(createStar, randomDelay);
        };

        createStar();

        return () => { };
    }, [minDelay, maxDelay, minSpeed, maxSpeed]);

    useEffect(() => {
        const moveStar = () => {
            if (star) {
                setStar((prevStar) => {
                    if (!prevStar) return null;
                    const newX =
                        prevStar.x +
                        prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
                    const newY =
                        prevStar.y +
                        prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
                    const newDistance = prevStar.distance - prevStar.speed;

                    if (newDistance <= 0) {
                        return null;
                    }

                    return {
                        ...prevStar,
                        x: newX,
                        y: newY,
                        distance: newDistance,
                    };
                });
            }
        };

        const animationFrame = requestAnimationFrame(moveStar);
        return () => cancelAnimationFrame(animationFrame);
    }, [star]);

    if (!star) return null;

    return (
        <svg
            ref={svgRef}
            className={cn("w-full h-full absolute inset-0 z-0 pointer-events-none", className)}
        >
            <rect
                key={star.id}
                x={star.x}
                y={star.y}
                width={starWidth * star.scale}
                height={starHeight}
                fill="url(#gradient)"
                transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2}, ${star.y + starHeight / 2
                    })`}
            />
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
                    <stop
                        offset="100%"
                        style={{ stopColor: starColor, stopOpacity: 1 }}
                    />
                </linearGradient>
            </defs>
        </svg>
    );
};
