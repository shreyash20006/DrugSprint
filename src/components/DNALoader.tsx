import React from 'react';

export const DNALoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 select-none" id="dna-loader">
      <div className="relative w-10 h-10 flex items-center justify-center overflow-visible">
        {/* Animated Double Helix SVG */}
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="animate-[dnaRotate_5s_linear_infinite]"
        >
          <style>{`
            @keyframes dnaRotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes dotPulse {
              0%, 100% { transform: scale(0.4); opacity: 0.3; }
              50% { transform: scale(1.15); opacity: 1; }
            }
            .dna-dot-1 {
              animation: dotPulse 1.6s ease-in-out infinite;
              fill: #C84B0E;
            }
            .dna-dot-2 {
              animation: dotPulse 1.6s ease-in-out infinite;
              animation-delay: -0.8s;
              fill: #FFFFFF;
            }
            .dna-rung {
              stroke: rgba(245, 166, 35, 0.35);
              stroke-width: 2.5;
            }
          `}</style>
          
          {[...Array(6)].map((_, i) => {
            const angle = (i * Math.PI) / 6;
            const r = 32; // strand radius
            const cx = 50;
            const cy = 50;
            const delay = (-(i * 0.26)).toFixed(2);
            
            return (
              <g key={i}>
                {/* Rung line */}
                <line 
                  x1={cx - Math.cos(angle) * r} 
                  y1={cy - Math.sin(angle) * r} 
                  x2={cx + Math.cos(angle) * r} 
                  y2={cy + Math.sin(angle) * r} 
                  className="dna-rung" 
                />
                {/* Dot 1 */}
                <circle 
                  cx={cx - Math.cos(angle) * r} 
                  cy={cy - Math.sin(angle) * r} 
                  r="6.5" 
                  className="dna-dot-1"
                  style={{ animationDelay: `${delay}s` }}
                />
                {/* Dot 2 */}
                <circle 
                  cx={cx + Math.cos(angle) * r} 
                  cy={cy + Math.sin(angle) * r} 
                  r="6.5" 
                  className="dna-dot-2"
                  style={{ animationDelay: `${(parseFloat(delay) - 0.8).toFixed(2)}s` }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default DNALoader;
