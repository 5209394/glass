import { HTMLAttributes } from "react";

export type GlassesType = {
  id: string;
  name: string;
  svg: string;
  image?: HTMLImageElement;
  widthRatio: number; // Ratio of SVG width to the physical distance between eyes
  yOffset: number; // Vertical offset adjustment relative to nose bridge height
};

export const glassesCatalog: GlassesType[] = [
  {
    id: "wayfarer-black",
    name: "Classic Wayfarer",
    widthRatio: 2.3,
    yOffset: -0.15,
    svg: `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#111" stroke-width="8" fill="rgba(0,0,0,0.85)">
        <rect x="20" y="15" width="65" height="50" rx="12"/>
        <rect x="115" y="15" width="65" height="50" rx="12"/>
      </g>
      <path d="M 85 30 Q 100 25 115 30" stroke="#111" stroke-width="6" fill="none"/>
      <path d="M 20 25 L 0 20 M 180 25 L 200 20" stroke="#111" stroke-width="8"/>
    </svg>`
  },
  {
    id: "round-gold",
    name: "Round Gold",
    widthRatio: 2.4,
    yOffset: -0.10,
    svg: `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#DAA520" stroke-width="4" fill="rgba(20, 20, 20, 0.4)">
        <circle cx="55" cy="40" r="32"/>
        <circle cx="145" cy="40" r="32"/>
      </g>
      <path d="M 87 35 Q 100 25 113 35" stroke="#DAA520" stroke-width="4" fill="none"/>
      <path d="M 23 35 Q 10 35 0 35 M 177 35 Q 190 35 200 35" stroke="#DAA520" stroke-width="4" fill="none"/>
    </svg>`
  },
  {
    id: "aviator",
    name: "Aviators",
    widthRatio: 2.4,
    yOffset: -0.05,
    svg: `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#C0C0C0" stroke-width="3" fill="rgba(10,50,40,0.6)">
        <path d="M 25 30 Q 55 15 85 30 Q 90 70 55 80 Q 20 70 25 30" />
        <path d="M 115 30 Q 145 15 175 30 Q 180 70 145 80 Q 110 70 115 30" />
      </g>
      <path d="M 85 30 L 115 30 M 80 20 Q 100 15 120 20" stroke="#C0C0C0" stroke-width="3" fill="none"/>
      <path d="M 25 30 Q 10 25 0 25 M 175 30 Q 190 25 200 25" stroke="#C0C0C0" stroke-width="3" fill="none"/>
    </svg>`
  },
  {
    id: "cyber-punk",
    name: "Cyber Neon",
    widthRatio: 2.2,
    yOffset: -0.2,
    svg: `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#0ff" stroke-width="3" fill="rgba(0, 255, 255, 0.3)">
        <polygon points="10,20 90,20 80,45 20,45" />
        <polygon points="110,20 190,20 180,45 120,45" />
      </g>
      <path d="M 90 20 L 110 20" stroke="#f0f" stroke-width="4" fill="none"/>
      <path d="M 10 20 L 0 20 M 190 20 L 200 20" stroke="#f0f" stroke-width="4"/>
    </svg>`
  }
];

export const loadGlassesImages = () => {
  glassesCatalog.forEach(glasses => {
    if (!glasses.image) {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(glasses.svg)}`;
      glasses.image = img;
    }
  });
};
