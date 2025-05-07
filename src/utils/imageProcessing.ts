
export function generateSVGFromCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create an SVG representation
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="64" height="64">
    <path fill="currentColor" d="`;
  
  // Simple bitmap tracing algorithm
  let path = "";
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx] === 0) { // Black pixel found
        path += `M${x},${y} `;
        // Add a small rectangle (1x1) for each black pixel
        path += `h1 v1 h-1 z `;
      }
    }
  }
  
  svg += path + '"/></svg>';
  return svg;
}

export function getThresholdValue(level: 1 | 2 | 3 | 4 | 5): number {
  // Map the 5 levels to threshold values (0-255)
  switch (level) {
    case 1: return 50;  // Very light (mostly black)
    case 2: return 100;
    case 3: return 150; // Medium
    case 4: return 200;
    case 5: return 225; // Very dark (mostly white)
    default: return 150;
  }
}
