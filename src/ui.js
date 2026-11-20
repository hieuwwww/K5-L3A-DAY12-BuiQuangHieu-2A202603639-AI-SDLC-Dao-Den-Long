import {DEFAULT_CONFIG} from './config.js';

export function getNearbyLantern(s,radius=DEFAULT_CONFIG.interact_radius){
 const distance=l=>Math.hypot(l.pos[0]-s.player.pos[0],l.pos[2]-s.player.pos[2]);
 return s.lanterns.filter(l=>!l.lit&&distance(l)<=radius).sort((a,b)=>distance(a)-distance(b)||a.id.localeCompare(b.id))[0]??null;
}

export function formatLanternHint(s,radius=DEFAULT_CONFIG.interact_radius){
 const lantern=getNearbyLantern(s,radius);
 return lantern?`E — Đèn ${lantern.deposited}/${DEFAULT_CONFIG.lantern_cost} · Đang mang ${s.player.carried}/${DEFAULT_CONFIG.carry_capacity}`:'';
}

export function createUI({onStart,onReplay,onContinue,onSettings,onMenu,onNext}){
 const el=document.querySelector('#overlay'),stats=document.querySelector('#stats'),hint=document.querySelector('#hint'),fps=document.querySelector('#fps');let timeBlink=0;
 const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=action;return b;};
 function panel(title,body){el.replaceChildren();const card=document.createElement('section');card.className='panel';const h=document.createElement('h1');h.textContent=title;card.append(h);if(body)card.append(body);el.append(card);return card;}
 function showMenu(){const c=panel('ĐẢO ĐÈN LỒNG');c.append(Object.assign(document.createElement('p'),{textContent:'Thắp sáng ba hòn đảo, né Bóng Mực và giữ ánh sáng cho đến bình minh.'}),button('Bắt đầu Đêm 1',onStart));}
 function showIntro(n,go){const names=['','Đảo Bến','Đảo Cau','Đảo Chuông'],quotes=['','Ông Đăng: Hãy gom ánh sáng, rồi thắp từng chiếc đèn.','Ông Đăng: Qua cầu tre, nghe gió trước khi thấy nó.','Ông Đăng: Trên đảo chuông, mỗi tầng giữ một bí mật.'];const c=panel(`Đêm ${n} — ${names[n]}`);c.append(Object.assign(document.createElement('p'),{textContent:quotes[n]}),button('Vào đêm',go));}
 function showGame(){el.replaceChildren();}
 function showPause(){const c=panel('Tạm dừng');c.append(button('Tiếp tục',onContinue),button('Chơi lại đêm',onReplay),button('Cài đặt',()=>onSettings()),button('Về menu',onMenu));}
 function showSettings(settings,apply){const c=panel('Cài đặt');const vol=document.createElement('label');vol.textContent='Âm lượng ';const vi=document.createElement('input');vi.type='range';vi.min='0';vi.max='1';vi.step='.01';vi.value=settings.volume;vol.append(vi);const sens=document.createElement('label');sens.textContent='Độ nhạy chuột ';const si=document.createElement('input');si.type='range';si.min='.2';si.max='3';si.step='.1';si.value=settings.sensitivity;sens.append(si);c.append(vol,sens,button('Lưu',()=>apply({volume:Number(vi.value),sensitivity:Number(si.value)})),button('Quay lại',showPause));}
 function showResult(game,night){const won=game.state==='won';const c=panel(won?'Đêm hoàn thành!':'Đêm khép lại');c.append(Object.assign(document.createElement('p'),{textContent:`Điểm đêm: ${game.score} · Tổng điểm: ${game.totalScore}`}));if(won&&night<3)c.append(button('Đêm kế tiếp',onNext));if(won&&night===3)c.append(Object.assign(document.createElement('p'),{textContent:'Bình Minh — ánh sáng đã trở lại.'}));c.append(button('Chơi lại đêm',onReplay),button('Về menu',onMenu));}
 function update(s,g){if(!g)return;const left=Math.ceil(s.time_left_s),flames='🔥 '.repeat(g.player.flames);stats.innerHTML=`<div class="top"><span>${flames||'—'}</span><strong class="clock ${left<=30?'danger':''}">${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}</strong><span>Đèn ${g.lanterns.filter(l=>l.lit).length}/${g.lanterns.length} · ${g.score}</span></div><div class="bottom"><span>${'● '.repeat(g.player.carried)}${'○ '.repeat(Math.max(0,10-g.player.carried))}</span><span>Lướt ${s.player.dash_cd_s.toFixed(1)}s · Tỏa sáng ${s.player.pulse_cd_s.toFixed(1)}s</span></div>`;hint.textContent=formatLanternHint(s);}
 return {showMenu,showIntro,showGame,showPause,showSettings,showResult,update,setFps:value=>{fps.textContent=`${value.toFixed(0)} FPS`;}};
}
