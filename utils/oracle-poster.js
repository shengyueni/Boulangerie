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
  strokeRoundedRect(context, x, y, width, height, 18, "rgba(184, 138, 74, 0.34)", 2);
  fillRoundedRect(context, x, y, 8, height, 4, index % 2 ? "#6f9c82" : "#d88b56");

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
  fillRoundedRect(context, x, y, width, height, 20, "#fffdfa");
  strokeRoundedRect(context, x, y, width, height, 20, "rgba(47, 123, 103, 0.28)", 2);
  context.textAlign = "left";
  context.fillStyle = "#6f9c82";
  context.font = "bold 22px sans-serif";
  context.fillText(label, x + 22, y + 35);
  context.fillStyle = "#3e352f";
  context.font = "bold 25px sans-serif";
  wrapText(context, text, x + 22, y + 73, width - 44, 34, 3);
}

function drawOraclePoster(context, oracle) {
  context.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.fillStyle = "#fff9ef";
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  context.fillStyle = "rgba(216, 139, 86, 0.12)";
  context.beginPath();
  context.arc(650, 78, 150, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(79, 152, 127, 0.10)";
  context.beginPath();
  context.arc(60, 1110, 180, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#3e352f";
  context.font = "bold 34px sans-serif";
  context.fillText("吗喽的出走", POSTER_WIDTH / 2, 70);
  context.fillStyle = "#78685e";
  context.font = "22px sans-serif";
  context.fillText("保护好你的猩", POSTER_WIDTH / 2, 108);

  fillRoundedRect(context, 58, 146, 604, 112, 24, "#f7efe3");
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
  context.font = "bold 24px sans-serif";
  context.fillText("Malo Runaway", POSTER_WIDTH / 2, 1102);
  context.fillStyle = "rgba(184, 138, 74, 0.55)";
  context.fillRect(270, 1132, 180, 3);
}

module.exports = {
  POSTER_HEIGHT,
  POSTER_SCALE,
  POSTER_WIDTH,
  drawOraclePoster
};
