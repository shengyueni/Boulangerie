const POSTER_WIDTH = 720;
const POSTER_HEIGHT = 1180;
const POSTER_SCALE = 1;

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function fillRoundedRect(context, x, y, width, height, radius, color) {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function strokeRoundedRect(context, x, y, width, height, radius, color, lineWidth) {
  roundedRect(context, x, y, width, height, radius);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
}

function drawCornerOrnament(context, x, y, horizontalDirection, verticalDirection, color, size = 34) {
  context.beginPath();
  context.moveTo(x + horizontalDirection * size, y);
  context.lineTo(x, y);
  context.lineTo(x, y + verticalDirection * size);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.arc(x + horizontalDirection * 11, y + verticalDirection * 11, 3, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function drawPaperDetails(context) {
  context.strokeStyle = "rgba(184, 138, 74, 0.07)";
  context.lineWidth = 1;
  for (let y = 132; y < POSTER_HEIGHT - 50; y += 38) {
    context.beginPath();
    context.moveTo(42, y);
    context.lineTo(678, y);
    context.stroke();
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = Array.from(String(text || ""));
  const lines = [];
  let line = "";

  chars.forEach((char) => {
    const candidate = line + char;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    let output = item;
    if (index === maxLines - 1 && lines.length > maxLines) {
      while (output && context.measureText(output + "…").width > maxWidth) {
        output = output.slice(0, -1);
      }
      output += "…";
    }
    context.fillText(output, x, y + index * lineHeight);
  });
}

function drawMetric(context, metric, index) {
  const x = 58;
  const y = 286 + index * 110;
  const width = 604;
  const height = 88;

  fillRoundedRect(context, x, y, width, height, 18, "#fffdfa");
  strokeRoundedRect(context, x, y, width, height, 18, "rgba(184, 138, 74, 0.42)", 2);
  strokeRoundedRect(context, x + 5, y + 5, width - 10, height - 10, 14, "rgba(184, 138, 74, 0.13)", 1);
  fillRoundedRect(context, x, y, 8, height, 4, index % 2 ? "#6f9c82" : "#d88b56");
  drawCornerOrnament(context, x + width - 14, y + 14, -1, 1, "rgba(111, 156, 130, 0.28)", 16);

  context.textAlign = "left";
  context.fillStyle = "#3e352f";
  context.font = "bold 28px sans-serif";
  context.fillText(`${metric.name}：${metric.value}`, x + 28, y + 37);
  context.fillStyle = "#78685e";
  context.font = "23px sans-serif";
  wrapText(context, metric.description, x + 28, y + 69, width - 54, 28, 1);
}

function drawSlip(context, label, text, x, y) {
  const width = 294;
  const height = 154;
  fillRoundedRect(context, x, y, width, height, 20, "rgba(255, 253, 250, 0.96)");
  strokeRoundedRect(context, x, y, width, height, 20, "rgba(47, 123, 103, 0.40)", 2);
  strokeRoundedRect(context, x + 6, y + 6, width - 12, height - 12, 15, "rgba(184, 138, 74, 0.17)", 1);
  drawCornerOrnament(context, x + width - 16, y + 16, -1, 1, "rgba(184, 138, 74, 0.40)", 20);
  context.textAlign = "left";
  context.fillStyle = "#6f9c82";
  context.font = "bold 22px sans-serif";
  context.fillText(label, x + 22, y + 35);
  context.fillStyle = "#3e352f";
  context.font = "bold 25px sans-serif";
  wrapText(context, text, x + 22, y + 73, width - 44, 34, 3);
}

function drawOraclePoster(context, oracle, croissantImage) {
  context.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.fillStyle = "#fffaf2";
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  drawPaperDetails(context);

  context.fillStyle = "rgba(216, 139, 86, 0.055)";
  context.beginPath();
  context.arc(674, 54, 72, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(79, 152, 127, 0.045)";
  context.beginPath();
  context.arc(38, 1142, 82, 0, Math.PI * 2);
  context.fill();

  strokeRoundedRect(context, 24, 22, 672, 1132, 28, "rgba(184, 138, 74, 0.50)", 2);
  strokeRoundedRect(context, 31, 29, 658, 1118, 23, "rgba(47, 107, 79, 0.16)", 1);
  drawCornerOrnament(context, 44, 42, 1, 1, "rgba(184, 74, 58, 0.58)", 42);
  drawCornerOrnament(context, 676, 42, -1, 1, "rgba(47, 107, 79, 0.58)", 42);
  drawCornerOrnament(context, 44, 1134, 1, -1, "rgba(90, 42, 95, 0.44)", 42);
  drawCornerOrnament(context, 676, 1134, -1, -1, "rgba(184, 138, 74, 0.58)", 42);

  context.textAlign = "center";
  context.fillStyle = "#3e352f";
  context.font = "bold 32px sans-serif";
  context.fillText("吗喽的出走", POSTER_WIDTH / 2, 70);
  context.fillStyle = "#78685e";
  context.font = "22px sans-serif";
  context.fillText("保护好你的猩", POSTER_WIDTH / 2, 108);

  fillRoundedRect(context, 58, 146, 604, 112, 24, "rgba(255, 253, 248, 0.96)");
  strokeRoundedRect(context, 58, 146, 604, 112, 24, "rgba(184, 74, 58, 0.40)", 2);
  strokeRoundedRect(context, 64, 152, 592, 100, 19, "rgba(184, 138, 74, 0.20)", 1);
  drawCornerOrnament(context, 76, 164, 1, 1, "rgba(184, 138, 74, 0.52)", 22);
  drawCornerOrnament(context, 644, 164, -1, 1, "rgba(47, 107, 79, 0.48)", 22);
  if (croissantImage) {
    context.drawImage(croissantImage, 82, 166, 72, 78);
  }
  context.fillStyle = "#a64f3f";
  context.font = "bold 40px sans-serif";
  context.fillText("今日职场猩象", POSTER_WIDTH / 2, 202);
  context.fillStyle = "#78685e";
  context.font = "22px sans-serif";
  context.fillText(oracle.dateLabel || "", POSTER_WIDTH / 2, 238);

  (oracle.metrics || []).slice(0, 5).forEach((metric, index) => drawMetric(context, metric, index));
  drawSlip(context, "今日护身符", oracle.talisman, 58, 858);
  drawSlip(context, "推荐行动", oracle.action, 368, 858);

  context.fillStyle = "#78685e";
  context.font = "20px sans-serif";
  context.fillText("这是今日陪伴内容，不是心理测量结果", POSTER_WIDTH / 2, 1055);
  context.fillStyle = "#a64f3f";
  context.font = "18px sans-serif";
  context.fillText("Malo Runaway", POSTER_WIDTH / 2, 1102);
  context.fillStyle = "rgba(184, 138, 74, 0.55)";
  context.fillRect(300, 1124, 120, 2);
}

module.exports = {
  POSTER_HEIGHT,
  POSTER_SCALE,
  POSTER_WIDTH,
  drawOraclePoster
};
