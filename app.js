'use strict';

// ══════════════════════════════════════════
// FIREBASE CONFIG
// ══════════════════════════════════════════
// 1. Go to console.firebase.google.com → Add project
// 2. Add a Web app → copy the config object values below
// 3. Enable Firestore (Build → Firestore Database → Create → Start in test mode)
// 4. Enable Auth (Build → Authentication → Get started → Anonymous → Enable)
// 5. Enable Storage (Build → Storage → Get started → Start in test mode)
// Leave these as-is to run fully offline with localStorage only.
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDJdJSwH11Ijh7QQmTgoyLzBZBBzC4Pew4',
  authDomain:        'gallerywall-d7b13.firebaseapp.com',
  projectId:         'gallerywall-d7b13',
  storageBucket:     'gallerywall-d7b13.firebasestorage.app',
  messagingSenderId: '1037475543276',
  appId:             '1:1037475543276:web:906c3aceb2ae13c7160dc9',
};
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

// ══════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════
const FRAME_GROUPS = [
  {name:'YLLEVAD',sizes:[{n:'holds 4×6 print',w:8.25,h:11.75}]},
  {name:'RIBBA',sizes:[
    {n:'holds 5×7 print',w:6.75,h:8.75},{n:'holds 8×10 print',w:9.75,h:11.75},
    {n:'holds 9×12 print',w:10.75,h:13.75},{n:'holds 12×16 print',w:13.75,h:17.75},
    {n:'holds 16×20 print',w:17.75,h:21.75},{n:'holds 19×27 print',w:20.87,h:28.74},
    {n:'holds 24×35 print',w:25.75,h:36.75},
  ]},
  {name:'HOVSTA',sizes:[{n:'holds 10×12 print',w:11.75,h:13.75},{n:'holds 12×16 print',w:13.75,h:17.75}]},
  {name:'KNOPPÄNG',sizes:[{n:'holds 5×7 print',w:6.75,h:8.75},{n:'holds 11×14 print',w:12.75,h:15.75}]},
  {name:'RÖDALM',sizes:[{n:'holds 10×12 print',w:11.75,h:13.75},{n:'holds 12×16 print',w:13.75,h:17.75}]},
  {name:'SANNAHED',sizes:[{n:'holds 4×6 print',w:6.75,h:8.75}]},
  {name:'SILVERHÖJDEN',sizes:[{n:'holds 8×10 print',w:9.75,h:11.75}]},
];
const IKEA_LEDGES = [
  {n:'MOSSLANDA 21.5"',w:21.5,h:3.5,type:'ledge'},{n:'MOSSLANDA 43"',w:43.3,h:3.5,type:'ledge'},
  {n:'RIBBA Ledge 21.5"',w:21.5,h:3.5,type:'ledge'},{n:'RIBBA Ledge 43"',w:43.3,h:3.5,type:'ledge'},
  {n:'EKET Shelf 13.75"',w:13.75,h:5.5,type:'shelf'},
  {n:'LACK Wall Shelf 43"',w:43.3,h:10.2,type:'shelf'},
  {n:'HEMNES Shelf 45"',w:45.5,h:8.25,type:'shelf'},
];
const FIXTURE_PRESETS = [
  {n:'Light Switch',w:3.5,h:4.5,icon:'⚡'},{n:'Duplex Outlet',w:3.5,h:4.5,icon:'⊡'},
  {n:'Thermostat',w:4.5,h:7,icon:'◈'},{n:'HVAC Vent',w:12,h:4,icon:'≡'},
  {n:'Smoke Detector',w:5.5,h:5.5,icon:'○'},{n:'Window',w:36,h:48,icon:'▭'},
];
const COLOR_PALETTE = [
  {name:'Black',hex:'#1a1a1a'},{name:'White',hex:'#f0f0f0'},
  {name:'Grey',hex:'#888888'},{name:'Silver',hex:'#c0c0c0'},
  {name:'Gold',hex:'#c4a24a'},{name:'Brown',hex:'#7a5230'},
  {name:'Navy',hex:'#1b3a63'},{name:'Blue',hex:'#4a7ab5'},
  {name:'Red',hex:'#aa3333'},{name:'Green',hex:'#3a7a4a'},
  {name:'Beige',hex:'#c8b89a'},{name:'Natural',hex:'#b89a70'},
  {name:'Walnut',hex:'#5a3820'},{name:'Copper',hex:'#b87333'},
];
const ART_TYPES = ['Photo','Map','Poster','Canvas','Stretched Canvas','Print','Drawing','Portrait','Other'];
const FRAME_KEYWORDS = ['Framed','Frame'];
const UNFRAMED_KEYWORDS = ['Canvas','Poster','Print','Unframed'];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let S = {
  wall:{w:120,h:96,c:'#f7f3ef'},
  pieces:[],
  groups:{},
  sel:new Set(),
  dims:false,
  gaps:false,
  grid:false,
  minGap:1,
  layouts:[],
  library:[],
  nid:1,
  ngid:1,
  scale:7,
  drag:null,
  cropState:null,
  cropPieceId:null,
  undoStack:[],
  redoStack:[],
  selMode:false,
  dataKey:null,
  cloudReady:false,
};

