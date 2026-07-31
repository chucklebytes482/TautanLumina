const fs = require('fs');
const svg = `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.04">
    <!-- Cloud -->
    <path d="M 40 40 Q 40 30 50 30 Q 60 30 65 35 Q 75 25 85 35 Q 95 35 90 45 Q 95 55 85 55 L 45 55 Q 35 55 40 40" />
    <!-- Star -->
    <path d="M 130 30 L 135 45 L 150 45 L 138 55 L 142 70 L 130 60 L 118 70 L 122 55 L 110 45 L 125 45 Z" />
    <!-- Moon -->
    <path d="M 230 40 A 15 15 0 0 0 245 55 A 20 20 0 0 1 220 55 A 15 15 0 0 0 230 40 Z" />
    <!-- Heart -->
    <path d="M 40 140 A 12 12 0 0 1 60 140 A 12 12 0 0 1 80 140 Q 80 155 60 170 Q 40 155 40 140 Z" />
    <!-- Sun -->
    <circle cx="150" cy="150" r="12" />
    <path d="M 150 125 L 150 120 M 150 175 L 150 180 M 125 150 L 120 150 M 175 150 L 180 150 M 132 132 L 128 128 M 168 168 L 172 172 M 132 168 L 128 172 M 168 132 L 172 128" />
    <!-- Envelope -->
    <rect x="230" y="130" width="30" height="20" rx="2" />
    <path d="M 230 130 L 245 140 L 260 130" />
    <!-- Music Note -->
    <path d="M 60 250 L 60 230 L 75 225 L 75 245 M 60 235 L 75 230" />
    <circle cx="55" cy="250" r="6" />
    <circle cx="70" cy="245" r="6" />
    <!-- Cup -->
    <path d="M 140 240 L 140 260 A 10 10 0 0 0 160 260 L 160 240 Z" />
    <path d="M 160 245 A 5 5 0 0 1 160 255" />
    <!-- Diamond -->
    <path d="M 230 240 L 250 240 L 255 250 L 240 265 L 225 250 Z" />
    <!-- Plus -->
    <path d="M 190 70 L 200 70 M 195 65 L 195 75" />
    <path d="M 70 80 L 80 80 M 75 75 L 75 85" />
    <path d="M 200 200 L 210 200 M 205 195 L 205 205" />
    <!-- Hash -->
    <path d="M 90 90 L 110 90 M 85 100 L 105 100 M 95 85 L 90 105 M 105 85 L 100 105" />
    <path d="M 250 180 L 270 180 M 245 190 L 265 190 M 255 175 L 250 195 M 265 175 L 260 195" />
    <!-- Triangle -->
    <path d="M 50 100 L 60 120 L 40 120 Z" />
    <path d="M 270 70 L 280 90 L 260 90 Z" />
    <!-- Arrow -->
    <path d="M 190 170 L 200 160 L 210 170 M 200 160 L 200 180" />
    <path d="M 100 210 L 110 200 L 120 210 M 110 200 L 110 220" />
    <!-- Check -->
    <path d="M 180 100 L 190 110 L 210 90" />
    <!-- Tiny circles / Dots -->
    <circle cx="25" cy="25" r="1.5" />
    <circle cx="85" cy="25" r="1.5" />
    <circle cx="205" cy="25" r="1.5" />
    <circle cx="285" cy="25" r="1.5" />
    
    <circle cx="25" cy="85" r="1.5" />
    <circle cx="155" cy="85" r="1.5" />
    <circle cx="285" cy="85" r="1.5" />
    
    <circle cx="105" cy="155" r="1.5" />
    <circle cx="205" cy="155" r="1.5" />
    <circle cx="285" cy="155" r="1.5" />
    
    <circle cx="25" cy="205" r="1.5" />
    <circle cx="155" cy="205" r="1.5" />
    <circle cx="285" cy="205" r="1.5" />
    
    <circle cx="25" cy="285" r="1.5" />
    <circle cx="105" cy="285" r="1.5" />
    <circle cx="205" cy="285" r="1.5" />
    <circle cx="285" cy="285" r="1.5" />
    
    <!-- Sparkles -->
    <path d="M 180 30 Q 185 30 185 25 Q 185 30 190 30 Q 185 30 185 35 Q 185 30 180 30" />
    <path d="M 30 230 Q 35 230 35 225 Q 35 230 40 230 Q 35 230 35 235 Q 35 230 30 230" />
    <path d="M 120 280 Q 125 280 125 275 Q 125 280 130 280 Q 125 280 125 285 Q 125 280 120 280" />
    
    <!-- Circles -->
    <circle cx="260" cy="280" r="5" />
    <circle cx="20" cy="90" r="4" />
    <circle cx="90" cy="50" r="3" />
    <circle cx="210" cy="120" r="6" />
    <circle cx="110" cy="180" r="4" />
    <circle cx="170" cy="220" r="5" />
    
    <!-- Squiggles -->
    <path d="M 260 100 Q 265 95 270 100 T 280 100" />
    <path d="M 80 180 Q 85 175 90 180 T 100 180" />
  </g>
</svg>`;
console.log("data:image/svg+xml;base64," + Buffer.from(svg).toString('base64'));
