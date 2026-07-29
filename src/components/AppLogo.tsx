import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  isDark?: boolean;
}

export const AppLogo = ({ size = 28, className = "", isDark = false }: LogoProps) => {
  const strokeColor = isDark ? "white" : "#FF4F00";
  const circleColor = isDark ? "white" : "#FF4F00";
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Bookmark Base */}
      <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z" />
      
      {/* Star / Inner icon */}
      <circle cx="12" cy="9" r="2.2" fill={circleColor} />
    </svg>
  );
};