function getAllPieces(){return S.pieces;}
function getPiece(id){return S.pieces.find(p=>p.id===id);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

// ══════════════════════════════════════════
// UNDO / REDO
// ══════════════════════════════════════════
function snapshot(){
  return JSON.stringify({
    pieces:S.pieces,
    groups:Object.fromEntries(Object.entries(S.groups).map(([k,v])=>[k,[...v]])),
    nid:S.nid,ngid:S.ngid
  });
}
function pushUndo(){
  S.undoStack.push(snapshot());
  if(S.undoStack.length>50)S.undoStack.shift();
  S.redoStack=[];
  updateUndoButtons();
}
function applySnapshot(snap){
  const d=JSON.parse(snap);
  document.getElementById('wall').innerHTML='';
  S.pieces=d.pieces;
  S.groups={};
  Object.entries(d.groups||{}).forEach(([k,v])=>{S.groups[k]=new Set(v);});
  S.nid=d.nid;S.ngid=d.ngid;
  S.sel.clear();
  S.pieces.forEach(p=>{
    if(p.type==='art')mkArtEl(p);
    else if(p.type==='shelf')mkShelfEl(p);
    else if(p.type==='zone')mkZoneEl(p);
    else if(p.type==='fixture')mkFixtureEl(p);
  });
  checkConflicts();renderConflicts();
  updatePropsPanel();updateStatus();
}
function undo(){
  if(!S.undoStack.length){showToast('Nothing to undo.');return;}
  S.redoStack.push(snapshot());
  applySnapshot(S.undoStack.pop());
  updateUndoButtons();
  showToast('Undo');
}
function redo(){
  if(!S.redoStack.length){showToast('Nothing to redo.');return;}
  S.undoStack.push(snapshot());
  applySnapshot(S.redoStack.pop());
  updateUndoButtons();
  showToast('Redo');
}
function updateUndoButtons(){
  document.getElementById('btn-undo')?.classList.toggle('on',S.undoStack.length>0);
  document.getElementById('btn-redo')?.classList.toggle('on',S.redoStack.length>0);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
function init(){
  try{const d=localStorage.getItem('gwp_layouts');if(d)S.layouts=JSON.parse(d);}catch(e){}
  try{const d=localStorage.getItem('gwp_library');if(d)S.library=JSON.parse(d);}catch(e){}

  // Build fixture list
  const fl=document.getElementById('fixture-list');
  FIXTURE_PRESETS.forEach(f=>{
    const row=document.createElement('div');row.className='preset-row';
    row.innerHTML=`<span class="pr-name">${f.icon} ${f.n}</span><span class="pr-dims">${f.w}"×${f.h}"</span>`;
    row.addEventListener('click',()=>quickAddFixture(f));
    fl.appendChild(row);
  });

  // Gap input
  document.getElementById('gap-in').addEventListener('change',e=>{
    S.minGap=parseFloat(e.target.value)||0;
    checkConflicts();renderConflicts();
  });

  // File inputs
  document.getElementById('file-in').addEventListener('change',onFileSelected);
  document.getElementById('lib-file-in').addEventListener('change',onLibFileSelected);
  document.getElementById('lib-cam-in').addEventListener('change',onLibFileSelected);

  // Library preset dropdown
  const lp=document.getElementById('lib-preset');
  FRAME_GROUPS.forEach(g=>{
    g.sizes.forEach(s=>{
      const o=document.createElement('option');
      o.value=JSON.stringify({w:s.w,h:s.h});
      o.textContent=`${g.name} — ${s.n} (${s.w}"×${s.h}")`;
      lp.appendChild(o);
    });
  });

  renderLibrary();

  document.addEventListener('pointermove',onDocMove);
  document.addEventListener('pointerup',onDocUp);
  document.addEventListener('pointercancel',onDocUp);
  document.addEventListener('keydown',onKey);
  window.addEventListener('resize',()=>{reScale();renderAll();});
  document.getElementById('save-name').addEventListener('input',updateSavePreview);

  // Close modals on overlay click
  document.querySelectorAll('.overlay').forEach(el=>{
    el.addEventListener('pointerdown',e=>{if(e.target===el)closeModal(el.id);});
  });

  const startPage=S.library.length?'planner':'library';
  showPage(startPage);
  renderLibrary();
  updateStatus();
  renderLayoutsSidebar();
  updateUndoButtons();

  // Start Firebase in background — does not block init
  initFirebase();
}

// ══════════════════════════════════════════
// FIREBASE
// ══════════════════════════════════════════
async function initFirebase(){
  if(!FIREBASE_ENABLED){
    updateSyncStatus('local');
    return;
  }
  try{
    if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
    // Enable offline persistence (best-effort — fails silently in private browsing)
    firebase.firestore().enablePersistence({synchronizeTabs:true}).catch(()=>{});

    await firebase.auth().signInAnonymously();

    // Use a stable dataKey stored in localStorage — separate from Firebase UID
    // so it can be shared to link another device
    S.dataKey=localStorage.getItem('gwp_datakey');
    if(!S.dataKey){
      S.dataKey=typeof crypto.randomUUID==='function'
        ?crypto.randomUUID()
        :(Date.now().toString(36)+Math.random().toString(36).slice(2));
      localStorage.setItem('gwp_datakey',S.dataKey);
    }
    S.cloudReady=true;
    updateSyncStatus('connected');
    await loadFromCloud();
  }catch(e){
    console.warn('Firebase init failed:',e);
    updateSyncStatus('offline');
  }
}

async function loadFromCloud(){
  if(!S.cloudReady||!S.dataKey)return;
  try{
    updateSyncStatus('syncing');
    const doc=await firebase.firestore().collection('users').doc(S.dataKey).get();
    if(doc.exists){
      const data=doc.data();
      if(data.library&&data.library.length){
        S.library=data.library;
        try{localStorage.setItem('gwp_library',JSON.stringify(S.library));}catch(e){}
        renderLibrary();
        renderLibraryPage();
      }
      if(data.layouts&&data.layouts.length){
        S.layouts=data.layouts;
        try{localStorage.setItem('gwp_layouts',JSON.stringify(S.layouts));}catch(e){}
        renderLayoutsSidebar();
      }
      showToast('Synced from cloud.');
    }else if(S.library.length||S.layouts.length){
      // First time with Firebase — push existing local data up
      await saveToCloud();
      showToast('Local data backed up to cloud.');
    }
    updateSyncStatus('synced');
  }catch(e){
    console.warn('Cloud load failed:',e);
    updateSyncStatus('offline');
  }
}

async function saveToCloud(){
  if(!S.cloudReady||!S.dataKey)return;
  try{
    updateSyncStatus('syncing');
    await firebase.firestore().collection('users').doc(S.dataKey).set({
      library:S.library,
      layouts:S.layouts,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
    });
    updateSyncStatus('synced');
  }catch(e){
    console.warn('Cloud save failed:',e);
    updateSyncStatus('offline');
  }
}

// Convert base64 data URL → upload to Firebase Storage → return download URL.
// Falls back to returning the original base64 if upload fails or Firebase is off.
async function uploadImageToStorage(base64DataUrl){
  if(!S.cloudReady||!base64DataUrl||!base64DataUrl.startsWith('data:'))return base64DataUrl;
  try{
    const resp=await fetch(base64DataUrl);
    const blob=await resp.blob();
    const path=`users/${S.dataKey}/images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const ref=firebase.storage().ref(path);
    await ref.put(blob,{contentType:'image/jpeg'});
    return await ref.getDownloadURL();
  }catch(e){
    console.warn('Image upload failed, keeping base64:',e);
    return base64DataUrl;
  }
}

function updateSyncStatus(state){
  const el=document.getElementById('st-sync');
  if(!el)return;
  const labels={local:'local',connected:'☁ ready',syncing:'↻ …',synced:'✓ synced',offline:'✕ offline'};
  el.textContent=labels[state]||state;
}

function openCloudModal(){
  const uidEl=document.getElementById('cloud-uid');
  const msgEl=document.getElementById('cloud-status-msg');
  if(uidEl)uidEl.textContent=S.dataKey||'Not ready (Firebase not configured)';
  if(msgEl){
    if(!FIREBASE_ENABLED)msgEl.textContent='Firebase not configured — running on localStorage only. Set up Firebase to enable cloud sync.';
    else if(S.cloudReady)msgEl.textContent='Connected and syncing. Changes save automatically.';
    else msgEl.textContent='Firebase configured but could not connect. Check your config.';
  }
  const linkInput=document.getElementById('link-code');
  if(linkInput)linkInput.value='';
  document.getElementById('m-cloud').classList.remove('hide');
}

function copyDeviceId(){
  const uid=S.dataKey||'Not available';
  if(navigator.clipboard){
    navigator.clipboard.writeText(uid).then(()=>showToast('Device ID copied.'));
  }else{
    showToast(uid);
  }
}

async function linkDevice(){
  const code=(document.getElementById('link-code')?.value||'').trim();
  if(!code||code.length<8){showToast('Enter a valid device ID.');return;}
  if(code===S.dataKey){showToast('That is already your device ID.');return;}
  if(!confirm('This will replace your current data with data from the linked device. Continue?'))return;
  if(!S.cloudReady){showToast('Firebase not connected.');return;}
  const previousKey=S.dataKey;
  S.dataKey=code;
  localStorage.setItem('gwp_datakey',code);
  try{
    const doc=await firebase.firestore().collection('users').doc(code).get();
    if(doc.exists&&(doc.data().library?.length||doc.data().layouts?.length)){
      await loadFromCloud();
      showToast('Device linked! Data loaded.');
      closeModal('m-cloud');
    }else{
      S.dataKey=previousKey;
      localStorage.setItem('gwp_datakey',previousKey);
      showToast('No data found for that ID. Check the code and try again.');
    }
  }catch(e){
    S.dataKey=previousKey;
    localStorage.setItem('gwp_datakey',previousKey);
    showToast('Could not reach cloud. Check your connection.');
  }
}

// ══════════════════════════════════════════
// JSON IMPORT / EXPORT
// ══════════════════════════════════════════
function exportJSON(){
  const data={
    library:S.library,
    layouts:S.layouts,
    dataKey:S.dataKey,
    exportedAt:new Date().toISOString(),
    version:7,
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`gallery-wall-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exported.');
}

function importJSON(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='.json,application/json';
  input.onchange=async e=>{
    const file=e.target.files[0];
    if(!file)return;
    try{
      const text=await file.text();
      const data=JSON.parse(text);
      if(data.library){S.library=data.library;persistLibrary();renderLibrary();renderLibraryPage();}
      if(data.layouts){S.layouts=data.layouts;persistLayouts();renderLayoutsSidebar();}
      showToast('Backup imported successfully.');
      closeModal('m-cloud');
    }catch(e){
      showToast('Invalid backup file.');
    }
  };
  input.click();
}

// ══════════════════════════════════════════
// WALL & SCALE
// ══════════════════════════════════════════
function reScale(){
  const ca=document.getElementById('ca');
  const pad=56;
  const aw=ca.clientWidth-pad*2;
  const ah=ca.clientHeight-pad*2;
  if(aw<=0||ah<=0)return;
  S.scale=Math.min(aw/S.wall.w,ah/S.wall.h);
  const wall=document.getElementById('wall');
  wall.style.width=(S.wall.w*S.scale)+'px';
  wall.style.height=(S.wall.h*S.scale)+'px';
  wall.style.background=S.wall.c;
  if(S.grid){
    const gs=Math.round(6*S.scale);
    wall.style.backgroundImage=`linear-gradient(rgba(120,120,180,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,120,180,.12) 1px,transparent 1px)`;
    wall.style.backgroundSize=`${gs}px ${gs}px`;
  }
  updateStatus();
}

function applyWall(){
  const w=parseFloat(document.getElementById('wall-w').value);
  const h=parseFloat(document.getElementById('wall-h').value);
  const c=document.getElementById('wall-c').value;
  if(!w||!h||w<24||h<24)return;
  S.wall={w,h,c};
  document.getElementById('wall').style.background=c;
  reScale();renderAll();
}

// ══════════════════════════════════════════
// ADD PIECES
// ══════════════════════════════════════════
function quickAdd(f,withPhoto){
  pushUndo();
  const pos=findEmptySpot(f.w,f.h);
  const piece={
    id:S.nid++,type:'art',
    x:pos.x,y:pos.y,w:f.w,h:f.h,shape:'rect',color:'#2a2a2a',
    img:null,imgOX:0,imgOY:0,imgZ:1,
    label:(f.name||f.n||'Frame'),
    gid:null,zi:S.pieces.length+1,conflict:false,gw:false,owarn:false,ywarn:false,
    snapToShelf:true,snappedToShelfId:null,frameVisible:false,frameColor:null,frameThickness:1,
  };
  S.pieces.push(piece);mkArtEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
  if(withPhoto)openCamForPiece(piece.id);
}

function addZone(){
  pushUndo();
  const w=48,h=30;
  const piece={
    id:S.nid++,type:'zone',
    x:clamp((S.wall.w-w)/2,0,S.wall.w-w),
    y:clamp((S.wall.h-h)/2,0,S.wall.h-h),
    w,h,label:'Exclusion Zone',
    locked:false,gid:null,zi:2,conflict:false,gw:false,owarn:false,ywarn:false
  };
  S.pieces.push(piece);mkZoneEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
}

function toggleZoneLock(){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='zone')return;
  p.locked=!p.locked;
  renderPiece(p);updatePropsPanel();
  showToast(p.locked?'Zone locked.':'Zone unlocked.');
}

function quickAddFixture(f){
  pushUndo();
  const piece={
    id:S.nid++,type:'fixture',
    x:clamp((S.wall.w-f.w)/2,0,S.wall.w-f.w),
    y:clamp((S.wall.h-f.h)/2,0,S.wall.h-f.h),
    w:f.w,h:f.h,label:f.n,icon:f.icon,
    gid:null,zi:3,conflict:false,gw:false,owarn:false,ywarn:false
  };
  S.pieces.push(piece);mkFixtureEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
}

function quickAddShelf(l){
  pushUndo();
  const piece={
    id:S.nid++,type:'shelf',
    x:clamp((S.wall.w-l.w)/2,0,S.wall.w-l.w),
    y:S.wall.h*0.5,
    w:l.w,h:l.h,color:'#7a6548',
    label:l.n,shelfType:l.type||'shelf',
    gid:null,zi:S.pieces.length+1,
    conflict:false,gw:false,owarn:false,ywarn:false
  };
  S.pieces.push(piece);mkShelfEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
}

function addCustomArtwork(withPhoto){
  const w=parseFloat(document.getElementById('art-w').value);
  const h=parseFloat(document.getElementById('art-h').value);
  if(!w||!h||w<=0||h<=0){showToast('Enter valid dimensions.');return;}
  pushUndo();
  const shape=document.getElementById('art-shape').value;
  const n=S.pieces.filter(p=>p.type==='art').length+1;
  const pos=findEmptySpot(w,h);
  const piece={
    id:S.nid++,type:'art',
    x:pos.x,y:pos.y,w,h,shape,color:'#2a2a2a',
    img:null,imgOX:0,imgOY:0,imgZ:1,
    label:'Frame '+n,gid:null,zi:S.pieces.length+1,
    conflict:false,gw:false,owarn:false,ywarn:false,
    snapToShelf:true,snappedToShelfId:null,frameVisible:false,frameColor:null,frameThickness:1,
  };
  S.pieces.push(piece);mkArtEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
  if(withPhoto)openCamForPiece(piece.id);
}

function setCustomShelfType(t){
  document.getElementById('shelf-type-val').value=t;
  document.getElementById('shelf-type-btn-shelf').classList.toggle('on',t==='shelf');
  document.getElementById('shelf-type-btn-ledge').classList.toggle('on',t==='ledge');
}
function addShelf(){
  const w=parseFloat(document.getElementById('shelf-l').value);
  const h=parseFloat(document.getElementById('shelf-h').value);
  if(!w||!h||isNaN(w)||isNaN(h)||w<=0||h<=0){showToast('Enter shelf dimensions.');return;}
  const shelfType=document.getElementById('shelf-type-val')?.value||'shelf';
  pushUndo();
  const n=S.pieces.filter(p=>p.type==='shelf').length+1;
  const lbl=(shelfType==='ledge'?'Ledge ':'Shelf ')+n;
  const piece={
    id:S.nid++,type:'shelf',
    x:clamp((S.wall.w-w)/2,0,S.wall.w-w),
    y:S.wall.h*0.5,
    w,h,color:'#7a6548',
    label:lbl,shelfType,
    gid:null,zi:S.pieces.length+1,
    conflict:false,gw:false,owarn:false,ywarn:false
  };
  S.pieces.push(piece);mkShelfEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);
}

function openCamForPiece(pid){
  S.cropPieceId=pid;
  const cam=document.getElementById('cam-in');
  cam.value='';
  cam.onchange=e=>{
    const f=e.target.files[0];
    if(f){const r=new FileReader();r.onload=ev=>openCrop(ev.target.result,S.cropPieceId);r.readAsDataURL(f);}
  };
  cam.click();
}

// ══════════════════════════════════════════
// CREATE DOM ELEMENTS
// ══════════════════════════════════════════
function mkArtEl(p){
  const el=document.createElement('div');
  el.id='p'+p.id;el.className='pc'+(p.shape==='oval'?' oval':'');el.dataset.id=p.id;
  Object.assign(el.style,{
    left:(p.x*S.scale)+'px',top:(p.y*S.scale)+'px',
    width:(p.w*S.scale)+'px',height:(p.h*S.scale)+'px',
    backgroundColor:p.color,zIndex:p.zi
  });
  const img=document.createElement('div');img.className='pc-img';img.id='pi'+p.id;el.appendChild(img);
  const lbl=document.createElement('div');lbl.className='pc-lbl';
  lbl.innerHTML=`<span class="pc-name" id="pn${p.id}">${esc(p.label)}</span><span class="pc-dims" id="pd${p.id}" style="${S.dims?'':'display:none'}">${p.w}" × ${p.h}"</span>`;
  el.appendChild(lbl);
  const frame=document.createElement('div');frame.className='pc-frame';frame.id='pf'+p.id;el.appendChild(frame);
  el.addEventListener('pointerdown',e=>pieceDown(e,p.id));
  el.addEventListener('dblclick',e=>{e.stopPropagation();showPiecePanel();});
  document.getElementById('wall').appendChild(el);
}

function mkShelfEl(p){
  const isLedge=p.shelfType==='ledge';
  const el=document.createElement('div');
  el.id='p'+p.id;
  el.className='pc '+(isLedge?'ledge-pc':'shelf-pc');
  el.dataset.id=p.id;
  Object.assign(el.style,{
    left:(p.x*S.scale)+'px',top:(p.y*S.scale)+'px',
    width:(p.w*S.scale)+'px',height:(p.h*S.scale)+'px',
    backgroundColor:p.color||'#7a6548',
    zIndex:p.zi
  });
  if(isLedge){
    const lip=document.createElement('div');lip.className='ledge-lip';el.appendChild(lip);
  }
  const lbl=document.createElement('div');lbl.className='shelf-lbl';lbl.id='pn'+p.id;
  lbl.textContent=p.label+(S.dims?` (${p.w}" × ${p.h}")`:'');
  el.appendChild(lbl);
  el.addEventListener('pointerdown',e=>pieceDown(e,p.id));
  el.addEventListener('dblclick',e=>{e.stopPropagation();showPiecePanel();});
  document.getElementById('wall').appendChild(el);
}

function mkZoneEl(p){
  const el=document.createElement('div');
  el.id='p'+p.id;el.className='pc zone-pc';el.dataset.id=p.id;
  Object.assign(el.style,{
    left:(p.x*S.scale)+'px',top:(p.y*S.scale)+'px',
    width:(p.w*S.scale)+'px',height:(p.h*S.scale)+'px',zIndex:p.zi
  });
  const lbl=document.createElement('div');
  lbl.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:10px;color:rgba(255,160,80,.85);font-weight:600;pointer-events:none;text-align:center;font-family:Figtree,sans-serif;white-space:nowrap';
  lbl.id='pn'+p.id;lbl.textContent=p.label+(S.dims?` (${p.w}"×${p.h}")`:'');
  el.appendChild(lbl);
  ['nw','ne','se','sw'].forEach(dir=>{
    const h=document.createElement('div');
    h.className='rh rh-'+dir;h.dataset.dir=dir;
    h.addEventListener('pointerdown',e=>resizeDown(e,p.id,dir));
    el.appendChild(h);
  });
  el.addEventListener('pointerdown',e=>{if(!e.target.classList.contains('rh'))pieceDown(e,p.id);});
  document.getElementById('wall').appendChild(el);
}

function mkFixtureEl(p){
  const el=document.createElement('div');
  el.id='p'+p.id;el.className='pc fixture-pc';el.dataset.id=p.id;
  Object.assign(el.style,{
    left:(p.x*S.scale)+'px',top:(p.y*S.scale)+'px',
    width:(p.w*S.scale)+'px',height:(p.h*S.scale)+'px',zIndex:p.zi
  });
  const icon=document.createElement('div');icon.className='fix-icon';icon.textContent=p.icon||'⚡';
  const lbl=document.createElement('div');lbl.className='fix-lbl';lbl.id='pn'+p.id;lbl.textContent=p.label;
  el.appendChild(icon);el.appendChild(lbl);
  el.addEventListener('pointerdown',e=>pieceDown(e,p.id));
  document.getElementById('wall').appendChild(el);
}

// ══════════════════════════════════════════
// SELECTION
// ══════════════════════════════════════════
function select(id,additive){
  if(!additive)S.sel.clear();
  const p=getPiece(id);
  if(p){
    if(additive&&S.sel.has(id)){S.sel.delete(id);}
    else{
      S.sel.add(id);
      if(p.gid&&S.groups[p.gid])S.groups[p.gid].forEach(i=>S.sel.add(i));
    }
  }
  refreshSel();updatePropsPanel();updateStatus();
}
function deselectAll(){S.sel.clear();refreshSel();updatePropsPanel();updateStatus();showWallPanel();}
function refreshSel(){
  document.querySelectorAll('.pc').forEach(el=>{
    const id=+el.dataset.id;
    el.classList.toggle('sel',S.sel.has(id));
    el.style.zIndex=S.sel.has(id)?500:(getPiece(id)?.zi||1);
  });
}

// ══════════════════════════════════════════
// DRAG
// ══════════════════════════════════════════
function resizeDown(e,id,dir){
  e.preventDefault();e.stopPropagation();
  const p=getPiece(id);if(!p||p.locked)return;
  pushUndo();select(id,false);
  S.drag={ids:[id],sx:e.clientX,sy:e.clientY,sp:{[id]:{x:p.x,y:p.y,w:p.w,h:p.h}},moved:false,resize:dir};
  e.currentTarget.setPointerCapture(e.pointerId);
}

function pieceDown(e,id){
  e.preventDefault();e.stopPropagation();
  const p=getPiece(id);
  if(p?.locked){select(id,false);return;}
  const additive=e.shiftKey||S.selMode;
  if(!additive&&!S.sel.has(id)){
    S.sel.clear();S.sel.add(id);
    if(p?.gid&&S.groups[p.gid])S.groups[p.gid].forEach(i=>S.sel.add(i));
    showPiecePanel();
  }else if(additive){S.sel.has(id)?S.sel.delete(id):S.sel.add(id);}
  refreshSel();updatePropsPanel();updateStatus();
  if(S.selMode)return;
  const sp={};
  S.sel.forEach(sid=>{const q=getPiece(sid);if(q)sp[sid]={x:q.x,y:q.y};});
  // Collect art pieces snapped to any shelf in the selection so they ride along
  const shelfIdsInSel=[...S.sel].filter(sid=>getPiece(sid)?.type==='shelf');
  const snapFollowers=[];
  if(shelfIdsInSel.length){
    S.pieces.forEach(a=>{
      if(a.type==='art'&&a.snappedToShelfId&&shelfIdsInSel.includes(a.snappedToShelfId)&&!sp[a.id]){
        sp[a.id]={x:a.x,y:a.y};snapFollowers.push(a.id);
      }
    });
  }
  pushUndo();
  S.drag={ids:[...S.sel],snapFollowers,sx:e.clientX,sy:e.clientY,sp,moved:false};
  e.currentTarget.setPointerCapture(e.pointerId);
}

function canvasDown(e){
  if(e.target.id==='ca'||e.target.id==='wall'||e.target.id==='wall-wrap')deselectAll();
}

function onDocMove(e){
  if(!S.drag)return;
  const dx=(e.clientX-S.drag.sx)/S.scale;
  const dy=(e.clientY-S.drag.sy)/S.scale;
  if(Math.abs(dx)>.05||Math.abs(dy)>.05)S.drag.moved=true;

  if(S.drag.resize){
    const id=S.drag.ids[0];const p=getPiece(id);const sp=S.drag.sp[id];if(!p||!sp)return;
    const dir=S.drag.resize;const MIN=2;
    if(dir==='se'){p.w=Math.max(MIN,sp.w+dx);p.h=Math.max(MIN,sp.h+dy);}
    else if(dir==='sw'){const nw=Math.max(MIN,sp.w-dx);p.x=clamp(sp.x+(sp.w-nw),0,S.wall.w-MIN);p.w=nw;p.h=Math.max(MIN,sp.h+dy);}
    else if(dir==='ne'){p.w=Math.max(MIN,sp.w+dx);const nh=Math.max(MIN,sp.h-dy);p.y=clamp(sp.y+(sp.h-nh),0,S.wall.h-MIN);p.h=nh;}
    else if(dir==='nw'){const nw=Math.max(MIN,sp.w-dx);const nh=Math.max(MIN,sp.h-dy);p.x=clamp(sp.x+(sp.w-nw),0,S.wall.w-MIN);p.y=clamp(sp.y+(sp.h-nh),0,S.wall.h-MIN);p.w=nw;p.h=nh;}
    const el=document.getElementById('p'+id);
    if(el){el.style.left=(p.x*S.scale)+'px';el.style.top=(p.y*S.scale)+'px';el.style.width=(p.w*S.scale)+'px';el.style.height=(p.h*S.scale)+'px';}
    const lbl=document.getElementById('pn'+id);
    if(lbl)lbl.textContent=p.label+(S.dims?` (${p.w.toFixed(1)}"×${p.h.toFixed(1)}")`:'');
    return;
  }

  S.drag.ids.forEach(id=>{
    const p=getPiece(id);const sp=S.drag.sp[id];if(!p||!sp)return;
    p.x=clamp(sp.x+dx,0,S.wall.w-p.w);
    p.y=clamp(sp.y+dy,0,S.wall.h-p.h);
    const el=document.getElementById('p'+id);
    if(el){el.style.left=(p.x*S.scale)+'px';el.style.top=(p.y*S.scale)+'px';}
  });
  // Move art pieces that are snapped to a shelf being dragged
  (S.drag.snapFollowers||[]).forEach(id=>{
    const p=getPiece(id);const sp=S.drag.sp[id];if(!p||!sp)return;
    p.x=clamp(sp.x+dx,0,S.wall.w-p.w);
    p.y=clamp(sp.y+dy,0,S.wall.h-p.h);
    const el=document.getElementById('p'+id);
    if(el){el.style.left=(p.x*S.scale)+'px';el.style.top=(p.y*S.scale)+'px';}
  });
  // Snap-to-shelf: art pieces with snapToShelf=true snap to nearby shelf tops
  const SNAP_IN=3;
  const shelves=S.pieces.filter(q=>q.type==='shelf');
  S.drag.ids.forEach(id=>{
    const p=getPiece(id);if(!p||p.type!=='art'||p.snapToShelf===false)return;
    let snapped=false;
    for(const s of shelves){
      if(p.x+p.w<=s.x||p.x>=s.x+s.w)continue;
      // Ledges: art bottom sits 1" above ledge bottom (front lip covers that 1")
      // Shelves: art bottom sits on shelf top
      const snapY=s.shelfType==='ledge'?s.y+s.h-1:s.y;
      const dist=(p.y+p.h)-snapY;
      if(Math.abs(dist)<SNAP_IN){
        p.y=snapY-p.h;
        p.snappedToShelfId=s.id;
        const el=document.getElementById('p'+id);
        if(el)el.style.top=(p.y*S.scale)+'px';
        snapped=true;break;
      }
    }
    if(!snapped)p.snappedToShelfId=null;
  });
  checkConflicts();renderConflicts();
  showTip(e,dx,dy);
}

function onDocUp(){
  if(!S.drag)return;
  hideTip();S.drag=null;updatePropsPanel();updateStatus();
}

function showTip(e,dx,dy){
  if(!S.drag?.moved)return;
  const ids=S.drag.ids;
  if(ids.length===1){
    const p=getPiece(ids[0]);
    if(p){
      const tip=document.getElementById('tip');
      tip.textContent=`x:${p.x.toFixed(1)}" y:${p.y.toFixed(1)}"`;
      tip.style.display='block';
      tip.style.left=(e.clientX+12)+'px';
      tip.style.top=(e.clientY-24)+'px';
    }
  }
}
function hideTip(){document.getElementById('tip').style.display='none';}

// ══════════════════════════════════════════
// RENDER ALL
// ══════════════════════════════════════════
function renderAll(){
  S.pieces.forEach(p=>{
    const el=document.getElementById('p'+p.id);if(!el)return;
    el.style.left=(p.x*S.scale)+'px';el.style.top=(p.y*S.scale)+'px';
    el.style.width=(p.w*S.scale)+'px';el.style.height=(p.h*S.scale)+'px';
  });
}

function renderPiece(p){
  const el=document.getElementById('p'+p.id);if(!el)return;
  Object.assign(el.style,{
    left:(p.x*S.scale)+'px',top:(p.y*S.scale)+'px',
    width:(p.w*S.scale)+'px',height:(p.h*S.scale)+'px'
  });
  if(p.type==='zone'){
    el.className='pc zone-pc'+(S.sel.has(p.id)?' sel':'')+(p.owarn?' owarn':'');
    el.style.zIndex=S.sel.has(p.id)?500:(p.zi||2);
    const lbl=document.getElementById('pn'+p.id);
    if(lbl)lbl.textContent=p.label+(S.dims?` (${p.w}"×${p.h}")`:'');
  }else if(p.type==='fixture'){
    el.className='pc fixture-pc'+(S.sel.has(p.id)?' sel':'')+(p.ywarn?' ywarn':'');
    el.style.zIndex=S.sel.has(p.id)?500:(p.zi||3);
  }else if(p.type==='art'){
    el.style.backgroundColor=p.color;
    const isCanvas=p.artType==='Stretched Canvas';
    el.classList.toggle('canvas-art',isCanvas&&!p.frameVisible);
    const frameEl=document.getElementById('pf'+p.id);
    if(frameEl){
      if(p.frameVisible){
        const thickPx=Math.max(1,Math.round((p.frameThickness||1)*S.scale));
        frameEl.style.boxShadow=`inset 0 0 0 ${thickPx}px ${p.frameColor||p.color||'#2a2a2a'}`;
      }else if(isCanvas){
        frameEl.style.boxShadow=''; // handled by CSS .canvas-art .pc-frame
      }else{frameEl.style.boxShadow='';}
    }
    const warn=p.owarn?' owarn':p.ywarn?' ywarn':'';
    el.className='pc'+(p.shape==='oval'?' oval':'')+(S.sel.has(p.id)?' sel':'')+(p.conflict?' conflict':'')+(p.gw&&S.gaps?' gw':'')+(p.gid?' grp':'')+warn;
    const img=document.getElementById('pi'+p.id);
    if(img){
      if(p.img){img.style.backgroundImage=`url(${p.img})`;img.style.backgroundSize=`${Math.round(p.imgZ*100)}%`;img.style.backgroundPosition=`calc(50% + ${p.imgOX}px) calc(50% + ${p.imgOY}px)`;}
      else{img.style.backgroundImage='';}
    }
    const pn=document.getElementById('pn'+p.id);if(pn)pn.textContent=p.label;
    const pd=document.getElementById('pd'+p.id);if(pd){pd.textContent=`${p.w}" × ${p.h}"`;pd.style.display=S.dims?'':'none';}
  }else{
    const isLedge=p.shelfType==='ledge';
    el.className='pc '+(isLedge?'ledge-pc':'shelf-pc')+(S.sel.has(p.id)?' sel':'')+(p.conflict?' conflict':'')+(p.gw&&S.gaps?' gw':'');
    el.style.backgroundColor=p.color||'#7a6548';
    const lbl=document.getElementById('pn'+p.id);
    if(lbl)lbl.textContent=p.label+(S.dims?` (${p.w}" × ${p.h}")`:'');
  }
  el.style.zIndex=S.sel.has(p.id)?500:(p.zi||1);
}

// ══════════════════════════════════════════
// CONFLICTS & GAP WARNINGS
// ══════════════════════════════════════════
function rectsOverlap(a,b){
  return !(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
}
function gapBetween(a,b){
  const gx=Math.max(0,Math.max(a.x,b.x)-Math.min(a.x+a.w,b.x+b.w));
  const gy=Math.max(0,Math.max(a.y,b.y)-Math.min(a.y+a.h,b.y+b.h));
  if(gx>0&&gy===0)return{dir:'h',gap:gx};
  if(gy>0&&gx===0)return{dir:'v',gap:gy};
  return null;
}
function checkConflicts(){
  const arts=S.pieces.filter(p=>p.type==='art');
  const shelves=S.pieces.filter(p=>p.type==='shelf');
  const zones=S.pieces.filter(p=>p.type==='zone');
  const fixtures=S.pieces.filter(p=>p.type==='fixture');
  S.pieces.forEach(p=>{p.conflict=false;p.gw=false;p.owarn=false;p.ywarn=false;});
  for(let i=0;i<arts.length;i++)for(let j=i+1;j<arts.length;j++)
    if(rectsOverlap(arts[i],arts[j])){arts[i].conflict=true;arts[j].conflict=true;}
  arts.forEach(a=>{if(a.snapToShelf===false)shelves.forEach(s=>{if(rectsOverlap(a,s)){a.conflict=true;s.conflict=true;}});});
  arts.forEach(a=>{zones.forEach(z=>{if(rectsOverlap(a,z))a.owarn=true;});});
  arts.forEach(a=>{fixtures.forEach(f=>{if(rectsOverlap(a,f))a.ywarn=true;});});
  const mg=S.minGap;
  if(mg>0){
    const spatial=[...arts,...shelves];
    for(let i=0;i<spatial.length;i++)for(let j=i+1;j<spatial.length;j++){
      const a=spatial[i],b=spatial[j];
      if(rectsOverlap(a,b))continue;
      const g=gapBetween(a,b);
      if(g&&g.gap<mg){a.gw=true;b.gw=true;}
    }
  }
}
function renderConflicts(){S.pieces.forEach(p=>renderPiece(p));}

// ══════════════════════════════════════════
// SMART PLACEMENT
// ══════════════════════════════════════════
function findEmptySpot(w,h){
  const others=S.pieces.filter(p=>p.type==='art'||p.type==='shelf');
  const margin=1;const step=Math.min(w,h,4);
  for(let y=0;y<=S.wall.h-h;y+=step){
    for(let x=0;x<=S.wall.w-w;x+=step){
      const candidate={x,y,w,h};
      const overlaps=others.some(o=>rectsOverlap(
        {x:candidate.x-margin,y:candidate.y-margin,w:candidate.w+margin*2,h:candidate.h+margin*2},o
      ));
      if(!overlaps)return{x,y};
    }
  }
  const base={x:clamp((S.wall.w-w)/2,0,S.wall.w-w),y:clamp((S.wall.h-h)/2,0,S.wall.h-h)};
  const offset=others.length*2;
  return{x:clamp(base.x+offset,0,S.wall.w-w),y:clamp(base.y+offset,0,S.wall.h-h)};
}

// ══════════════════════════════════════════
// GROUPS
// ══════════════════════════════════════════
function doGroup(){
  if(S.sel.size<2){showToast('Select 2+ items to group.');return;}
  pushUndo();
  const gid='g'+(S.ngid++);
  S.groups[gid]=new Set([...S.sel]);
  S.sel.forEach(id=>{const p=getPiece(id);if(p)p.gid=gid;});
  renderConflicts();showToast('Grouped '+S.sel.size+' items.');
}
function doUngroup(){
  const gids=new Set();
  S.sel.forEach(id=>{const p=getPiece(id);if(p&&p.gid)gids.add(p.gid);});
  if(!gids.size){showToast('No groups in selection.');return;}
  pushUndo();
  gids.forEach(gid=>{
    const members=S.groups[gid]||new Set();
    members.forEach(id=>{const p=getPiece(id);if(p)p.gid=null;});
    delete S.groups[gid];
  });
  renderConflicts();showToast('Ungrouped.');
}

// ══════════════════════════════════════════
// DISTRIBUTE / ALIGN
// ══════════════════════════════════════════
function getSelPieces(){return [...S.sel].map(id=>getPiece(id)).filter(Boolean);}
function distH(){const ps=getSelPieces();if(ps.length<3){showToast('Select 3+ items.');return;}ps.sort((a,b)=>a.x-b.x);const left=ps[0].x;const right=ps[ps.length-1].x+ps[ps.length-1].w;const totalW=ps.reduce((s,p)=>s+p.w,0);const gap=(right-left-totalW)/(ps.length-1);let cx=left;ps.forEach(p=>{p.x=cx;cx+=p.w+gap;});checkConflicts();renderConflicts();}
function distV(){const ps=getSelPieces();if(ps.length<3){showToast('Select 3+ items.');return;}ps.sort((a,b)=>a.y-b.y);const top=ps[0].y;const bot=ps[ps.length-1].y+ps[ps.length-1].h;const totalH=ps.reduce((s,p)=>s+p.h,0);const gap=(bot-top-totalH)/(ps.length-1);let cy=top;ps.forEach(p=>{p.y=cy;cy+=p.h+gap;});checkConflicts();renderConflicts();}
function alignL(){const ps=getSelPieces();if(!ps.length)return;const v=Math.min(...ps.map(p=>p.x));ps.forEach(p=>p.x=v);checkConflicts();renderConflicts();}
function alignR(){const ps=getSelPieces();if(!ps.length)return;const v=Math.max(...ps.map(p=>p.x+p.w));ps.forEach(p=>p.x=v-p.w);checkConflicts();renderConflicts();}
function alignT(){const ps=getSelPieces();if(!ps.length)return;const v=Math.min(...ps.map(p=>p.y));ps.forEach(p=>p.y=v);checkConflicts();renderConflicts();}
function alignBot(){const ps=getSelPieces();if(!ps.length)return;const v=Math.max(...ps.map(p=>p.y+p.h));ps.forEach(p=>p.y=v-p.h);checkConflicts();renderConflicts();}
function ctrH(){const ps=getSelPieces();if(!ps.length)return;ps.forEach(p=>p.x=clamp((S.wall.w-p.w)/2,0,S.wall.w-p.w));checkConflicts();renderConflicts();}
function ctrV(){const ps=getSelPieces();if(!ps.length)return;ps.forEach(p=>p.y=clamp((S.wall.h-p.h)/2,0,S.wall.h-p.h));checkConflicts();renderConflicts();}

// ══════════════════════════════════════════
// PROPERTIES PANEL
// ══════════════════════════════════════════
function updatePropsPanel(){
  const zonePnl=document.getElementById('p-zone-pnl');
  const artPnl=document.getElementById('p-art-pnl');
  const shelfPnl=document.getElementById('p-shelf-pnl');
  if(!zonePnl)return;
  zonePnl.classList.add('hide');
  artPnl?.classList.add('hide');
  shelfPnl?.classList.add('hide');
  // Update piece header
  const lbl=document.getElementById('pp-piece-label');
  const dims=document.getElementById('pp-piece-dims');
  if(S.sel.size===1){
    const pp=getPiece([...S.sel][0]);
    if(lbl)lbl.textContent=pp?.label||'';
    if(dims)dims.textContent=pp?`${pp.w}" × ${pp.h}"`:'';
  }else{
    if(lbl)lbl.textContent=S.sel.size>1?`${S.sel.size} selected`:'';
    if(dims)dims.textContent='';
  }
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p)return;
  if(p.type==='zone'){
    zonePnl.classList.remove('hide');
    const lockBtn=document.getElementById('p-lock-btn');
    lockBtn.textContent=p.locked?'🔓 Unlock Zone':'🔒 Lock Zone';
    lockBtn.className='btn btn-f '+(p.locked?'danger':'accent');
  }else if(p.type==='art'&&artPnl){
    artPnl.classList.remove('hide');
    // Frame visible toggle
    const fv=document.getElementById('p-frame-visible');
    if(fv)fv.checked=!!p.frameVisible;
    document.getElementById('p-frame-opts')?.classList.toggle('hide',!p.frameVisible);
    // Frame color swatches
    const sc=document.getElementById('p-frame-color-swatches');
    if(sc){
      sc.innerHTML='';
      const active=p.frameColor||p.color||'#2a2a2a';
      COLOR_PALETTE.forEach(c=>{
        const sw=document.createElement('div');
        sw.className='csw'+(active===c.hex?' on':'');
        sw.style.background=c.hex;sw.title=c.name;
        sw.addEventListener('click',()=>setFrameColor(c.hex));
        sc.appendChild(sw);
      });
    }
    // Thickness buttons
    document.querySelectorAll('#p-frame-thickness .btn').forEach(btn=>{
      const t=parseFloat(btn.dataset.thickness);
      btn.classList.toggle('on',t===(p.frameThickness||1));
      btn.onclick=()=>setFrameThickness(t);
    });
    // Snap toggle
    const sn=document.getElementById('p-snap-shelf');
    if(sn)sn.checked=p.snapToShelf!==false;
  }else if(p.type==='shelf'&&shelfPnl){
    shelfPnl.classList.remove('hide');
    const sc=document.getElementById('p-shelf-color-swatches');
    if(sc){
      sc.innerHTML='';
      COLOR_PALETTE.forEach(c=>{
        const sw=document.createElement('div');
        sw.className='csw'+(p.color===c.hex?' on':'');
        sw.style.background=c.hex;sw.title=c.name;
        sw.addEventListener('click',()=>setShelfColor(c.hex));
        sc.appendChild(sw);
      });
    }
    populateShelfLinkList(p);
  }
}
function togglePieceFrame(){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='art')return;
  pushUndo();
  p.frameVisible=!p.frameVisible;
  if(p.frameVisible&&!p.frameColor)p.frameColor=p.color||'#2a2a2a';
  renderPiece(p);updatePropsPanel();
}
function setFrameColor(hex){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='art')return;
  pushUndo();p.frameColor=hex;renderPiece(p);updatePropsPanel();
}
function setFrameThickness(t){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='art')return;
  pushUndo();p.frameThickness=t;renderPiece(p);updatePropsPanel();
}
function togglePieceSnap(){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='art')return;
  p.snapToShelf=p.snapToShelf===false?true:false;
  if(!p.snapToShelf)p.snappedToShelfId=null;
  checkConflicts();renderConflicts();updatePropsPanel();
}
function populateShelfLinkList(shelf){
  const container=document.getElementById('p-shelf-link-list');if(!container)return;
  const others=S.pieces.filter(q=>q.type==='shelf'&&q.id!==shelf.id);
  if(!others.length){container.innerHTML='<div style="font-size:10px;color:var(--muted)">No other shelves on wall.</div>';return;}
  container.innerHTML='';
  others.forEach(s=>{
    const linked=shelf.gid&&s.gid&&shelf.gid===s.gid;
    const row=document.createElement('div');
    row.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:3px 0';
    row.innerHTML=`<span style="font-size:11px">${esc(s.label)}</span><button class="btn${linked?' on':''}" style="font-size:10px;padding:2px 8px">${linked?'Unlink':'Link'}</button>`;
    row.querySelector('button').addEventListener('click',()=>toggleShelfLink(shelf.id,s.id));
    container.appendChild(row);
  });
}
function setShelfColor(hex){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p||p.type!=='shelf')return;
  pushUndo();p.color=hex;renderPiece(p);updatePropsPanel();
}
function toggleShelfLink(idA,idB){
  const a=getPiece(idA);const b=getPiece(idB);if(!a||!b)return;
  pushUndo();
  const linked=a.gid&&b.gid&&a.gid===b.gid;
  if(linked){
    if(a.gid&&S.groups[a.gid]){S.groups[a.gid].delete(idA);S.groups[a.gid].delete(idB);if(S.groups[a.gid].size<2)delete S.groups[a.gid];}
    a.gid=null;b.gid=null;
  }else{
    if(a.gid&&S.groups[a.gid]){S.groups[a.gid].add(idB);b.gid=a.gid;}
    else if(b.gid&&S.groups[b.gid]){S.groups[b.gid].add(idA);a.gid=b.gid;}
    else{const gid=S.ngid++;S.groups[gid]=new Set([idA,idB]);a.gid=gid;b.gid=gid;}
  }
  renderPiece(a);renderPiece(b);updatePropsPanel();
}
function setProp(key,val){
  if(S.sel.size!==1)return;
  const id=[...S.sel][0];const p=getPiece(id);if(!p)return;
  pushUndo();
  if(key==='width'&&val>0)p.w=val;
  else if(key==='height'&&val>0)p.h=val;
  else if(key==='x')p.x=clamp(val,0,S.wall.w-p.w);
  else if(key==='y')p.y=clamp(val,0,S.wall.h-p.h);
  else p[key]=val;
  renderPiece(p);checkConflicts();renderConflicts();
}

