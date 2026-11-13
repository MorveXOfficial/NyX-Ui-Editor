/* NyX UI Editor - Full Version */
let CW=1920, CH=1080;
const i18n={
  en:{
    ai:'AI Generate',clear:'Clear',export:'Export Lua',components:'Components',presets:'Presets',layers:'Layers',
    shapes:'Shapes',controls:'Controls',rect:'Rectangle',square:'Square',circle:'Circle',triangle:'Triangle',
    line:'Line',rhombus:'Rhombus',button:'Button',label:'Label',editbox:'Edit Box',checkbox:'Checkbox',
    progress:'Progress',image:'Image',readyBtns:'Ready Buttons',icons:'Icons',hudIcons:'HUD Icons',panels:'Panels',
    darkPanel:'Dark Panel',glassPanel:'Glass',card:'Card',noLayers:'No layers yet',properties:'Properties',
    selectEl:'Select an element',hint:'Drag components onto the canvas',aiTitle:'AI Generate',
    cancel:'Cancel',generate:'Generate',exportTitle:'Export Lua',close:'Close',copy:'Copy',download:'Download',
    aiPh:'Describe the UI you want...',delete:'Delete Element',varName:'Variable Name',posSize:'Position & Size',
    color:'Color',hover:'Hover Color',gradient:'Gradient',angle:'Angle',textColor:'Text Color',
    radius:'Radius',alpha:'Alpha',rotation:'Rotation',text:'Text',font:'Font',weight:'Weight',size:'Size',
    enable:'Enable',yes:'Yes',no:'No'
  },
  fa:{
    ai:'تولید با هوش مصنوعی',clear:'پاک کردن',export:'خروجی Lua',components:'کامپوننت‌ها',presets:'آماده',layers:'لایه‌ها',
    shapes:'اشکال',controls:'کنترل‌ها',rect:'مستطیل',square:'مربع',circle:'دایره',triangle:'مثلث',
    line:'خط',rhombus:'لوزی',button:'دکمه',label:'متن',editbox:'جعبه متن',checkbox:'چک‌باکس',
    progress:'نوار پیشرفت',image:'تصویر',readyBtns:'دکمه‌های آماده',icons:'آیکون‌ها',hudIcons:'آیکون‌های HUD',panels:'پنل‌ها',
    darkPanel:'پنل تیره',glassPanel:'شیشه‌ای',card:'کارت',noLayers:'هنوز لایه‌ای نیست',properties:'ویژگی‌ها',
    selectEl:'یک المان انتخاب کنید',hint:'کامپوننت‌ها را روی بوم بکشید',aiTitle:'تولید با هوش مصنوعی',
    cancel:'لغو',generate:'تولید',exportTitle:'خروجی Lua',close:'بستن',copy:'کپی',download:'دانلود',
    aiPh:'رابط کاربری مورد نظرتان را توصیف کنید...',delete:'حذف المان',varName:'نام متغیر',posSize:'موقعیت و اندازه',
    color:'رنگ',hover:'رنگ هاور',gradient:'گرادیان',angle:'زاویه',textColor:'رنگ متن',
    radius:'انحنا',alpha:'شفافیت',rotation:'چرخش',text:'متن',font:'فونت',weight:'ضخامت',size:'اندازه',
    enable:'فعال',yes:'بله',no:'خیر'
  },
  ar:{
    ai:'توليد بالذكاء',clear:'مسح',export:'تصدير Lua',components:'المكونات',presets:'جاهز',layers:'الطبقات',
    shapes:'أشكال',controls:'عناصر',rect:'مستطيل',square:'مربع',circle:'دائرة',triangle:'مثلث',
    line:'خط',rhombus:'معين',button:'زر',label:'نص',editbox:'حقل',checkbox:'اختيار',
    progress:'شريط',image:'صورة',readyBtns:'أزرار جاهزة',icons:'أيقونات',hudIcons:'أيقونات HUD',panels:'لوحات',
    darkPanel:'لوحة داكنة',glassPanel:'زجاج',card:'بطاقة',noLayers:'لا طبقات',properties:'خصائص',
    selectEl:'اختر عنصراً',hint:'اسحب المكونات إلى اللوحة',aiTitle:'توليد بالذكاء',
    cancel:'إلغاء',generate:'توليد',exportTitle:'تصدير Lua',close:'إغلاق',copy:'نسخ',download:'تحميل',
    aiPh:'صف الواجهة التي تريدها...',delete:'حذف',varName:'اسم المتغير',posSize:'الموضع والحجم',
    color:'لون',hover:'لون التحويم',gradient:'تدرج',angle:'زاوية',textColor:'لون النص',
    radius:'انحناء',alpha:'شفافية',rotation:'دوران',text:'نص',font:'خط',weight:'سُمك',size:'حجم',
    enable:'تفعيل',yes:'نعم',no:'لا'
  }
};

let lang='en', zoom=1, nextId=1, selected=null, selectedIds=[], dragType=null;
const SNAP=8;
let dragStartPositions={};

function getSelectedEls(){
  const ids = selectedIds.length ? selectedIds : (selected ? [selected] : []);
  return elements.filter(e => ids.includes(e.id));
}
function setSelection(ids, primary){
  selectedIds = [...new Set(ids)];
  selected = primary || selectedIds[selectedIds.length-1] || null;
}
function isSelected(id){
  return selectedIds.includes(id) || selected === id;
}


let elements=[], history=[], histIdx=-1;
let dragging=false, resizing=false, resizeH=null, dragOff={x:0,y:0};

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const t=k=>(i18n[lang]&&i18n[lang][k])||i18n.en[k]||k;

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  var ta = document.getElementById('aiPrompt');
  if (ta) ta.placeholder = t('aiPh');
  document.documentElement.dir = (lang === 'fa' || lang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  try { buildAiPresets(); } catch(e) {}
  try { buildIconGrid(); } catch(e) {}
}

function saveHistory(){
  history=history.slice(0,histIdx+1);
  history.push(JSON.parse(JSON.stringify(elements)));
  if(history.length>50) history.shift();
  histIdx=history.length-1;
}
function undo(){ if(histIdx>0){ histIdx--; elements=JSON.parse(JSON.stringify(history[histIdx])); selected=null; render(); }}
function redo(){ if(histIdx<history.length-1){ histIdx++; elements=JSON.parse(JSON.stringify(history[histIdx])); selected=null; render(); }}

function hexRgb(h){ h=(h||'#000').replace('#',''); if(h.length===3)h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16)||0; return[(n>>16)&255,(n>>8)&255,n&255]; }

function createEl(type,x=100,y=100,extra={}){
  const id='el_'+(nextId++);
  const base={id,type,x,y,w:100,h:100,color:'#3B82F6',hoverColor:'#1e40af',gradient:false,gradFade:false,gradIntensity:100,angle:180,iconColor:'',blur:0,imageData:'',imageName:'',
    textColor:'#FFFFFF',textColor2:'#3b82f6',textGradient:false,radius:0,alpha:1,rotation:0,font:'Inter',weight:'Regular',size:14,text:'',varName:type+'_'+nextId,progress:70,stroke:false,strokeWidth:2,strokeColor:'#ffffff',strike:false,underline:false,glow:false,glowColor:'#3b82f6',glowSize:16,glowIntensity:60,imageTint:'',imageTintMode:'none'};
  Object.assign(base,extra);
  switch(type){
    case 'square': base.w=100;base.h=100;break;
    case 'rectangle': base.w=180;base.h=80;break;
    case 'circle': base.w=90;base.h=90;base.radius=45;break;
    case 'triangle': base.w=100;base.h=90;break;
    case 'line': base.w=160;base.h=3;break;
    case 'rhombus': base.w=100;base.h=100;break;
    case 'button': base.w=140;base.h=40;base.radius=8;base.text='Button';break;
    case 'label': base.w=160;base.h=30;base.color='transparent';base.text='Label';break;
    case 'editbox': base.w=200;base.h=38;base.radius=6;base.color='#1a1a24';base.text='';break;
    case 'checkbox': base.w=24;base.h=24;base.radius=4;base.color='#3B82F6';break;
    case 'progress': base.w=200;base.h=14;base.radius=7;base.color='#22c55e';base.hoverColor='#1a1a24';break;
    case 'image': base.w=100;base.h=100;base.color='#333';break;
    case 'icon': base.w=32;base.h=32;base.color='transparent';base.iconType=base.iconType||'info';break;
  }
  return base;
}

function addPreset(name){
  saveHistory();
  const cx=CW/2,cy=CH/2;
  const map={
    submit:()=>createEl('button',cx-70,cy,{text:'Submit',color:'#22c55e',hoverColor:'#16a34a',radius:8,w:140,h:42,varName:'btn_submit'}),
    cancel:()=>createEl('button',cx-70,cy,{text:'Cancel',color:'#ef4444',hoverColor:'#dc2626',radius:8,w:140,h:42,varName:'btn_cancel'}),
    select:()=>createEl('button',cx-70,cy,{text:'Select',color:'#3b82f6',hoverColor:'#2563eb',radius:8,w:140,h:42,varName:'btn_select'}),
    confirm:()=>createEl('button',cx-70,cy,{text:'Confirm',color:'#8b5cf6',hoverColor:'#7c3aed',radius:8,w:140,h:42,varName:'btn_confirm'}),
    close:()=>createEl('button',cx-30,cy,{text:'✕',color:'#333',hoverColor:'#555',radius:6,w:40,h:40,size:16,varName:'btn_close'}),
    next:()=>createEl('button',cx-70,cy,{text:'Next →',color:'#3b82f6',radius:8,w:140,h:42,varName:'btn_next'}),
    back:()=>createEl('button',cx-70,cy,{text:'← Back',color:'#555',radius:8,w:140,h:42,varName:'btn_back'}),
    buy:()=>createEl('button',cx-70,cy,{text:'Buy Now',color:'#22c55e',radius:8,w:140,h:42,varName:'btn_buy'}),
    icon_hp:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'hp',varName:'icon_hp'}),
    icon_armor:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'armor',varName:'icon_armor'}),
    icon_food:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'food',varName:'icon_food'}),
    icon_water:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'water',varName:'icon_water'}),
    icon_warn:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'warn',varName:'icon_warn'}),
    icon_success:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'success',varName:'icon_success'}),
    icon_error:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'error',varName:'icon_error'}),
    icon_info:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'info',varName:'icon_info'}),
    icon_x:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'close',varName:'icon_close'}),
    icon_star:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'star',varName:'icon_star'}),
    icon_lock:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'lock',varName:'icon_lock'}),
    icon_user:()=>createEl('icon',cx-16,cy,{w:32,h:32,iconType:'user',varName:'icon_user'}),
    panel_dark:()=>createEl('rectangle',cx-200,cy-150,{w:400,h:300,color:'#14141c',radius:12,varName:'panel_dark'}),
    panel_glass:()=>createEl('rectangle',cx-200,cy-150,{w:400,h:300,color:'#ffffff',alpha:0.08,radius:12,varName:'panel_glass'}),
    panel_card:()=>createEl('rectangle',cx-180,cy-120,{w:360,h:240,color:'#1e1e2e',radius:14,gradient:true,hoverColor:'#2a2a3e',angle:180,varName:'panel_card'}),
    char_male:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#3b82f6',varName:'char_male',text:'MALE',charType:'male'}),
    char_female:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#ec4899',varName:'char_female',text:'FEMALE',charType:'female'}),
    char_cj:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#22c55e',varName:'char_cj',text:'CJ',charType:'cj'}),
    char_cop:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#3b82f6',varName:'char_cop',text:'COP',charType:'cop'}),
    char_medic:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#ef4444',varName:'char_medic',text:'MEDIC',charType:'medic'}),
    char_biker:()=>createEl('image',cx-40,cy-60,{w:80,h:120,color:'#a855f7',varName:'char_biker',text:'BIKER',charType:'biker'}),

  };
  if(map[name]){ const el=map[name](); elements.push(el); selected=el.id; render(); return; }
  if(name && name.startsWith('custom_')){
    const cid = name.replace('custom_','');
    const ic = (customIcons||[]).find(c=>c.id===cid);
    if(ic){
      const el=createEl('image', cx-24, cy-24, {
        w:48, h:48, color:'transparent',
        imageData:ic.dataUrl, imageName:ic.name,
        varName:('icon_'+String(ic.name||'custom').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_]/g,'_')).slice(0,40)
      });
      uploadedImages[el.id]={name:ic.name, dataUrl:ic.dataUrl};
      elements.push(el); selected=el.id; selectedIds=[el.id]; render();
    }
    return;
  }
  if(name && name.startsWith('icon_')){
    const itype = name.replace('icon_','');
    if(ICON_SVGS[itype]){
      const el=createEl('icon',cx-16,cy,{w:32,h:32,iconType:itype,varName:'icon_'+itype});
      elements.push(el); selected=el.id; selectedIds=[el.id]; render();
    }
  }
}


