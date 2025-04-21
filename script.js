// — Elements —
const imageInput   = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const wrapper      = document.getElementById('dragWrapper');
const addGroupBtn  = document.getElementById('addGroup');
const bgBtn        = document.getElementById('bgMove');
const grpBtn       = document.getElementById('grpMove');

const groupModal   = document.getElementById('groupModal');
const optCount     = document.getElementById('optCount');
const optSize      = document.getElementById('optSize');
const qNumber      = document.getElementById('qNumber');
const cancelGroup  = document.getElementById('cancelGroup');
const createGroup  = document.getElementById('createGroup');

// — State —
let scale = 1, posX = 0, posY = 0;
let startX, startY, isImgDragging = false;
let mode = 'bg'; // 'bg' or 'grp'
const groups = [];

// — IMAGE UPLOAD + DRAG + ZOOM —
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = 'block';
    scale = 1; posX = 0; posY = 0;
    applyTransform();
  };
  reader.readAsDataURL(file);
});

wrapper.addEventListener('mousedown', e => {
  if (mode !== 'bg' || e.target !== wrapper) return;
  isImgDragging = true;
  wrapper.style.cursor = 'grabbing';
  startX = e.clientX - posX;
  startY = e.clientY - posY;
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!isImgDragging) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  applyTransform();
});

document.addEventListener('mouseup', () => {
  isImgDragging = false;
  wrapper.style.cursor = 'grab';
});

wrapper.parentElement.addEventListener('wheel', e => {
  if (mode !== 'bg') return;
  e.preventDefault();
  const delta = -e.deltaY * 0.001;
  scale = Math.min(Math.max(0.1, scale + delta), 5);
  applyTransform();
});

function applyTransform() {
  wrapper.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// — TOOL BUTTONS —
bgBtn.addEventListener('click', () => {
  mode = 'bg';
  bgBtn.classList.add('active');
  grpBtn.classList.remove('active');
  wrapper.style.cursor = 'grab';
});

grpBtn.addEventListener('click', () => {
  mode = 'grp';
  grpBtn.classList.add('active');
  bgBtn.classList.remove('active');
});

// — ADD / DELETE QUESTION GROUP —
addGroupBtn.addEventListener('click', () => {
  optCount.value = '4';
  optSize.value  = '50';
  qNumber.value  = groups.length + 1;
  groupModal.classList.remove('hidden');
});

cancelGroup.addEventListener('click', () => {
  groupModal.classList.add('hidden');
});

createGroup.addEventListener('click', () => {
  const count = parseInt(optCount.value, 10);
  const size  = parseInt(optSize.value, 10);
  const qnum  = qNumber.value.trim();
  if (![4,5].includes(count) || isNaN(size) || size < 10 || !qnum) {
    alert('Please fill out valid values.');
    return;
  }
  groupModal.classList.add('hidden');

  const grp = document.createElement('div');
  grp.className = 'question-group';
  grp.dataset.qnum = qnum;

  const badge = document.createElement('div');
  badge.className = 'question-number';
  badge.innerText = qnum;
  grp.appendChild(badge);

  const delBtn = document.createElement('div');
  delBtn.className = 'delete-btn';
  delBtn.innerHTML = '&times;';
  grp.appendChild(delBtn);
  delBtn.addEventListener('click', () => {
    grp.remove();
    const idx = groups.findIndex(g => g.element === grp);
    if (idx > -1) groups.splice(idx, 1);
  });

  for (let i = 0; i < count; i++) {
    const sq = document.createElement('div');
    sq.className = 'square';
    grp.appendChild(sq);
  }

  const totalMargins = (count - 1) * 5;
  const w = count * size + totalMargins + 10;
  const h = size + 10;
  grp.style.width  = `${w}px`;
  grp.style.height = `${h}px`;

  grp.style.top  = '10px';
  grp.style.left = '10px';

  wrapper.appendChild(grp);
  makeDraggable(grp);

  groups.push({ question: qnum, element: grp });
});

// — MAKE ELEMENT DRAGGABLE (GROUP) —
function makeDraggable(el) {
  let dragging = false,
      sx = 0, sy = 0,
      ox = 0, oy = 0;

  el.addEventListener('mousedown', e => {
    if (mode !== 'grp') return;
    dragging = true;
    sx = e.clientX - ox;
    sy = e.clientY - oy;
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    ox = e.clientX - sx;
    oy = e.clientY - sy;
    el.style.transform = `translate(${ox}px, ${oy}px)`;
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });
}