// ══════════════════════════════════════════
// TOGGLES
// ══════════════════════════════════════════
function showPage(name){
  document.getElementById('page-library').classList.toggle('hide',name!=='library');
  document.getElementById('page-planner').classList.toggle('hide',name!=='planner');
  document.getElementById('nav-library').classList.toggle('on',name==='library');
  document.getElementById('nav-planner').classList.toggle('on',name==='planner');
  if(name==='library')renderLibraryPage();
  if(name==='planner'){reScale();renderAll();}
}
function renderLibraryPage(){
  const search=(document.getElementById('lib-search')?.value||'').toLowerCase();
  const items=S.library.filter(i=>!search||i.name.toLowerCase().includes(search));
  const grid=document.getElementById('lib-grid');
  const empty=document.getElementById('lib-empty');
  if(!items.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';grid.innerHTML='';
  items.forEach(item=>{
    const onWall=item.placedId&&S.pieces.find(p=>p.id===item.placedId);
    const card=document.createElement('div');card.className='lib-card';
    const thumb=item.img?`<img src="${item.img}" alt="">`:`<div class="lib-card-thumb-blank">🖼</div>`;
    const typeBadge=item.type?`<span class="meta-badge badge-type">${esc(item.type)}</span>`:'';
    const framedBadge=item.framed!=null?`<span class="meta-badge ${item.framed?'badge-framed':'badge-unframed'}">${item.framed?'Framed':'Unframed'}</span>`:'';
    const colorBadge=item.frameColor
      ?`<span class="meta-badge badge-color"><span class="color-dot" style="background:${item.frameColor.hex}"></span>${esc(item.frameColor.name)}</span>`
      :item.color?`<span class="meta-badge badge-color"><span class="color-dot" style="background:${item.color.hex}"></span>${esc(item.color.name)}</span>`:'';
    const statusBadge=`<div class="lib-card-status ${onWall?'onwall':'available'}">${onWall?'On wall':'Available'}</div>`;
    card.innerHTML=`
      <div class="lib-card-thumb">${thumb}</div>
      <div class="lib-card-body">
        <div class="lib-card-name">${esc(item.name)}</div>
        <div class="lib-card-dims">${item.w}" × ${item.h}"</div>
        <div class="lib-card-meta">${typeBadge}${framedBadge}${colorBadge}</div>
        ${statusBadge}
      </div>
      <div class="lib-card-footer">
        <button class="btn" data-edit="${item.id}">Edit</button>
        <button class="btn danger" data-del="${item.id}">✕</button>
      </div>`;
    card.querySelector('[data-edit]').addEventListener('click',e=>{e.stopPropagation();openEditLibItem(item.id);});
    card.querySelector('[data-del]').addEventListener('click',e=>{
      e.stopPropagation();
      if(onWall){showToast('Remove from wall first.');return;}
      if(confirm('Delete "'+item.name+'" from library?'))deleteLibItem(item.id);
    });
    grid.appendChild(card);
  });
}
function toggleSelMode(){
  S.selMode=!S.selMode;
  document.getElementById('btn-selmode').classList.toggle('on',S.selMode);
  if(!S.selMode)deselectAll();
  showToast(S.selMode?'Select mode ON — tap pieces to add to selection':'Select mode off');
}
function toggleDims(){S.dims=!S.dims;document.getElementById('btn-dims').classList.toggle('on',S.dims);S.pieces.forEach(p=>renderPiece(p));}
function toggleGaps(){S.gaps=!S.gaps;document.getElementById('btn-gaps').classList.toggle('on',S.gaps);checkConflicts();renderConflicts();}
function toggleGrid(){
  S.grid=!S.grid;document.getElementById('btn-grid').classList.toggle('on',S.grid);
  const wall=document.getElementById('wall');
  if(S.grid){const gs=Math.round(6*S.scale);wall.style.backgroundImage=`linear-gradient(rgba(120,120,180,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,120,180,.12) 1px,transparent 1px)`;wall.style.backgroundSize=`${gs}px ${gs}px`;}
  else{wall.style.backgroundImage='none';}
}
function toggleSidebar(){document.getElementById('sb').classList.toggle('closed');setTimeout(()=>{reScale();renderAll();},210);}

// ══════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════
function deleteSelected(){
  if(!S.sel.size)return;
  pushUndo();
  S.sel.forEach(id=>{
    const p=getPiece(id);
    if(p?.libId){const li=S.library.find(l=>l.id===p.libId);if(li){li.placedId=null;persistLibrary();}}
    if(p?.gid&&S.groups[p.gid]){S.groups[p.gid].delete(id);if(S.groups[p.gid].size<2)delete S.groups[p.gid];}
    document.getElementById('p'+id)?.remove();
  });
  S.pieces=S.pieces.filter(p=>!S.sel.has(p.id));
  S.sel.clear();
  checkConflicts();updatePropsPanel();updateStatus();renderLibrary();
}

// ══════════════════════════════════════════
// IMAGE UPLOAD & CROP
// ══════════════════════════════════════════
function triggerFileUpload(){
  if(S.sel.size!==1)return;
  S.cropPieceId=[...S.sel][0];
  const fi=document.getElementById('file-in');fi.value='';
  fi.onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>openCrop(ev.target.result,S.cropPieceId);r.readAsDataURL(f);}};
  fi.click();
}
function triggerCameraUpload(){if(S.sel.size!==1)return;openCamForPiece([...S.sel][0]);}
function onFileSelected(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>openCrop(ev.target.result,S.cropPieceId);r.readAsDataURL(f);}