const ICON_SVGS = {
  hp: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c1.74 0 3.41 1.01 4.5 2.09C12.09 6.01 13.76 5 15.5 5 19 5 21.5 8.5 21.5 12.5 19 16.65 12 21 12 21z"/></svg>',
  armor: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>',
  food: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M18.06 3a4.94 4.94 0 00-3.53 1.46L12 7l-2.53-2.54A5 5 0 005.94 3H4v2h1.94a3 3 0 012.12.88L11 8.8V21h2V8.8l2.94-2.92A3 3 0 0118.06 5H20V3h-1.94z"/></svg>',
  water: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#06b6d4" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/></svg>',
  stamina: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a3e635" d="M13 2L4 14h7l-1 8 10-14h-7l1-6z"/></svg>',
  oxygen: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M12 2a5 5 0 015 5c0 3-5 9-5 9S7 10 7 7a5 5 0 015-5zm0 7a2 2 0 100-4 2 2 0 000 4z"/></svg>',
  mana: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#8b5cf6" d="M12 2l2 6h6l-5 4 2 7-5-3.5L7 19l2-7-5-4h6z"/></svg>',
  xp: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>',
  warn: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  success: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle fill="#22c55e" cx="12" cy="12" r="10"/><path fill="#fff" d="M10 15.5l-3.5-3.5 1.4-1.4L10 12.7l5.6-5.6 1.4 1.4L10 15.5z"/></svg>',
  error: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle fill="#ef4444" cx="12" cy="12" r="10"/><path fill="#fff" d="M15.5 8.5l-1.4-1.4L12 9.2 9.9 7.1 8.5 8.5 10.6 10.6 8.5 12.7l1.4 1.4L12 12l2.1 2.1 1.4-1.4L13.4 10.6z"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle fill="#3b82f6" cx="12" cy="12" r="10"/><path fill="#fff" d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle fill="#333" cx="12" cy="12" r="10"/><path fill="#fff" stroke="#fff" stroke-width="1.5" d="M15.5 8.5l-7 7M8.5 8.5l7 7"/></svg>',
  question: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#6366f1" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92A2.5 2.5 0 0012 12h-1v-1a2 2 0 011.55-1.96 1.5 1.5 0 10-1.05-2.5 1.5 1.5 0 00-1.45 1H8a3.5 3.5 0 117 0c0 1.25-.62 1.87-1.93 3.25z"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z"/></svg>',
  unlock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M18 8h-1V6a5 5 0 00-9.9-1h2.02A3 3 0 0117 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/></svg>',
  users: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19.14 12.94a7.5 7.5 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.3 7.3 0 00-1.63-.94l-.36-2.54A.5.5 0 0014 2h-4a.5.5 0 00-.5.42l-.36 2.54c-.6.24-1.15.55-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.7 8.84a.5.5 0 00.12.64l2.03 1.58a7.5 7.5 0 000 1.88L2.82 14.5a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.48.39 1.03.7 1.63.94l.36 2.54a.5.5 0 00.5.42h4a.5.5 0 00.5-.42l.36-2.54c.6-.24 1.15-.55 1.63-.94l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.56zM12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5z"/></svg>',
  home: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 5h2v2H3V5zm4 0h14v2H7V5zM3 11h2v2H3v-2zm4 0h14v2H7v-2zM3 17h2v2H3v-2zm4 0h14v2H7v-2z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 5h18v2l-7 8v5l-4-2v-3L3 7V5z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zM15 9H5V5h10v4z"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M5 20h14v-2H5v2zM9 15h6v-6h4l-7-7-7 7h4v6z"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M18 16a3 3 0 00-2.46 1.25L9.9 13.9a3.1 3.1 0 000-1.8l5.64-3.35A3 3 0 1015 6a3 3 0 00.1.75L9.46 10.1a3 3 0 100 3.8l5.64 3.35A3 3 0 1018 16z"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M3.9 12a5 5 0 017.07-7.07l1.76 1.76-1.41 1.41-1.76-1.76a3 3 0 10-4.24 4.24l1.76 1.76-1.41 1.41L3.9 12zm6.54 1.24l1.41-1.41 4.24 4.24a3 3 0 01-4.24 4.24l-1.76-1.76-1.41 1.41 1.76 1.76a5 5 0 007.07-7.07l-4.24-4.24-1.83 1.83z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19 13H5v-2h14v2z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  arrow_up: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7 14l5-5 5 5H7z"/></svg>',
  arrow_down: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7 10l5 5 5-5H7z"/></svg>',
  arrow_left: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M14 7l-5 5 5 5V7z"/></svg>',
  arrow_right: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M10 17l5-5-5-5v10z"/></svg>',
  chevron_up: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>',
  chevron_down: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M17.65 6.35A8 8 0 104 12h2a6 6 0 119.9-4.5L14 10h7V3l-3.35 3.35z"/></svg>',
  power: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6 6 0 1112 6v2a4 4 0 104 4h2a6 6 0 01-2.17-9.83z"/></svg>',
  gun: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2v2c2.33 0 4-1.67 4-4 0-.55.45-1 1-1h7v-2H7zm14-7h-2V5h-2v2h-2v2h2v6h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 6h-2v-4h2v4z"/></svg>',
  car: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
  bike: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M18.5 8.5a3.5 3.5 0 11-3.4 4.2L12 15l-2.5-4H6v2H4V9h5l2.5 4 2.6-2.1A3.5 3.5 0 0118.5 8.5zM5.5 16a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm13 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/></svg>',
  plane: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
  boat: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#06b6d4" d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l2.18-7.65-2.23-.73V4h-5v1H9V4H4v6.62l-2.23.73L3.95 19z"/></svg>',
  house: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4v14a2 2 0 002 2h12a2 2 0 002-2V6h-4zM10 4h4v2h-4V4zm6 16H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8v-2h8v2z"/></svg>',
  bank: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/></svg>',
  money: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.02 1.83-1.39 2.83-3.12 3.16z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-1h2v1zm0-3h-2V7h2v7z"/></svg>',
  key: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14a2 2 0 110-4 2 2 0 010 4z"/></svg>',
  map: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9A.5.5 0 003 5.38V20.5a.5.5 0 00.63.48L9 18.9l6 2.1 5.64-1.9a.5.5 0 00.36-.48V3.5a.5.5 0 00-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
  location: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 14.5L8.5 13 7.5 8.5 15.5 12l0 4.5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11H7v-2h4V6h2v7z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.57 3.6 1 1 0 01-.25 1L6.6 10.8z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  camera: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 15.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4zM9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z"/></svg>',
  volume: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.3v7.4a4.5 4.5 0 002.5-3.7z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M16.5 12A4.5 4.5 0 0014 8.3v2.06l2.45 2.45c.03-.27.05-.54.05-.81zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.24 4.24 0 00-6 0zm-4-4l2 2a7.07 7.07 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
  battery: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>',
  flash: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>',
  eye_off: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55A2.98 2.98 0 009 12a3 3 0 003 3c.35 0 .69-.07 1-.18l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 01-5-5c0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16a3 3 0 00-3-3l-.17.01z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c1.74 0 3.41 1.01 4.5 2.09C12.09 6.01 13.76 5 15.5 5 19 5 21.5 8.5 21.5 12.5 19 16.65 12 21 12 21z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2H20V6z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M19 5h-2V3H7v2H5a2 2 0 00-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7a2 2 0 00-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>',
  medal: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.7l5.4-.8L12 2z"/></svg>',
  target: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-14a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z"/></svg>',
  skull: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 2C7 2 3 6 3 11c0 3 1.5 5.5 3.5 7v2h2v-2h1v2h2v-2h1v2h2v-2c2-1.5 3.5-4 3.5-7 0-5-4-9-9-9zM9 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-6 3h6v2H9v-2z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M12 12.9l1.45-1.45C14.74 10.15 16 8.55 16 6.5 16 4 14 2 12 2S8 4 8 6.5c0 2.05 1.26 3.65 2.55 4.95L12 12.9zM6 20v-2c0-2.2 3.3-3.5 6-3.5s6 1.3 6 3.5v2H6z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4m12.8-12.8l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M12 3a9 9 0 109 9c0-5-4-9-9-9z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 00-6 0c0 .35.07.69.18 1H8.18c.11-.31.18-.65.18-1a3 3 0 00-6 0c0 .35.07.69.18 1H2v2h1v11a2 2 0 002 2h14a2 2 0 002-2V8h1V6h-2zM7 4a1 1 0 110 2 1 1 0 010-2zm10 0a1 1 0 110 2 1 1 0 010-2z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M7 18a2 2 0 100 4 2 2 0 000-4zM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 007 17h12v-2H7.42a.25.25 0 01-.25-.25l.03-.12.9-1.63h7.45a2 2 0 001.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16a2 2 0 100 4 2 2 0 000-4z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"/></svg>',
  crown: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/></svg>',
  diamond: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22d3ee" d="M6 2L2 8l10 14L22 8l-4-6H6zm2.5 2h7L18 8H6l2.5-4z"/></svg>',
  fuel: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M18 10h1a1 1 0 011 1v5a1 1 0 01-2 0v-4h-1v6a2 2 0 002 2h1a3 3 0 003-3v-5.17A3 3 0 0020.17 8L16 3.83V2h-2v2H6a2 2 0 00-2 2v14h14v-2H6V10h12z"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>',
  hammer: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M2 19.6L3.4 21 13 11.4 11.6 10 2 19.6zM21.6 5.4l-2.8-2.8-5.6 5.6 2.8 2.8 5.6-5.6zM14.5 3L13 4.5 15.5 7 17 5.5 14.5 3z"/></svg>',
  code: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm1 3l4 4-4 4h2.5L11 11 7.5 7H5zm7 8h6v2h-6v-2z"/></svg>',
  server: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M4 1h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm0 8h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4a1 1 0 011-1zm0 8h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4a1 1 0 011-1zM6 4a1 1 0 100-2 1 1 0 000 2zm0 8a1 1 0 100-2 1 1 0 000 2zm0 8a1 1 0 100-2 1 1 0 000 2z"/></svg>',
  database: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm0 14c-3.87 0-6-1.5-6-2v-2.14c1.5.9 3.75 1.14 6 1.14s4.5-.24 6-1.14V17c0 .5-2.13 2-6 2z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 17.93A8 8 0 014.07 13H7a14 14 0 004 6.93zM4.07 11A8 8 0 0111 4.07V7a14 14 0 00-6.93 4H4.07zM13 4.07A8 8 0 0119.93 11H17A14 14 0 0013 7V4.07zM13 19.93A14 14 0 0017 13h2.93A8 8 0 0113 19.93z"/></svg>',
  wifi_off: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M1 9l2 2c.8-.8 1.7-1.4 2.7-1.9L1 4.3 2.3 3l18 18-1.3 1.3-5.6-5.6A6.9 6.9 0 0012 19l-3-3c1.3-1.3 3-2 4.7-2 .6 0 1.1.1 1.6.2l-2.1-2.1c-.5-.1-1-.1-1.5-.1-2.3 0-4.4.9-6 2.3L1 9zm16.3 2.3l-1.5-1.5c1.4.3 2.7.9 3.8 1.8l1.4-1.4a10 10 0 00-3.7-2.1z"/></svg>',
  image: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M17 10.5V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-3.5l4 4v-11l-4 4z"/></svg>',
  music: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M6 6h12v12H6z"/></svg>',
  radio: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/></svg>',
  headset: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 1a9 9 0 00-9 9v7a3 3 0 003 3h3v-8H5v-2a7 7 0 0114 0v2h-4v8h3a3 3 0 003-3v-7a9 9 0 00-9-9z"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zm0 10H3V9h18v8zm-3-3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 5h16v2H3V5z"/></svg>',
  id_card: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM8 14a2 2 0 110-4 2 2 0 010 4zm8 2h-4v-1h4v1zm0-3h-4v-1h4v1zm0-3h-4V9h4v1z"/></svg>',
  badge: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M14.5 1.5l1.4 3.4 3.6.5-2.6 2.6.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.6 3.6-.5L12 1.5 14.5 1.5zM5 20v-2h14v2H5z"/></svg>',
  police: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#3b82f6" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
  ambulance: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 006 0h6a3 3 0 006 0h2v-5l-3-4zM6 13H4v-2h2v2zm0-3H4V8h2v2zm0-3H4V5h2v2zm4 6H8v-2h2v2zm0-3H8V8h2v2zm0-3H8V5h2v2zm4 3h-2V8h2v2zm4.5 1.5H16V9.5h2.5l1.5 2z"/></svg>',
  hospital: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>',
  pill: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M4.22 11.29l6.36-6.36a4 4 0 015.66 5.66l-6.36 6.36a4 4 0 01-5.66-5.66zm7.78-.71l2.12-2.12a1 1 0 111.41 1.41L13.41 12 11 9.59z"/></svg>',
  syringe: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M11.66 4.5l1.41-1.41 5.66 5.66-1.41 1.41-1.41-1.41-3.54 3.54 5.66 5.66-1.41 1.41-5.66-5.66-3.54 3.54-1.41-1.41 1.41-1.41L3 9.54 4.41 8.1l5.66 5.66 3.54-3.54-1.41-1.41 1.46-1.32z"/></svg>',
  bandage: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M19.5 3.5L3.5 19.5a2 2 0 002.83 2.83L22.3 6.33a2 2 0 00-2.83-2.83zM7.5 17.5l-1-1 2-2 1 1-2 2zm4-4l-1-1 2-2 1 1-2 2zm4-4l-1-1 2-2 1 1-2 2z"/></svg>',

  circle_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#ef4444"/></svg>',
  circle_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#f97316"/></svg>',
  circle_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#f59e0b"/></svg>',
  circle_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#eab308"/></svg>',
  circle_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#84cc16"/></svg>',
  circle_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#22c55e"/></svg>',
  circle_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#14b8a6"/></svg>',
  circle_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#06b6d4"/></svg>',
  circle_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#0ea5e9"/></svg>',
  circle_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#3b82f6"/></svg>',
  circle_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#6366f1"/></svg>',
  circle_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#8b5cf6"/></svg>',
  circle_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#a855f7"/></svg>',
  circle_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#d946ef"/></svg>',
  circle_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#ec4899"/></svg>',
  circle_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#f43f5e"/></svg>',
  circle_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#94a3b8"/></svg>',
  circle_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#64748b"/></svg>',
  circle_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#fff"/></svg>',
  circle_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="#000"/></svg>',
  circle_ring_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#ef4444" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#ef4444"/></svg>',
  circle_ring_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#f97316" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#f97316"/></svg>',
  circle_ring_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#f59e0b" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#f59e0b"/></svg>',
  circle_ring_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#eab308" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#eab308"/></svg>',
  circle_ring_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#84cc16" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#84cc16"/></svg>',
  circle_ring_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#22c55e" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#22c55e"/></svg>',
  circle_ring_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#14b8a6" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#14b8a6"/></svg>',
  circle_ring_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#06b6d4" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#06b6d4"/></svg>',
  circle_ring_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#0ea5e9" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#0ea5e9"/></svg>',
  circle_ring_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#3b82f6" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#3b82f6"/></svg>',
  circle_ring_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#6366f1" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#6366f1"/></svg>',
  circle_ring_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#8b5cf6" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#8b5cf6"/></svg>',
  circle_ring_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#a855f7" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#a855f7"/></svg>',
  circle_ring_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#d946ef" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#d946ef"/></svg>',
  circle_ring_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#ec4899" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#ec4899"/></svg>',
  circle_ring_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#f43f5e" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#f43f5e"/></svg>',
  circle_ring_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#94a3b8" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#94a3b8"/></svg>',
  circle_ring_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#64748b" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#64748b"/></svg>',
  circle_ring_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>',
  circle_ring_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="8" fill="none" stroke="#000" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#000"/></svg>',
  square_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#ef4444"/></svg>',
  square_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#f97316"/></svg>',
  square_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#f59e0b"/></svg>',
  square_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#eab308"/></svg>',
  square_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#84cc16"/></svg>',
  square_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#22c55e"/></svg>',
  square_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#14b8a6"/></svg>',
  square_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#06b6d4"/></svg>',
  square_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#0ea5e9"/></svg>',
  square_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#3b82f6"/></svg>',
  square_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#6366f1"/></svg>',
  square_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#8b5cf6"/></svg>',
  square_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#a855f7"/></svg>',
  square_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#d946ef"/></svg>',
  square_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#ec4899"/></svg>',
  square_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#f43f5e"/></svg>',
  square_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#94a3b8"/></svg>',
  square_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#64748b"/></svg>',
  square_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#fff"/></svg>',
  square_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="#000"/></svg>',
  square_ring_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#ef4444" stroke-width="2"/></svg>',
  square_ring_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#f97316" stroke-width="2"/></svg>',
  square_ring_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#f59e0b" stroke-width="2"/></svg>',
  square_ring_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#eab308" stroke-width="2"/></svg>',
  square_ring_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#84cc16" stroke-width="2"/></svg>',
  square_ring_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#22c55e" stroke-width="2"/></svg>',
  square_ring_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#14b8a6" stroke-width="2"/></svg>',
  square_ring_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#06b6d4" stroke-width="2"/></svg>',
  square_ring_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#0ea5e9" stroke-width="2"/></svg>',
  square_ring_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#3b82f6" stroke-width="2"/></svg>',
  square_ring_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#6366f1" stroke-width="2"/></svg>',
  square_ring_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#8b5cf6" stroke-width="2"/></svg>',
  square_ring_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#a855f7" stroke-width="2"/></svg>',
  square_ring_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#d946ef" stroke-width="2"/></svg>',
  square_ring_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#ec4899" stroke-width="2"/></svg>',
  square_ring_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#f43f5e" stroke-width="2"/></svg>',
  square_ring_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#94a3b8" stroke-width="2"/></svg>',
  square_ring_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#64748b" stroke-width="2"/></svg>',
  square_ring_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  square_ring_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#000" stroke-width="2"/></svg>',
  tri_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#ef4444"/></svg>',
  tri_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#f97316"/></svg>',
  tri_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#f59e0b"/></svg>',
  tri_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#eab308"/></svg>',
  tri_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#84cc16"/></svg>',
  tri_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#22c55e"/></svg>',
  tri_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#14b8a6"/></svg>',
  tri_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#06b6d4"/></svg>',
  tri_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#0ea5e9"/></svg>',
  tri_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#3b82f6"/></svg>',
  tri_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#6366f1"/></svg>',
  tri_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#8b5cf6"/></svg>',
  tri_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#a855f7"/></svg>',
  tri_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#d946ef"/></svg>',
  tri_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#ec4899"/></svg>',
  tri_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#f43f5e"/></svg>',
  tri_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#94a3b8"/></svg>',
  tri_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#64748b"/></svg>',
  tri_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#fff"/></svg>',
  tri_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 21,20 3,20" fill="#000"/></svg>',
  diamond_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#ef4444"/></svg>',
  diamond_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#f97316"/></svg>',
  diamond_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#f59e0b"/></svg>',
  diamond_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#eab308"/></svg>',
  diamond_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#84cc16"/></svg>',
  diamond_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#22c55e"/></svg>',
  diamond_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#14b8a6"/></svg>',
  diamond_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#06b6d4"/></svg>',
  diamond_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#0ea5e9"/></svg>',
  diamond_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#3b82f6"/></svg>',
  diamond_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#6366f1"/></svg>',
  diamond_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#8b5cf6"/></svg>',
  diamond_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#a855f7"/></svg>',
  diamond_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#d946ef"/></svg>',
  diamond_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#ec4899"/></svg>',
  diamond_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#f43f5e"/></svg>',
  diamond_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#94a3b8"/></svg>',
  diamond_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#64748b"/></svg>',
  diamond_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#fff"/></svg>',
  diamond_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 22,12 12,22 2,12" fill="#000"/></svg>',
  hex_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#ef4444"/></svg>',
  hex_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#f97316"/></svg>',
  hex_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#f59e0b"/></svg>',
  hex_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#eab308"/></svg>',
  hex_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#84cc16"/></svg>',
  hex_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#22c55e"/></svg>',
  hex_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#14b8a6"/></svg>',
  hex_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#06b6d4"/></svg>',
  hex_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#0ea5e9"/></svg>',
  hex_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#3b82f6"/></svg>',
  hex_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#6366f1"/></svg>',
  hex_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#8b5cf6"/></svg>',
  hex_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#a855f7"/></svg>',
  hex_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#d946ef"/></svg>',
  hex_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#ec4899"/></svg>',
  hex_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#f43f5e"/></svg>',
  hex_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#94a3b8"/></svg>',
  hex_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#64748b"/></svg>',
  hex_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#fff"/></svg>',
  hex_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#000"/></svg>',
  pent_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#ef4444"/></svg>',
  pent_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#f97316"/></svg>',
  pent_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#f59e0b"/></svg>',
  pent_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#eab308"/></svg>',
  pent_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#84cc16"/></svg>',
  pent_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#22c55e"/></svg>',
  pent_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#14b8a6"/></svg>',
  pent_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#06b6d4"/></svg>',
  pent_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#0ea5e9"/></svg>',
  pent_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#3b82f6"/></svg>',
  pent_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#6366f1"/></svg>',
  pent_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#8b5cf6"/></svg>',
  pent_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#a855f7"/></svg>',
  pent_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#d946ef"/></svg>',
  pent_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#ec4899"/></svg>',
  pent_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#f43f5e"/></svg>',
  pent_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#94a3b8"/></svg>',
  pent_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#64748b"/></svg>',
  pent_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#fff"/></svg>',
  pent_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 19,8 16,18 8,18 5,8" fill="#000"/></svg>',
  star5_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#ef4444"/></svg>',
  star5_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#f97316"/></svg>',
  star5_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#f59e0b"/></svg>',
  star5_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#eab308"/></svg>',
  star5_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#84cc16"/></svg>',
  star5_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#22c55e"/></svg>',
  star5_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#14b8a6"/></svg>',
  star5_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#06b6d4"/></svg>',
  star5_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#0ea5e9"/></svg>',
  star5_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#3b82f6"/></svg>',
  star5_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#6366f1"/></svg>',
  star5_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#8b5cf6"/></svg>',
  star5_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#a855f7"/></svg>',
  star5_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#d946ef"/></svg>',
  star5_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#ec4899"/></svg>',
  star5_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#f43f5e"/></svg>',
  star5_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#94a3b8"/></svg>',
  star5_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#64748b"/></svg>',
  star5_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#fff"/></svg>',
  star5_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,2 14.5,9 22,9.5 16,14.5 18,22 12,18 6,22 8,14.5 2,9.5 9.5,9" fill="#000"/></svg>',
  cross_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#ef4444"/></svg>',
  cross_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#f97316"/></svg>',
  cross_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#f59e0b"/></svg>',
  cross_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#eab308"/></svg>',
  cross_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#84cc16"/></svg>',
  cross_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#22c55e"/></svg>',
  cross_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#14b8a6"/></svg>',
  cross_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#06b6d4"/></svg>',
  cross_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#0ea5e9"/></svg>',
  cross_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#3b82f6"/></svg>',
  cross_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#6366f1"/></svg>',
  cross_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#8b5cf6"/></svg>',
  cross_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#a855f7"/></svg>',
  cross_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#d946ef"/></svg>',
  cross_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#ec4899"/></svg>',
  cross_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#f43f5e"/></svg>',
  cross_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#94a3b8"/></svg>',
  cross_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#64748b"/></svg>',
  cross_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#fff"/></svg>',
  cross_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#000"/></svg>',
  dash_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#ef4444"/></svg>',
  dash_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#f97316"/></svg>',
  dash_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#f59e0b"/></svg>',
  dash_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#eab308"/></svg>',
  dash_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#84cc16"/></svg>',
  dash_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#22c55e"/></svg>',
  dash_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#14b8a6"/></svg>',
  dash_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#06b6d4"/></svg>',
  dash_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#0ea5e9"/></svg>',
  dash_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#3b82f6"/></svg>',
  dash_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#6366f1"/></svg>',
  dash_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#8b5cf6"/></svg>',
  dash_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#a855f7"/></svg>',
  dash_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#d946ef"/></svg>',
  dash_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#ec4899"/></svg>',
  dash_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#f43f5e"/></svg>',
  dash_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#94a3b8"/></svg>',
  dash_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#64748b"/></svg>',
  dash_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#fff"/></svg>',
  dash_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4" y="10" width="16" height="4" rx="2" fill="#000"/></svg>',
  dot_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#ef4444"/></svg>',
  dot_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#f97316"/></svg>',
  dot_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#f59e0b"/></svg>',
  dot_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#eab308"/></svg>',
  dot_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#84cc16"/></svg>',
  dot_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#22c55e"/></svg>',
  dot_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#14b8a6"/></svg>',
  dot_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#06b6d4"/></svg>',
  dot_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#0ea5e9"/></svg>',
  dot_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#3b82f6"/></svg>',
  dot_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#6366f1"/></svg>',
  dot_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#8b5cf6"/></svg>',
  dot_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#a855f7"/></svg>',
  dot_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#d946ef"/></svg>',
  dot_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#ec4899"/></svg>',
  dot_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#f43f5e"/></svg>',
  dot_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#94a3b8"/></svg>',
  dot_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#64748b"/></svg>',
  dot_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
  dot_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="4" fill="#000"/></svg>',
  vline_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#ef4444"/></svg>',
  vline_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#f97316"/></svg>',
  vline_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#f59e0b"/></svg>',
  vline_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#eab308"/></svg>',
  vline_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#84cc16"/></svg>',
  vline_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#22c55e"/></svg>',
  vline_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#14b8a6"/></svg>',
  vline_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#06b6d4"/></svg>',
  vline_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#0ea5e9"/></svg>',
  vline_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#3b82f6"/></svg>',
  vline_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#6366f1"/></svg>',
  vline_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#8b5cf6"/></svg>',
  vline_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#a855f7"/></svg>',
  vline_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#d946ef"/></svg>',
  vline_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#ec4899"/></svg>',
  vline_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#f43f5e"/></svg>',
  vline_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#94a3b8"/></svg>',
  vline_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#64748b"/></svg>',
  vline_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#fff"/></svg>',
  vline_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="10" y="3" width="4" height="18" rx="1" fill="#000"/></svg>',
  hline_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#ef4444"/></svg>',
  hline_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#f97316"/></svg>',
  hline_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#f59e0b"/></svg>',
  hline_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#eab308"/></svg>',
  hline_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#84cc16"/></svg>',
  hline_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#22c55e"/></svg>',
  hline_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#14b8a6"/></svg>',
  hline_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#06b6d4"/></svg>',
  hline_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#0ea5e9"/></svg>',
  hline_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#3b82f6"/></svg>',
  hline_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#6366f1"/></svg>',
  hline_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#8b5cf6"/></svg>',
  hline_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#a855f7"/></svg>',
  hline_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#d946ef"/></svg>',
  hline_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#ec4899"/></svg>',
  hline_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#f43f5e"/></svg>',
  hline_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#94a3b8"/></svg>',
  hline_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#64748b"/></svg>',
  hline_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#fff"/></svg>',
  hline_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="10" width="18" height="4" rx="1" fill="#000"/></svg>',
  arrow_n_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#ef4444"/></svg>',
  arrow_n_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#f97316"/></svg>',
  arrow_n_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#f59e0b"/></svg>',
  arrow_n_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#eab308"/></svg>',
  arrow_n_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#84cc16"/></svg>',
  arrow_n_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#22c55e"/></svg>',
  arrow_n_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#14b8a6"/></svg>',
  arrow_n_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#06b6d4"/></svg>',
  arrow_n_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#0ea5e9"/></svg>',
  arrow_n_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#3b82f6"/></svg>',
  arrow_n_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#6366f1"/></svg>',
  arrow_n_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#8b5cf6"/></svg>',
  arrow_n_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#a855f7"/></svg>',
  arrow_n_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#d946ef"/></svg>',
  arrow_n_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#ec4899"/></svg>',
  arrow_n_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#f43f5e"/></svg>',
  arrow_n_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#94a3b8"/></svg>',
  arrow_n_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#64748b"/></svg>',
  arrow_n_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#fff"/></svg>',
  arrow_n_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,4 20,14 15,14 15,20 9,20 9,14 4,14" fill="#000"/></svg>',
  arrow_s_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#ef4444"/></svg>',
  arrow_s_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#f97316"/></svg>',
  arrow_s_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#f59e0b"/></svg>',
  arrow_s_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#eab308"/></svg>',
  arrow_s_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#84cc16"/></svg>',
  arrow_s_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#22c55e"/></svg>',
  arrow_s_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#14b8a6"/></svg>',
  arrow_s_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#06b6d4"/></svg>',
  arrow_s_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#0ea5e9"/></svg>',
  arrow_s_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#3b82f6"/></svg>',
  arrow_s_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#6366f1"/></svg>',
  arrow_s_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#8b5cf6"/></svg>',
  arrow_s_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#a855f7"/></svg>',
  arrow_s_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#d946ef"/></svg>',
  arrow_s_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#ec4899"/></svg>',
  arrow_s_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#f43f5e"/></svg>',
  arrow_s_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#94a3b8"/></svg>',
  arrow_s_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#64748b"/></svg>',
  arrow_s_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#fff"/></svg>',
  arrow_s_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,20 4,10 9,10 9,4 15,4 15,10 20,10" fill="#000"/></svg>',
  arrow_e_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#ef4444"/></svg>',
  arrow_e_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#f97316"/></svg>',
  arrow_e_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#f59e0b"/></svg>',
  arrow_e_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#eab308"/></svg>',
  arrow_e_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#84cc16"/></svg>',
  arrow_e_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#22c55e"/></svg>',
  arrow_e_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#14b8a6"/></svg>',
  arrow_e_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#06b6d4"/></svg>',
  arrow_e_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#0ea5e9"/></svg>',
  arrow_e_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#3b82f6"/></svg>',
  arrow_e_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#6366f1"/></svg>',
  arrow_e_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#8b5cf6"/></svg>',
  arrow_e_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#a855f7"/></svg>',
  arrow_e_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#d946ef"/></svg>',
  arrow_e_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#ec4899"/></svg>',
  arrow_e_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#f43f5e"/></svg>',
  arrow_e_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#94a3b8"/></svg>',
  arrow_e_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#64748b"/></svg>',
  arrow_e_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#fff"/></svg>',
  arrow_e_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="20,12 10,4 10,9 4,9 4,15 10,15 10,20" fill="#000"/></svg>',
  arrow_w_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#ef4444"/></svg>',
  arrow_w_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#f97316"/></svg>',
  arrow_w_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#f59e0b"/></svg>',
  arrow_w_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#eab308"/></svg>',
  arrow_w_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#84cc16"/></svg>',
  arrow_w_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#22c55e"/></svg>',
  arrow_w_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#14b8a6"/></svg>',
  arrow_w_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#06b6d4"/></svg>',
  arrow_w_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#0ea5e9"/></svg>',
  arrow_w_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#3b82f6"/></svg>',
  arrow_w_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#6366f1"/></svg>',
  arrow_w_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#8b5cf6"/></svg>',
  arrow_w_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#a855f7"/></svg>',
  arrow_w_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#d946ef"/></svg>',
  arrow_w_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#ec4899"/></svg>',
  arrow_w_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#f43f5e"/></svg>',
  arrow_w_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#94a3b8"/></svg>',
  arrow_w_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#64748b"/></svg>',
  arrow_w_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#fff"/></svg>',
  arrow_w_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="4,12 14,4 14,9 20,9 20,15 14,15 14,20" fill="#000"/></svg>',
  chev_n_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#84cc16" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#ec4899" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_n_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 14l6-6 6 6" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_0: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_1: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_3: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_4: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#84cc16" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_5: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_6: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_7: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_8: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_9: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_10: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_11: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_12: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_13: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_14: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#ec4899" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_15: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_16: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_17: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_18: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>',
  chev_s_19: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 10l6 6 6-6" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>',

  gun: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M7 10v2h2v6H7v2h10v-2h-2v-6h2v-2H7zm3 2h4v6h-4v-6zM5 8h14l1 2H4l1-2zm-1 3h2v2H4v-2z"/></svg>',
  car: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .7-.3 1L6.6 10.8z"/></svg>',
  map: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
  bank: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#eab308" d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
  inventory: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 9.85 2 8.72 2 7.07 2 5.72 3.35 5.72 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>',
  radio: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 002 2h16a2 2 0 002-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f43f5e" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
  crown: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#fbbf24" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>',
  medal: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 7a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4zM17.5 2L16 6h-2l1.5-4h2zM9 6H7L5.5 2h2L9 6zm1 12l-2 4h2l1-2 1 2h2l-2-4h-2z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11 20c0-1.1.9-2 2-2 1.1 0 2 .9 2 2h-4z"/></svg>',
  skull: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#e2e8f0" d="M12 2C7 2 3 6 3 11c0 3.5 2.1 6.5 5.1 7.8L7 22h2l1-2h4l1 2h2l-1.1-3.2C18.9 17.5 21 14.5 21 11c0-5-4-9-9-9zM9 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>',
  target: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14a6 6 0 100 12A6 6 0 0012 6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#818cf8" d="M12 2.5s4 3.5 4 8.5c0 2-.5 3.5-1 4.5l2 3h-2l-1-1.5c-.5.3-1 .5-2 .5s-1.5-.2-2-.5L9 18.5H7l2-3c-.5-1-1-2.5-1-4.5 0-5 4-8.5 4-8.5zM9.5 10a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM8 20l1.5-1.5L11 20H8zm5 0l1.5-1.5L16 20h-3z"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22d3ee" d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
  battery: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#4ade80" d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/></svg>',
  camera: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 1 0-6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
  music: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#c084fc" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f43f5e" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#facc15" d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f472b6" d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 9.85 2 8.72 2 7.07 2 5.72 3.35 5.72 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h16v6z"/></svg>',
  key: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#fbbf24" d="M12.65 10C11.7 7.31 8.9 5.5 5.77 6.12c-2.29.46-4.15 2.29-4.63 4.58C.32 14.41 3.26 18 7 18c2.61 0 4.83-1.67 5.65-4H17v2c0 1.1.9 2 2 2s2-.9 2-2v-2c1.1 0 2-.9 2-2s-.9-2-2-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f87171" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#2dd4bf" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M6 6h12v12H6z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M6 6v12l8.5-6zm9.5 0v12H18V6z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M18 6v12L9.5 12 18 6zM6 6h2.5v12H6z"/></svg>',
  volume: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M5 20h14v-2H5v2zM12 2L5 9h4v6h6V9h4L12 2z"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
  paste: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/></svg>',
  cut: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M9.64 7.64c.29-.29.3-.77.02-1.08a3.5 3.5 0 10-1.04 1.04c.32-.28.8-.27 1.08.02L12 9.9l5.66-5.66a1 1 0 011.41 1.41L13.4 11.3l5.67 5.66a1 1 0 01-1.41 1.41L12 12.73l-2.3 2.3a3.5 3.5 0 11-1.04-1.04c.28-.32.27-.8-.02-1.08L9.64 7.64zM6 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
  unlink: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16v-2zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.43.98-2.63 2.31-2.98L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
  eye_off: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>',
  sort: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>',
  more: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19 13H5v-2h14v2z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  xmark: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>',
  login: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z"/></svg>',
  folder: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>',
  image_ico: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
  video: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>',
  print: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>',
  world: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  server: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M4 1h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2zM6 4h2v2H6V4zm0 8h2v2H6v-2zm0 8h2v2H6v-2z"/></svg>',
  database: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.42 0 8 .9 8 2s-3.58 2-8 2-8-.9-8-2 3.58-2 8-2zm0 14c-4.42 0-8-.9-8-2v-2.03c1.79.94 4.68 1.53 8 1.53s6.21-.59 8-1.53V16c0 1.1-3.58 2-8 2zm0-6c-4.42 0-8-.9-8-2v-2.03c1.79.94 4.68 1.53 8 1.53s6.21-.59 8-1.53V10c0 1.1-3.58 2-8 2z"/></svg>',
  code: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zM7.5 17l-1.41-1.41L8.67 13l-2.58-2.59L7.5 9l4 4-4 4z"/></svg>',
  bug: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M20 8h-2.81a5.99 5.99 0 00-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.04 6.04 0 00-2.84 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
  sword: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M6.92 5H5l6 6-1.5 1.5L3.5 6.5 2 8l6 6L6.5 15.5 2 11v2.5L8 19.5 11.5 16 18 22.5 22.5 18 16 11.5 19.5 8 14 2.5 11.5 5 9 7.5 6.92 5z"/></svg>',
  crosshair: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M12 2v3m0 14v3M2 12h3m14 0h3M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>',
  ammo: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M7 2v2h2V2H7zm4 0v2h2V2h-2zm4 0v2h2V2h-2zM7 6v14h2V6H7zm4 0v14h2V6h-2zm4 0v14h2V6h-2z"/></svg>',
  helmet: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M12 2C7 2 4 6 4 10v4c0 2 1 3 3 3h1v3h8v-3h1c2 0 3-1 3-3v-4c0-4-3-8-8-8z"/></svg>',
  vest: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 1L8 3v3c0 2-1 3-2 4v11h12V10c-1-1-2-2-2-4V3l-4-2z"/></svg>',
  gas: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2C8 2 6 5 6 8v2H5v10h14V10h-1V8c0-3-2-6-6-6zm0 2c2.2 0 4 1.8 4 4v2H8V8c0-2.2 1.8-4 4-4z"/></svg>',
  parachute: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M12 2C6 2 3 7 3 10c0 0 3 1 9 1s9-1 9-1c0-3-3-8-9-8zm0 11l-2 9h4l-2-9z"/></svg>',
  plane: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
  heli: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M4 10h16v2H4v-2zm7-6h2v6h-2V4zm-5 8h12c1 0 2 1 2 2v2H4v-2c0-1 1-2 2-2zm2 6h8v2H8v-2z"/></svg>',
  boat: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19z"/></svg>',
  bike: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M18.5 9c.83 0 1.5-.67 1.5-1.5S19.33 6 18.5 6 17 6.67 17 7.5 17.67 9 18.5 9zm-13 0c.83 0 1.5-.67 1.5-1.5S6.33 6 5.5 6 4 6.67 4 7.5 4.67 9 5.5 9zM18.5 10c-1.48 0-2.75.81-3.45 2H13l-2.5-5H9L6.5 12H3v2h3.5c.5 1.94 2.25 3.35 4.35 3.45.4.02.75.05 1.15.05 2.5 0 4.55-1.7 5.2-4h1.8c.55 1.63 2.05 2.8 3.85 2.8 2.21 0 4-1.79 4-4s-1.79-4-4-4c-1.48 0-2.75.81-3.45 2z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
  gas_pump: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.22v7.22c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>',
  hammer: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M2 19.63l7.66-7.66-1.41-1.41L.59 18.22 2 19.63zM14.12 2.41l-1.41 1.41 2.12 2.12-7.07 7.07 1.41 1.41 7.07-7.07 2.12 2.12 1.41-1.41-5.65-5.65z"/></svg>',
  cog: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.49.49 0 00.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>',
  tool: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>',
  paint: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z"/></svg>',
  palette: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 01-4.4 2.26 5.403 5.403 0 01-3.4-9.5c-.44-.06-.9-.1-1.36-.1z"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>',
  rain: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M12 2c-4 0-7 3-7 7 0 4 3 8 7 11 4-3 7-7 7-11 0-4-3-7-7-7zm0 10a3 3 0 110-6 3 3 0 010 6z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-2z"/></svg>',
  droplet: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.10.0.1.1.34.01C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>',
  tree: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M12 2L7 8h3v3H6l5 6v5h2v-5l5-6h-4V8h3L12 2z"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>',
  building: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
  house: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  store: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>',
  chart_bar: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/></svg>',
  users2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  admin: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
  id_card: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H4v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1zm8 0h-6v-2h6v2zm0-4h-6V8h6v4z"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M16.3 9.27l-2.12-2.12-1.41 1.41 2.12 2.12-2.12 2.12 1.41 1.41 2.12-2.12 2.12 2.12 1.41-1.41-2.12-2.12 2.12-2.12-1.41-1.41-2.12 2.12zM9 11H3v2h6v-2zm12 0h-6v2h6v-2z"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
  flash: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  signal: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M2 22h20V2z"/></svg>',
  bluetooth: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>',
  usb: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.7-.37 1.2-1.08 1.2-1.93 0-1.21-.99-2.2-2.2-2.2S4.8 7.79 4.8 9c0 .85.5 1.56 1.2 1.93V13c0 1.11.89 2 2 2h3v3.05c-.7.37-1.2 1.08-1.2 1.93 0 1.21.99 2.2 2.2 2.2s2.2-.99 2.2-2.2c0-.85-.5-1.56-1.2-1.93V15h3c1.11 0 2-.89 2-2v-2h1V7h-4z"/></svg>',
  power: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.99 6.99 0 0119 12c0 3.87-3.13 7-7 7A6.99 6.99 0 017.58 6.58L6.17 5.17A8.93 8.93 0 003 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>',
  layers_ico: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-10-5v2.5l10 5 10-5V8.5l-10 5z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
  table: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>',
  cursor: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M13.64 21.97a.99.99 0 01-1.41 0L9.5 19.24l-2.12 2.12a.996.996 0 01-1.41 0 .996.996 0 010-1.41l2.12-2.12-2.73-2.73a.996.996 0 010-1.41L13.64 5.5a.996.996 0 011.41 0l4.24 4.24c.39.39.39 1.02 0 1.41l-5.65 5.65 2.12 2.12c.39.39.39 1.02 0 1.41l-2.12 2.12z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"/></svg>',
  zoom_in: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM10 9V7H9v2H7v1h2v2h1v-2h2V9h-2z"/></svg>',
  zoom_out: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7V9z"/></svg>',
  expand: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
  attach: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f97316" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>',
  emoji: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#38bdf8" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
  thumbs_up: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#94a3b8" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>',
  thumbs_down: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#60a5fa" d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>',
  flag2: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#22c55e" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#f59e0b" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ef4444" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 8C6.67 8 6 7.33 6 6.5S6.67 5 7.5 5 9 5.67 9 6.5 8.33 8 7.5 8zm0 7c-.83 0-1.5-.67-1.5-1.5S6.67 12 7.5 12s1.5.67 1.5 1.5S8.33 15 7.5 15zm4.5 4c-.83 0-1.5-.67-1.5-1.5S11.17 16 12 16s1.5.67 1.5 1.5S12.83 19 12 19zm0-7c-.83 0-1.5-.67-1.5-1.5S11.17 9 12 9s1.5.67 1.5 1.5S12.83 12 12 12zm4.5 4c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-7c-.83 0-1.5-.67-1.5-1.5S15.67 5 16.5 5s1.5.67 1.5 1.5S17.33 8 16.5 8z"/></svg>',
  puzzle: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#a78bfa" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>',
  gamepad: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ec4899" d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>',
  controller: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#14b8a6" d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',

};



