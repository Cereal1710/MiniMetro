import React, { useEffect, useRef } from 'react';

interface MenuAnimatedTracksProps {
  theme?: 'dark' | 'light';
}

interface Point {
  x: number;
  y: number;
}

interface TrackLine {
  id: string;
  name: string;
  color: string;
  darkColor: string;
  pointsNorm: Point[]; // Normalized 0-1 coordinates relative to viewport
}

interface StationNode {
  xNorm: number;
  yNorm: number;
  shape: 'circle' | 'triangle' | 'square' | 'diamond' | 'star';
  name: string;
}

interface AnimatedTrain {
  lineIndex: number;
  progress: number; // 0 to 1 along path length
  speed: number;    // normalized progress per second
  direction: 1 | -1;
  hasAdBanner: boolean;
  carriages: number;
  dwellTimer: number;
}

export const MenuAnimatedTracks: React.FC<MenuAnimatedTracksProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // 5 Authentic Mini Metro Transit Lines across the viewport
    const lines: TrackLine[] = [
      {
        id: 'red',
        name: 'Red Line',
        color: '#e53e3e',
        darkColor: '#9b2c2c',
        pointsNorm: [
          { x: -0.05, y: 0.62 },
          { x: 0.22, y: 0.62 },
          { x: 0.44, y: 0.38 },
          { x: 0.76, y: 0.38 },
          { x: 0.92, y: 0.22 },
          { x: 1.05, y: 0.22 }
        ]
      },
      {
        id: 'yellow',
        name: 'Yellow Line',
        color: '#eab308',
        darkColor: '#854d0e',
        pointsNorm: [
          { x: 0.52, y: -0.05 },
          { x: 0.52, y: 0.38 },
          { x: 0.66, y: 0.56 },
          { x: 0.84, y: 0.82 },
          { x: 1.05, y: 0.82 }
        ]
      },
      {
        id: 'cyan',
        name: 'Cyan Line',
        color: '#38bdf8',
        darkColor: '#0369a1',
        pointsNorm: [
          { x: 0.56, y: -0.05 },
          { x: 0.56, y: 0.34 },
          { x: 0.70, y: 0.52 },
          { x: 0.90, y: 0.78 },
          { x: 1.05, y: 0.78 }
        ]
      },
      {
        id: 'green',
        name: 'Green Line',
        color: '#10b981',
        darkColor: '#047857',
        pointsNorm: [
          { x: 0.16, y: -0.05 },
          { x: 0.16, y: 0.22 },
          { x: 0.06, y: 0.44 },
          { x: 0.06, y: 0.82 },
          { x: 0.35, y: 1.05 }
        ]
      },
      {
        id: 'purple',
        name: 'Purple Line',
        color: '#a855f7',
        darkColor: '#6b21a8',
        pointsNorm: [
          { x: 0.24, y: 1.05 },
          { x: 0.38, y: 0.72 },
          { x: 0.68, y: 0.72 },
          { x: 0.86, y: 0.52 },
          { x: 1.05, y: 0.52 }
        ]
      }
    ];

    // Authentic Stations located at junctions & waypoints
    const stations: StationNode[] = [
      { xNorm: 0.22, yNorm: 0.62, shape: 'circle', name: 'Circle Station' },
      { xNorm: 0.44, yNorm: 0.38, shape: 'square', name: 'Square Station' },
      { xNorm: 0.52, yNorm: 0.38, shape: 'triangle', name: 'Central Interchange' },
      { xNorm: 0.76, yNorm: 0.38, shape: 'diamond', name: 'Diamond Station' },
      { xNorm: 0.66, yNorm: 0.56, shape: 'star', name: 'Star Station' },
      { xNorm: 0.84, yNorm: 0.82, shape: 'circle', name: 'South Terminal' },
      { xNorm: 0.16, yNorm: 0.22, shape: 'triangle', name: 'North West' },
      { xNorm: 0.06, yNorm: 0.82, shape: 'square', name: 'South West' },
      { xNorm: 0.38, yNorm: 0.72, shape: 'circle', name: 'Midtown Station' },
      { xNorm: 0.86, yNorm: 0.52, shape: 'triangle', name: 'East Junction' }
    ];

    // Trains roaming continuously across the network
    const trains: AnimatedTrain[] = [
      { lineIndex: 0, progress: 0.15, speed: 0.045, direction: 1, hasAdBanner: true, carriages: 1, dwellTimer: 0 },
      { lineIndex: 0, progress: 0.75, speed: 0.042, direction: -1, hasAdBanner: false, carriages: 0, dwellTimer: 0 },
      { lineIndex: 1, progress: 0.28, speed: 0.048, direction: 1, hasAdBanner: true, carriages: 1, dwellTimer: 0 },
      { lineIndex: 2, progress: 0.62, speed: 0.052, direction: 1, hasAdBanner: true, carriages: 2, dwellTimer: 0 },
      { lineIndex: 3, progress: 0.40, speed: 0.044, direction: 1, hasAdBanner: false, carriages: 1, dwellTimer: 0 },
      { lineIndex: 4, progress: 0.20, speed: 0.046, direction: 1, hasAdBanner: true, carriages: 1, dwellTimer: 0 },
      { lineIndex: 4, progress: 0.85, speed: 0.043, direction: -1, hasAdBanner: false, carriages: 0, dwellTimer: 0 }
    ];

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helpers to compute points & length along polyline
    const getScreenPoints = (line: TrackLine, w: number, h: number): Point[] => {
      return line.pointsNorm.map(p => ({ x: p.x * w, y: p.y * h }));
    };

    const getPolylineLength = (pts: Point[]): number => {
      let len = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i + 1].x - pts[i].x;
        const dy = pts[i + 1].y - pts[i].y;
        len += Math.hypot(dx, dy);
      }
      return len;
    };

    const getPointAtProgress = (pts: Point[], totalLen: number, progress: number): { x: number; y: number; angle: number } => {
      let targetDist = Math.max(0, Math.min(1, progress)) * totalLen;
      let acc = 0;

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (acc + segLen >= targetDist || i === pts.length - 2) {
          const segProgress = segLen > 0 ? (targetDist - acc) / segLen : 0;
          const x = p1.x + (p2.x - p1.x) * segProgress;
          const y = p1.y + (p2.y - p1.y) * segProgress;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          return { x, y, angle };
        }
        acc += segLen;
      }

      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2] || last;
      return { x: last.x, y: last.y, angle: Math.atan2(last.y - prev.y, last.x - prev.x) };
    };

    // Draw station glyph
    const drawStation = (x: number, y: number, shape: StationNode['shape'], isDarkMode: boolean) => {
      ctx.save();
      ctx.translate(x, y);

      const radius = 10;
      const strokeWidth = 3.5;
      const fillColor = isDarkMode ? '#252528' : '#ffffff';
      const strokeColor = isDarkMode ? '#ffffff' : '#252528';

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'miter';

      ctx.beginPath();
      switch (shape) {
        case 'circle':
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          break;
        case 'triangle': {
          const r = radius * 1.25;
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.866, r * 0.5);
          ctx.lineTo(-r * 0.866, r * 0.5);
          ctx.closePath();
          break;
        }
        case 'square': {
          const s = radius * 1.7;
          ctx.rect(-s / 2, -s / 2, s, s);
          break;
        }
        case 'diamond': {
          const d = radius * 1.25;
          ctx.moveTo(0, -d);
          ctx.lineTo(d, 0);
          ctx.lineTo(0, d);
          ctx.lineTo(-d, 0);
          ctx.closePath();
          break;
        }
        case 'star': {
          const spikes = 5;
          const outerR = radius * 1.35;
          const innerR = radius * 0.6;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (i * Math.PI) / spikes - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          break;
        }
      }
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Draw realistic train car with headlights and optional sky-blue livery
    const drawTrainCar = (
      x: number,
      y: number,
      angle: number,
      color: string,
      isLocomotive: boolean,
      hasAdBanner: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const length = 38;
      const width = 14;
      const corner = 3.5;

      // Soft headlight beam projecting forward
      if (isLocomotive) {
        const beamGrad = ctx.createRadialGradient(length / 2 + 5, 0, 2, length / 2 + 35, 0, 28);
        beamGrad.addColorStop(0, 'rgba(255, 255, 220, 0.45)');
        beamGrad.addColorStop(0.5, 'rgba(255, 255, 200, 0.15)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(length / 2 + 45, -24);
        ctx.lineTo(length / 2 + 45, 24);
        ctx.closePath();
        ctx.fill();
      }

      // Train car body shadow
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-length / 2, -width / 2, length, width, corner);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Sky blue advertising livery stripe (requested by user)
      if (hasAdBanner) {
        ctx.fillStyle = '#38bdf8'; // Sky blue
        ctx.fillRect(-length / 2 + 6, -width / 2, length - 12, 2.5);
        ctx.fillRect(-length / 2 + 6, width / 2 - 2.5, length - 12, 2.5);
      }

      // Front headlights on locomotive
      if (isLocomotive) {
        ctx.fillStyle = '#fef08a'; // Warm white
        ctx.beginPath();
        ctx.arc(length / 2 - 1.5, -4, 1.8, 0, Math.PI * 2);
        ctx.arc(length / 2 - 1.5, 4, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Roof window slots / minimalist details
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-length / 2 + 9, -2, 4, 4);
      ctx.fillRect(-length / 2 + 17, -2, 4, 4);
      ctx.fillRect(-length / 2 + 25, -2, 4, 4);

      ctx.restore();
    };

    // Render loop
    const render = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Track Lines
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 10;

      lines.forEach((line) => {
        const pts = getScreenPoints(line, width, height);
        if (pts.length < 2) return;

        ctx.strokeStyle = line.color;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      });

      // 2. Draw Stations along the tracks
      stations.forEach((st) => {
        drawStation(st.xNorm * width, st.yNorm * height, st.shape, isDark);
      });

      // 3. Update & Draw Trains
      trains.forEach((train) => {
        const line = lines[train.lineIndex];
        if (!line) return;

        const pts = getScreenPoints(line, width, height);
        const totalLen = getPolylineLength(pts);
        if (totalLen <= 0) return;

        // Dwell pause simulation
        if (train.dwellTimer > 0) {
          train.dwellTimer -= dt;
        } else {
          train.progress += train.speed * train.direction * dt;

          // Loop or bounce at line ends
          if (train.progress > 1.0) {
            train.progress = 1.0;
            train.direction = -1;
            train.dwellTimer = 1.2;
          } else if (train.progress < 0.0) {
            train.progress = 0.0;
            train.direction = 1;
            train.dwellTimer = 1.2;
          }
        }

        const headPos = getPointAtProgress(pts, totalLen, train.progress);
        const headingAngle = train.direction === -1 ? headPos.angle + Math.PI : headPos.angle;

        // Draw Locomotive
        drawTrainCar(headPos.x, headPos.y, headingAngle, line.color, true, train.hasAdBanner);

        // Draw Attached Carriages behind
        const carSpacingNorm = 42 / totalLen;
        for (let c = 1; c <= train.carriages; c++) {
          const carProgress = train.progress - (c * carSpacingNorm * train.direction);
          if (carProgress >= 0 && carProgress <= 1) {
            const carPos = getPointAtProgress(pts, totalLen, carProgress);
            const carAngle = train.direction === -1 ? carPos.angle + Math.PI : carPos.angle;

            // Coupler link
            ctx.save();
            ctx.strokeStyle = isDark ? '#52525b' : '#a1a1aa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(headPos.x, headPos.y);
            ctx.lineTo(carPos.x, carPos.y);
            ctx.stroke();
            ctx.restore();

            drawTrainCar(carPos.x, carPos.y, carAngle, line.color, false, train.hasAdBanner);
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${
        isDark ? 'opacity-90' : 'opacity-80'
      }`}
    />
  );
};
