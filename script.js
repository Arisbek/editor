// — Elements —
const imageInput   = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const wrapper      = document.getElementById('dragWrapper');
const addGroupBtn  = document.getElementById('addGroup');
const saveFrameBtn = document.getElementById('saveFrame');
const loadFrameBtn = document.getElementById('loadFrameBtn');
const bgBtn        = document.getElementById('bgMove');
const grpBtn       = document.getElementById('grpMove');

const groupModal   = document.getElementById('groupModal');
const optCount     = document.getElementById('optCount');
const optSize      = document.getElementById('optSize');
const qNumber      = document.getElementById('qNumber');
const cancelGroup  = document.getElementById('cancelGroup');
const createGroup  = document.getElementById('createGroup');

const loadModal    = document.getElementById('loadModal');
const frameSelect  = document.getElementById('frameSelect');
const cancelLoad   = document.getElementById('cancelLoad');
const confirmLoad  = document.getElementById('confirmLoad');

// — State —
let scale = 1, posX = 0, posY = 0;
let startX, startY, isImgDragging = false;
let mode = 'bg'; // 'bg' or 'grp'
let lastSize = 50;
let groups = [];

// — IMAGE UPLOAD + DRAG + ZOOM —
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = 'block';
    scale = 1; posX = 0; posY = 0;
    groups = [];
    wrapper.innerHTML = '';
    wrapper.appendChild(imagePreview);
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
  mode = 'bg'; bgBtn.classList.add('active'); grpBtn.classList.remove('active'); wrapper.style.cursor = 'grab';
});

grpBtn.addEventListener('click', () => {
  mode = 'grp'; grpBtn.classList.add('active'); bgBtn.classList.remove('active');
});

// — ADD / DELETE QUESTION GROUP —
addGroupBtn.addEventListener('click', () => {
  optCount.value = '4';
  optSize.value  = lastSize;
  qNumber.value  = groups.length + 1;
  groupModal.classList.remove('hidden');
});

cancelGroup.addEventListener('click', () => groupModal.classList.add('hidden'));

createGroup.addEventListener('click', () => {
  const count = +optCount.value;
  const size  = +optSize.value;
  const qnum  = qNumber.value.trim();
  if (![4,5].includes(count) || size < 10 || !qnum) return alert('Invalid values');
  groupModal.classList.add('hidden'); lastSize = size;

  // initial position
  const baseX = 10, baseY = 10;
  const groupData = { question: qnum, count, baseX, baseY, tx: 0, ty: 0 };

  const grp = document.createElement('div');
  grp.className = 'question-group';
  grp.dataset.qnum = qnum;
  grp._data = groupData;

  const badge = document.createElement('div'); badge.className = 'question-number'; badge.innerText = qnum; grp.appendChild(badge);
  const delBtn = document.createElement('div'); delBtn.className = 'delete-btn'; delBtn.innerHTML = '&times;'; grp.appendChild(delBtn);
  delBtn.addEventListener('click', () => { grp.remove(); groups = groups.filter(g=>g!==groupData); });

  for (let i=0; i<count; i++) { const sq = document.createElement('div'); sq.className='square'; grp.appendChild(sq); }
  const totalMargin = (count - 1) * 5;
  const w = count * size + totalMargin + 10;
  const h = size + 10;
  grp.style.width = `${w}px`;
  grp.style.height = `${h}px`;
  grp.style.left = baseX + 'px';
  grp.style.top  = baseY + 'px';

  wrapper.appendChild(grp);
  groups.push(groupData);
  makeDraggable(grp, groupData);
});