let cropImg=null,cropOX=0,cropOY=0,cropZ=1,cropDragging=false,cropDX=0,cropDY=0;

function openCrop(src,pid){
  const p=getPiece(pid);if(!p)return;
  cropImg=new Image();cropOX=0;cropOY=0;cropZ=1;
  document.getElementById('crop-zoom').value=100;
  document.getElementById('zoom-val').textContent='100%';
  cropImg.onload=()=>{
    const ratio=p.w/p.h;
    const cw=document.getElementById('crop-wrap').clientWidth||420;
    const ch=Math.round(cw/ratio);
    const canvas=document.getElementById('crop-canvas');
    canvas.width=cw;canvas.height=ch;canvas.style.height=ch+'px';
    S.cropState={p,cw,ch};drawCropCanvas();
    canvas.onpointerdown=ev=>{ev.preventDefault();cropDragging=true;cropDX=ev.clientX;cropDY=ev.clientY;canvas.setPointerCapture(ev.pointerId);};
    canvas.onpointermove=ev=>{if(!cropDragging)return;cropOX+=(ev.clientX-cropDX);cropOY+=(ev.clientY-cropDY);cropDX=ev.clientX;cropDY=ev.clientY;drawCropCanvas();};
    canvas.onpointerup=()=>{cropDragging=false;};
    document.getElementById('m-crop').classList.remove('hide');
  };
  cropImg.src=src;
}
function updateCrop(){const z=parseInt(document.getElementById('crop-zoom').value)/100;cropZ=z;document.getElementById('zoom-val').textContent=Math.round(z*100)+'%';drawCropCanvas();}
function drawCropCanvas(){
  if(!S.cropState||!cropImg)return;
  const {cw,ch}=S.cropState;
  const canvas=document.getElementById('crop-canvas');
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,cw,ch);
  const baseScale=Math.min(cw/cropImg.naturalWidth,ch/cropImg.naturalHeight);
  const sw=cropImg.naturalWidth*baseScale*cropZ;
  const sh=cropImg.naturalHeight*baseScale*cropZ;
  ctx.drawImage(cropImg,(cw-sw)/2+cropOX,(ch-sh)/2+cropOY,sw,sh);
  ctx.strokeStyle='rgba(196,162,74,.8)';ctx.lineWidth=2;ctx.strokeRect(1,1,cw-2,ch-2);
}
function confirmCrop(){
  if(!S.cropState)return;
  const {p}=S.cropState;
  p.img=document.getElementById('crop-canvas').toDataURL('image/jpeg',.9);
  p.imgOX=0;p.imgOY=0;p.imgZ=1;
  renderPiece(p);updatePropsPanel();closeModal('m-crop');
}
function removeImg(){
  if(S.sel.size!==1)return;
  const p=getPiece([...S.sel][0]);if(!p)return;
  p.img=null;renderPiece(p);updatePropsPanel();
}
function stepDim(inputId,delta){
  const el=document.getElementById(inputId);
  const cur=parseFloat(el.value)||0;
  el.value=Math.max(0.5,Math.round((cur+delta)*4)/4).toFixed(2).replace(/\.?0+$/,'');
  if(inputId==='lib-w'||inputId==='lib-h')syncLibOrientation();
}

