/**
 * Silgi: şeffaf delik (destination-out) yerine beyaza boya.
 * Şeffaf delik karanlık arka planda siyah görünür; PDF’de de kaybolabilir / bozulur.
 */

export function eraseDotToWhite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sizePx: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, sizePx) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function eraseStrokeToWhite(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sizePx: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, sizePx);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}