document.getElementById('iconsSearch')?.addEventListener('input', function(){
  const q = (this.value||'').toLowerCase().trim();
  document.querySelectorAll('#iconsTabGrid .preset.icon, .hud-icons .preset.icon').forEach(el=>{
    const name = (el.getAttribute('title')||el.dataset.preset||'').toLowerCase();
    el.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
});
function buildIconGrid(){
  const grids = document.querySelectorAll('.hud-icons, #iconsTabGrid');
  const builtin = Object.keys(ICON_SVGS).map(k => {
    return '<div class="preset icon" data-preset="icon_'+k+'" title="'+k+'">'+ICON_SVGS[k].replace(/width="100%"/g,'width="22"').replace(/height="100%"/g,'height="22"')+'</div>';
  }).join('');
  const custom = (customIcons||[]).map(ic => {
    const safe = String(ic.name||'custom').replace(/"/g,'');
    return '<div class="preset icon custom-icon" data-preset="custom_'+ic.id+'" title="'+safe+'" data-custom="'+ic.id+'">'
      +'<img src="'+ic.dataUrl+'" alt="" style="width:22px;height:22px;object-fit:contain;pointer-events:none">'
      +'<button type="button" class="icon-del" data-del-icon="'+ic.id+'" title="Remove">×</button>'
      +'</div>';
  }).join('');
  const header = custom
    ? '<div class="icon-sec" style="grid-column:1/-1;font-size:10px;color:var(--muted);padding:4px 0">My Icons / آیکون‌های من ('+customIcons.length+'/'+CUSTOM_ICON_LIMIT+')</div>'+custom
      +'<div class="icon-sec" style="grid-column:1/-1;font-size:10px;color:var(--muted);padding:8px 0 4px">Built-in / آماده</div>'
    : '';
  const html = header + builtin;
  grids.forEach(grid => {
    if(!grid) return;
    grid.innerHTML = html;
    grid.querySelectorAll('.preset').forEach(p => {
      p.addEventListener('click', (ev) => {
        if(ev.target.closest('.icon-del')) return;
        addPreset(p.dataset.preset);
      });
    });
    grid.querySelectorAll('.icon-del').forEach(btn=>{
      btn.addEventListener('click', (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        const id = btn.getAttribute('data-del-icon');
        customIcons = customIcons.filter(c=>c.id!==id);
        saveCustomIcons().then(()=>buildIconGrid());
      });
    });
  });
}


function renderEl(el){
  let div=document.getElementById(el.id);
  if(!div){
    div=document.createElement('div');
    div.id=el.id; div.className='el'; div.dataset.id=el.id;
    ['nw','ne','sw','se'].forEach(p=>{ const h=document.createElement('div'); h.className='handle '+p; h.dataset.handle=p; div.appendChild(h); });
    $('#els').appendChild(div);
    div.addEventListener('mousedown',onElDown);
  }
  div.style.left=el.x+'px'; div.style.top=el.y+'px';
  div.style.width=el.w+'px'; div.style.height=el.h+'px';
  div.style.transform=`rotate(${el.rotation}deg)`;
  div.style.opacity=el.alpha;
  // higher index = on top
  const z = elements.findIndex(e=>e.id===el.id);
  div.style.zIndex = z >= 0 ? String(10 + z) : '10';
  const filters=[];
  if(el.blur) filters.push(`blur(${el.blur}px)`);
  div.style.filter = filters.length ? filters.join(' ') : 'none';
  if(el.glow && (el.glowSize||0)>0 && el.type!=='label' && el.type!=='button'){
    const gi = Math.max(0, Math.min(100, el.glowIntensity||60)) / 100;
    const gs = el.glowSize||16;
    const gc = el.glowColor || '#3b82f6';
    const [gr,gg,gb] = (typeof hexRgb==='function') ? hexRgb(gc) : [59,130,246];
    div.style.boxShadow = `0 0 ${gs*0.4}px rgba(${gr},${gg},${gb},${(0.9*gi).toFixed(2)}), 0 0 ${gs}px rgba(${gr},${gg},${gb},${(0.55*gi).toFixed(2)}), 0 0 ${gs*1.8}px rgba(${gr},${gg},${gb},${(0.25*gi).toFixed(2)})`;
  } else if(!(el.glow && (el.type==='label'||el.type==='button'))) {
    div.style.boxShadow = 'none';
  } else {
    div.style.boxShadow = 'none'; // text glow is on inner node via text-shadow
  }
  div.classList.toggle('sel', el.id===selected || selectedIds.includes(el.id));
  div.classList.toggle('sel-multi', selectedIds.includes(el.id) && selectedIds.length>1);

  let bg=el.color;
  if(el.gradient || el.gradFade){
    const intens = Math.max(0, Math.min(100, el.gradIntensity||100)) / 100;
    const [rr,gg,bb]=hexRgb(el.color==='transparent'?'#000000':el.color);
    if(el.gradFade){
      bg=`linear-gradient(${el.angle||180}deg, rgba(${rr},${gg},${bb},${intens}), rgba(${rr},${gg},${bb},0))`;
    } else if(el.gradient){
      const [r2,g2,b2]=hexRgb(el.hoverColor||'#000000');
      bg=`linear-gradient(${el.angle||180}deg, rgba(${rr},${gg},${bb},${intens}), rgba(${r2},${g2},${b2},${intens}))`;
    }
  }
  const br=el.type==='circle'?'50%':el.radius+'px';
  let html='';

  if(el.type==='icon'){
    let svg = ICON_SVGS[el.iconType] || ICON_SVGS.info;
    if(el.iconColor){
      // replace fills with custom color
      svg = svg.replace(/fill="[^"]*"/g, 'fill="'+el.iconColor+'"');
    }
    let iconStyle = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    if(el.gradient || el.gradFade){
      const intens = Math.max(0, Math.min(100, el.gradIntensity||100)) / 100;
      const [rr,gg,bb]=hexRgb(el.iconColor||el.color||'#ffffff');
      if(el.gradFade){
        iconStyle += `background:linear-gradient(${el.angle||180}deg, rgba(${rr},${gg},${bb},${intens}), rgba(${rr},${gg},${bb},0));border-radius:6px;`;
      } else if(el.gradient){
        const [r2,g2,b2]=hexRgb(el.hoverColor||'#000000');
        iconStyle += `background:linear-gradient(${el.angle||180}deg, rgba(${rr},${gg},${bb},${intens}), rgba(${r2},${g2},${b2},${intens}));border-radius:6px;`;
      }
    }
    html = `<div style="${iconStyle}">${svg}</div>`;
  } else if(el.type==='label'||el.type==='button'){
    const safeText=(el.text||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const deco = [];
    if(el.strike) deco.push('line-through');
    if(el.underline) deco.push('underline');
    const td = deco.length ? `text-decoration:${deco.join(' ')};` : '';
    const st = (el.stroke && el.strokeWidth>0) ? `border:${el.strokeWidth}px solid ${el.strokeColor||'#fff'};box-sizing:border-box;` : '';
    const tc = el.textColor || '#FFFFFF';
    const tc2 = el.textColor2 || el.hoverColor || '#3b82f6';
    const useTextGrad = !!(el.textGradient || (el.type==='label' && el.gradient));
    let textPaint = `color:${tc};`;
    if(useTextGrad){
      const ang = el.angle||180;
      textPaint = `background:linear-gradient(${ang}deg, ${tc}, ${tc2});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;`;
    }
    // text glow via text-shadow (works on gradient text too)
    let tglow = '';
    if(el.glow && (el.glowSize||0)>0){
      const gi = Math.max(0, Math.min(100, el.glowIntensity||60)) / 100;
      const gs = el.glowSize||16;
      const gc = el.glowColor || tc || '#3b82f6';
      const [gr,gg,gb] = hexRgb(gc);
      tglow = `text-shadow:0 0 ${gs*0.35}px rgba(${gr},${gg},${gb},${(0.95*gi).toFixed(2)}),0 0 ${gs*0.8}px rgba(${gr},${gg},${gb},${(0.7*gi).toFixed(2)}),0 0 ${gs*1.6}px rgba(${gr},${gg},${gb},${(0.35*gi).toFixed(2)});`;
    }
    const boxBg = el.type==='label' ? 'transparent' : bg;
    html=`<div data-txt="1" data-textgrad="${useTextGrad?'1':'0'}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${boxBg};border-radius:${br};${textPaint}font-family:${el.font},Vazirmatn,sans-serif;font-size:${el.size}px;font-weight:${el.weight==='Bold'?700:el.weight==='Medium'?500:400};overflow:hidden;white-space:pre-wrap;text-align:center;line-height:1.35;padding:4px 8px;word-break:break-word;${td}${st}${tglow}">${safeText}</div>`;
  } else if(el.type==='editbox'){
    const bw = (el.stroke && el.strokeWidth>0) ? el.strokeWidth : 1;
    const bc = (el.stroke && el.strokeWidth>0) ? (el.strokeColor||'#fff') : '#333';
    html=`<div style="width:100%;height:100%;display:flex;align-items:center;padding:0 12px;background:${bg};border:${bw}px solid ${bc};border-radius:${br};box-sizing:border-box;color:${el.textColor};font-family:${el.font},sans-serif;font-size:${el.size}px">${el.text||'...'}</div>`;
  } else if(el.type==='checkbox'){
    html=`<div style="width:100%;height:100%;background:${bg};border-radius:${br};display:flex;align-items:center;justify-content:center;color:#fff;font-size:${el.w*0.6}px">✓</div>`;
  } else if(el.type==='progress'){
    const pct=el.progress||70;
    const st = (el.stroke && el.strokeWidth>0) ? `border:${el.strokeWidth}px solid ${el.strokeColor||'#fff'};box-sizing:border-box;` : '';
    html=`<div style="width:100%;height:100%;background:${el.hoverColor};border-radius:${br};overflow:hidden;${st}"><div style="width:${pct}%;height:100%;background:${bg};border-radius:${br}"></div></div>`;
  } else if(el.type==='triangle'){
    html=`<div style="width:0;height:0;border-left:${el.w/2}px solid transparent;border-right:${el.w/2}px solid transparent;border-bottom:${el.h}px solid ${el.color}"></div>`;
  } else if(el.type==='rhombus'){
    html=`<div style="width:100%;height:100%;background:${bg};transform:rotate(45deg) scale(0.7);border-radius:${el.radius}px"></div>`;
  } else if(el.type==='line'){
    html=`<div style="width:100%;height:100%;background:${el.color}"></div>`;
  } else if(el.type==='image'){
    const blurPart = el.blur ? `blur(${el.blur}px)` : '';
    const st = (el.stroke && el.strokeWidth>0) ? `border:${el.strokeWidth}px solid ${el.strokeColor||'#fff'};box-sizing:border-box;` : '';
    if(el.imageData){
      const tint = el.imageTint || '';
      const mode = el.imageTintMode || 'none';
      let imgStyle = 'width:100%;height:100%;object-fit:cover;display:block;';
      let wrapExtra = '';
      if(mode==='colorize' && tint){
        // solid recolor like Photoshop Color Overlay on icons
        wrapExtra = `background:${tint};`;
        imgStyle += 'mix-blend-mode:destination-in;';
      } else if(mode==='tint' && tint){
        wrapExtra = `background:${tint};`;
        imgStyle += 'mix-blend-mode:multiply;opacity:0.85;';
      } else if(mode==='screen' && tint){
        wrapExtra = `background:${tint};`;
        imgStyle += 'mix-blend-mode:screen;';
      }
      const filters = [blurPart].filter(Boolean).join(' ');
      const fcss = filters ? `filter:${filters};` : '';
      html=`<div style="width:100%;height:100%;border-radius:${br};overflow:hidden;position:relative;${wrapExtra}${st}${fcss}"><img src="${el.imageData}" style="${imgStyle}" draggable="false"></div>`;
    } else {
      const label = el.text || el.charType || 'IMG';
      const fcss = blurPart ? `filter:${blurPart};` : '';
      html=`<div style="width:100%;height:100%;background:${bg};border-radius:${br};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;${fcss}${st}">${label}</div>`;
    }
  } else {
    const st = (el.stroke && el.strokeWidth>0) ? `border:${el.strokeWidth}px solid ${el.strokeColor||'#fff'};box-sizing:border-box;` : '';
    html=`<div style="width:100%;height:100%;background:${bg};border-radius:${br};${st}"></div>`;
  }
  const handles=[...div.querySelectorAll('.handle')];
  div.innerHTML=html;
  // force text color (skip when text gradient is active)
  const tnode = div.querySelector('[data-txt]');
  if(tnode && el.textColor && tnode.getAttribute('data-textgrad')!=='1'){
    tnode.style.setProperty('color', el.textColor, 'important');
    tnode.style.removeProperty('-webkit-text-fill-color');
  }
  handles.forEach(h=>div.appendChild(h));
}

function render(){
  const ids=new Set(elements.map(e=>e.id));
  $$('.el').forEach(d=>{if(!ids.has(d.dataset.id))d.remove()});
  elements.forEach(renderEl);
  renderLayers();
  renderProps();
}


function moveLayer(id, dir){
  const i = elements.findIndex(e=>e.id===id);
  if(i < 0) return;
  const j = i + dir;
  if(j < 0 || j >= elements.length) return;
  saveHistory();
  const t = elements[i];
  elements[i] = elements[j];
  elements[j] = t;
  render();
}
function bringToFront(id){
  const i = elements.findIndex(e=>e.id===id);
  if(i < 0 || i === elements.length-1) return;
  saveHistory();
  const [t] = elements.splice(i, 1);
  elements.push(t);
  render();
}
function sendToBack(id){
  const i = elements.findIndex(e=>e.id===id);
  if(i <= 0) return;
  saveHistory();
  const [t] = elements.splice(i, 1);
  elements.unshift(t);
  render();
}

function renderLayers(){
  const list=$('#layersList');
  if(!elements.length){ list.innerHTML=`<div class="empty">${t('noLayers')}</div>`; return; }
  // top of list = front (highest z)
  const ordered = [...elements].reverse();
  list.innerHTML = `<div style="font-size:10px;color:var(--muted);padding:4px 8px;margin-bottom:4px">${lang==='fa'?'بالا = جلو | دکمه‌ها: جلو/عقب':'Top = Front | arrows: reorder'}</div>` + ordered.map((el, revIdx)=>{
    const realIdx = elements.length - 1 - revIdx;
    return `<div class="layer ${isSelected(el.id)?'sel':''}" data-id="${el.id}">
      <div class="dot" style="background:${el.color==='transparent'?'#555':(el.color||'#555')}"></div>
      <span class="layer-name">${el.varName||el.type}</span>
      <div class="layer-btns">
        <button type="button" class="lb" data-act="export" title="Export layer PNG">⤓</button>
        <button type="button" class="lb" data-act="up" title="Forward">▲</button>
        <button type="button" class="lb" data-act="down" title="Backward">▼</button>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('.layer').forEach(l=>{
    l.addEventListener('click', (ev)=>{
      if(ev.target.closest('.lb')) return;
      if(ev.shiftKey){
        if(selectedIds.includes(l.dataset.id)) selectedIds=selectedIds.filter(x=>x!==l.dataset.id);
        else selectedIds.push(l.dataset.id);
        selected=l.dataset.id;
      } else {
        selectedIds=[l.dataset.id]; selected=l.dataset.id;
      }
      render();
    });
  });
  list.querySelectorAll('.lb').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const id = btn.closest('.layer').dataset.id;
      const act = btn.dataset.act;
      // list is reversed: up = toward front = higher index
      if(act==='up') moveLayer(id, +1);
      if(act==='down') moveLayer(id, -1);
      if(act==='export') exportSingleLayer(id);
    });
  });
}

function renderProps(){
  const box=$('#props');
  const el=elements.find(e=>e.id===selected);
  if(!el){ box.innerHTML=`<div class="empty-props">${t('selectEl')}</div>`; return; }

  const fonts=['Inter','Poppins','Roboto','Montserrat','Space Grotesk','Oswald','Vazirmatn','Arial'];
  box.innerHTML=`
    <div class="pg"><label>${t('varName')}</label><input class="inp" data-p="varName" value="${el.varName}"></div>
    <div class="pg"><label>${lang==='fa'?'اولویت لایه':'Layer Order'}</label>
      <div class="row" style="gap:4px;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost btn-sm" id="btnFront">${lang==='fa'?'بیار جلو':'Bring Front'}</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btnBack">${lang==='fa'?'بفرست عقب':'Send Back'}</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btnFwd">▲</button>
        <button type="button" class="btn btn-ghost btn-sm" id="btnBwd">▼</button>
      </div>
    </div>
    <div class="pg"><label>${t('posSize')}</label>
      <div class="row"><div class="field"><small>X</small><input class="inp" type="number" data-p="x" value="${Math.round(el.x)}"></div>
      <div class="field"><small>Y</small><input class="inp" type="number" data-p="y" value="${Math.round(el.y)}"></div></div>
      <div class="row"><div class="field"><small>W</small><input class="inp" type="number" data-p="w" value="${Math.round(el.w)}"></div>
      <div class="field"><small>H</small><input class="inp" type="number" data-p="h" value="${Math.round(el.h)}"></div></div>
    </div>
    <div class="pg"><label>${t('color')} (HEX)</label><div class="color-row"><input class="inp" type="text" data-p="color" value="${el.color}" placeholder="#RRGGBB"><input class="inp" type="color" data-p="color" value="${el.color==='transparent'?'#000000':el.color}"></div>${recentColorsHtml('color')}</div>
    <div class="pg"><label>${t('hover')}</label><div class="color-row"><input class="inp" type="text" data-p="hoverColor" value="${el.hoverColor}"><input class="inp" type="color" data-p="hoverColor" value="${el.hoverColor}"></div></div>
    <div class="pg"><label>${t('gradient')}</label>
      <div class="row">
        <div class="field"><small>${t('enable')}</small>
          <select class="inp" data-p="gradient"><option value="false" ${!el.gradient?'selected':''}>${t('no')}</option><option value="true" ${el.gradient?'selected':''}>${t('yes')}</option></select>
        </div>
        <div class="field"><small>Fade / Glass</small>
          <select class="inp" data-p="gradFade"><option value="false" ${!el.gradFade?'selected':''}>${t('no')}</option><option value="true" ${el.gradFade?'selected':''}>${t('yes')}</option></select>
        </div>
      </div>
      <div class="row" style="margin-top:6px">
        <div class="field"><small>${t('angle')} (0-360°)</small>
          <input class="inp" type="number" data-p="angle" value="${el.angle||180}" min="0" max="360" step="1">
        </div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px">0°=↑ 90°=→ 180°=↓ 270°=← | Fade=رنگ به شفاف</div>
    </div>
    ${(el.gradient||el.gradFade)?`<div class="pg"><label>Intensity / شدت (0-100)</label><input class="inp" type="number" data-p="gradIntensity" value="${el.gradIntensity??100}" min="0" max="100" step="5"></div>`:''}
    ${el.type==='icon'?`<div class="pg"><label>Icon Color / رنگ آیکون</label><div class="color-row"><input class="inp" type="text" data-p="iconColor" value="${el.iconColor||''}" placeholder="#ef4444"><input class="inp" type="color" data-p="iconColor" value="${el.iconColor||'#ffffff'}"></div></div>`:''}
    <div class="pg"><label>${t('textColor')}</label><div class="color-row"><input class="inp" type="text" data-p="textColor" value="${el.textColor||'#FFFFFF'}" placeholder="#FFFFFF"><input class="inp" type="color" data-p="textColor" value="${(/^#[0-9a-fA-F]{6}$/.test(el.textColor||'')?el.textColor:'#FFFFFF')}"></div></div>
    ${(el.type==='label'||el.type==='button')?`<div class="pg"><label>Text Gradient / گرادیان متن</label>
      <div class="row">
        <div class="field"><small>Enable</small>
          <select class="inp" data-p="textGradient"><option value="false" ${!el.textGradient?'selected':''}>${t('no')}</option><option value="true" ${el.textGradient?'selected':''}>${t('yes')}</option></select>
        </div>
        <div class="field"><small>${t('angle')}</small><input class="inp" type="number" data-p="angle" value="${el.angle||180}" min="0" max="360" step="15"></div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin:4px 0">Color 1 = Text Color | Color 2 = below</div>
      <div class="color-row"><input class="inp" type="text" data-p="textColor2" value="${el.textColor2||'#3b82f6'}" placeholder="#3b82f6"><input class="inp" type="color" data-p="textColor2" value="${(/^#[0-9a-fA-F]{6}$/.test(el.textColor2||'')?el.textColor2:'#3b82f6')}"></div>
    </div>`:''}
    <div class="pg"><label>${t('radius')} / ${t('alpha')}</label>
      <div class="row"><div class="field"><small>${t('radius')}</small><input class="inp" type="number" data-p="radius" value="${el.radius}" min="0"></div>
      <div class="field"><small>${t('alpha')}</small><input class="inp" type="number" data-p="alpha" value="${el.alpha}" min="0" max="1" step="0.05"></div></div>
    </div>
    <div class="pg"><label>Stroke / حاشیه</label>
      <div class="row">
        <div class="field"><small>Enable</small>
          <select class="inp" data-p="stroke"><option value="false" ${!el.stroke?'selected':''}>${t('no')}</option><option value="true" ${el.stroke?'selected':''}>${t('yes')}</option></select>
        </div>
        <div class="field"><small>Width</small><input class="inp" type="number" data-p="strokeWidth" value="${el.strokeWidth||2}" min="0" max="40"></div>
      </div>
      <div class="color-row" style="margin-top:6px"><input class="inp" type="text" data-p="strokeColor" value="${el.strokeColor||'#ffffff'}" placeholder="#ffffff"><input class="inp" type="color" data-p="strokeColor" value="${el.strokeColor||'#ffffff'}"></div>
    </div>
    <div class="pg"><label>Glow / درخشش</label>
      <div class="row">
        <div class="field"><small>Enable</small>
          <select class="inp" data-p="glow"><option value="false" ${!el.glow?'selected':''}>${t('no')}</option><option value="true" ${el.glow?'selected':''}>${t('yes')}</option></select>
        </div>
        <div class="field"><small>Size</small><input class="inp" type="number" data-p="glowSize" value="${el.glowSize||16}" min="0" max="80"></div>
        <div class="field"><small>Intensity</small><input class="inp" type="number" data-p="glowIntensity" value="${el.glowIntensity??60}" min="0" max="100"></div>
      </div>
      <div class="color-row" style="margin-top:6px"><input class="inp" type="text" data-p="glowColor" value="${el.glowColor||'#3b82f6'}" placeholder="#3b82f6"><input class="inp" type="color" data-p="glowColor" value="${el.glowColor||'#3b82f6'}"></div>
    </div>
    <div class="pg"><label>${t('rotation')}</label><input class="inp" type="number" data-p="rotation" value="${el.rotation}"></div>
    <div class="pg"><label>Blur (0-20)</label><input class="inp" type="number" data-p="blur" value="${el.blur||0}" min="0" max="20" step="1"></div>
    ${el.type==='image'?`<div class="pg"><label>Image Color / رنگ تصویر (مثل فتوشاپ)</label>
      <div class="row">
        <div class="field"><small>Mode</small>
          <select class="inp" data-p="imageTintMode">
            <option value="none" ${(!el.imageTintMode||el.imageTintMode==='none')?'selected':''}>None</option>
            <option value="tint" ${el.imageTintMode==='tint'?'selected':''}>Tint</option>
            <option value="colorize" ${el.imageTintMode==='colorize'?'selected':''}>Colorize</option>
            <option value="screen" ${el.imageTintMode==='screen'?'selected':''}>Screen</option>
          </select>
        </div>
      </div>
      <div class="color-row" style="margin-top:6px"><input class="inp" type="text" data-p="imageTint" value="${el.imageTint||'#3b82f6'}" placeholder="#3b82f6"><input class="inp" type="color" data-p="imageTint" value="${(/^#[0-9a-fA-F]{6}$/.test(el.imageTint||'')?el.imageTint:'#3b82f6')}"></div>
    </div>`:''}
    <div class="pg"><label>Center tips</label><div style="font-size:11px;color:var(--muted);line-height:1.5">
      Screen center: X=${Math.round(CW/2)} Y=${Math.round(CH/2)}<br>
      Element center: X=${Math.round(el.x+el.w/2)} Y=${Math.round(el.y+el.h/2)}<br>
      <button type="button" class="btn btn-ghost btn-sm" id="btnCenterH" style="margin-top:4px">Center H</button>
      <button type="button" class="btn btn-ghost btn-sm" id="btnCenterV">Center V</button>
      <button type="button" class="btn btn-ghost btn-sm" id="btnCenter">Center Both</button>
    </div></div>
    ${(el.type==='button'||el.type==='label'||el.type==='editbox')?`
    <div class="pg"><label>${t('text')}</label><textarea class="inp" data-p="text" rows="3" style="resize:vertical;min-height:60px;line-height:1.4">${el.text||''}</textarea></div>
    <div class="pg"><label>${t('font')}</label>
      <div class="row">
        <div class="field"><select class="inp" data-p="font">${fonts.map(f=>`<option ${el.font===f?'selected':''}>${f}</option>`).join('')}</select></div>
        <div class="field"><select class="inp" data-p="weight"><option ${el.weight==='Regular'?'selected':''}>Regular</option><option ${el.weight==='Medium'?'selected':''}>Medium</option><option ${el.weight==='Bold'?'selected':''}>Bold</option></select></div>
        <div class="field"><small>${t('size')}</small><input class="inp" type="number" data-p="size" value="${el.size}"></div>
      </div>
    </div>
    <div class="pg"><label>Strike / Underline</label>
      <div class="row">
        <div class="field"><small>Strike</small>
          <select class="inp" data-p="strike"><option value="false" ${!el.strike?'selected':''}>${t('no')}</option><option value="true" ${el.strike?'selected':''}>${t('yes')}</option></select>
        </div>
        <div class="field"><small>Underline</small>
          <select class="inp" data-p="underline"><option value="false" ${!el.underline?'selected':''}>${t('no')}</option><option value="true" ${el.underline?'selected':''}>${t('yes')}</option></select>
        </div>
      </div>
    </div>`:''}
    ${el.type==='progress'?`<div class="pg"><label>Progress %</label><input class="inp" type="number" data-p="progress" value="${el.progress||70}" min="0" max="100"></div>`:''}
    <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-ghost" id="btnExportLayer" style="flex:1;justify-content:center">${lang==='fa'?'خروجی لایه PNG':'Export Layer PNG'}</button>
      <button class="btn btn-ghost" id="copyBtn" style="flex:1;justify-content:center">${lang==='fa'?'کپی (Ctrl+J)':'Copy (Ctrl+J)'}</button>
      <button class="btn btn-danger" id="delBtn" style="flex:1;margin-top:0">${t('delete')}</button>
    </div>
  `;

  box.querySelectorAll('[data-p]').forEach(inp=>{
    function applyProp(inp){
      // always re-resolve element from array (avoid stale ref)
      const live = elements.find(e=>e.id===selected) || el;
      if(!live) return;
      const p=inp.dataset.p; let v=inp.value;
      if(['x','y','w','h','radius','rotation','angle','size','progress','gradIntensity','blur','strokeWidth','glowSize','glowIntensity'].includes(p)){
        if(v==='' || v==='-' || v==='.') return;
        const num=parseFloat(v);
        if(isNaN(num)) return;
        if((p==='w'||p==='h') && num < 1) return;
        v=num;
      }
      if(p==='alpha'){ const num=parseFloat(v); if(isNaN(num)) return; v=num; }
      if(p==='gradient'||p==='gradFade'||p==='stroke'||p==='strike'||p==='underline'||p==='glow'||p==='textGradient') v=v==='true';
      if(['color','hoverColor','textColor','textColor2','iconColor','strokeColor','glowColor','imageTint'].includes(p)){
        v = (v||'').trim();
        if(v && v[0]!=='#' && v!=='transparent' && /^[0-9a-fA-F]{3,8}$/.test(v)) v='#'+v;
        if(v.length===4 && v[0]==='#') v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];
        live[p]=v;
        box.querySelectorAll(`[data-p="${p}"]`).forEach(s=>{ if(s!==inp){ try{ s.value=v; }catch(e){} } });
        if(v && v!=='transparent') pushRecentColor(v);
      } else {
        live[p]=v;
      }
      // copy back to el reference used by other handlers
      Object.assign(el, live);
      renderEl(live); renderLayers();
      try{ updateMeasures(); }catch(e){}
    }
    inp.addEventListener('input',()=>applyProp(inp));
    inp.addEventListener('change',()=>{
      applyProp(inp);
      const p=inp.dataset.p;
      if(['w','h'].includes(p)){
        let num=parseFloat(inp.value);
        if(isNaN(num) || num < 1){ num = p==='w' ? el.w : el.h; inp.value = num; el[p]=num; renderEl(el); }
      }
      saveHistory();
    });
  });
  document.getElementById('btnExportLayer')?.addEventListener('click',()=>exportSingleLayer(el.id));
  document.getElementById('copyBtn')?.addEventListener('click',()=>duplicateSelected());
  document.getElementById('btnFront')?.addEventListener('click',()=>bringToFront(el.id));
  document.getElementById('btnBack')?.addEventListener('click',()=>sendToBack(el.id));
  document.getElementById('btnFwd')?.addEventListener('click',()=>moveLayer(el.id, +1));
  document.getElementById('btnBwd')?.addEventListener('click',()=>moveLayer(el.id, -1));
  document.getElementById('delBtn')?.addEventListener('click',()=>{ saveHistory(); elements=elements.filter(e=>e.id!==el.id); selected=null; render(); });
  document.getElementById('btnCenterH')?.addEventListener('click',()=>{ el.x=Math.round((CW-el.w)/2); saveHistory(); render(); });
  document.getElementById('btnCenterV')?.addEventListener('click',()=>{ el.y=Math.round((CH-el.h)/2); saveHistory(); render(); });
  document.getElementById('btnCenter')?.addEventListener('click',()=>{ el.x=Math.round((CW-el.w)/2); el.y=Math.round((CH-el.h)/2); saveHistory(); render(); });
  box.querySelectorAll('[data-rc]').forEach(s=>{
    s.addEventListener('click',()=>{
      const prop=s.getAttribute('data-rcp'); const c=s.getAttribute('data-rc');
      if(prop&&c){ el[prop]=c; pushRecentColor(c); render(); }
    });
  });
}

/* Mouse */
function onElDown(e){
  e.preventDefault();
  e.stopPropagation();
  const id=e.currentTarget.dataset.id;
  const h=e.target.dataset.handle;
  if(e.shiftKey){
    if(selectedIds.includes(id)) selectedIds = selectedIds.filter(x=>x!==id);
    else selectedIds = [...selectedIds, id];
    selected = id;
    render();
  } else if(!selectedIds.includes(id)){
    selectedIds = [id];
    selected = id;
    render();
  } else {
    selected = id;
    document.querySelectorAll('.el').forEach(d=>{
      d.classList.toggle('sel', isSelected(d.dataset.id));
      d.classList.toggle('sel-multi', selectedIds.includes(d.dataset.id) && selectedIds.length>1);
    });
  }
  if(h){ resizing=true; resizeH=h; dragging=false; }
  else {
    dragging=true; resizing=false;
    const el=elements.find(x=>x.id===id);
    if(!el) return;
    const r=$('#canvas').getBoundingClientRect();
    dragOff={x:(e.clientX-r.left)/zoom-el.x, y:(e.clientY-r.top)/zoom-el.y};
    // store start positions for group move
    dragStartPositions = {};
    const ids = selectedIds.includes(id) ? selectedIds : [id];
    ids.forEach(sid=>{
      const ee=elements.find(x=>x.id===sid);
      if(ee) dragStartPositions[sid]={x:ee.x,y:ee.y};
    });
  }
}
document.addEventListener('mousemove',e=>{
  if(!selected) return;
  const el=elements.find(x=>x.id===selected); if(!el) return;
  const r=$('#canvas').getBoundingClientRect();
  const mx=(e.clientX-r.left)/zoom, my=(e.clientY-r.top)/zoom;
  if(dragging){
    let nx=mx-dragOff.x, ny=my-dragOff.y;
    // snap to other elements (Photoshop-like)
    const others=elements.filter(o=>o.id!==el.id);
    let snapX=null, snapY=null;
    others.forEach(o=>{
      const ptsX=[o.x, o.x+o.w/2, o.x+o.w];
      const myPtsX=[nx, nx+el.w/2, nx+el.w];
      ptsX.forEach(px=>{
        myPtsX.forEach((mxp,i)=>{
          if(Math.abs(mxp-px)<SNAP){ snapX = px - (i===0?0:i===1?el.w/2:el.w); }
        });
      });
      const ptsY=[o.y, o.y+o.h/2, o.y+o.h];
      const myPtsY=[ny, ny+el.h/2, ny+el.h];
      ptsY.forEach(py=>{
        myPtsY.forEach((myp,i)=>{
          if(Math.abs(myp-py)<SNAP){ snapY = py - (i===0?0:i===1?el.h/2:el.h); }
        });
      });
    });
    // snap to canvas center
    if(Math.abs(nx+el.w/2 - CW/2)<SNAP) snapX = CW/2 - el.w/2;
    if(Math.abs(ny+el.h/2 - CH/2)<SNAP) snapY = CH/2 - el.h/2;
    if(snapX!==null) nx=snapX;
    if(snapY!==null) ny=snapY;
    const dx = Math.max(0,Math.min(CW-el.w,nx)) - (dragStartPositions[el.id]?.x ?? el.x);
    const dy = Math.max(0,Math.min(CH-el.h,ny)) - (dragStartPositions[el.id]?.y ?? el.y);
    // Actually set primary to snapped position
    const newX = Math.max(0,Math.min(CW-el.w,nx));
    const newY = Math.max(0,Math.min(CH-el.h,ny));
    const offX = newX - (dragStartPositions[el.id]?.x ?? el.x);
    const offY = newY - (dragStartPositions[el.id]?.y ?? el.y);
    const group = selectedIds.includes(el.id) && selectedIds.length>1 ? selectedIds : [el.id];
    group.forEach(sid=>{
      const ee=elements.find(x=>x.id===sid);
      if(!ee) return;
      const sx = dragStartPositions[sid]?.x ?? ee.x;
      const sy = dragStartPositions[sid]?.y ?? ee.y;
      ee.x = Math.max(0, Math.min(CW-ee.w, sx+offX));
      ee.y = Math.max(0, Math.min(CH-ee.h, sy+offY));
      renderEl(ee);
    });
    try{updateMeasures();}catch(err){}
  }
  if(resizing){
    const h=resizeH;
    if(h.includes('e')) el.w=Math.max(10, Math.min(CW-el.x, mx-el.x));
    if(h.includes('s')) el.h=Math.max(10, Math.min(CH-el.y, my-el.y));
    if(h.includes('w')){ const nw=el.x+el.w-mx; if(nw>10){ el.w=nw; el.x=Math.max(0,mx); } }
    if(h.includes('n')){ const nh=el.y+el.h-my; if(nh>10){ el.h=nh; el.y=Math.max(0,my); } }
    renderEl(el);
    try{ updateMeasures(); }catch(err){}
  }
});
document.addEventListener('mouseup',()=>{ if(dragging||resizing){ dragging=false; resizing=false; saveHistory(); renderProps(); renderLayers(); }});
$('#canvas').addEventListener('mousedown',e=>{ if(e.target.id==='canvas'||e.target.classList.contains('game-bg')||e.target.id==='els'){ selected=null; selectedIds=[]; render(); }});

/* Drag from sidebar */
$$('.item').forEach(it=>{
  it.addEventListener('dragstart',e=>{ dragType=it.dataset.type; e.dataTransfer.setData('text',it.dataset.type); });
  it.addEventListener('dblclick',()=>{ saveHistory(); const el=createEl(it.dataset.type,200+Math.random()*80,150+Math.random()*80); elements.push(el); selected=el.id; render(); });
});
$('#canvas').addEventListener('dragover',e=>e.preventDefault());
$('#canvas').addEventListener('drop',e=>{
  e.preventDefault();
  // if image files, let the image handler deal with it
  const files=[...(e.dataTransfer.files||[])];
  if(files.some(f=>f.type && f.type.startsWith('image/'))) return;
  const type=(e.dataTransfer.getData('text')||'').trim() || (dragType||'');
  dragType=null; // always clear
  if(!type || type==='text/plain') return;
  // only allow known component types
  const allowed=['rectangle','square','circle','triangle','line','rhombus','button','label','editbox','checkbox','progress','image'];
  if(!allowed.includes(type)) return;
  saveHistory();
  const r=$('#canvas').getBoundingClientRect();
  const el=createEl(type, Math.max(0,(e.clientX-r.left)/zoom-50), Math.max(0,(e.clientY-r.top)/zoom-50));
  elements.push(el); selected=el.id; render();
});
document.addEventListener('dragend',()=>{ dragType=null; });

/* Presets */
$$('.preset').forEach(p=>p.addEventListener('click',()=>addPreset(p.dataset.preset)));

/* Tabs */
$$('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    $$('.tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active');
    $$('.tab-pane').forEach(p=>p.classList.add('hidden'));
    const map={comp:'pane-comp',icons:'pane-icons',preset:'pane-preset',layer:'pane-layer'};
    $('#'+map[tab.dataset.tab])?.classList.remove('hidden');
  });
});

/* Zoom */
$('#zoomIn').onclick=()=>{ zoom=Math.min(1.5,zoom+0.1); applyZoom(); };
$('#zoomOut').onclick=()=>{ zoom=Math.max(0.4,zoom-0.1); applyZoom(); };
function applyZoom(){ $('#canvas').style.transform=`scale(${zoom})`; $('#zoomVal').textContent=Math.round(zoom*100)+'%'; }

/* Clear / Undo / Redo */
$('#clearBtn').onclick=()=>{ if(elements.length&&confirm(lang==='fa'?'همه پاک شود؟':'Clear all?')){ saveHistory(); elements=[]; selected=null; render(); }};
$('#undoBtn').onclick=undo; $('#redoBtn').onclick=redo;
let clipboard = null;

function pushRecentColor(hex){
  if(!hex || hex==='transparent') return;
  hex = String(hex).toLowerCase();
  recentColors = [hex, ...recentColors.filter(c=>c!==hex)].slice(0,12);
  try { localStorage.setItem('nyx_recent_colors', JSON.stringify(recentColors)); } catch(e){}
}
function recentColorsHtml(prop){
  if(!recentColors.length) return '';
  return '<div class="recent-colors">'+recentColors.map(c=>
    '<span data-rc="'+c+'" data-rcp="'+prop+'" style="background:'+c+'" title="'+c+'"></span>'
  ).join('')+'</div>';
}

let recentColors = [];
try { recentColors = JSON.parse(localStorage.getItem('nyx_recent_colors')||'[]'); } catch(e) { recentColors=[]; }
const uploadedImages = {}; // id -> {name, dataUrl}


function duplicateSelected(){
  if(!selected) return;
  const src = elements.find(e => e.id === selected);
  if(!src) return;
  saveHistory();
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'el_' + (nextId++);
  copy.x = Math.min(CW - copy.w, src.x + 20);
  copy.y = Math.min(CH - copy.h, src.y + 20);
  copy.varName = (src.varName || src.type) + '_copy';
  elements.push(copy);
  selected = copy.id;
  render();
}

document.addEventListener('keydown',e=>{
  const tag = document.activeElement && document.activeElement.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  if((e.ctrlKey||e.metaKey)&&e.key==='z'){ e.preventDefault(); undo(); }
  if((e.ctrlKey||e.metaKey)&&e.key==='y'){ e.preventDefault(); redo(); }

  // Ctrl+J or Ctrl+D = Duplicate / Copy element
  if((e.ctrlKey||e.metaKey)&&(e.key==='j'||e.key==='J'||e.key==='d'||e.key==='D') && !typing){
    e.preventDefault();
    duplicateSelected();
  }

  // Ctrl+C = copy to clipboard
  if((e.ctrlKey||e.metaKey)&&(e.key==='c'||e.key==='C') && !typing && selected){
    const src = elements.find(el => el.id === selected);
    if(src){ clipboard = JSON.parse(JSON.stringify(src)); }
  }

  // Ctrl+V = paste from clipboard
  if((e.ctrlKey||e.metaKey)&&(e.key==='v'||e.key==='V') && !typing && clipboard){
    e.preventDefault();
    saveHistory();
    const copy = JSON.parse(JSON.stringify(clipboard));
    copy.id = 'el_' + (nextId++);
    copy.x = Math.min(CW - copy.w, (clipboard.x || 100) + 20);
    copy.y = Math.min(CH - copy.h, (clipboard.y || 100) + 20);
    copy.varName = (clipboard.varName || clipboard.type) + '_copy';
    elements.push(copy);
    selected = copy.id;
    clipboard = JSON.parse(JSON.stringify(copy)); // next paste offsets more
    render();
  }

  if((e.key==='Delete'||e.key==='Backspace')&&selected&&!typing){
    saveHistory(); elements=elements.filter(x=>x.id!==selected); selected=null; render();
  }
});

/* ========== FIXED LUA EXPORT ========== */

function luaTextDraw(el, x, y, w, h, a){
  const lines = [];
  const txt = (el.text||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ');
  const scale = ((el.size||14)/12);
  const [tr,tg,tb]=hexRgb(el.textColor||'#FFFFFF');
  if(el.glow && (el.glowSize||0)>0){
    const [gr,gg,gb]=hexRgb(el.glowColor||el.textColor||'#3b82f6');
    const ga = Math.round(((el.glowIntensity??60)/100) * a * 0.55);
    const gs = Math.max(1, Math.round((el.glowSize||16)/4));
    // soft glow by offset draws
    for(const [ox,oy] of [[-gs,0],[gs,0],[0,-gs],[0,gs],[-gs,-gs],[gs,gs]]){
      lines.push(`    dxDrawText("${txt}", ${x}+${ox}, ${y}+${oy}, ${x}+${w}+${ox}, ${y}+${h}+${oy}, tocolor(${gr},${gg},${gb},${ga}), ${scale} * scaleValue, "default", "center", "center", false, false, false, true)`);
    }
  }
  if(el.textGradient || (el.type==='label' && el.gradient)){
    const [r2,g2,b2]=hexRgb(el.textColor2||el.hoverColor||'#3b82f6');
    lines.push(`    -- text gradient: ${el.textColor||'#fff'} -> ${el.textColor2||'#3b82f6'} (layered approx)`);
    // 3-stop blend for better gradient look in pure dxDrawText
    const stops = [
      [tr,tg,tb, 0],
      [Math.round((tr+r2)/2), Math.round((tg+g2)/2), Math.round((tb+b2)/2), 0],
      [r2,g2,b2, 0]
    ];
    // main readable center color
    lines.push(`    dxDrawText("${txt}", ${x}, ${y}, ${x}+${w}, ${y}+${h}, tocolor(${Math.round((tr+r2)/2)},${Math.round((tg+g2)/2)},${Math.round((tb+b2)/2)},${a}), ${scale} * scaleValue, "default", "center", "center", false, false, false, true)`);
    lines.push(`    -- tip: for full gradient text use Export Lua+Images (PNG bake)`);
  } else {
    lines.push(`    dxDrawText("${txt}", ${x}, ${y}, ${x}+${w}, ${y}+${h}, tocolor(${tr},${tg},${tb},${a}), ${scale} * scaleValue, "default", "center", "center", false, false, false, true)`);
  }
  return lines.join('\\n')+'\\n';
}


/* ===== Classic MTA responsive (scaleValue + getScreenStartPositionFromBox) ===== */
function luaResponsiveHeader(){
  return [
    '-- NyX UI Editor — Responsive (classic scaleValue system)',
    '-- ' + new Date().toLocaleString(),
    '-- Design resolution: ' + CW + ' x ' + CH,
    '',
    'local devScreenX = ' + CW,
    'local devScreenY = ' + CH,
    'local screenX, screenY = guiGetScreenSize()',
    'local scaleValue = screenY / devScreenY',
    'scaleValue = math.max(scaleValue, 0.65)',
    '',
    'getScreenStartPositionFromBox = function(width, height, offsetX, offsetY, startIndicationX, startIndicationY)',
    '    if type(width) ~= "number" then width = 0 end',
    '    if type(height) ~= "number" then height = 0 end',
    '    if type(offsetX) ~= "number" then offsetX = 0 end',
    '    if type(offsetY) ~= "number" then offsetY = 0 end',
    '    local startX = offsetX',
    '    local startY = offsetY',
    '    if startIndicationX == "right" then',
    '        startX = screenX - (width + offsetX)',
    '    elseif startIndicationX == "center" then',
    '        startX = screenX / 2 - width / 2 + offsetX',
    '    end',
    '    if startIndicationY == "bottom" then',
    '        startY = screenY - (height + offsetY)',
    '    elseif startIndicationY == "center" then',
    '        startY = screenY / 2 - height / 2 + offsetY',
    '    end',
    '    return startX, startY',
    'end',
    '',
    ''
  ].join('\n');
}

function luaAnchorFor(el){
  // ALWAYS left/top so relative layout between elements stays intact when scaling.
  // Mixed anchors (center/right) caused UI pieces to drift apart on different resolutions.
  return {ax: 'left', ay: 'top'};
}

function luaOffsets(el, ax, ay){
  let ox = el.x, oy = el.y;
  if(ax === 'right') ox = CW - (el.x + el.w);
  else if(ax === 'center') ox = el.x + el.w/2 - CW/2;
  if(ay === 'bottom') oy = CH - (el.y + el.h);
  else if(ay === 'center') oy = el.y + el.h/2 - CH/2;
  return { ox: Math.round(ox*100)/100, oy: Math.round(oy*100)/100 };
}

function luaStartPos(el, indent){
  indent = indent || '    ';
  const {ax, ay} = luaAnchorFor(el);
  const {ox, oy} = luaOffsets(el, ax, ay);
  const w = Math.round(el.w*100)/100;
  const h = Math.round(el.h*100)/100;
  return indent + 'local startX, startY = getScreenStartPositionFromBox(' + w + ' * scaleValue, ' + h + ' * scaleValue, ' + ox + ' * scaleValue, ' + oy + ' * scaleValue, "' + ax + '", "' + ay + '")\n';
}

function luaBoxSize(el){
  const w = Math.round(el.w*100)/100;
  const h = Math.round(el.h*100)/100;
  return { ws: w + ' * scaleValue', hs: h + ' * scaleValue' };
}

function generateLua(){
  let code = luaResponsiveHeader();

  // Helper functions
  code+=`-- Rounded rectangle helper\n`;
  code+=`local function dxDrawRoundedRect(x, y, w, h, radius, color)\n`;
  code+=`    if radius <= 0 then dxDrawRectangle(x, y, w, h, color) return end\n`;
  code+=`    radius = math.min(radius, w/2, h/2)\n`;
  code+=`    dxDrawRectangle(x + radius, y, w - radius*2, h, color)\n`;
  code+=`    dxDrawRectangle(x, y + radius, radius, h - radius*2, color)\n`;
  code+=`    dxDrawRectangle(x + w - radius, y + radius, radius, h - radius*2, color)\n`;
  code+=`    dxDrawCircle(x + radius, y + radius, radius, 180, 270, color, color, 16)\n`;
  code+=`    dxDrawCircle(x + w - radius, y + radius, radius, 270, 360, color, color, 16)\n`;
  code+=`    dxDrawCircle(x + radius, y + h - radius, radius, 90, 180, color, color, 16)\n`;
  code+=`    dxDrawCircle(x + w - radius, y + h - radius, radius, 0, 90, color, color, 16)\n`;
  code+=`end\n\n`;

      code+=`-- Soft glow approximation (layered rects)\n`;
  code+=`local function dxDrawGlowRect(x, y, w, h, r, g, b, a, size, radius)\n`;
  code+=`    if not size or size <= 0 then return end\n`;
  code+=`    local layers = math.max(3, math.floor(size / 4))\n`;
  code+=`    for i = layers, 1, -1 do\n`;
  code+=`        local t = i / layers\n`;
  code+=`        local expand = size * t\n`;
  code+=`        local aa = a * 0.12 * (1 - t * 0.7)\n`;
  code+=`        local col = tocolor(r, g, b, aa)\n`;
  code+=`        if radius and radius > 0 then\n`;
  code+=`            dxDrawRoundedRect(x - expand, y - expand, w + expand*2, h + expand*2, radius + expand*0.3, col)\n`;
  code+=`        else\n`;
  code+=`            dxDrawRectangle(x - expand, y - expand, w + expand*2, h + expand*2, col)\n`;
  code+=`        end\n`;
  code+=`    end\n`;
  code+=`end\n\n`;

code+=`-- Gradient: pass RGBA components (works in all MTA versions)\n`;
  code+=`local function dxDrawGradientRect(x, y, w, h, r1, g1, b1, a1, r2, g2, b2, a2, angle)\n`;
  code+=`    angle = angle or 180\n`;
  code+=`    local vertical = (angle > 45 and angle < 135) or (angle > 225 and angle < 315)\n`;
  code+=`    -- flip direction for 0 (bottom->top) and 270 (right->left)\n`;
  code+=`    local reverse = (angle >= 315 or angle < 45) or (angle >= 225 and angle <= 315)\n`;
  code+=`    if reverse then\n`;
  code+=`        r1,g1,b1,a1,r2,g2,b2,a2 = r2,g2,b2,a2,r1,g1,b1,a1\n`;
  code+=`    end\n`;
  code+=`    if vertical then\n`;
  code+=`        local steps = math.max(math.floor(w), 12)\n`;
  code+=`        for i = 0, steps - 1 do\n`;
  code+=`            local t = i / steps\n`;
  code+=`            local col = tocolor(r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t, a1+(a2-a1)*t)\n`;
  code+=`            dxDrawRectangle(x + (w/steps)*i, y, math.ceil(w/steps)+1, h, col)\n`;
  code+=`        end\n`;
  code+=`    else\n`;
  code+=`        local steps = math.max(math.floor(h), 12)\n`;
  code+=`        for i = 0, steps - 1 do\n`;
  code+=`            local t = i / steps\n`;
  code+=`            local col = tocolor(r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t, a1+(a2-a1)*t)\n`;
  code+=`            dxDrawRectangle(x, y + (h/steps)*i, w, math.ceil(h/steps)+1, col)\n`;
  code+=`        end\n`;
  code+=`    end\n`;
  code+=`end\n\n`;

code+=`addEventHandler("onClientRender", root, function()\n`;

  elements.forEach(el=>{
    const [r,g,b]=hexRgb(el.color==='transparent'?'#000000':el.color);
    const [r2,g2,b2]=hexRgb(el.hoverColor||'#000000');
    const a=Math.floor((el.alpha||1)*255);
    const col=`tocolor(${r},${g},${b},${a})`;
    const col2=`tocolor(${r2},${g2},${b2},${a})`;
        const rad=el.radius||0;
    const {ws, hs} = luaBoxSize(el);
    code += luaStartPos(el);
    const x='startX', y='startY', w=ws, h=hs;

    code+=`    -- ${el.varName} [${el.type}]
`;
    if(el.glow && (el.glowSize||0)>0 && el.type!=='label'){
      const [gr,gg,gb]=hexRgb(el.glowColor||'#3b82f6');
      const ga=Math.floor(((el.glowIntensity||60)/100)*180);
      code+=`    dxDrawGlowRect(${x}, ${y}, ${w}, ${h}, ${gr}, ${gg}, ${gb}, ${ga}, ${el.glowSize||16}, ${rad})\n`;
    }

    if(el.type==='circle'){
      code+=`    dxDrawCircle(${x}+${w}/2, ${y}+${h}/2, ${w}/2, 0, 360, ${col}, ${col}, 32)\n`;
    } else if(el.type==='line'){
      code+=`    dxDrawLine(${x}, ${y}+${h}/2, ${x}+${w}, ${y}+${h}/2, ${col}, math.max(1, ${h}))\n`;
    } else if(el.type==='label'){
      code += luaTextDraw(el, x, y, w, h, a);
    } else if(el.type==='button'){
      if(el.gradient || el.gradFade){
        const intens = Math.max(0, Math.min(100, el.gradIntensity||100)) / 100;
        const a1 = Math.floor(a * intens);
        const a2 = el.gradFade ? 0 : Math.floor(a * intens);
        const rr2 = el.gradFade ? r : r2, gg2 = el.gradFade ? g : g2, bb2 = el.gradFade ? b : b2;
        code+=`    dxDrawGradientRect(${x}, ${y}, ${w}, ${h}, ${r}, ${g}, ${b}, ${a1}, ${rr2}, ${gg2}, ${bb2}, ${a2}, ${el.angle||180})\n`;
      } else if(rad>0){
        code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}, ${h}, ${rad}, ${col})\n`;
      } else {
        code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, ${col})\n`;
      }
      code += luaTextDraw(el, x, y, w, h, a);
    } else if(el.type==='editbox'){
      if(rad>0) code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}, ${h}, ${rad}, ${col})\n`;
      else code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, ${col})\n`;
      code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, tocolor(255,255,255,15))\n`;
    } else if(el.type==='checkbox'){
      if(rad>0) code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}, ${h}, ${rad}, ${col})\n`;
      else code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, ${col})\n`;
      code+=`    dxDrawText("✓", ${x}, ${y}, ${x}+${w}, ${y}+${h}, tocolor(255,255,255,${a}), 1.2*sh, "default", "center", "center")\n`;
    } else if(el.type==='progress'){
      const pct=(el.progress||70)/100;
      code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}, ${h}, ${rad}, ${col2})\n`;
      code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}*${pct}, ${h}, ${rad}, ${col})\n`;
    } else if(el.type==='triangle'){
      code+=`    -- Triangle approximated with rectangle (use dxDrawPrimitive for real triangle)\n`;
      code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, ${col})\n`;
    } else {
      // rectangle, square, rhombus, image, panels
      if(el.gradient || el.gradFade){
        const intens = Math.max(0, Math.min(100, el.gradIntensity||100)) / 100;
        const a1 = Math.floor(a * intens);
        const a2 = el.gradFade ? 0 : Math.floor(a * intens);
        const rr2 = el.gradFade ? r : r2, gg2 = el.gradFade ? g : g2, bb2 = el.gradFade ? b : b2;
        code+=`    dxDrawGradientRect(${x}, ${y}, ${w}, ${h}, ${r}, ${g}, ${b}, ${a1}, ${rr2}, ${gg2}, ${bb2}, ${a2}, ${el.angle||180})\n`;
      } else if(rad>0){
        code+=`    dxDrawRoundedRect(${x}, ${y}, ${w}, ${h}, ${rad}, ${col})\n`;
      } else {
        code+=`    dxDrawRectangle(${x}, ${y}, ${w}, ${h}, ${col})\n`;
      }
    }
    code+=`\n`;
  });

  code+=`end)\n`;
  return code;
}

function generateMetaXml(){
  return `<!-- NyX UI Editor - MTA Resource -->
