import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HoldButtonProps {
  onActivate: () => void;
  holdDuration?: number;
  isAlertActive: boolean;
  isAlert?: boolean;
  disabled?: boolean;
  buttonLabel?: string;
}

export function HoldButton({ 
  onActivate, 
  holdDuration = 2000, 
  isAlertActive,
  isAlert = false,
  disabled = false,
  buttonLabel
}: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasActivatedRef = useRef(false);

  const updateProgress = useCallback(() => {
    if (holdStartRef.current === null) return;
    
    const elapsed = Date.now() - holdStartRef.current;
    const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
    
    setProgress(newProgress);
    
    if (newProgress >= 100 && !hasActivatedRef.current) {
      hasActivatedRef.current = true;
      onActivate();
      setIsHolding(false);
      holdStartRef.current = null;
      return;
    }
    
    if (newProgress < 100) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [holdDuration, onActivate]);

  const handleStart = useCallback(() => {
    if (disabled) return;
    
    setIsHolding(true);
    setProgress(0);
    holdStartRef.current = Date.now();
    hasActivatedRef.current = false;
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [disabled, updateProgress]);

  const handleEnd = useCallback(() => {
    setIsHolding(false);
    holdStartRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setTimeout(() => setProgress(0), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const size = 220;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const label = buttonLabel || (isAlertActive ? "Estoy bien" : "Pedir Ayuda");

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>
      <svg 
        className="absolute -rotate-90"
        width={size + 40}
        height={size + 40}
        viewBox={`0 0 ${size + 40} ${size + 40}`}
      >
        <circle
          cx={(size + 40) / 2}
          cy={(size + 40) / 2}
          r={radius + 10}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
        />
        {isHolding && (
          <circle
            cx={(size + 40) / 2}
            cy={(size + 40) / 2}
            r={radius + 10}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        )}
      </svg>
      
      <button
        type="button"
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        disabled={disabled}
        className={cn(
          "rounded-full flex flex-col items-center justify-center",
          "text-white font-bold shadow-2xl",
          "select-none touch-none focus:outline-none",
          "transition-transform duration-150",
          isHolding && "scale-95",
          disabled && "opacity-50"
        )}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
          border: "2px solid rgba(255,255,255,0.4)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        data-testid="button-alert"
        aria-label={label}
      >
        {isAlertActive && (
          <span className="text-5xl mb-3">💚</span>
        )}
        <span className="text-xl font-bold leading-tight text-center px-2">
          {label}
        </span>
        <span className="text-sm opacity-70 mt-1 font-normal">
          {isAlertActive ? "Mantén pulsado" : "Mantén 2 segundos"}
        </span>
      </button>
    </div>
  );
}