// ══════════════════════════════════════════
// FILENAME PARSER
// ══════════════════════════════════════════
function camelToWords(s){return s.replace(/([A-Z])/g,' $1').replace(/^_+|_+$/g,'').replace(/_+/g,' ').trim();}
function parseFilename(filename){
  const base=filename.replace(/\.[^/.]+$/,'').replace(/^_+/,'');
  const parts=base.split('-');
  const result={name:'',type:'Photo',framed:false,color:null,frameColor:null};
  const colorNames=COLOR_PALETTE.map(c=>c.name.toLowerCase());
  const typeNames=ART_TYPES.map(t=>t.toLowerCase());
  const nameParts=[];
  parts.forEach(p=>{
    const pl=p.toLowerCase();
    if(FRAME_KEYWORDS.some(k=>pl===k.toLowerCase())){result.framed=true;return;}
    if(UNFRAMED_KEYWORDS.some(k=>pl===k.toLowerCase())){result.framed=false;const ti=typeNames.indexOf(pl);if(ti>=0)result.type=ART_TYPES[ti];return;}
    const ti=typeNames.indexOf(pl);if(ti>=0){result.type=ART_TYPES[ti];return;}
    const ci=colorNames.indexOf(pl);
    if(ci>=0){if(!result.color)result.color=COLOR_PALETTE[ci];else if(!result.frameColor)result.frameColor=COLOR_PALETTE[ci];return;}
    nameParts.push(p);
  });
  result.name=nameParts.map(p=>camelToWords(p)).join(' ').trim()||base;
  if(result.framed&&result.color&&!result.frameColor){result.frameColor=result.color;result.color=null;}
  return result;
}

// ══════════════════════════════════════════
// ARTWORK LIBRARY
// ══════════════════════════════════════════
let libImgData=null;

function openAddToLibrary(){
  libImgData=null;
  const fi=document.getElementById('lib-file-in');fi.value='';
  fi.onchange=e=>{
    if(e.target.files.length>1)openBatchReview(e.target.files);
    else if(e.target.files.length===1)openSingleAddModal(e.target.files[0]);
  };
  fi.click();
}

function openSingleAddModal(file){
  libImgData=null;
  const parsed=file?parseFilename(file.name):{name:'',type:'Photo',framed:false,color:null,frameColor:null};
  document.getElementById('lib-name').value=parsed.name;
  document.getElementById('lib-w').value='';
  document.getElementById('lib-h').value='';
  document.getElementById('lib-preset').value='';
  document.getElementById('lib-type').value=parsed.type;
  document.getElementById('lib-framed').checked=parsed.framed;
  document.getElementById('lib-preview-wrap').style.display='none';
  document.getElementById('lib-preview-img').src='';
  document.getElementById('lib-no-photo').style.display=file?'none':'flex';
  document.getElementById('lib-change-photo').style.display=file?'block':'none';
  document.getElementById('lib-portrait').classList.add('on');
  document.getElementById('lib-landscape').classList.remove('on');
  document.getElementById('m-lib-add').dataset.editId='';
  document.getElementById('lib-modal-title').textContent='Add to Library';
  const tagsEl=document.getElementById('lib-tags');if(tagsEl)tagsEl.value='';
  syncFramedUI();
  buildModalSwatches('lib-color-swatches',parsed.color?.hex||null);
  buildModalSwatches('lib-frame-swatches',parsed.frameColor?.hex||null);
  document.getElementById('m-lib-add').classList.remove('hide');
  if(file){
    const r=new FileReader();
    r.onload=ev=>{
      libImgData=ev.target.result;
      document.getElementById('lib-preview-img').src=libImgData;
      document.getElementById('lib-preview-wrap').style.display='block';
    };
    r.readAsDataURL(file);
  }
}

function buildModalSwatches(containerId,selectedHex){
  const container=document.getElementById(containerId);if(!container)return;
  container.innerHTML='';
  COLOR_PALETTE.forEach(c=>{
    const sw=document.createElement('div');
    sw.className='csw'+(selectedHex&&selectedHex===c.hex?' on':'');
    sw.style.background=c.hex;sw.title=c.name;
    sw.dataset.color=c.hex;sw.dataset.colorName=c.name;
    sw.addEventListener('click',()=>{container.querySelectorAll('.csw').forEach(s=>s.classList.remove('on'));sw.classList.add('on');});
    container.appendChild(sw);
  });
}

function syncFramedUI(){
  document.getElementById('lib-frame-color-row').style.display=document.getElementById('lib-framed').checked?'block':'none';
}
function getSelectedSwatch(containerId){
  const on=document.getElementById(containerId)?.querySelector('.csw.on');
  return on?{hex:on.dataset.color,name:on.dataset.colorName}:null;
}

function triggerLibUpload(camera){
  const inp=document.getElementById(camera?'lib-cam-in':'lib-file-in');
  inp.value='';
  inp.onchange=e=>{const f=e.target.files[0];if(f)openSingleAddModal(f);};
  inp.click();
}
function onLibFileSelected(){}  // handled by triggerLibUpload and openAddToLibrary

function applyLibPreset(){
  const val=document.getElementById('lib-preset').value;if(!val)return;
  const p=JSON.parse(val);
  const orient=document.getElementById('lib-portrait').classList.contains('on')?'portrait':'landscape';
  const w=orient==='landscape'?Math.max(p.w,p.h):Math.min(p.w,p.h);
  const h=orient==='landscape'?Math.min(p.w,p.h):Math.max(p.w,p.h);
  document.getElementById('lib-w').value=w;document.getElementById('lib-h').value=h;
}
function setLibOrientation(o){
  document.getElementById('lib-portrait').classList.toggle('on',o==='portrait');
  document.getElementById('lib-landscape').classList.toggle('on',o==='landscape');
  const wEl=document.getElementById('lib-w'),hEl=document.getElementById('lib-h');
  const w=parseFloat(wEl.value)||0,h=parseFloat(hEl.value)||0;
  if(w>0&&h>0){
    if(o==='portrait'&&w>h){wEl.value=h;hEl.value=w;}
    else if(o==='landscape'&&h>w){wEl.value=h;hEl.value=w;}
  }
}
function syncLibOrientation(){
  const w=parseFloat(document.getElementById('lib-w').value)||0;
  const h=parseFloat(document.getElementById('lib-h').value)||0;
  if(w>0&&h>0){
    document.getElementById('lib-portrait').classList.toggle('on',h>=w);
    document.getElementById('lib-landscape').classList.toggle('on',w>h);
  }
}