<meta>
    <info author="NyX UI Editor" name="nyx_ui" version="1.0" type="script" description="UI generated by NyX UI Editor"/>
    <script src="client.lua" type="client"/>
    <!-- Images: place files in images/ and list them below -->
    <!-- <file src="images/example.png"/> -->
    <!-- Fonts: put .ttf in fonts/ -->
    <!-- <file src="fonts/CustomFont.ttf"/> -->
</meta>
`;
}

function downloadText(filename, content){
  const b = new Blob([content], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

$('#exportBtn').onclick=()=>{
  const lua = generateLua();
  const meta = generateMetaXml();
  $('#exCode').textContent = lua + '\n\n========== meta.xml ==========\n\n' + meta +
    '\n\n========== README ==========\n\n' +
    '1. Create folder: nyx_ui\n' +
    '2. Put client.lua (the Lua code above) inside it\n' +
    '3. Put meta.xml inside it\n' +
    '4. Optional: create fonts/ and add .ttf files\n' +
    '5. Start resource: start nyx_ui\n' +
    'Fonts: dxDraw uses default font. For custom fonts use dxCreateFont("fonts/Name.ttf", size)';
  $('#exportModal').classList.remove('hidden');
};
$('#exClose').onclick=$('#exCancel').onclick=()=>$('#exportModal').classList.add('hidden');
$('#exCopy').onclick=()=>{ navigator.clipboard.writeText(generateLua()).then(()=>{ $('#exCopy').textContent=lang==='fa'?'کپی شد!':'Copied!'; setTimeout(()=>$('#exCopy').textContent=t('copy'),1200); }); };
$('#exDl').onclick=()=>{
  // Download client.lua + meta.xml
  downloadText('client.lua', generateLua());
  setTimeout(() => downloadText('meta.xml', generateMetaXml()), 400);
  setTimeout(() => downloadText('README.txt',
`NyX UI Editor - Resource Package
================================
1. Make a folder named: nyx_ui
2. Put client.lua and meta.xml inside
3. (Optional) Create fonts/ folder and put .ttf fonts
4. Copy folder to server: mods/deathmatch/resources/nyx_ui
5. In server console: refresh && start nyx_ui

