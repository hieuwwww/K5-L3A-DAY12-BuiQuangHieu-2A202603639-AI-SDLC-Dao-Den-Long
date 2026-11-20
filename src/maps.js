const polar = (radius, degrees, y = 0, centerX = 0, centerZ = 0) => {
  const angle = degrees * Math.PI / 180;
  return [+(centerX + Math.cos(angle) * radius).toFixed(3), y, +(centerZ + Math.sin(angle) * radius).toFixed(3)];
};
const points = (radius, angles, y = 0, x = 0, z = 0) => angles.map(a => polar(radius, a, y, x, z));
const circleAngles = (start, step, count) => Array.from({length:count}, (_, i) => start + i * step);

export const MAPS = Object.freeze({
  1: Object.freeze({
    night:1, name:'Đảo Bến', islands:[{center:[0,0,0],radius:40}], bridge:null, tiers:[], ramps:[],
    lanterns:[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]].map((pos,i)=>({id:`L${i+1}`,pos})),
    mote_points:[...points(12,circleAngles(0,45,8)),...points(33,circleAngles(0,22.5,16))],
    shade_points:points(37,circleAngles(15,30,12)), pads:[], charms:[]
  }),
  2: Object.freeze({
    night:2, name:'Đảo Cau', islands:[{center:[0,0,0],radius:28},{center:[70,0,0],radius:28}],
    bridge:{x:[26,44],z:[-2,2]}, tiers:[],ramps:[],
    lanterns:[[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]].map((pos,i)=>({id:`L${i+1}`,pos})),
    mote_points:[...[[0,0,0],[70,0,0]].flatMap(([x,y,z])=>[...points(10,[0,90,180,270],y,x,z),...points(22,circleAngles(0,45,8),y,x,z)])],
    shade_points:[...[0,70].flatMap(x=>points(26,circleAngles(22.5,45,8),0,x,0))],
    pads:[{pos:[20,0,18],radius:1,destination:[70,0,0]},{pos:[50,0,-18],radius:1,destination:[0,0,0]}],charms:[{id:'C1',pos:[35,0,0]}]
  }),
  3: Object.freeze({
    night:3,name:'Đảo Chuông',islands:[{center:[0,0,0],radius:45}],bridge:null,
    tiers:[{y:3,inner:12,outer:24,half:'z>0'},{y:6,radius:8}],
    ramps:[{angle_deg:30,width:3,from_radius:30,from_y:0,to_radius:24,to_y:3},{angle_deg:150,width:3,from_radius:30,from_y:0,to_radius:24,to_y:3}],
    lanterns:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]].map((pos,i)=>({id:`L${i+1}`,pos})),
    mote_points:[...points(34,circleAngles(0,20,18)),...points(18,circleAngles(20,20,8),3),...points(5,[45,135,225,315],6)],
    shade_points:points(43,circleAngles(0,22.5,16)),pads:[{pos:[0,3,13],radius:1,destination:[0,6,0]}],
    charms:[{id:'C1',pos:[30,0,25]},{id:'C2',pos:[-30,0,25]}],tower:{center:[0,6,0],radius:2,height:8},wind:{interval_ticks:1800,duration_ticks:300,warning_ticks:120,speed:2}
  })
});

export function getNightMap(night) {
  const map = MAPS[night];
  if (!map) throw new RangeError(`night must be 1, 2 or 3; got ${night}`);
  return map;
}
