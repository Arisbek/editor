const imageInput   = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const container    = document.querySelector('.preview-container');

let scale = 1,
    posX  = 0,
    posY  = 0,
    startX, startY,
    isDragging = false;

// 1) Load & show the image
imageInput.addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = 'block';
    // reset transforms
    scale = 1; posX = 0; posY = 0;
    updateTransform();
  };
  reader.readAsDataURL(file);
});

// 2) Start dragging
imagePreview.addEventListener('mousedown', e => {
  isDragging = true;
  imagePreview.style.cursor = 'grabbing';
  startX = e.clientX - posX;
  startY = e.clientY - posY;
});

// 3) Drag motion
document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  updateTransform();
});

// 4) End dragging
document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  imagePreview.style.cursor = 'grab';
});

// 5) Zoom with wheel
container.addEventListener('wheel', e => {
  e.preventDefault();
  // adjust this factor to zoom faster/slower
  const delta = -e.deltaY * 0.001; 
  scale = Math.min(Math.max(0.1, scale + delta), 5);
  updateTransform();
});

// 6) Apply CSS transform
function updateTransform() {
  imagePreview.style.transform =
    `translate(${posX}px, ${posY}px) scale(${scale})`;
}
