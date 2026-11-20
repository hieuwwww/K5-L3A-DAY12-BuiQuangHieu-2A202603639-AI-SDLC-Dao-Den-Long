import {DEFAULT_CONFIG} from './config.js';

export function getNearbyLantern(s,radius=DEFAULT_CONFIG.interact_radius,exactLanterns){
 const distance=l=>Math.hypot(l.pos[0]-s.player.pos[0],l.pos[2]-s.player.pos[2]);
 return s.lanterns.filter(l=>{const exact=exactLanterns?.find(item=>item.id===l.id);return (!l.lit||(exact?exact.fuel_ticks<DEFAULT_CONFIG.fuel_max*60:l.fuel<DEFAULT_CONFIG.fuel_max))&&distance(l)<=radius;}).sort((a,b)=>distance(a)-distance(b)||a.id.localeCompare(b.id))[0]??null;
}

export function formatLanternHint(s,radius=DEFAULT_CONFIG.interact_radius,exactLanterns){
  const lantern=getNearbyLantern(s,radius,exactLanterns);
  if(!lantern)return '';
  const exact=exactLanterns?.find(item=>item.id===lantern.id);
  const displayFuel=lantern.fuel===100&&exact?.fuel_ticks<DEFAULT_CONFIG.fuel_max*60?'~100':lantern.fuel;
  const action=lantern.lit?`Châm dầu đèn ${displayFuel}/100`:`Đèn ${lantern.deposited}/${lantern.ever_lit?DEFAULT_CONFIG.relight_cost:DEFAULT_CONFIG.lantern_cost}`;
  return `E — ${action} · Đang mang ${s.player.carried}/${s.player.capacity??DEFAULT_CONFIG.carry_capacity}`;
}

export function createUI({onStart,onReplay,onContinue,onSettings,onMenu,onNext}){
 const el=document.querySelector('#overlay'),stats=document.querySelector('#stats'),hint=document.querySelector('#hint'),fps=document.querySelector('#fps');let timeBlink=0;
 const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=action;return b;};
 function panel(title,body){el.replaceChildren();const card=document.createElement('section');card.className='panel';const h=document.createElement('h1');h.textContent=title;card.append(h);if(body)card.append(body);el.append(card);return card;}
 function showMenu(){const c=panel('ĐẢO ĐÈN LỒNG');c.append(Object.assign(document.createElement('p'),{textContent:'Thắp sáng ba hòn đảo, né Bóng Mực và giữ ánh sáng cho đến bình minh.'}),button('Bắt đầu Đêm 1',onStart));}
 function showIntro(n,go){const names=['','Đảo Bến','Đảo Cau','Đảo Chuông'],quotes=['','Ông Đăng: Hãy gom ánh sáng, rồi thắp từng chiếc đèn.','Ông Đăng: Qua cầu tre, nghe gió trước khi thấy nó.','Ông Đăng: Trên đảo chuông, mỗi tầng giữ một bí mật.'];const c=panel(`Đêm ${n} — ${names[n]}`);c.append(Object.assign(document.createElement('p'),{textContent:quotes[n]}),button('Vào đêm',go));}
 function showGame(){el.replaceChildren();}
 function showPause(){const c=panel('Tạm dừng');c.append(button('Tiếp tục',onContinue),button('Chơi lại đêm',onReplay),button('Cài đặt',()=>onSettings()),button('Về menu',onMenu));}
  function showSettings(settings,apply){const c=panel('Cài đặt');const vol=document.createElement('label');vol.textContent='Âm lượng ';const vi=document.createElement('input');vi.type='range';vi.min='0';vi.max='1';vi.step='.01';vi.value=settings.volume;vol.append(vi);const sens=document.createElement('label');sens.textContent='Độ nhạy chuột ';const si=document.createElement('input');si.type='range';si.min='.2';si.max='3';si.step='.1';si.value=settings.sensitivity;sens.append(si);const palette=document.createElement('label');palette.textContent='Bảng màu dễ phân biệt ';const pi=document.createElement('input');pi.type='checkbox';pi.checked=settings.distinguishablePalette;palette.append(pi);c.append(vol,sens,palette,button('Lưu',()=>apply({volume:Number(vi.value),sensitivity:Number(si.value),distinguishablePalette:pi.checked})),button('Quay lại',showPause));}
 function showResult(game,night){const won=game.state==='won';const c=panel(won?'Đêm hoàn thành!':'Đêm khép lại');c.append(Object.assign(document.createElement('p'),{textContent:`Điểm đêm: ${game.score} · Tổng điểm: ${game.totalScore}`}));if(won&&night<3)c.append(button('Đêm kế tiếp',onNext));if(won&&night===3)c.append(Object.assign(document.createElement('p'),{textContent:'Bình Minh — ánh sáng đã trở lại.'}));c.append(button('Chơi lại đêm',onReplay),button('Về menu',onMenu));}
   function update(s,g,settings={}){if(!g)return;const left=Math.ceil(s.time_left_s),flames='🔥 '.repeat(g.player.flames),lit=s.lanterns.filter(l=>l.lit).length,target=Math.ceil(DEFAULT_CONFIG.win_ratio*s.lanterns.length);stats.classList.toggle('distinguishable',settings.distinguishablePalette===true);stats.innerHTML=`<div class="top"><span>${flames||'—'}</span><strong class="clock ${left<=30?'danger':''}">${left<=30&&settings.distinguishablePalette?'⚠ ':''}${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}</strong><span>Đèn ${lit}/${s.lanterns.length} · Bình minh ≥${target} · ${g.score}</span></div><div class="bottom"><span>Đang mang ${s.player.carried}/${s.player.capacity}</span><span>Lướt ${s.player.dash_cd_s.toFixed(1)}s · Tỏa sáng ${s.player.pulse_cd_s.toFixed(1)}s</span></div>`;hint.textContent=formatLanternHint(s,DEFAULT_CONFIG.interact_radius,g.lanterns);}
 return {showMenu,showIntro,showGame,showPause,showSettings,showResult,update,setFps:value=>{fps.textContent=`${value.toFixed(0)} FPS`;}};
}