Custom fonts example in Lua:
local font = dxCreateFont("fonts/MyFont.ttf", 14)
dxDrawText("Hello", x, y, x+w, y+h, tocolor(255,255,255,255), 1, font)
`), 800);
};

/* AI */
function buildAiPresets(){
  const presets=lang==='fa'?[
    {l:'پنل لاگین',p:'login panel with username password and login button'},
    {l:'HUD سلامت',p:'hud health armor money bars top right'},
    {l:'اسکورباورد',p:'scoreboard panel with title and close button'},
    {l:'نوتیفیکیشن',p:'notification box top center'},
    {l:'منوی فروشگاه',p:'shop menu with items and buy button'},
    {l:'پنل تنظیمات',p:'settings panel with options'},
  ]:[
    {l:'Login Panel',p:'login panel with username password and login button'},
    {l:'HUD Bars',p:'hud health armor money bars top right'},
    {l:'Scoreboard',p:'scoreboard panel with title and close button'},
    {l:'Notification',p:'notification box top center'},
    {l:'Shop Menu',p:'shop menu with items and buy button'},
    {l:'Settings',p:'settings panel with options'},
  ];
  $('#aiPresets').innerHTML=presets.map(x=>`<button data-p="${x.p}">${x.l}</button>`).join('');
  $$('#aiPresets button').forEach(b=>b.onclick=()=>{$('#aiPrompt').value=b.dataset.p});
}

function runAI(prompt){
  saveHistory(); elements=[]; selected=null;
  const p=prompt.toLowerCase();

  if(p.includes('login')){
    elements.push(createEl('rectangle',440,160,{w:400,h:380,color:'#12121a',radius:14,varName:'login_bg'}));
    elements.push(createEl('label',440,190,{w:400,h:40,text:lang==='fa'?'خوش آمدید':'Welcome',size:22,weight:'Bold',varName:'login_title'}));
    elements.push(createEl('editbox',480,260,{w:320,h:42,text:lang==='fa'?'نام کاربری':'Username',varName:'login_user'}));
    elements.push(createEl('editbox',480,320,{w:320,h:42,text:lang==='fa'?'رمز عبور':'Password',varName:'login_pass'}));
    elements.push(createEl('button',480,400,{w:320,h:46,text:lang==='fa'?'ورود':'Login',color:'#6366f1',radius:10,varName:'login_btn'}));
  } else if(p.includes('hud')||p.includes('health')||p.includes('armor')){
    elements.push(createEl('rectangle',1000,25,{w:240,h:16,color:'#1a1a24',radius:8,varName:'hp_bg'}));
    elements.push(createEl('rectangle',1002,27,{w:200,h:12,color:'#22c55e',radius:6,varName:'hp_bar'}));
    elements.push(createEl('rectangle',1000,50,{w:240,h:16,color:'#1a1a24',radius:8,varName:'ar_bg'}));
    elements.push(createEl('rectangle',1002,52,{w:150,h:12,color:'#3b82f6',radius:6,varName:'ar_bar'}));
    elements.push(createEl('label',1000,78,{w:240,h:28,text:'$00000000',size:16,weight:'Bold',textColor:'#22c55e',varName:'money'}));
  } else if(p.includes('score')){
    elements.push(createEl('rectangle',340,80,{w:600,h:500,color:'#0e0e14',radius:12,alpha:0.95,varName:'score_bg'}));
    elements.push(createEl('label',340,95,{w:540,h:40,text:'Scoreboard',size:20,weight:'Bold',varName:'score_title'}));
    elements.push(createEl('button',890,95,{w:36,h:36,text:'✕',color:'#ef4444',radius:6,size:14,varName:'score_close'}));
    elements.push(createEl('rectangle',360,150,{w:560,h:380,color:'#16161e',radius:8,varName:'score_list'}));
  } else if(p.includes('notif')){
    elements.push(createEl('rectangle',440,30,{w:400,h:64,color:'#1e293b',radius:10,varName:'notif_bg'}));
    elements.push(createEl('circle',455,42,{w:40,h:40,color:'#3b82f6',varName:'notif_icon'}));
    elements.push(createEl('label',510,42,{w:300,h:40,text:lang==='fa'?'پیام اعلان':'Notification message',size:14,varName:'notif_text'}));
  } else if(p.includes('shop')){
    elements.push(createEl('rectangle',340,100,{w:600,h:480,color:'#12121a',radius:14,varName:'shop_bg'}));
    elements.push(createEl('label',340,120,{w:600,h:40,text:lang==='fa'?'فروشگاه':'Shop',size:20,weight:'Bold',varName:'shop_title'}));
    elements.push(createEl('rectangle',370,180,{w:160,h:200,color:'#1a1a28',radius:10,varName:'item1'}));
    elements.push(createEl('rectangle',560,180,{w:160,h:200,color:'#1a1a28',radius:10,varName:'item2'}));
    elements.push(createEl('rectangle',750,180,{w:160,h:200,color:'#1a1a28',radius:10,varName:'item3'}));
    elements.push(createEl('button',520,480,{w:200,h:44,text:lang==='fa'?'خرید':'Buy',color:'#22c55e',radius:10,varName:'shop_buy'}));
  } else if(p.includes('setting')){
    elements.push(createEl('rectangle',440,120,{w:400,h:420,color:'#12121a',radius:14,varName:'set_bg'}));
    elements.push(createEl('label',440,145,{w:400,h:36,text:lang==='fa'?'تنظیمات':'Settings',size:18,weight:'Bold',varName:'set_title'}));
    elements.push(createEl('label',480,210,{w:200,h:30,text:lang==='fa'?'صدا':'Volume',size:14,varName:'set_vol'}));
    elements.push(createEl('progress',480,245,{w:280,h:12,progress:60,varName:'set_vol_bar'}));
    elements.push(createEl('label',480,290,{w:200,h:30,text:lang==='fa'?'گرافیک':'Graphics',size:14,varName:'set_gfx'}));
    elements.push(createEl('progress',480,325,{w:280,h:12,progress:80,color:'#8b5cf6',varName:'set_gfx_bar'}));
    elements.push(createEl('button',520,440,{w:240,h:42,text:lang==='fa'?'ذخیره':'Save',color:'#6366f1',radius:10,varName:'set_save'}));
  } else {
    elements.push(createEl('rectangle',440,180,{w:400,h:300,color:'#12121a',radius:14,varName:'panel_bg'}));
    elements.push(createEl('label',440,210,{w:400,h:36,text:'NyX Panel',size:18,weight:'Bold',varName:'panel_title'}));
    elements.push(createEl('button',520,380,{w:240,h:44,text:lang==='fa'?'تایید':'Confirm',color:'#6366f1',radius:10,varName:'panel_btn'}));
  }
  render();
}

$('#aiBtn').onclick=()=>{$('#aiModal').classList.remove('hidden'); buildAiPresets();};
$('#aiClose').onclick=$('#aiCancel').onclick=()=>$('#aiModal').classList.add('hidden');
$('#aiRun').onclick=()=>{ const p=$('#aiPrompt').value||'panel'; $('#aiModal').classList.add('hidden'); runAI(p); };

/* Language */

/* ===== IndexedDB project store (browser TEMP equivalent) ===== */
const NYX_DB = 'nyx_ui_db';
const NYX_STORE = 'projects';
let currentProjectId = null;
let currentProjectName = '';
let customIcons = []; // {id, name, dataUrl} — capacity 5000, IndexedDB
const CUSTOM_ICON_LIMIT = 5000;
const CUSTOM_ICON_DB = 'nyx_icons_db';
const CUSTOM_ICON_STORE = 'icons';

function openIconDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(CUSTOM_ICON_DB, 1);
    req.onupgradeneeded = function(){
      const db = req.result;
      if(!db.objectStoreNames.contains(CUSTOM_ICON_STORE)){
        db.createObjectStore(CUSTOM_ICON_STORE, {keyPath:'id'});
      }
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}

async function loadCustomIcons(){
  try {
    const db = await openIconDB();
    const rows = await new Promise((resolve, reject)=>{
      const tx = db.transaction(CUSTOM_ICON_STORE, 'readonly');
      const req = tx.objectStore(CUSTOM_ICON_STORE).getAll();
      req.onsuccess = ()=>resolve(req.result||[]);
      req.onerror = ()=>reject(req.error);
    });
    // newest first
    customIcons = rows.sort((a,b)=>(b.ts||0)-(a.ts||0));
    return customIcons;
  } catch(e){
    console.warn('loadCustomIcons', e);
    // fallback localStorage (legacy small libs)
    try {
      const raw = localStorage.getItem('nyx_custom_icons');
      if(raw) customIcons = JSON.parse(raw)||[];
    } catch(e2){ customIcons = []; }
    return customIcons;
  }
}

async function saveCustomIcons(){
  try {
    const db = await openIconDB();
    await new Promise((resolve, reject)=>{
      const tx = db.transaction(CUSTOM_ICON_STORE, 'readwrite');
      const store = tx.objectStore(CUSTOM_ICON_STORE);
      store.clear();
      (customIcons||[]).forEach(ic=>store.put(ic));
      tx.oncomplete = ()=>resolve();
      tx.onerror = ()=>reject(tx.error);
    });
  } catch(e){
    console.warn('saveCustomIcons IDB failed', e);
    try {
      // last resort tiny fallback
      localStorage.setItem('nyx_custom_icons', JSON.stringify((customIcons||[]).slice(0,50)));
    } catch(e2){}
  }
}

async function addCustomIconsBatch(items){
  // items: [{id,name,dataUrl,ts}]
  customIcons = [...items, ...(customIcons||[])];
  // dedupe by name+size-ish dataUrl prefix
  const seen = new Set();
  customIcons = customIcons.filter(ic=>{
    const key = (ic.name||'')+'|'+(ic.dataUrl||'').slice(0,64);
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if(customIcons.length > CUSTOM_ICON_LIMIT){
    customIcons = customIcons.slice(0, CUSTOM_ICON_LIMIT);
  }
  await saveCustomIcons();
}

// load async on start
loadCustomIcons().then(()=>{ try{ buildIconGrid(); }catch(e){} }).catch(()=>{});

let autoSaveTimer = null;

function openNyxDB(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(NYX_DB, 1);
    req.onupgradeneeded = function(){
      const db = req.result;
      if(!db.objectStoreNames.contains(NYX_STORE)){
        const store = db.createObjectStore(NYX_STORE, {keyPath:'id'});
        store.createIndex('updatedAt', 'updatedAt', {unique:false});
      }
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}

async function listNyxProjects(){
  const db = await openNyxDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(NYX_STORE, 'readonly');
    const store = tx.objectStore(NYX_STORE);
    const req = store.getAll();
    req.onsuccess = ()=>{
      const rows = (req.result||[]).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      resolve(rows);
    };
    req.onerror = ()=>reject(req.error);
  });
}

async function saveNyxToDB(silent){
  try {
    const project = buildNyxProject();
    project.id = currentProjectId || ('p_' + Date.now() + '_' + Math.random().toString(36).slice(2,7));
    project.updatedAt = Date.now();
    project.name = currentProjectName || project.name || ('AutoSave ' + new Date().toLocaleString());
    currentProjectName = project.name;
    project.layerCount = (project.elements||[]).length;
    currentProjectId = project.id;
    const db = await openNyxDB();
    await new Promise((resolve, reject)=>{
      const tx = db.transaction(NYX_STORE, 'readwrite');
      tx.objectStore(NYX_STORE).put(project);
      tx.oncomplete = ()=>resolve();
      tx.onerror = ()=>reject(tx.error);
    });
    // keep max 20 projects
    const all = await listNyxProjects();
    if(all.length > 20){
      const db2 = await openNyxDB();
      const tx2 = db2.transaction(NYX_STORE, 'readwrite');
      all.slice(20).forEach(p=>tx2.objectStore(NYX_STORE).delete(p.id));
    }
    const badge = document.getElementById('autosaveBadge');
    if(badge) badge.textContent = (lang==='fa'?'ذخیره شد ':'Saved ') + new Date().toLocaleTimeString();
    if(!silent) console.log('NyX auto-saved', project.id);
    return project.id;
  } catch(e){
    console.warn('auto-save failed', e);
  }
}

async function openNyxProjectById(id){
  const db = await openNyxDB();
  const row = await new Promise((resolve, reject)=>{
    const tx = db.transaction(NYX_STORE, 'readonly');
    const req = tx.objectStore(NYX_STORE).get(id);
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  if(!row){ alert('Project not found'); return; }
  currentProjectId = row.id;
  currentProjectName = row.name || '';
  loadNyxProject(row);
  enterEditor();
}

async function renameNyxProject(id, newName){
  const db = await openNyxDB();
  const row = await new Promise((resolve, reject)=>{
    const tx = db.transaction(NYX_STORE, 'readonly');
    const req = tx.objectStore(NYX_STORE).get(id);
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  if(!row) return;
  row.name = newName;
  row.updatedAt = Date.now();
  await new Promise((resolve, reject)=>{
    const tx = db.transaction(NYX_STORE, 'readwrite');
    tx.objectStore(NYX_STORE).put(row);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
  if(currentProjectId === id) currentProjectName = newName;
}
async function deleteNyxProject(id){
  const db = await openNyxDB();
  await new Promise((resolve, reject)=>{
    const tx = db.transaction(NYX_STORE, 'readwrite');
    tx.objectStore(NYX_STORE).delete(id);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
  if(currentProjectId === id) currentProjectId = null;
}

function startAutoSave(){
  if(autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(()=>{
    if(document.getElementById('app')?.classList.contains('hidden')) return;
    // only if there is something or existing project
    if(elements.length || currentProjectId) saveNyxToDB(true);
  }, 60 * 1000);
}


function setLang(l){
  try {
    lang = (l === 'fa' || l === 'ar' || l === 'en') ? l : 'en';
    applyI18n();
    try { localStorage.setItem('nyx_lang', lang); } catch(e) {}
    document.getElementById('langOverlay')?.classList.add('hidden');
    // after language → recent projects or editor
    afterLanguageChosen();
  } catch(err) {
    console.error('setLang error', err);
    document.getElementById('langOverlay').style.display = 'none';
    enterEditor();
  }
}

function enterEditor(){
  document.getElementById('langOverlay')?.classList.add('hidden');
  document.getElementById('projectsOverlay')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  startAutoSave();
}

function afterLanguageChosen(){
  listNyxProjects().then(list => {
    if(!list || list.length === 0){
      enterEditor();
      return;
    }
    showProjectsScreen(list);
  }).catch(() => enterEditor());
}

function showProjectsScreen(list){
  const po = document.getElementById('projectsOverlay');
  const appEl = document.getElementById('app');
  if(appEl) appEl.classList.add('hidden');
  if(po){ po.classList.remove('hidden'); po.style.display = 'flex'; }
  const title = document.getElementById('projTitle');
  const sub = document.getElementById('projSub');
  if(title) title.textContent = lang==='fa' ? 'پروژه‌های اخیر' : (lang==='ar' ? 'المشاريع الأخيرة' : 'Recent Projects');
  if(sub) sub.textContent = lang==='fa' ? 'ذخیره خودکار در حافظه مرورگر' : 'Auto-saved in browser storage';
  const btnNew = document.getElementById('btnNewProject');
  if(btnNew) btnNew.textContent = lang==='fa' ? '+ جدید' : (lang==='ar' ? '+ جديد' : '+ New');
  const box = document.getElementById('projectsList');
  if(!box) return;
  if(!list || !list.length){
    box.innerHTML = '<div style="color:var(--muted);padding:24px;text-align:center">'+(lang==='fa'?'پروژه‌ای نیست — New بزن':'No projects — click New')+'</div>';
    return;
  }
  box.innerHTML = list.map(p => {
    const when = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '';
    const layers = (p.elements && p.elements.length) || p.layerCount || 0;
    const name = p.name || ('Project ' + String(p.id||'').slice(-6));
    const safeName = String(name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    return '<div class="proj-item" data-id="'+p.id+'">'
      +'<div class="pi-info"><div class="pi-name">'+safeName+'</div>'
      +'<div class="pi-meta">'+when+' · '+layers+' layers · '+(p.canvas&&p.canvas.w||'?')+'×'+(p.canvas&&p.canvas.h||'?')+'</div></div>'
      +'<button type="button" class="pi-ren" data-action="rename" data-id="'+p.id+'" data-name="'+safeName+'">'+(lang==='fa'?'نام':'Rename')+'</button>'
      +'<button type="button" class="pi-del" data-action="delete" data-id="'+p.id+'">'+(lang==='fa'?'حذف':'Del')+'</button>'
      +'</div>';
  }).join('');
}


document.querySelectorAll('.lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setLang(btn.getAttribute('data-lang'));
  });
});

let pendingProjectAction = null;

function openNameModal(mode, existingName, projectId){
  pendingProjectAction = mode === 'rename' ? {type:'rename', id:projectId} : {type:'new'};
  const modal = document.getElementById('nameProjectModal');
  const title = document.getElementById('nameProjTitle');
  const label = document.getElementById('nameProjLabel');
  const input = document.getElementById('nameProjInput');
  const ok = document.getElementById('nameProjOk');
  if(title) title.textContent = mode==='rename'
    ? (lang==='fa'?'تغییر نام پروژه':'Rename Project')
    : (lang==='fa'?'پروژه جدید':'New Project');
  if(label) label.textContent = lang==='fa'?'نام پروژه':'Project name';
  if(ok) ok.textContent = mode==='rename' ? (lang==='fa'?'ذخیره':'Save') : (lang==='fa'?'بساز':'Create');
  if(input) input.value = existingName || '';
  if(modal){
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '10050';
  }
  setTimeout(()=>{ try{ input && input.focus(); input && input.select(); }catch(e){} }, 50);
}
function closeNameModal(){
  const modal = document.getElementById('nameProjectModal');
  if(modal){ modal.classList.add('hidden'); modal.style.display = 'none'; }
  pendingProjectAction = null;
}
async function confirmNameModal(){
  const name = ((document.getElementById('nameProjInput')||{}).value || '').trim() || (lang==='fa'?'بدون نام':'Untitled');
  if(!pendingProjectAction){ closeNameModal(); return; }
  if(pendingProjectAction.type === 'new'){
    elements = [];
    selected = null;
    selectedIds = [];
    currentProjectId = null;
    currentProjectName = name;
    const root = document.getElementById('els');
    if(root) root.innerHTML = '';
    try { applyResolution(1920, 1080); } catch(e){}
    closeNameModal();
    enterEditor();
    render();
    try { await saveNyxToDB(true); } catch(e){ console.warn(e); }
  } else if(pendingProjectAction.type === 'rename'){
    try {
      await renameNyxProject(pendingProjectAction.id, name);
      closeNameModal();
      const list2 = await listNyxProjects();
      showProjectsScreen(list2);
    } catch(e){
      alert('Rename failed: '+(e.message||e));
    }
  }
}

// ONE global click handler for projects + modal (works even if DOM rebuilt)
document.addEventListener('click', async function(ev){
  const t = ev.target;
  if(!t || !t.closest) return;

  // Modal buttons
  if(t.closest('#nameProjClose') || t.closest('#nameProjCancel')){
    ev.preventDefault(); closeNameModal(); return;
  }
  if(t.closest('#nameProjOk')){
    ev.preventDefault(); await confirmNameModal(); return;
  }
  if(t.closest('#btnNewProject')){
    ev.preventDefault(); openNameModal('new'); return;
  }

  // Project list actions
  const actionBtn = t.closest('#projectsList [data-action]');
  if(actionBtn){
    ev.preventDefault();
    ev.stopPropagation();
    const id = actionBtn.getAttribute('data-id');
    const action = actionBtn.getAttribute('data-action');
    if(action === 'rename'){
      openNameModal('rename', actionBtn.getAttribute('data-name')||'', id);
      return;
    }
    if(action === 'delete'){
      if(!confirm(lang==='fa'?'حذف این پروژه؟':'Delete this project?')) return;
      try {
        await deleteNyxProject(id);
        const list2 = await listNyxProjects();
        if(!list2.length){
          document.getElementById('projectsOverlay')?.classList.add('hidden');
          enterEditor();
        } else showProjectsScreen(list2);
      } catch(err){
        alert('Delete failed: '+(err.message||err));
      }
      return;
    }
  }

  // Open project (click row, not buttons)
  const item = t.closest('#projectsList .proj-item');
  if(item && !t.closest('[data-action]')){
    const id = item.getAttribute('data-id');
    if(id){
      try { await openNyxProjectById(id); }
      catch(err){ alert('Open failed: '+(err.message||err)); }
    }
  }
});

document.addEventListener('keydown', function(ev){
  if(ev.key === 'Enter' && document.getElementById('nameProjectModal') && !document.getElementById('nameProjectModal').classList.contains('hidden')){
    confirmNameModal();
  }
  if(ev.key === 'Escape') closeNameModal();
});


var langBtn = document.getElementById('langBtn');
if (langBtn) {
  langBtn.addEventListener('click', function() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('projectsOverlay')?.classList.add('hidden');
    document.getElementById('langOverlay').classList.remove('hidden');
  });
}


/* ===== Image upload / drop ===== */
function addImageFromFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    saveHistory();
    const dataUrl = ev.target.result;
    const el = createEl('image', 200, 150, {w:160,h:160,varName:'img_'+nextId, imageData:dataUrl, imageName:file.name});
    uploadedImages[el.id] = {name:file.name, dataUrl:dataUrl};
    elements.push(el);
    selected = el.id;
    render();
  };
  reader.readAsDataURL(file);
}

const fileInput = document.getElementById('fileImageInput');
document.getElementById('btnUploadImg')?.addEventListener('click', ()=> fileInput && fileInput.click());
fileInput?.addEventListener('change', function(){
  [...(this.files||[])].forEach(addImageFromFile);
  this.value = '';
});

// Drop images onto canvas
const canvasEl = document.getElementById('canvas');
canvasEl?.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
canvasEl?.addEventListener('drop', e=>{
  e.preventDefault();
  const files = [...(e.dataTransfer.files||[])].filter(f=>f.type.startsWith('image/'));
  if(files.length){ files.forEach(addImageFromFile); return; }
  // existing component drop handled elsewhere
});

/* ===== Distance measures (Photoshop-like) ===== */
function updateMeasures(){
  const layer = document.getElementById('measureLayer');
  if(!layer) return;
  layer.innerHTML = '';
  if(!selected) return;
  const el = elements.find(e=>e.id===selected);
  if(!el) return;
  const others = elements.filter(e=>e.id!==selected);
  if(!others.length) return;

  function drawHGap(x1, x2, y){
    const gap = Math.round(x2 - x1);
    if(gap < 0) return;
    const w = Math.max(gap, 1);
    layer.innerHTML += `<div class="measure-line h" style="left:${x1}px;top:${y}px;width:${w}px"></div>`;
    layer.innerHTML += `<div class="measure-line v" style="left:${x1}px;top:${y-5}px;height:11px"></div>`;
    layer.innerHTML += `<div class="measure-line v" style="left:${x1+w}px;top:${y-5}px;height:11px"></div>`;
    layer.innerHTML += `<div class="measure-label" style="left:${x1+w/2}px;top:${y}px">${gap} px</div>`;
  }
  function drawVGap(y1, y2, x){
    const gap = Math.round(y2 - y1);
    if(gap < 0) return;
    const h = Math.max(gap, 1);
    layer.innerHTML += `<div class="measure-line v" style="left:${x}px;top:${y1}px;height:${h}px"></div>`;
    layer.innerHTML += `<div class="measure-line h" style="left:${x-5}px;top:${y1}px;width:11px"></div>`;
    layer.innerHTML += `<div class="measure-line h" style="left:${x-5}px;top:${y1+h}px;width:11px"></div>`;
    layer.innerHTML += `<div class="measure-label" style="left:${x}px;top:${y1+h/2}px">${gap} px</div>`;
  }

  // ONLY nearest neighbor on each of 4 sides (not all shapes)
  let nearL=null, nearR=null, nearT=null, nearB=null;
  const ecx = el.x + el.w/2, ecy = el.y + el.h/2;

  others.forEach(o=>{
    const ocx = o.x + o.w/2, ocy = o.y + o.h/2;
    const vOv = Math.min(el.y+el.h, o.y+o.h) - Math.max(el.y, o.y);
    const hOv = Math.min(el.x+el.w, o.x+o.w) - Math.max(el.x, o.x);
    // same row if vertical centers close OR vertical overlap
    const sameRow = vOv > 0 || Math.abs(ecy - ocy) < Math.max(el.h, o.h) * 0.55;
    // same column if horizontal centers close OR horizontal overlap
    const sameCol = hOv > 0 || Math.abs(ecx - ocx) < Math.max(el.w, o.w) * 0.55;

    if(sameRow){
      if(o.x + o.w <= el.x + 0.5){
        const g = el.x - (o.x + o.w);
        if(nearL===null || g < nearL.g) nearL = {g, o};
      }
      if(el.x + el.w <= o.x + 0.5){
        const g = o.x - (el.x + el.w);
        if(nearR===null || g < nearR.g) nearR = {g, o};
      }
    }
    if(sameCol){
      if(o.y + o.h <= el.y + 0.5){
        const g = el.y - (o.y + o.h);
        if(nearT===null || g < nearT.g) nearT = {g, o};
      }
      if(el.y + el.h <= o.y + 0.5){
        const g = o.y - (el.y + el.h);
        if(nearB===null || g < nearB.g) nearB = {g, o};
      }
    }
  });

  if(nearL){
    const o=nearL.o;
    const y = Math.round((Math.max(el.y,o.y)+Math.min(el.y+el.h,o.y+o.h))/2);
    drawHGap(o.x+o.w, el.x, y);
  }
  if(nearR){
    const o=nearR.o;
    const y = Math.round((Math.max(el.y,o.y)+Math.min(el.y+el.h,o.y+o.h))/2);
    drawHGap(el.x+el.w, o.x, y);
  }
  if(nearT){
    const o=nearT.o;
    const x = Math.round((Math.max(el.x,o.x)+Math.min(el.x+el.w,o.x+o.w))/2);
    drawVGap(o.y+o.h, el.y, x);
  }
  if(nearB){
    const o=nearB.o;
    const x = Math.round((Math.max(el.x,o.x)+Math.min(el.x+el.w,o.x+o.w))/2);
    drawVGap(el.y+el.h, o.y, x);
  }
}
const _origRender = render;
render = function(){ _origRender(); try{ updateMeasures(); }catch(e){} };

/* ===== ZIP export with images + meta ===== */
async function downloadZipPackage(){
  if(typeof JSZip === 'undefined'){
    // fallback separate files
    downloadText('client.lua', generateLua());
    setTimeout(()=>downloadText('meta.xml', generateMetaXml()), 300);
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder('nyx_ui');
  folder.file('client.lua', generateLua());
  folder.file('meta.xml', generateMetaXml());
  folder.file('README.txt', `NyX UI Resource