// — SAVE FRAME DATA (to localStorage) —
saveFrameBtn.addEventListener('click', function() {
    // 1) Make sure an image is loaded
    if (!imagePreview.src || imagePreview.src === '') {
      alert('Please load an image first.');
      return;
    }
  
    // 2) Ask for a frame name
    let name = prompt('Frame name:');
    if (name === null) return;           // user cancelled
    name = name.trim();
    if (name === '') {
      alert('Frame name cannot be empty.');
      return;
    }
  
    // 3) Compute wrapper bounds once
    const wr = wrapper.getBoundingClientRect();
  
    // 4) Collect all question‐groups directly from the DOM
    const groupsData = [];
    wrapper.querySelectorAll('.question-group').forEach(el => {
      const rect = el.getBoundingClientRect();
      groupsData.push({
        question: el.dataset.qnum,
        count:    el.querySelectorAll('.square').length,
        x:        (rect.left - wr.left)  / scale,
        y:        (rect.top  - wr.top)   / scale,
        width:    rect.width  / scale,
        height:   rect.height / scale
      });
    });
  
    // 5) Build the frame object
    const frame = {
      imageSrc: imagePreview.src,
      transform: { scale, x: posX, y: posY },
      groups: groupsData
    };
  
    // 6) Save & alert
    try {
      localStorage.setItem('omrFrame_' + name, JSON.stringify(frame));
      alert('Saved frame: ' + name);
    } catch (e) {
      console.error(e);
      alert('Failed to save frame: ' + e.message);
    }
  });

// — LOAD FRAME —
loadFrameBtn.addEventListener('click',()=>{
  frameSelect.innerHTML = '';
  Object.keys(localStorage).filter(k=>k.startsWith('omrFrame_')).forEach(key=>{
    const opt = document.createElement('option'); opt.value = key;
    opt.text = key.replace('omrFrame_',''); frameSelect.appendChild(opt);
  });
  loadModal.classList.remove('hidden');
});
cancelLoad.addEventListener('click',()=>loadModal.classList.add('hidden'));
confirmLoad.addEventListener('click',()=>{
  const key = frameSelect.value; if(!key) return;
  const frame = JSON.parse(localStorage.getItem(key));
  loadModal.classList.add('hidden');

  // set background
  imagePreview.src = frame.imageSrc; imagePreview.style.display='block';
  scale = frame.transform.scale;
  posX = frame.transform.x;
  posY = frame.transform.y;
  applyTransform();

  // clear and recreate groups
  wrapper.querySelectorAll('.question-group').forEach(el=>el.remove());
  groups = [];

  frame.groups.forEach(gd=>{
    const baseX = gd.x;
    const baseY = gd.y;
    const groupData = { question: gd.question, count: gd.count, baseX, baseY, tx: 0, ty: 0 };
    const grp = document.createElement('div'); grp.className='question-group'; grp.dataset.qnum=gd.question;
    grp._data = groupData;
    const badge = document.createElement('div'); badge.className='question-number'; badge.innerText=gd.question; grp.appendChild(badge);
    const delBtn = document.createElement('div'); delBtn.className='delete-btn'; delBtn.innerHTML='&times;'; grp.appendChild(delBtn);
    delBtn.addEventListener('click',()=>{grp.remove(); groups=groups.filter(g=>g!==groupData);});
    for(let i=0;i<gd.count;i++){ const sq=document.createElement('div'); sq.className='square'; grp.appendChild(sq);}    
    const w = gd.width * scale;
    const h = gd.height * scale;
    grp.style.width=`${w}px`;
    grp.style.height=`${h}px`;
    // position without translation transform
    grp.style.left = (baseX * scale) + 'px';
    grp.style.top  = (baseY * scale) + 'px';

    wrapper.appendChild(grp);
    groups.push(groupData);
    makeDraggable(grp, groupData);
  });
});

function makeDraggable(el) {
  let dragging = false;
  let startMouseX, startMouseY;
  let startLeft, startTop;
  const wrapperRect = () => wrapper.getBoundingClientRect();

  el.addEventListener('mousedown', e => {
    if (mode !== 'grp') return;
    e.stopPropagation();
    dragging = true;

    // record initial mouse pos in screen coords
    startMouseX = e.clientX;
    startMouseY = e.clientY;

    // record element's current un‑scaled left/top
    startLeft = parseFloat(el.style.left);
    startTop  = parseFloat(el.style.top);

    // change cursor so user knows it's draggable
    el.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    // compute delta in image‑space:
    // translate movement in screen px to movement in wrapper’s scaled coordinate system
    const dx = (e.clientX - startMouseX) / scale;
    const dy = (e.clientY - startMouseY) / scale;
    el.style.left = `${startLeft + dx}px`;
    el.style.top  = `${startTop  + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = 'move';
  });
}