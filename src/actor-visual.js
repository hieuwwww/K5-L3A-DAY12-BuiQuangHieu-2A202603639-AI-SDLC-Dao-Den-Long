// Geometry is authored facing +Z. Keep the last non-zero simulation facing while idle.
export function facingYaw(facing){
 const x=facing?.[0]??0,z=facing?.[2]??0;
 return Math.hypot(x,z)>1e-6?Math.atan2(x,z):0;
}
