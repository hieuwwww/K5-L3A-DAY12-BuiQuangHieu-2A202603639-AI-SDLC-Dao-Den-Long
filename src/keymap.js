export const DEFAULT_KEYMAP=Object.freeze({forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyF',pause:'Escape'});

export function validateKeymap(map){
 if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).length!==Object.keys(DEFAULT_KEYMAP).length||Object.keys(map).some(key=>!(key in DEFAULT_KEYMAP)))throw Error('Hành động không hợp lệ / invalid action');
 for(const code of Object.values(map))if(typeof code!=='string'||!(/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Escape|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Enter)$/.test(code)))throw Error('Phím không hợp lệ / invalid key');
 if(new Set(Object.values(map)).size!==Object.keys(DEFAULT_KEYMAP).length)throw Error('Phím trùng / duplicate binding');
 return {...map};
}

export function inputFromKeys(keys,keymap,previous){
 const active=key=>keys.has(keymap[key]),result={move:[Number(active('right'))-Number(active('left')),Number(active('back'))-Number(active('forward'))],cam_yaw_deg:0};
 for(const action of ['jump','dash','interact','pulse','pause']){const held=active(action);result[action]=held&&!previous[action];previous[action]=held;}
 return result;
}