1. Copy nyx_ui folder to resources/
2. refresh && start nyx_ui
Images are embedded as data in client if needed, or place files in images/
`);
  // collect uploaded images
  const imgFolder = folder.folder('images');
  let imgIdx = 0;
  elements.forEach(el=>{
    if(el.imageData && el.imageName){
      const base = (el.imageName||('img_'+imgIdx)).replace(/[^a-zA-Z0-9._-]/g,'_');
      const b64 = el.imageData.split(',')[1];
      if(b64) imgFolder.file(base, b64, {base64:true});
      imgIdx++;
    }
  });
  const blob = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nyx_ui_resource.zip';
  a.click();
}

// override download button
const exDlBtn = document.getElementById('exDl');
if(exDlBtn){
  exDlBtn.onclick = function(){ downloadZipPackage(); };
}


/* ===== Export canvas as PNG image ===== */

/* ===== .nyx project save / load ===== */
function buildNyxProject(){
  return {
    format: 'nyx',
    version: 1,
    name: currentProjectName || (currentProjectId ? ('Project ' + String(currentProjectId).slice(-6)) : ('Project ' + new Date().toLocaleString())),
    savedAt: new Date().toISOString(),
    canvas: { w: CW, h: CH },
    nextId: nextId,
    zoom: zoom,
    elements: JSON.parse(JSON.stringify(elements)),
  };
}

function saveNyxFile(){
  const project = buildNyxProject();
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.download = 'project_' + stamp + '.nyx';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  saveNyxToDB(true);
}

function loadNyxProject(data){
  try {
    if(typeof data === 'string') data = JSON.parse(data);
    if(!data || data.format !== 'nyx' || !Array.isArray(data.elements)){
      alert(lang==='fa'?'فایل .nyx معتبر نیست':'Invalid .nyx file');
      return;
    }
    saveHistory();
    if(data.canvas && data.canvas.w && data.canvas.h){
      try { applyResolution(data.canvas.w, data.canvas.h); } catch(e){
        CW = data.canvas.w; CH = data.canvas.h;
        const c=document.getElementById('canvas');
        if(c){ c.style.width=CW+'px'; c.style.height=CH+'px'; }
      }
    }
    elements = data.elements.map(el => ({...el}));
    // restore uploadedImages map from elements
    try {
      Object.keys(uploadedImages||{}).forEach(k=>delete uploadedImages[k]);
    } catch(e){}
    elements.forEach(el=>{
      if(el.imageData && el.id){
        try { uploadedImages[el.id] = {name: el.imageName||'image.png', dataUrl: el.imageData}; } catch(e){}
      }
    });
    if(typeof data.nextId === 'number' && data.nextId > nextId) nextId = data.nextId;
    else {
      // ensure nextId higher than any el id number
      let max=nextId;
      elements.forEach(el=>{
        const m = String(el.id||'').match(/(\d+)/);
        if(m) max = Math.max(max, parseInt(m[1],10)+1);
      });
      nextId = max;
    }
    selected = null;
    selectedIds = [];
    // clear old DOM els so they rebuild
    const root = document.getElementById('els');
    if(root) root.innerHTML = '';
    render();
    alert(lang==='fa' ? ('پروژه بارگذاری شد — '+elements.length+' لایه') : ('Project loaded — '+elements.length+' layers'));
  } catch(err){
    console.error(err);
    alert('Load failed: '+(err.message||err));
  }
}

document.getElementById('saveNyxBtn')?.addEventListener('click', saveNyxFile);
document.getElementById('openNyxBtn')?.addEventListener('click', ()=>{
  document.getElementById('nyxFileInput')?.click();
});
document.getElementById('nyxFileInput')?.addEventListener('change', function(){
  const file = this.files && this.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    loadNyxProject(ev.target.result);
  };
  reader.readAsText(file);
  this.value = '';
});



/* ===== Export Lua + per-layer PNG images (ZIP) ===== */

/* ===== High-quality canvas capture (3x PNG) ===== */
const EXPORT_SCALE = 2; // 2x = sharp UI, smaller files than 3x

async function captureCanvasHQ(canvasEl, opts){
  opts = opts || {};
  const scale = opts.scale != null ? opts.scale : EXPORT_SCALE;
  const prevTransform = canvasEl.style.transform;
  try { canvasEl.style.transform = 'none'; } catch(e){}
  await new Promise(r=>requestAnimationFrame(r));
  const shot = await html2canvas(canvasEl, {
    backgroundColor: opts.backgroundColor === undefined ? null : opts.backgroundColor,
    scale: scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 8000,
    removeContainer: true
  });
  try { canvasEl.style.transform = prevTransform || ''; } catch(e){}
  return { shot, scale };
}

/** Canvas-rasterize text with real gradient + glow (html2canvas breaks background-clip:text) */
function rasterizeTextLayer(el){
  const s = EXPORT_SCALE;
  const W = Math.max(1, Math.ceil(el.w * s));
  const H = Math.max(1, Math.ceil(el.h * s));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.scale(s, s);
  const w = el.w, h = el.h;
  // button background
  if(el.type === 'button'){
    ctx.save();
    const r = el.radius||0;
    ctx.beginPath();
    if(r>0 && ctx.roundRect) ctx.roundRect(0,0,w,h,r);
    else ctx.rect(0,0,w,h);
    ctx.clip();
    if(el.gradient || el.gradFade){
      const ang = ((el.angle||180) * Math.PI) / 180;
      const cx=w/2, cy=h/2, len=Math.max(w,h);
      const g = ctx.createLinearGradient(cx - Math.sin(ang)*len, cy + Math.cos(ang)*len, cx + Math.sin(ang)*len, cy - Math.cos(ang)*len);
      const [r1,g1,b1]=hexRgb(el.color==='transparent'?'#3b82f6':el.color);
      const intens = Math.max(0,Math.min(100,el.gradIntensity??100))/100;
      if(el.gradFade){
        g.addColorStop(0, `rgba(${r1},${g1},${b1},${intens})`);
        g.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
      } else {
        const [r2,g2,b2]=hexRgb(el.hoverColor||'#000');
        g.addColorStop(0, `rgba(${r1},${g1},${b1},${intens})`);
        g.addColorStop(1, `rgba(${r2},${g2},${b2},${intens})`);
      }
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = el.color==='transparent' ? 'transparent' : (el.color||'#3b82f6');
    }
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }
  // text
  const text = el.text || '';
  const weight = el.weight==='Bold' ? '700' : el.weight==='Medium' ? '500' : '400';
  const size = el.size || 14;
  ctx.font = weight+' '+size+'px '+(el.font||'Inter')+', Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tx = w/2, ty = h/2;
  // glow
  if(el.glow && (el.glowSize||0)>0){
    const gi = Math.max(0, Math.min(100, el.glowIntensity??60))/100;
    const gc = el.glowColor || el.textColor || '#3b82f6';
    ctx.save();
    ctx.shadowColor = gc;
    ctx.shadowBlur = (el.glowSize||16) * gi * 1.2;
    ctx.fillStyle = gc;
    ctx.globalAlpha = 0.85 * gi;
    ctx.fillText(text, tx, ty);
    ctx.restore();
  }
  // fill text (gradient or solid)
  const useGrad = !!(el.textGradient || (el.type==='label' && el.gradient));
  if(useGrad){
    const ang = ((el.angle||180) * Math.PI) / 180;
    const cx=w/2, cy=h/2, len=Math.max(w,h)*0.6;
    const g = ctx.createLinearGradient(cx - Math.sin(ang)*len, cy + Math.cos(ang)*len, cx + Math.sin(ang)*len, cy - Math.cos(ang)*len);
    g.addColorStop(0, el.textColor||'#fff');
    g.addColorStop(1, el.textColor2||el.hoverColor||'#3b82f6');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = el.textColor || '#FFFFFF';
  }
  ctx.globalAlpha = el.alpha!=null ? el.alpha : 1;
  if(el.strike || el.underline){
    // draw text then decoration
    ctx.fillText(text, tx, ty);
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(1, size/12);
    if(el.strike){ ctx.beginPath(); ctx.moveTo(tx-tw/2, ty); ctx.lineTo(tx+tw/2, ty); ctx.stroke(); }
    if(el.underline){ ctx.beginPath(); ctx.moveTo(tx-tw/2, ty+size*0.4); ctx.lineTo(tx+tw/2, ty+size*0.4); ctx.stroke(); }
  } else {
    ctx.fillText(text, tx, ty);
  }
  return c;
}

/** Capture only one layer — text uses canvas (gradient/glow), others html2canvas */
async function captureLayerHQ(el){
  // accurate text gradient + glow path
  if((el.type==='label' || el.type==='button') && (el.textGradient || el.glow || el.gradient || el.text)){
    // always canvas-rasterize labels/buttons so gradient/glow survive export
    try { return rasterizeTextLayer(el); } catch(e){ console.warn('rasterizeTextLayer', e); }
  }
  const node = document.getElementById(el.id);
  if(!node) return null;
  const handles = [...node.querySelectorAll('.handle')];
  handles.forEach(h=>h.style.display='none');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-100000px;top:0;width:'+Math.max(1,el.w)+'px;height:'+Math.max(1,el.h)+'px;overflow:hidden;pointer-events:none;z-index:-1;';
  const clone = node.cloneNode(true);
  clone.classList.remove('sel','sel-multi');
  clone.querySelectorAll('.handle').forEach(h=>h.remove());
  // rotation applied later in Lua dxDrawImage — capture axis-aligned
  clone.style.cssText = 'position:absolute;left:0;top:0;width:'+el.w+'px;height:'+el.h+'px;transform:none;margin:0;outline:none;box-shadow:none;';
  wrap.appendChild(clone);
  document.body.appendChild(wrap);
  let shot;
  try {
    shot = await html2canvas(wrap, {
      backgroundColor: null,
      scale: EXPORT_SCALE,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: Math.max(1, Math.ceil(el.w)),
      height: Math.max(1, Math.ceil(el.h)),
      imageTimeout: 8000,
      removeContainer: true
    });
  } finally {
    wrap.remove();
    handles.forEach(h=>h.style.display='');
  }
  return shot;
}

function cropShot(shot, scale, x, y, w, h){
  const sx = Math.max(0, Math.floor(x * scale));
  const sy = Math.max(0, Math.floor(y * scale));
  const sw = Math.max(1, Math.ceil(w * scale));
  const sh = Math.max(1, Math.ceil(h * scale));
  const out = document.createElement('canvas');
  out.width = sw; out.height = sh;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0,0,sw,sh);
  ctx.drawImage(shot, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

function canvasToPNGBlob(canvasOut){
  return new Promise((resolve)=> canvasOut.toBlob(b=>resolve(b), 'image/png'));
}

function downloadCanvasPNG(canvasOut, filename){
  return canvasToPNGBlob(canvasOut).then(blob=>{
    if(!blob) return null;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename.endsWith('.png')?filename:(filename+'.png');
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
    return blob;
  });
}

async function mapPool(items, limit, fn){
  const ret = new Array(items.length);
  let i = 0;
  async function worker(){
    while(i < items.length){
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({length:n}, ()=>worker()));
  return ret;
}


async function exportLuaWithImages(){
  if(typeof JSZip === 'undefined'){
    alert('JSZip not loaded - check internet');
    return;
  }
  if(!elements.length){
    alert(lang==='fa'?'چیزی برای خروجی نیست':'Nothing to export');
    return;
  }
  const zip = new JSZip();
  const imgFolder = zip.folder('images');
  const fontsFolder = zip.folder('fonts');
  const usedFonts = new Set();
  const imageMap = []; // {el, fileName}

  const canvas = document.getElementById('canvas');
  const measure = document.getElementById('measureLayer');
  const guides = document.getElementById('guides');
  const prevSel = selected, prevIds = [...selectedIds];
  selected = null; selectedIds = [];
  document.querySelectorAll('.el').forEach(d=>{ d.classList.remove('sel','sel-multi'); });
  if(measure) measure.style.display='none';
  if(guides) guides.style.display='none';
  canvas?.classList.add('export-mode');

  const progress = document.createElement('div');
  progress.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a22;border:1px solid #333;padding:12px 18px;border-radius:10px;z-index:99999;color:#fff;font-size:13px';
  progress.textContent = 'Export PNG 3x... 0/'+elements.length;
  document.body.appendChild(progress);

  try {
    if(typeof html2canvas === 'undefined'){
      alert('html2canvas not loaded');
      return;
    }
    // parallel capture (3 at a time) — each layer alone, 3x PNG
    let done = 0;
    const results = await mapPool(elements, 3, async (el, i)=>{
      const safeName = String(el.varName||el.type||('layer_'+i)).replace(/[^a-zA-Z0-9_\-]/g,'_');
      const fileName = String(i+1).padStart(2,'0')+'_'+safeName+'.png';
      try {
        const shot = await captureLayerHQ(el);
        if(shot){
          // shot is already the layer at EXPORT_SCALE
          const blob = await canvasToPNGBlob(shot);
          if(blob) imgFolder.file(fileName, blob);
        }
      } catch(err){ console.warn('layer export', el.id, err); }
      done++;
      progress.textContent = 'Export PNG 3x... '+done+'/'+elements.length;
      if(el.font) usedFonts.add(el.font);
      return {el, fileName, w:Math.round(el.w), h:Math.round(el.h), x:el.x, y:el.y};
    });
    results.forEach(r=>{ if(r) imageMap.push(r); });
  } finally {
    progress.remove();
    canvas?.classList.remove('export-mode');
    if(measure) measure.style.display='';
    if(guides) guides.style.display='';
    selected = prevSel; selectedIds = prevIds;
    render();
  }

  // README for fonts (cannot embed licensed webfonts as binary easily)
  const fontList = [...usedFonts];
  fontsFolder.file('README.txt',
`NyX UI Editor — Fonts
======================
Fonts used in this UI:
${fontList.map(f=>'- '+f).join('\\n') || '- default'}

