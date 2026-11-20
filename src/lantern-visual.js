export function lanternVisual(lantern,simTick){
 const lit=lantern.lit,bar=lit?Math.max(0,Math.min(1,lantern.fuel/100)):0;
 return {scale:lit?1:.8,tear:!lit,blink:lit&&lantern.fuel<30&&simTick%60>=30,bar};
}

export function shadeAccent(distinguishablePalette){
 return distinguishablePalette?'#00B3FF':'#7A3CFF';
}
