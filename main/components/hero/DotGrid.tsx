import styles from "./dotgrid.module.scss";
import anime from "animejs";
import { useEffect, useRef } from "react";

export const DotGrid = () => {
  const GRID_WIDTH = 34;
  const GRID_HEIGHT = 28;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define larger, rounder letter patterns for "S" and "C" (scaled up 1.5x - now 10x14)
  const letterS = [
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
  ];

  const letterC = [
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
  ];

  // Position the letters to the top and slightly more centered
  const letterSStartX = 6;  // Starting column for S (brought back a bit more)
  const letterSStartY = 4;   // Starting row for S (keep at top)
  const letterCStartX = 18;  // Starting column for C (brought back a bit more)
  const letterCStartY = 4;   // Starting row for C (keep at top)

  // Function to check if a dot should be highlighted
  const shouldHighlightDot = (x: number, y: number) => {
    // Check if dot is part of letter S
    const sRelativeX = x - letterSStartX;
    const sRelativeY = y - letterSStartY;
    if (sRelativeX >= 0 && sRelativeX < 10 && sRelativeY >= 0 && sRelativeY < 14) {
      return letterS[sRelativeY][sRelativeX] === 1;
    }

    // Check if dot is part of letter C
    const cRelativeX = x - letterCStartX;
    const cRelativeY = y - letterCStartY;
    if (cRelativeX >= 0 && cRelativeX < 10 && cRelativeY >= 0 && cRelativeY < 14) {
      return letterC[cRelativeY][cRelativeX] === 1;
    }

    return false;
  };

  // Function to trigger wave effect from a specific dot
  const triggerWaveFromDot = (dotIndex: number) => {
    anime({
      targets: ".dot-point",
      scale: [
        { value: 1.5, easing: "easeOutSine", duration: 200 },
        { value: 1, easing: "easeInOutQuad", duration: 600 },
      ],
      translateY: [
        { value: -20, easing: "easeOutSine", duration: 200 },
        { value: 0, easing: "easeInOutQuad", duration: 600 },
      ],
      opacity: [
        { value: 1, easing: "easeOutSine", duration: 200 },
        { value: 0.4, easing: "easeInOutQuad", duration: 600 },
      ],
      backgroundColor: [
        { value: "#6F8EDE", easing: "easeOutSine", duration: 200 }, // Wave color
        { value: "#879BCB", easing: "easeInOutQuad", duration: 400 }, // After-wave color
        { value: "rgba(255, 255, 255, 0.35)", easing: "easeInOutQuad", duration: 400 }, // Back to original
      ],
      delay: anime.stagger(80, {
        grid: [GRID_WIDTH, GRID_HEIGHT],
        from: dotIndex,
      }),
    });
  };

  // Function to find the center dot between S and C
  const findCenterDotIndex = () => {
    // Calculate the center position between S and C
    const sEndX = letterSStartX + 10; // End of S
    const cStartX = letterCStartX; // Start of C
    const centerX = Math.floor((sEndX + cStartX) / 2) - 1; // Middle point between S and C, moved 1 left
    const centerY = letterSStartY + 7 - 1; // Middle of the letters vertically, moved 1 up
    
    // Convert to grid index
    return centerY * GRID_WIDTH + centerX;
  };

  // Set up periodic wave effect
  useEffect(() => {
    const centerDotIndex = findCenterDotIndex();
    
    // Trigger wave every 3 seconds
    intervalRef.current = setInterval(() => {
      triggerWaveFromDot(centerDotIndex);
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const dots = [];

  const handleDotClick = (e: any) => {
    triggerWaveFromDot(parseInt(e.target.dataset.index));
  };

  let index = 0;

  for (let i = 0; i < GRID_HEIGHT; i++) {
    for (let j = 0; j < GRID_WIDTH; j++) {
      const isHighlighted = shouldHighlightDot(j, i);
      
      dots.push(
        <div
          onClick={handleDotClick}
          className={styles.dotWrapper}
          data-index={index}
          key={`${j}-${i}`}
        >
          <div 
            className={`${styles.dot} ${isHighlighted ? styles.highlightedDot : ''} dot-point`} 
            data-index={index} 
          />
        </div>
      );
      index++;
    }
  }

  return (
    <div
      style={{ 
        gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
        position: 'absolute',
        top: '65%',
        left: '60%',
        transform: 'translate(-50%, -50%)',
        width: '75vw',
        maxWidth: '750px',
        height: '77vh',
        maxHeight: '750px'
      }}
      className={styles.dotGrid}
    >
      {dots.map((dot) => dot)}
    </div>
  );
};