Place matching .ttf / .otf files in this fonts/ folder if you use dxCreateFont in MTA.
Common free fonts: Inter, Roboto, Montserrat, Vazirmatn (Persian).
`);

  // Responsive Lua (classic scaleValue)
  let lua = luaResponsiveHeader();
  lua += '-- Preload images (argb = sharp UI)\nlocal imgs = {}\nlocal function loadImgs()\n';
  imageMap.forEach(({fileName})=>{
    const key = fileName.replace(/\.png$/,'');
    lua += '    imgs["' + key + '"] = dxCreateTexture("images/' + fileName + '", "argb", false, "clamp")\n';
  });
  lua += 'end\naddEventHandler("onClientResourceStart", resourceRoot, loadImgs)\n\naddEventHandler("onClientRender", root, function()\n';
  imageMap.forEach(({el, fileName})=>{
    const key = fileName.replace(/\.png$/,'');
    const rot = Number(el.rotation)||0;
    const a = Math.floor((el.alpha!=null?el.alpha:1)*255);
    const {ws, hs} = luaBoxSize(el);
    lua += '    -- ' + (el.varName||el.type) + '\n';
    lua += '    if imgs["' + key + '"] then\n';
    lua += luaStartPos(el, '        ');
    lua += '            dxDrawImage(startX, startY, ' + ws + ', ' + hs + ', imgs["' + key + '"], ' + rot + ', 0, 0, tocolor(255,255,255,' + a + '), false)\n';
    lua += '    end\n';
  });
  lua += 'end)\n';

  zip.file('client.lua', lua);
  zip.file('meta.xml', ` <meta>
    <info author="NyX UI Editor" type="script" name="${(currentProjectName||'nyx_ui').replace(/"/g,'')}" />
    <script src="client.lua" type="client" cache="false" />
