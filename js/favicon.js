const favicon = document.getElementById("dynamic-favicon");

let scale = 1;
let growing = true;

function animateFavicon() {
  // naik turun scale (detak)
  if (growing) {
    scale += 0.08;
    if (scale >= 1) growing = false;
  } else {
    scale -= 0.08;
    if (scale <= 1) growing = true;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text 
        x="50%" 
        y="50%" 
        dy=".50em"
        text-anchor="middle"
        font-size="${80 * scale}">
        ❤️
      </text>
    </svg>
  `;

  favicon.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

// speed detak
setInterval(animateFavicon, 50);