async function confirmAddToLibrary(){
  const name=document.getElementById('lib-name').value.trim()||'Untitled';
  const w=parseFloat(document.getElementById('lib-w').value);
  const h=parseFloat(document.getElementById('lib-h').value);
  if(!w||!h||w<=0||h<=0){showToast('Enter frame dimensions.');return;}
  const type=document.getElementById('lib-type').value;
  const framed=document.getElementById('lib-framed').checked;
  const color=getSelectedSwatch('lib-color-swatches');
  const frameColor=getSelectedSwatch('lib-frame-swatches');

  // Upload image if it's a base64 string and Firebase is ready
  let imgUrl=libImgData;
  if(imgUrl&&imgUrl.startsWith('data:')&&S.cloudReady){
    const saveBtn=document.getElementById('btn-lib-save');
    if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Uploading…';}
    showToast('Uploading image…');
    imgUrl=await uploadImageToStorage(imgUrl);
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='Save';}
  }

  const tagsRaw=document.getElementById('lib-tags')?.value||'';
  const tags=tagsRaw.split(',').map(t=>t.trim()).filter(Boolean);
  const editId=+document.getElementById('m-lib-add').dataset.editId||0;
  if(editId){
    const item=S.library.find(i=>i.id===editId);
    if(item){Object.assign(item,{name,w,h,type,framed,color,frameColor,tags});if(libImgData)item.img=imgUrl;}
    showToast('"'+name+'" updated.');
  }else{
    S.library.push({id:Date.now(),name,w,h,img:imgUrl,type,framed,color,frameColor,tags,placedId:null});
    showToast('"'+name+'" added to library.');
  }
  document.getElementById('m-lib-add').dataset.editId='';
  persistLibrary();renderLibrary();renderLibraryPage();
  closeModal('m-lib-add');
}

function openEditLibItem(id){
  const item=S.library.find(i=>i.id===id);if(!item)return;
  libImgData=item.img||null;
  document.getElementById('lib-name').value=item.name;
  document.getElementById('lib-w').value=item.w;
  document.getElementById('lib-h').value=item.h;
  document.getElementById('lib-preset').value='';
  document.getElementById('lib-type').value=item.type||'Photo';
  document.getElementById('lib-framed').checked=!!item.framed;
  if(item.img){
    document.getElementById('lib-preview-img').src=item.img;
    document.getElementById('lib-preview-wrap').style.display='block';
    document.getElementById('lib-no-photo').style.display='none';
    document.getElementById('lib-change-photo').style.display='block';
  }else{
    document.getElementById('lib-preview-wrap').style.display='none';
    document.getElementById('lib-no-photo').style.display='flex';
    document.getElementById('lib-change-photo').style.display='none';
  }
  document.getElementById('lib-portrait').classList.toggle('on',!item.w||!item.h||item.h>=item.w);
  document.getElementById('lib-landscape').classList.toggle('on',item.w>item.h);
  document.getElementById('m-lib-add').dataset.editId=id;
  document.getElementById('lib-modal-title').textContent='Edit Artwork';
  const tagsEl=document.getElementById('lib-tags');
  if(tagsEl)tagsEl.value=(item.tags||[]).join(', ');
  syncFramedUI();
  buildModalSwatches('lib-color-swatches',item.color?.hex||null);
  buildModalSwatches('lib-frame-swatches',item.frameColor?.hex||null);
  document.getElementById('m-lib-add').classList.remove('hide');
}

async function deleteLibItem(id){
  // Delete image from Firebase Storage if it's a cloud URL
  if(S.cloudReady){
    const item=S.library.find(i=>i.id===id);
    if(item?.img&&item.img.startsWith('http')){
      try{await firebase.storage().refFromURL(item.img).delete();}catch(e){}
    }
  }
  S.library=S.library.filter(i=>i.id!==id);
  persistLibrary();renderLibrary();renderLibraryPage();
}

function persistLibrary(){
  try{localStorage.setItem('gwp_library',JSON.stringify(S.library));}catch(e){
    showToast('Storage full — try removing some library items or setting up cloud sync.');
  }
  if(S.cloudReady)saveToCloud();
}

function renderLibrary(){
  if(document.getElementById('drawer')?.classList.contains('open'))renderDrawerGrid();
  const el=document.getElementById('wall-lib-list');if(!el)return;
  if(!S.library.length){
    el.innerHTML='<div style="font-size:11px;color:var(--muted);text-align:center;padding:12px 0">Library is empty.<br>Go to Library to add artwork.</div>';
    return;
  }
  el.innerHTML='';
  S.library.forEach(item=>{
    const onWall=item.placedId&&S.pieces.find(p=>p.id===item.placedId);
    const d=document.createElement('div');d.className='lib-item';
    const thumb=item.img?`<img class="lib-thumb" src="${item.img}" alt="">`:`<div class="lib-thumb-blank">🖼</div>`;
    const placeBtn=onWall?`<button class="lib-place onwall" disabled>On Wall</button>`:`<button class="lib-place" data-id="${item.id}">Place</button>`;
    d.innerHTML=`${thumb}<div class="lib-info"><div class="lib-name">${esc(item.name)}</div><div class="lib-dims">${item.w}" × ${item.h}"</div></div>${placeBtn}`;
    if(!onWall)d.querySelector('.lib-place').addEventListener('click',e=>{e.stopPropagation();addFromLibrary(item);});
    el.appendChild(d);
  });
  if(document.getElementById('page-library')&&!document.getElementById('page-library').classList.contains('hide'))renderLibraryPage();
}

function addFromLibrary(item){
  if(item.placedId&&S.pieces.find(p=>p.id===item.placedId)){showToast('"'+item.name+'" is already on the wall.');return;}
  pushUndo();
  const pos=findEmptySpot(item.w,item.h);
  const piece={
    id:S.nid++,type:'art',x:pos.x,y:pos.y,
    w:item.w,h:item.h,shape:'rect',color:'#2a2a2a',
    img:item.img||null,imgOX:0,imgOY:0,imgZ:1,
    label:item.name,gid:null,zi:S.pieces.length+1,
    libId:item.id,conflict:false,gw:false,owarn:false,ywarn:false,
    snapToShelf:true,snappedToShelfId:null,
    frameVisible:!!(item.framed),frameColor:item.frameColor?.hex||null,frameThickness:1,
  };
  item.placedId=piece.id;persistLibrary();
  S.pieces.push(piece);mkArtEl(piece);
  checkConflicts();renderConflicts();updateStatus();
  select(piece.id,false);renderLibrary();
}

// ══════════════════════════════════════════
// BATCH UPLOAD
// ══════════════════════════════════════════
let batchQueue=[];

function openBatchReview(files){
  batchQueue=[];
  const list=document.getElementById('batch-list');
  list.innerHTML='<div style="font-size:11px;color:var(--muted);text-align:center;padding:12px">Loading previews…</div>';
  document.getElementById('m-batch').classList.remove('hide');
  const fileArr=Array.from(files);let loaded=0;
  fileArr.forEach((file,i)=>{
    const parsed=parseFilename(file.name);
    const entry={id:i,file,parsed,imgData:null,name:parsed.name,type:parsed.type,framed:parsed.framed,color:parsed.color,frameColor:parsed.frameColor,w:'',h:''};
    batchQueue.push(entry);
    const r=new FileReader();
    r.onload=ev=>{entry.imgData=ev.target.result;loaded++;if(loaded===fileArr.length)renderBatchList();};
    r.readAsDataURL(file);
  });
}

