import React, { useEffect, useRef } from "react";

// Plain 2D canvas overlay, redrawn straight from refs every animation frame —
// deliberately outside React state so 4 cars moving 60x/sec don't trigger 60
// re-renders/sec of the whole HUD tree.
export default function MiniMap({ samples, carsRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;

    const xs = samples.map((p) => p.x);
    const zs = samples.map((p) => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const pad = 16;
    const scale = Math.min((size - pad * 2) / (maxX - minX), (size - pad * 2) / (maxZ - minZ));
    const toCanvas = (x, z) => [
      pad + (x - minX) * scale,
      pad + (z - minZ) * scale,
    ];

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "rgba(8,10,18,0.55)";
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 4;
      samples.forEach((p, i) => {
        const [cx, cy] = toCanvas(p.x, p.z);
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.stroke();

      Object.values(carsRef.current).forEach((car) => {
        if (!car?.position) return;
        const [cx, cy] = toCanvas(car.position.x, car.position.z);
        ctx.beginPath();
        ctx.fillStyle = car.color;
        ctx.arc(cx, cy, car.isPlayer ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        if (car.isPlayer) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [samples, carsRef]);

  return <canvas ref={canvasRef} width={140} height={140} className="racer-minimap" />;
}
