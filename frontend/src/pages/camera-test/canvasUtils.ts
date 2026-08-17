export interface DetectedObject {
  class_name: string;
  class_id: number;
  confidence: number;
  bbox: [number, number, number, number];
  center: [number, number];
  area: number;
}

export const drawOverlay = (
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement | null,
  res: any
) => {
  if (!canvas || !video) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / 640;
  const scaleY = canvas.height / 480;

  const objects: DetectedObject[] = res.objects || [];
  objects.forEach(obj => {
    const [rx, ry, rw, rh] = obj.bbox;
    const w = rw * scaleX;
    const x = canvas.width - (rx * scaleX) - w;
    const y = ry * scaleY;
    const h = rh * scaleY;

    const isSuspicious = ['cell phone', 'book', 'laptop'].includes(obj.class_name);
    const color = isSuspicious ? '#EF4444' : '#10B981';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = color;
    const label = `${obj.class_name} (${Math.round(obj.confidence * 100)}%)`;
    ctx.font = 'bold 12px sans-serif';
    const textWidth = ctx.measureText(label).width;
    ctx.fillRect(x - 1, y - 22, textWidth + 10, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, x + 4, y - 6);
  });

  // Comment out to remove the circular head pose compass overlay
  // drawHeadPoseCompass(ctx, canvas.width - 70, 70, res.head_yaw || 0, res.head_pitch || 0);
};

export const drawHeadPoseCompass = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  yaw: number,
  pitch: number
) => {
  const radius = 45;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - radius + 5, cy);
  ctx.lineTo(cx + radius - 5, cy);
  ctx.moveTo(cx, cy - radius + 5);
  ctx.lineTo(cx, cy + radius - 5);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const maxVal = 35;
  const dx = (Math.max(-maxVal, Math.min(maxVal, yaw)) / maxVal) * (radius - 10);
  const dy = (Math.max(-maxVal, Math.min(maxVal, -pitch)) / maxVal) * (radius - 10);

  const targetX = cx + dx;
  const targetY = cy + dy;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(targetX, targetY);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(targetX, targetY, 6, 0, 2 * Math.PI);
  const isAbnormal = Math.abs(yaw) > 25 || Math.abs(pitch) > 20;
  ctx.fillStyle = isAbnormal ? '#EF4444' : '#22D3EE';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Y:${Math.round(yaw)}° P:${Math.round(pitch)}°`, cx, cy + radius + 14);
};