function renderBatchList(){
  const list=document.getElementById('batch-list');list.innerHTML='';
  batchQueue.forEach((entry,i)=>{
    const div=document.createElement('div');div.className='batch-item';
    const thumb=entry.imgData?`<img class="batch-thumb" src="${entry.imgData}">`:`<div class="batch-thumb-blank">🖼</div>`;
    const makeSwatches=(selected,key)=>COLOR_PALETTE.map(c=>`<div class="csw${selected&&selected.hex===c.hex?' on':''}" style="background:${c.hex}" data-hex="${c.hex}" data-name="${c.name}" data-key="${key}" data-idx="${i}" title="${c.name}"></div>`).join('');
    div.innerHTML=`
      <div class="batch-header">
        ${thumb}
        <div class="batch-meta" style="flex:1">
          <input type="text" value="${esc(entry.name)}" data-field="name" data-idx="${i}" style="margin-bottom:6px;font-size:12px">
          <select data-field="type" data-idx="${i}" style="font-size:11px;margin-bottom:6px">
            ${ART_TYPES.map(t=>`<option${t===entry.type?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="toggle-row">
        <span class="toggle-label">Framed</span>
        <label class="toggle"><input type="checkbox" data-field="framed" data-idx="${i}"${entry.framed?' checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></label>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Frame Color</div>
      <div class="color-swatch-row" style="margin-bottom:8px">${makeSwatches(entry.frameColor,'frameColor')}</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Art Color</div>
      <div class="color-swatch-row" style="margin-bottom:8px">${makeSwatches(entry.color,'color')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Width (in)</div>
          <div style="display:flex;gap:3px;align-items:center">
            <button class="stepper-btn" data-step="-0.25" data-field="w" data-idx="${i}">−</button>
            <input type="number" class="sm" data-field="w" data-idx="${i}" value="${entry.w}" placeholder="16" style="flex:1;text-align:center" min="0.5" step="0.25">
            <button class="stepper-btn" data-step="0.25" data-field="w" data-idx="${i}">+</button>
          </div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Height (in)</div>
          <div style="display:flex;gap:3px;align-items:center">
            <button class="stepper-btn" data-step="-0.25" data-field="h" data-idx="${i}">−</button>
            <input type="number" class="sm" data-field="h" data-idx="${i}" value="${entry.h}" placeholder="20" style="flex:1;text-align:center" min="0.5" step="0.25">
            <button class="stepper-btn" data-step="0.25" data-field="h" data-idx="${i}">+</button>
          </div>
        </div>
      </div>`;
    div.querySelectorAll('input[type=text],input[type=number],select').forEach(el=>{
      el.addEventListener('change',e=>{const idx=+e.target.dataset.idx,field=e.target.dataset.field;batchQueue[idx][field]=e.target.value;});
      if(el.type==='number')el.addEventListener('input',e=>{batchQueue[+e.target.dataset.idx][e.target.dataset.field]=e.target.value;});
    });
    div.querySelectorAll('input[type=checkbox]').forEach(el=>{el.addEventListener('change',e=>{batchQueue[+e.target.dataset.idx].framed=e.target.checked;});});
    div.querySelectorAll('.csw').forEach(sw=>{
      sw.addEventListener('click',()=>{
        const idx=+sw.dataset.idx,key=sw.dataset.key;
        div.querySelectorAll(`.csw[data-key="${key}"]`).forEach(s=>s.classList.remove('on'));
        sw.classList.add('on');
        batchQueue[idx][key]={hex:sw.dataset.hex,name:sw.dataset.name};
      });
    });
    div.querySelectorAll('.stepper-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const idx=+btn.dataset.idx,field=btn.dataset.field,step=+btn.dataset.step;
        const inp=div.querySelector(`input[type=number][data-field="${field}"][data-idx="${idx}"]`);
        const cur=parseFloat(inp.value)||0;
        inp.value=Math.max(0.5,Math.round((cur+step)*4)/4).toFixed(2).replace(/\.?0+$/,'');
        batchQueue[idx][field]=inp.value;
      });
    });
    list.appendChild(div);
  });
}

async function confirmBatch(){
  let added=0;
  const saveBtn=document.getElementById('btn-batch-save');
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Adding…';}
  for(const entry of batchQueue){
    const w=parseFloat(entry.w),h=parseFloat(entry.h);
    if(!w||!h||w<=0||h<=0)continue;
    let imgUrl=entry.imgData||null;
    if(imgUrl&&imgUrl.startsWith('data:')&&S.cloudReady){
      imgUrl=await uploadImageToStorage(imgUrl);
    }
    S.library.push({
      id:Date.now()+added,name:entry.name||'Untitled',
      w,h,img:imgUrl,type:entry.type,framed:entry.framed,
      color:entry.color||null,frameColor:entry.frameColor||null,placedId:null
    });
    added++;
  }
  if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='Add All to Library';}
  persistLibrary();renderLibrary();renderLibraryPage();
  closeModal('m-batch');
  showToast(added+' piece'+(added!==1?'s':'')+' added to library.');
  batchQueue=[];
}

// ══════════════════════════════════════════
// SAVE / LOAD LAYOUTS
// ══════════════════════════════════════════
function openSave(){updateSavePreview();document.getElementById('m-save').classList.remove('hide');}
function updateSavePreview(){
  const name=document.getElementById('save-name').value.trim()||'Gallery Wall';
  const ver=S.layouts.filter(l=>l.baseName===name).length+1;
  document.getElementById('save-preview').textContent=`Will save as: "${name} v${ver}"`;
}
function saveLayout(){
  const name=document.getElementById('save-name').value.trim()||'Gallery Wall';
  const ver=S.layouts.filter(l=>l.baseName===name).length+1;
  const layout={
    id:Date.now(),baseName:name,name:`${name} v${ver}`,ver,
    ts:new Date().toLocaleString(),
    wall:{...S.wall},
    pieces:S.pieces.map(p=>({...p})),
    groups:Object.fromEntries(Object.entries(S.groups).map(([k,v])=>[k,[...v]])),
    nid:S.nid,ngid:S.ngid
  };
  S.layouts.push(layout);
  persistLayouts();renderLayoutsSidebar();renderLayoutsModal();
  closeModal('m-save');showToast('Saved as "'+layout.name+'"');
}
function loadLayout(id){
  const l=S.layouts.find(x=>x.id===id);if(!l)return;
  document.getElementById('wall').innerHTML='';
  S.wall={...l.wall};S.pieces=l.pieces.map(p=>({...p}));
  S.groups={};Object.entries(l.groups||{}).forEach(([k,v])=>{S.groups[k]=new Set(v);});
  S.nid=l.nid||S.nid;S.ngid=l.ngid||S.ngid;S.sel.clear();
  document.getElementById('wall-w').value=S.wall.w;
  document.getElementById('wall-h').value=S.wall.h;
  document.getElementById('wall-c').value=S.wall.c;
  document.getElementById('wall').style.background=S.wall.c;
  reScale();
  S.pieces.forEach(p=>{
    if(p.type==='art')mkArtEl(p);
    else if(p.type==='shelf')mkShelfEl(p);
    else if(p.type==='zone')mkZoneEl(p);
    else if(p.type==='fixture')mkFixtureEl(p);
  });
  checkConflicts();renderConflicts();updateStatus();closeModal('m-layouts');showToast('Loaded "'+l.name+'"');
}
function deleteLayout(id){
  S.layouts=S.layouts.filter(l=>l.id!==id);
  persistLayouts();renderLayoutsSidebar();renderLayoutsModal();
}
function persistLayouts(){
  try{localStorage.setItem('gwp_layouts',JSON.stringify(S.layouts));}catch(e){}
  if(S.cloudReady)saveToCloud();
}
function renderLayoutsSidebar(){
  const el=document.getElementById('wall-layouts');
  if(!S.layouts.length){el.innerHTML='<div style="font-size:10px;color:var(--muted)">No saved layouts.</div>';return;}
  el.innerHTML='';
  [...S.layouts].reverse().slice(0,6).forEach(l=>{
    const d=document.createElement('div');d.className='layout-item';
    d.innerHTML=`<div><div class="li-name">${esc(l.name)}</div><div class="li-date">${l.ts}</div></div>`;
    d.style.cursor='pointer';d.onclick=()=>loadLayout(l.id);
    el.appendChild(d);
  });
}
function openLayouts(){renderLayoutsModal();document.getElementById('m-layouts').classList.remove('hide');}
function renderLayoutsModal(){
  const el=document.getElementById('layouts-list');
  if(!S.layouts.length){el.innerHTML='<div style="font-size:11px;color:var(--muted)">No saved layouts yet.</div>';return;}
  el.innerHTML='';
  [...S.layouts].reverse().forEach(l=>{
    const d=document.createElement('div');d.className='layout-item';
    d.innerHTML=`<div style="flex:1"><div class="li-name">${esc(l.name)}</div><div class="li-date">${l.ts}</div></div>`;
    const lb=document.createElement('div');lb.className='li-btns';
    const btnL=document.createElement('button');btnL.className='btn accent';btnL.textContent='Load';btnL.onclick=()=>loadLayout(l.id);
    const btnD=document.createElement('button');btnD.className='btn danger';btnD.textContent='✕';btnD.onclick=()=>{if(confirm('Delete "'+l.name+'"?'))deleteLayout(l.id);};
    lb.appendChild(btnL);lb.appendChild(btnD);d.appendChild(lb);el.appendChild(d);
  });
}

// ══════════════════════════════════════════
// EXPORT PNG
// ══════════════════════════════════════════
async function exportPNG(){
  const dpr=2,ww=S.wall.w*S.scale,wh=S.wall.h*S.scale;
  const canvas=document.createElement('canvas');canvas.width=ww*dpr;canvas.height=wh*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle=S.wall.c;ctx.fillRect(0,0,ww,wh);
  const sorted=[...S.pieces].sort((a,b)=>(a.zi||0)-(b.zi||0));
  for(const p of sorted){
    const x=p.x*S.scale,y=p.y*S.scale,w=p.w*S.scale,h=p.h*S.scale;
    ctx.save();
    if(p.shape==='oval'){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.clip();}
    ctx.fillStyle=p.color||'#c8b89a';
    if(p.type==='shelf'){
      ctx.fillRect(x,y,w,h);
      ctx.fillStyle='rgba(0,0,0,.07)';
      for(let i=0;i<w;i+=11)ctx.fillRect(x+i,y,1,h);
    }else{
      ctx.fillRect(x,y,w,h);
      if(p.img){
        // Fetch https:// images as blob to avoid CORS canvas taint
        let src=p.img;
        if(src.startsWith('http')){
          try{const resp=await fetch(src);const blob=await resp.blob();src=URL.createObjectURL(blob);}
          catch(e){src=null;}
        }
        if(src){
          await new Promise(res=>{
            const img=new Image();
            img.onload=()=>{ctx.drawImage(img,x,y,w,h);res();};
            img.onerror=res;img.src=src;
          });
          if(p.img.startsWith('http'))URL.revokeObjectURL(src);
        }
      }
    }
    ctx.restore();
    if(S.dims){
      ctx.save();
      ctx.font=`${Math.max(10,S.scale*0.9)}px "Space Mono",monospace`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(`${p.w}" × ${p.h}"`,x+w/2,y+h/2+8);
      ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillText(`${p.w}" × ${p.h}"`,x+w/2,y+h/2+7);
      ctx.font=`${Math.max(9,S.scale*0.85)}px Figtree,sans-serif`;
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(p.label,x+w/2,y+h/2-6);
      ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillText(p.label,x+w/2,y+h/2-7);
      ctx.restore();
    }
  }
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=2;ctx.strokeRect(1,1,ww-2,wh-2);
  const a=document.createElement('a');a.download='gallery-wall.png';a.href=canvas.toDataURL('image/png');a.click();
}

// ══════════════════════════════════════════
// MODALS / TABS / STATUS / KEYBOARD / TOAST
// ══════════════════════════════════════════
function closeModal(id){document.getElementById(id).classList.add('hide');}

function switchTab(){}  // legacy no-op — panels are now context-driven
function showWallPanel(){
  document.getElementById('panel-wall')?.classList.remove('hide');
  document.getElementById('panel-piece')?.classList.add('hide');
}
function showPiecePanel(){
  document.getElementById('panel-wall')?.classList.add('hide');
  document.getElementById('panel-piece')?.classList.remove('hide');
  updatePropsPanel();
}
function toggleAcc(id){
  const body=document.getElementById(id);
  const arrow=body.previousElementSibling.querySelector('.fg-arrow');
  body.classList.toggle('hide');
  if(arrow)arrow.style.transform=body.classList.contains('hide')?'':'rotate(90deg)';
}

function updateStatus(){
  document.getElementById('st-scale').textContent=S.scale.toFixed(1)+'px/in';
  document.getElementById('st-wall').textContent=S.wall.w+'" × '+S.wall.h+'"';
  document.getElementById('st-items').textContent=S.pieces.length;
  document.getElementById('st-sel').textContent=S.sel.size;
  if(S.sel.size===1){const p=getPiece([...S.sel][0]);if(p)document.getElementById('st-pos').textContent=p.x.toFixed(1)+'" , '+p.y.toFixed(1)+'"';}
  else document.getElementById('st-pos').textContent='—';
}

function onKey(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  const step=e.shiftKey?1:0.25;
  if(e.key==='Delete'||e.key==='Backspace'){deleteSelected();}
  else if(e.key==='ArrowLeft'){nudge(-step,0,e);}
  else if(e.key==='ArrowRight'){nudge(step,0,e);}
  else if(e.key==='ArrowUp'){nudge(0,-step,e);}
  else if(e.key==='ArrowDown'){nudge(0,step,e);}
  else if(e.key==='Escape'){deselectAll();}
  else if((e.metaKey||e.ctrlKey)&&e.shiftKey&&(e.key==='z'||e.key==='Z')){e.preventDefault();redo();}
  else if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();undo();}
  else if((e.metaKey||e.ctrlKey)&&e.key==='g'){e.preventDefault();doGroup();}
  else if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key==='G'){e.preventDefault();doUngroup();}
  else if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();openSave();}
}
function nudge(dx,dy,e){
  e.preventDefault();
  S.sel.forEach(id=>{const p=getPiece(id);if(!p)return;p.x=clamp(p.x+dx,0,S.wall.w-p.w);p.y=clamp(p.y+dy,0,S.wall.h-p.h);renderPiece(p);});
  checkConflicts();renderConflicts();updateStatus();updatePropsPanel();
}

let toastTO=null;
function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){
    t=document.createElement('div');t.id='toast';
    Object.assign(t.style,{position:'fixed',bottom:'40px',left:'50%',transform:'translateX(-50%)',
      background:'rgba(10,10,20,.9)',color:'var(--text)',fontFamily:"'Space Mono',monospace",
      fontSize:'11px',padding:'7px 14px',borderRadius:'5px',border:'1px solid var(--border2)',
      zIndex:9999,transition:'opacity .3s',pointerEvents:'none'});
    document.body.appendChild(t);
  }
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(toastTO);toastTO=setTimeout(()=>{t.style.opacity='0';},2200);
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ══════════════════════════════════════════
// ADD DRAWER
// ══════════════════════════════════════════
let drawerTab='art';
let drawerFilters={size:null,style:null}; // null = all
let drawerSel=new Set(); // selected item keys in drawer

function openDrawer(){
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-backdrop').classList.add('show');
  renderDrawerFilters();
  renderDrawerGrid();
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').classList.remove('show');
  drawerSel.clear();
  updateDrawerFooter();
}
function switchDrawerTab(tab){
  drawerTab=tab;
  drawerFilters={size:null,style:null};
  drawerSel.clear();
  document.querySelectorAll('.dtab').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  renderDrawerFilters();
  renderDrawerGrid();
  updateDrawerFooter();
}

function renderDrawerFilters(){
  const bar=document.getElementById('drawer-filters');if(!bar)return;
  bar.innerHTML='';
  if(drawerTab==='art'){
    [['size',null,'All Sizes'],['size','s','Small'],['size','m','Medium'],['size','l','Large']].forEach(([key,val,lbl])=>{
      const b=document.createElement('button');b.className='dfbtn'+(drawerFilters[key]===val?' on':'');
      b.textContent=lbl;b.onclick=()=>{drawerFilters[key]=val;renderDrawerFilters();renderDrawerGrid();};
      bar.appendChild(b);
    });
    const div=document.createElement('div');div.style.cssText='width:1px;height:18px;background:var(--border2);flex-shrink:0;margin:0 2px';bar.appendChild(div);
    [['style',null,'All'],['style','framed','Framed'],['style','unframed','Unframed'],['style','canvas','Canvas']].forEach(([key,val,lbl])=>{
      const b=document.createElement('button');b.className='dfbtn'+(drawerFilters[key]===val?' on':'');
      b.textContent=lbl;b.onclick=()=>{drawerFilters[key]=val;renderDrawerFilters();renderDrawerGrid();};
      bar.appendChild(b);
    });
  }
}

function drawerSizeGroup(item){
  const long=Math.max(item.w,item.h);
  if(long<=16)return's';
  if(long<=24)return'm';
  return'l';
}

function renderDrawerGrid(){
  const grid=document.getElementById('drawer-grid');if(!grid)return;
  grid.innerHTML='';
  const REF=36,MAX_PX=160,MIN_PX=52;
  const factor=MAX_PX/REF;

  function cardSize(w,h){
    let dw=w*factor,dh=h*factor;
    const minDim=Math.min(dw,dh);
    if(minDim<MIN_PX){const s=MIN_PX/minDim;dw*=s;dh*=s;}
    return{dw:Math.round(dw),dh:Math.round(dh)};
  }

  if(drawerTab==='art'){
    let items=S.library;
    if(drawerFilters.size)items=items.filter(i=>drawerSizeGroup(i)===drawerFilters.size);
    if(drawerFilters.style==='framed')items=items.filter(i=>i.framed);
    else if(drawerFilters.style==='unframed')items=items.filter(i=>!i.framed&&i.type!=='Stretched Canvas');
    else if(drawerFilters.style==='canvas')items=items.filter(i=>i.type==='Stretched Canvas');
    if(!items.length){
      grid.innerHTML='<div style="width:100%;text-align:center;padding:30px;color:var(--muted);font-size:11px">No artwork matches.<br>Add pieces in the Library.</div>';
      return;
    }
    items.forEach(item=>{
      const key='lib:'+item.id;
      const onWall=item.placedId&&S.pieces.find(p=>p.id===item.placedId);
      const {dw,dh}=cardSize(item.w,item.h);
      const card=document.createElement('div');
      card.className='dcard'+(drawerSel.has(key)?' dsel':'')+(onWall?' lifting':'');
      card.style.width=dw+'px';card.style.height=dh+'px';
      if(item.img){
        const img=document.createElement('img');img.className='dcard-thumb';
        img.src=item.img;img.style.cssText='width:100%;height:100%;object-fit:cover;flex:1';
        card.appendChild(img);
      }else{
        const blank=document.createElement('div');blank.className='dcard-blank';blank.textContent='🖼';
        blank.style.flex='1';card.appendChild(blank);
      }
      const info=document.createElement('div');info.className='dcard-info';
      info.innerHTML=`<div class="dcard-name">${esc(item.name)}</div><div class="dcard-dims">${item.w}"×${item.h}"</div>`;
      if(item.tags&&item.tags.length){
        const tags=document.createElement('div');tags.className='dcard-tags';
        item.tags.slice(0,3).forEach(t=>{const s=document.createElement('span');s.className='dcard-tag';s.textContent=t;tags.appendChild(s);});
        info.appendChild(tags);
      }
      card.appendChild(info);
      if(onWall){card.title='Already on wall';card.style.opacity='.5';}
      else setupCardInteraction(card,key,{type:'lib',item});
      grid.appendChild(card);
    });

    // Custom art button
    const custom=document.createElement('div');
    custom.className='dcard';custom.style.cssText='width:80px;height:80px;align-items:center;justify-content:center;border-style:dashed;cursor:pointer';
    custom.innerHTML='<div style="text-align:center;color:var(--muted);font-size:10px;padding:8px">+ Custom</div>';
    custom.onclick=()=>{closeDrawer();document.getElementById('m-custom-piece').classList.remove('hide');};
    grid.appendChild(custom);

  }else if(drawerTab==='frames'){
    FRAME_GROUPS.forEach(g=>{
      g.sizes.forEach(s=>{
        const key='frame:'+g.name+':'+s.w+':'+s.h;
        const {dw,dh}=cardSize(s.w,s.h);
        const card=document.createElement('div');
        card.className='dcard'+(drawerSel.has(key)?' dsel':'');
        card.style.width=dw+'px';card.style.height=dh+'px';
        const blank=document.createElement('div');blank.style.cssText='flex:1;display:flex;align-items:center;justify-content:center';
        blank.innerHTML='<div style="font-size:9px;color:var(--dim);text-align:center;padding:4px">'+esc(g.name)+'</div>';
        card.appendChild(blank);
        const info=document.createElement('div');info.className='dcard-info';
        info.innerHTML=`<div class="dcard-name">${esc(g.name)}</div><div class="dcard-dims">${s.w}"×${s.h}"</div>`;
        card.appendChild(info);
        setupCardInteraction(card,key,{type:'frame',frame:{name:g.name,w:s.w,h:s.h}});
        grid.appendChild(card);
      });
    });
    const custom=document.createElement('div');
    custom.className='dcard';custom.style.cssText='width:80px;height:80px;align-items:center;justify-content:center;border-style:dashed;cursor:pointer';
    custom.innerHTML='<div style="text-align:center;color:var(--muted);font-size:10px;padding:8px">+ Custom</div>';
    custom.onclick=()=>{closeDrawer();document.getElementById('m-custom-piece').classList.remove('hide');};
    grid.appendChild(custom);

  }else if(drawerTab==='shelves'){
    IKEA_LEDGES.forEach(l=>{
      const key='shelf:'+l.n;
      const card=document.createElement('div');
      card.className='dcard shelf-dcard'+(drawerSel.has(key)?' dsel':'');
      const bar=document.createElement('div');bar.className='shelf-dcard-bar';
      bar.style.width=Math.max(20,Math.min(80,Math.round(l.w*1.5)))+'px';
      bar.style.background=l.type==='ledge'?'#8a7050':'#7a6548';
      const info=document.createElement('div');info.className='dcard-info';
      info.style.background='none';info.style.padding='0';
      info.innerHTML=`<div class="dcard-name">${esc(l.n)}</div><div class="dcard-dims">${l.w}"×${l.h}" · ${l.type||'shelf'}</div>`;
      card.appendChild(bar);card.appendChild(info);
      setupCardInteraction(card,key,{type:'shelf',shelf:l});
      grid.appendChild(card);
    });
    const custom=document.createElement('div');
    custom.className='dcard shelf-dcard';custom.style.cssText='border-style:dashed;cursor:pointer';
    custom.innerHTML='<div style="color:var(--muted);font-size:10px;padding:4px 8px">+ Custom Shelf / Ledge</div>';
    custom.onclick=()=>{closeDrawer();document.getElementById('m-custom-shelf').classList.remove('hide');};
    grid.appendChild(custom);
  }
  updateDrawerFooter();
}

function updateDrawerFooter(){
  const count=drawerSel.size;
  const countEl=document.getElementById('drawer-count');
  const addBtn=document.getElementById('drawer-add-btn');
  if(countEl)countEl.textContent=count===0?'Select pieces to add':`${count} selected`;
  if(addBtn){
    addBtn.textContent=count===0?'Add to Wall':count===1?'Add to Wall':`Add ${count} to Wall`;
    addBtn.disabled=count===0;
  }
}

// ── Card interaction: tap to select, longpress to drag ──
let _lpTimer=null,_lpStart={x:0,y:0},_lpData=null,_lpCard=null;

function setupCardInteraction(card,key,data){
  card.addEventListener('pointerdown',e=>{
    if(e.button!==0&&e.button!==undefined)return;
    _lpStart={x:e.clientX,y:e.clientY};_lpData=data;_lpCard=card;
    _lpTimer=setTimeout(()=>{
      _lpTimer=null;
      if(navigator.vibrate)navigator.vibrate(30);
      startDrawerDrag(e,key,data,card);
    },420);
  });
  card.addEventListener('pointermove',e=>{
    if(!_lpTimer)return;
    if(Math.abs(e.clientX-_lpStart.x)>8||Math.abs(e.clientY-_lpStart.y)>8){
      clearTimeout(_lpTimer);_lpTimer=null;
    }
  });
  card.addEventListener('pointerup',e=>{
    if(_lpTimer){
      clearTimeout(_lpTimer);_lpTimer=null;
      // Tap → toggle selection
      if(drawerSel.has(key))drawerSel.delete(key);
      else drawerSel.add(key);
      card.classList.toggle('dsel',drawerSel.has(key));
      updateDrawerFooter();
    }
  });
  card.addEventListener('pointercancel',()=>{clearTimeout(_lpTimer);_lpTimer=null;});
}

// ── Drag ghost ──
let _drag={active:false,ghost:null,data:null,key:null};

function startDrawerDrag(e,key,data,card){
  card.classList.add('lifting');
  const ghost=document.getElementById('drag-ghost');
  ghost.textContent=data.type==='lib'?data.item.name:data.type==='frame'?data.frame.name:data.shelf.n;
  ghost.style.display='flex';
  ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  _drag={active:true,ghost,data,key,card};
  document.addEventListener('pointermove',onDragGhostMove,{passive:false});
  document.addEventListener('pointerup',onDragGhostUp);
}

function onDragGhostMove(e){
  if(!_drag.active)return;
  e.preventDefault();
  _drag.ghost.style.left=e.clientX+'px';
  _drag.ghost.style.top=e.clientY+'px';
}

function onDragGhostUp(e){
  if(!_drag.active)return;
  document.removeEventListener('pointermove',onDragGhostMove);
  document.removeEventListener('pointerup',onDragGhostUp);
  _drag.ghost.style.display='none';
  _drag.card?.classList.remove('lifting');
  // Check if dropped over the wall
  const wallEl=document.getElementById('wall');
  if(wallEl){
    const r=wallEl.getBoundingClientRect();
    if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){
      const wx=(e.clientX-r.left)/S.scale;
      const wy=(e.clientY-r.top)/S.scale;
      addPieceFromDrawerAtPos(_drag.data,wx,wy);
      closeDrawer();
    }
  }
  _drag={active:false,ghost:null,data:null,key:null,card:null};
}

function addPieceFromDrawerAtPos(data,wx,wy){
  pushUndo();
  if(data.type==='lib'){
    const item=data.item;
    if(item.placedId&&S.pieces.find(p=>p.id===item.placedId)){showToast('"'+item.name+'" already on wall.');return;}
    const piece={
      id:S.nid++,type:'art',
      x:clamp(wx-item.w/2,0,S.wall.w-item.w),y:clamp(wy-item.h/2,0,S.wall.h-item.h),
      w:item.w,h:item.h,shape:'rect',color:'#2a2a2a',
      img:item.img||null,imgOX:0,imgOY:0,imgZ:1,
      label:item.name,gid:null,zi:S.pieces.length+1,
      libId:item.id,conflict:false,gw:false,owarn:false,ywarn:false,
      snapToShelf:true,snappedToShelfId:null,artType:item.type||null,
      frameVisible:!!(item.framed),frameColor:item.frameColor?.hex||null,frameThickness:1,
    };
    item.placedId=piece.id;persistLibrary();
    S.pieces.push(piece);mkArtEl(piece);
    checkConflicts();renderConflicts();updateStatus();
    select(piece.id,false);renderLibrary();
  }else if(data.type==='frame'){
    const f=data.frame;
    const piece={
      id:S.nid++,type:'art',
      x:clamp(wx-f.w/2,0,S.wall.w-f.w),y:clamp(wy-f.h/2,0,S.wall.h-f.h),
      w:f.w,h:f.h,shape:'rect',color:'#2a2a2a',
      img:null,imgOX:0,imgOY:0,imgZ:1,
      label:f.name,gid:null,zi:S.pieces.length+1,
      conflict:false,gw:false,owarn:false,ywarn:false,
      snapToShelf:true,snappedToShelfId:null,artType:null,
      frameVisible:false,frameColor:null,frameThickness:1,
    };
    S.pieces.push(piece);mkArtEl(piece);
    checkConflicts();renderConflicts();updateStatus();
    select(piece.id,false);
  }else if(data.type==='shelf'){
    const l=data.shelf;
    const piece={
      id:S.nid++,type:'shelf',
      x:clamp(wx-l.w/2,0,S.wall.w-l.w),y:clamp(wy-l.h/2,0,S.wall.h-l.h),
      w:l.w,h:l.h,color:'#7a6548',
      label:l.n,shelfType:l.type||'shelf',
      gid:null,zi:S.pieces.length+1,
      conflict:false,gw:false,owarn:false,ywarn:false
    };
    S.pieces.push(piece);mkShelfEl(piece);
    checkConflicts();renderConflicts();updateStatus();
    select(piece.id,false);
  }
}

function addSelectedFromDrawer(){
  if(!drawerSel.size)return;
  pushUndo();
  const newIds=[];
  drawerSel.forEach(key=>{
    const parts=key.split(':');
    if(parts[0]==='lib'){
      const item=S.library.find(i=>String(i.id)===parts[1]);
      if(!item||item.placedId&&S.pieces.find(p=>p.id===item.placedId))return;
      const pos=findEmptySpot(item.w,item.h);
      const piece={
        id:S.nid++,type:'art',x:pos.x,y:pos.y,
        w:item.w,h:item.h,shape:'rect',color:'#2a2a2a',
        img:item.img||null,imgOX:0,imgOY:0,imgZ:1,
        label:item.name,gid:null,zi:S.pieces.length+1,
        libId:item.id,conflict:false,gw:false,owarn:false,ywarn:false,
        snapToShelf:true,snappedToShelfId:null,artType:item.type||null,
        frameVisible:!!(item.framed),frameColor:item.frameColor?.hex||null,frameThickness:1,
      };
      item.placedId=piece.id;S.pieces.push(piece);mkArtEl(piece);newIds.push(piece.id);
    }else if(parts[0]==='frame'){
      const [,name,,w,,h]=key.split(':');
      const fw=parseFloat(w),fh=parseFloat(h);
      const pos=findEmptySpot(fw,fh);
      const piece={
        id:S.nid++,type:'art',x:pos.x,y:pos.y,
        w:fw,h:fh,shape:'rect',color:'#2a2a2a',
        img:null,imgOX:0,imgOY:0,imgZ:1,
        label:name,gid:null,zi:S.pieces.length+1,
        conflict:false,gw:false,owarn:false,ywarn:false,
        snapToShelf:true,snappedToShelfId:null,artType:null,
        frameVisible:false,frameColor:null,frameThickness:1,
      };
      S.pieces.push(piece);mkArtEl(piece);newIds.push(piece.id);
    }else if(parts[0]==='shelf'){
      const l=IKEA_LEDGES.find(x=>x.n===parts.slice(1).join(':'));
      if(!l)return;
      const pos=findEmptySpot(l.w,l.h);
      const piece={
        id:S.nid++,type:'shelf',x:pos.x,y:pos.y,
        w:l.w,h:l.h,color:'#7a6548',
        label:l.n,shelfType:l.type||'shelf',
        gid:null,zi:S.pieces.length+1,
        conflict:false,gw:false,owarn:false,ywarn:false
      };
      S.pieces.push(piece);mkShelfEl(piece);newIds.push(piece.id);
    }
  });
  persistLibrary();
  checkConflicts();renderConflicts();updateStatus();
  // Select all newly added pieces
  S.sel.clear();
  newIds.forEach(id=>S.sel.add(id));
  refreshSel();updatePropsPanel();updateStatus();
  if(newIds.length)showPiecePanel();
  renderLibrary();
  closeDrawer();
}

// ══════════════════════════════════════════
// START
// ══════════════════════════════════════════
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
else{init();}