${imageMap.map(({fileName})=>`    <file src="images/${fileName}" />`).join('\n')}
</meta>
`);

  const content = await zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:1}});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = (currentProjectName || 'nyx_ui').replace(/[^\w\-]+/g,'_') + '_lua_images.zip';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
}

document.getElementById('exportLuaImgBtn')?.addEventListener('click', ()=>{
  exportLuaWithImages().catch(err=>{
    console.error(err);
    alert('Export failed: '+(err.message||err));
  });
});


document.getElementById('exportImgBtn')?.addEventListener('click', async function(){
  const canvas = document.getElementById('canvas');
  if(!canvas) return;
  if(typeof html2canvas === 'undefined'){
    alert('html2canvas not loaded - check internet');
    return;
  }
  if(elements.length===0){
    alert(lang==='fa'?'چیزی برای خروجی نیست':'Nothing to export');
    return;
  }
  let minX=CW, minY=CH, maxX=0, maxY=0;
  elements.forEach(el=>{
    minX=Math.min(minX, el.x);
    minY=Math.min(minY, el.y);
    maxX=Math.max(maxX, el.x+el.w);
    maxY=Math.max(maxY, el.y+el.h);
  });
  const pad = 0;
  minX = Math.max(0, Math.floor(minX)-pad);
  minY = Math.max(0, Math.floor(minY)-pad);
  maxX = Math.min(CW, Math.ceil(maxX)+pad);
  maxY = Math.min(CH, Math.ceil(maxY)+pad);
  const cropW = Math.max(1, maxX - minX);
  const cropH = Math.max(1, maxY - minY);

  canvas.classList.add('export-mode');
  document.querySelectorAll('.el').forEach(el => el.classList.remove('sel'));
  document.querySelectorAll('.handle,.guides,.measure-layer').forEach(el => { el.style.display='none'; });

  try {
    const {shot, scale} = await captureCanvasHQ(canvas, {backgroundColor:null, scale:EXPORT_SCALE});
    // crop at high-res (scale accounts for 2x capture)
    const out = cropShot(shot, scale, minX, minY, cropW, cropH);
    // always lossless PNG for max quality
    await downloadCanvasPNG(out, 'nyx_ui_design.png');
  } catch(err){
    console.error(err);
    alert('Export image failed: '+err.message);
  }
  canvas.classList.remove('export-mode');
  document.querySelectorAll('.handle,.guides,.measure-layer').forEach(el => { el.style.display=''; });
  render();
});


/* ===== Export single layer as PNG ===== */
async function exportSingleLayer(id){
  const el = elements.find(e=>e.id===id);
  if(!el) return;
  if(typeof html2canvas === 'undefined'){
    alert('html2canvas not loaded');
    return;
  }
  const canvas = document.getElementById('canvas');
  const prevVis = {};
  elements.forEach(o=>{
    const d = document.getElementById(o.id);
    if(d){ prevVis[o.id]=d.style.visibility; d.style.visibility = (o.id===id)?'visible':'hidden'; }
  });
  document.querySelectorAll('.handle,.guides,.measure-layer').forEach(n=>{ n.style.display='none'; });
  canvas?.classList.add('export-mode');
  document.querySelectorAll('.el').forEach(d=>d.classList.remove('sel','sel-multi'));
  try {
        const shot = await captureLayerHQ(el);
    if(!shot) throw new Error('capture failed');
    const name = String(el.varName||el.type||'layer').replace(/[^a-zA-Z0-9_\-]/g,'_') + '.png';
    await downloadCanvasPNG(shot, name);
  } catch(err){
    alert('Export layer failed: '+(err.message||err));
  }
  elements.forEach(o=>{
    const d=document.getElementById(o.id);
    if(d) d.style.visibility = prevVis[o.id]||'';
  });
  document.querySelectorAll('.handle,.guides,.measure-layer').forEach(n=>{ n.style.display=''; });
  canvas?.classList.remove('export-mode');
  render();
}

function importIconFiles(fileList){
  const files = [...(fileList||[])].filter(f => (f.type && f.type.startsWith('image/')) || /\.svg$/i.test(f.name||''));
  if(!files.length){ alert(lang==='fa'?'فایل تصویری پیدا نشد':'No image files found'); return; }
  const total = files.length;
  let loaded = 0, failed = 0;
  const batch = [];
  const progress = document.createElement('div');
  progress.id = 'iconImportProgress';
  progress.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a22;border:1px solid #333;padding:12px 20px;border-radius:10px;z-index:99999;font-size:13px;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.5)';
  progress.textContent = (lang==='fa'?'در حال وارد کردن... ':'Importing... ') + '0/'+total;
  document.body.appendChild(progress);

  function finish(){
    progress.remove();
    addCustomIconsBatch(batch).then(()=>{
      buildIconGrid();
      try {
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelector('.tab[data-tab="icons"]')?.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(p=>p.classList.add('hidden'));
        document.getElementById('pane-icons')?.classList.remove('hidden');
      } catch(e){}
      const ok = batch.length;
      const msg = lang==='fa'
        ? ('وارد شد: '+ok+' از '+total+(failed?(' | ناموفق: '+failed):'')+'\nظرفیت کتابخانه: '+customIcons.length+'/'+CUSTOM_ICON_LIMIT)
        : ('Imported: '+ok+' of '+total+(failed?(' | failed: '+failed):'')+'\nLibrary: '+customIcons.length+'/'+CUSTOM_ICON_LIMIT);
      alert(msg);
    }).catch(err=>{
      alert('Save failed: '+(err.message||err));
    });
  }

  if(!total){ progress.remove(); return; }

  files.forEach((file)=>{
    const reader = new FileReader();
    reader.onload = function(ev){
      try {
        const dataUrl = ev.target.result;
        // skip empty/corrupt
        if(dataUrl && dataUrl.length > 32){
          batch.push({
            id: 'cicon_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'_'+loaded,
            name: file.name,
            dataUrl,
            ts: Date.now()
          });
        } else failed++;
      } catch(e){ failed++; }
      loaded++;
      progress.textContent = (lang==='fa'?'در حال وارد کردن... ':'Importing... ')+loaded+'/'+total+' ('+batch.length+' ok)';
      if(loaded === total) finish();
    };
    reader.onerror = function(){
      failed++; loaded++;
      if(loaded === total) finish();
    };
    try { reader.readAsDataURL(file); }
    catch(e){ failed++; loaded++; if(loaded===total) finish(); }
  });
}


/* ===== Upload custom icons (from Flaticon etc) ===== */
document.getElementById('btnUploadIcon')?.addEventListener('click', ()=>{
  document.getElementById('fileIconInput')?.click();
});
document.getElementById('btnUploadIconFolder')?.addEventListener('click', ()=>{
  document.getElementById('fileIconFolder')?.click();
});
document.getElementById('fileIconInput')?.addEventListener('change', function(){
  importIconFiles(this.files);
  this.value='';
});
document.getElementById('fileIconFolder')?.addEventListener('change', function(){
  importIconFiles(this.files);
  this.value='';
});




/* ===== Align / Distribute (Photoshop-like) ===== */
function alignDo(mode){
  const els = getSelectedEls();
  if(els.length < 2){
    // if only one selected, align to canvas
    if(els.length===1){
      saveHistory();
      const el=els[0];
      if(mode==='left') el.x=0;
      if(mode==='right') el.x=CW-el.w;
      if(mode==='hcenter') el.x=(CW-el.w)/2;
      if(mode==='top') el.y=0;
      if(mode==='bottom') el.y=CH-el.h;
      if(mode==='vcenter') el.y=(CH-el.h)/2;
      render();
    } else {
      alert(lang==='fa'?'حداقل ۲ المان انتخاب کن (Shift+کلیک)':'Select 2+ elements (Shift+Click)');
    }
    return;
  }
  saveHistory();
  const minX=Math.min(...els.map(e=>e.x));
  const maxX=Math.max(...els.map(e=>e.x+e.w));
  const minY=Math.min(...els.map(e=>e.y));
  const maxY=Math.max(...els.map(e=>e.y+e.h));
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2;
  els.forEach(el=>{
    if(mode==='left') el.x=minX;
    if(mode==='right') el.x=maxX-el.w;
    if(mode==='hcenter') el.x=cx-el.w/2;
    if(mode==='top') el.y=minY;
    if(mode==='bottom') el.y=maxY-el.h;
    if(mode==='vcenter') el.y=cy-el.h/2;
  });
  render();
}
function distributeH(){
  const els = getSelectedEls().slice().sort((a,b)=>a.x-b.x);
  if(els.length<3){ alert(lang==='fa'?'حداقل ۳ المان':'Need 3+ elements'); return; }
  saveHistory();
  const first=els[0], last=els[els.length-1];
  const totalW = els.reduce((s,e)=>s+e.w,0);
  const span = (last.x+last.w) - first.x;
  const gap = (span - totalW) / (els.length-1);
  let x = first.x;
  els.forEach((el,i)=>{
    if(i===0){ x = el.x + el.w; return; }
    if(i===els.length-1) return;
    el.x = x + gap;
    x = el.x + el.w;
  });
  render();
}
function distributeV(){
  const els = getSelectedEls().slice().sort((a,b)=>a.y-b.y);
  if(els.length<3){ alert(lang==='fa'?'حداقل ۳ المان':'Need 3+ elements'); return; }
  saveHistory();
  const first=els[0], last=els[els.length-1];
  const totalH = els.reduce((s,e)=>s+e.h,0);
  const span = (last.y+last.h) - first.y;
  const gap = (span - totalH) / (els.length-1);
  let y = first.y;
  els.forEach((el,i)=>{
    if(i===0){ y = el.y + el.h; return; }
    if(i===els.length-1) return;
    el.y = y + gap;
    y = el.y + el.h;
  });
  render();
}
function equalGapH(){
  const els = getSelectedEls().slice().sort((a,b)=>a.x-b.x);
  if(els.length<2){ alert(lang==='fa'?'حداقل ۲ المان (Shift+کلیک)':'Select 2+ elements'); return; }
  const gap = parseFloat(document.getElementById('gapInput')?.value)||16;
  saveHistory();
  let x = els[0].x;
  els.forEach((el,i)=>{
    el.x = x;
    // also align vertically to first (same line)
    el.y = els[0].y;
    x = el.x + el.w + gap;
  });
  render();
}
function equalGapV(){
  const els = getSelectedEls().slice().sort((a,b)=>a.y-b.y);
  if(els.length<2){ alert(lang==='fa'?'حداقل ۲ المان (Shift+کلیک)':'Select 2+ elements'); return; }
  const gap = parseFloat(document.getElementById('gapInput')?.value)||16;
  saveHistory();
  let y = els[0].y;
  els.forEach((el,i)=>{
    el.y = y;
    el.x = els[0].x;
    y = el.y + el.h + gap;
  });
  render();
}
function sameLineH(){
  const els = getSelectedEls();
  if(els.length<2){ alert(lang==='fa'?'حداقل ۲ المان (Shift+کلیک)':'Select 2+ elements'); return; }
  saveHistory();
  const y = els[0].y;
  els.forEach(el=>{ el.y = y; });
  render();
}

document.getElementById('alignLeft')?.addEventListener('click',()=>alignDo('left'));
document.getElementById('alignHCenter')?.addEventListener('click',()=>alignDo('hcenter'));
document.getElementById('alignRight')?.addEventListener('click',()=>alignDo('right'));
document.getElementById('alignTop')?.addEventListener('click',()=>alignDo('top'));
document.getElementById('alignVCenter')?.addEventListener('click',()=>alignDo('vcenter'));
document.getElementById('alignBottom')?.addEventListener('click',()=>alignDo('bottom'));
document.getElementById('distH')?.addEventListener('click', distributeH);
document.getElementById('distV')?.addEventListener('click', distributeV);
document.getElementById('gapH')?.addEventListener('click', equalGapH);
document.getElementById('gapV')?.addEventListener('click', equalGapV);
document.getElementById('sameLineH')?.addEventListener('click', sameLineH);


/* ===== Canvas resolution ===== */
function scaleElementsToResolution(oldW, oldH, newW, newH){
  if(!oldW || !oldH || oldW===newW && oldH===newH) return;
  const sx = newW / oldW;
  const sy = newH / oldH;
  // uniform scale keeps aspect of UI elements consistent
  const s = Math.min(sx, sy); // or use sx/sy separately for position
  elements.forEach(el=>{
    el.x = Math.round(el.x * sx);
    el.y = Math.round(el.y * sy);
    el.w = Math.max(1, Math.round(el.w * sx));
    el.h = Math.max(1, Math.round(el.h * sy));
    if(el.size) el.size = Math.max(8, Math.round(el.size * Math.min(sx, sy)));
    if(el.radius) el.radius = Math.round(el.radius * Math.min(sx, sy));
    if(el.strokeWidth) el.strokeWidth = Math.max(0, Math.round((el.strokeWidth||0) * Math.min(sx, sy)));
    if(el.glowSize) el.glowSize = Math.round((el.glowSize||0) * Math.min(sx, sy));
    if(el.blur) el.blur = Math.round((el.blur||0) * Math.min(sx, sy));
    // clamp inside canvas
    el.x = Math.max(0, Math.min(newW - el.w, el.x));
    el.y = Math.max(0, Math.min(newH - el.h, el.y));
  });
}
function applyResolution(w, h, doScale){
  w = Math.max(320, Math.min(7680, parseInt(w)||1920));
  h = Math.max(240, Math.min(4320, parseInt(h)||1080));
  const oldW = CW, oldH = CH;
  if(doScale === undefined){
    const cb = document.getElementById('resScale');
    doScale = cb ? cb.checked : true;
  }
  if(doScale && elements.length && (oldW!==w || oldH!==h)){
    saveHistory();
    scaleElementsToResolution(oldW, oldH, w, h);
  }
  CW = w; CH = h;
  const c = document.getElementById('canvas');
  if(c){ c.style.width = w+'px'; c.style.height = h+'px'; }
  const rw = document.getElementById('resW');
  const rh = document.getElementById('resH');
  if(rw) rw.value = w;
  if(rh) rh.value = h;
  render();
}
function applyResFromUI(w, h){
  applyResolution(w, h, document.getElementById('resScale')?.checked !== false);
}
document.getElementById('resApply')?.addEventListener('click', ()=>{
  applyResFromUI(document.getElementById('resW').value, document.getElementById('resH').value);
});
document.querySelectorAll('.res-preset').forEach(btn=>{
  btn.addEventListener('click', function(){
    applyResFromUI(this.dataset.w, this.dataset.h);
  });
});
// init canvas size (no scale on first load)
try { applyResolution(1920, 1080, false); } catch(e){}

/* Init - always show language picker first */
try { /* do not auto-load language - user must choose */ } catch(e) {}
// clear previous auto-lang so it does not jump
// localStorage intentionally NOT auto-applied
saveHistory();
render();
try { buildIconGrid(); } catch(e) {}
console.log('NyX UI Editor ready');
