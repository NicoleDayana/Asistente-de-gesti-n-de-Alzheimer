// Rótulos 3D generados con canvas (sin fuentes externas, compatibles con VR y single-file).
import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface TextureOptions {
  bg?: string;
  fg?: string;
  border?: string;
  fontSize?: number;
}

export function makeTextTexture(text: string, options: TextureOptions = {}): THREE.CanvasTexture {
  const { bg = "rgba(15, 23, 42, 0.85)", fg = "#ffffff", border = "rgba(255,255,255,0.35)", fontSize = 44 } = options;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const padX = 30;
  const padY = 18;
  canvas.width = Math.ceil(metrics.width + padX * 2);
  canvas.height = fontSize + padY * 2;

  // El cambio de tamaño del canvas reinicia el contexto: volver a aplicar estilo.
  ctx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const radius = 18;
  const w = canvas.width;
  const h = canvas.height;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(w - radius, 0);
  ctx.quadraticCurveTo(w, 0, w, radius);
  ctx.lineTo(w, h - radius);
  ctx.quadraticCurveTo(w, h, w - radius, h);
  ctx.lineTo(radius, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.fillText(text, padX, h / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function Label({
  text,
  position,
  scale = 2.4,
  bg,
  fg,
  border,
}: {
  text: string;
  position: [number, number, number];
  scale?: number;
  bg?: string;
  fg?: string;
  border?: string;
}) {
  const texture = useMemo(() => makeTextTexture(text, { bg, fg, border }), [text, bg, fg, border]);
  useEffect(() => () => texture.dispose(), [texture]);
  const aspect = texture.image.width / texture.image.height;

  return (
    <sprite position={position} scale={[scale * aspect, scale, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
