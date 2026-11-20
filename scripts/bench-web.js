#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {platform,release} from 'node:os';
import {chromium} from 'playwright';
import {createServer} from './serve.js';

const processStart=Date.now();
function parse(argv){
 const options={};for(let i=0;i<argv.length;i+=2){const key=argv[i],value=argv[i+1];if(!['--seed','--duration','--out'].includes(key)||value===undefined||options[key]!==undefined)throw Error(`invalid benchmark argument: ${key}`);options[key]=value;}
 const seed=Number(options['--seed']),duration=Number(options['--duration']),out=options['--out'];
 if(!Number.isInteger(seed)||!Number.isFinite(duration)||duration<=0||!out)throw Error('usage: --seed INTEGER --duration POSITIVE_SECONDS --out PATH');
 return {seed,duration,out};
}

export async function runBenchmark(argv){
 const {seed,duration,out}=parse(argv);
 const headless=process.env.BENCH_HEADLESS==='1';
 if(!headless&&!process.env.DISPLAY&&!process.env.WAYLAND_DISPLAY)throw Error('windowed Chromium benchmark requires a display (e.g. xvfb-run); BENCH_HEADLESS=1 is diagnostic only');
 let server,browser;
 try{
  server=createServer({root:process.cwd()});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  browser=await chromium.launch({headless,executablePath:process.env.BENCH_CHROMIUM_PATH||undefined,args:['--window-size=1296,807']});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:${port}/?bench=1&seed=${seed}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__bench?.ready(),{timeout:10000});
  const first=await page.evaluate(()=>window.__bench.firstFrameEpochMs());
  await page.waitForFunction(duration=>performance.now()>=window.__bench.startedAt()+3000+duration*1000,duration,{timeout:(duration+20)*1000});
  const report=await page.evaluate(duration=>window.__bench.report(duration),duration);
  const result={contract_version:'1.3',...report.metrics,load_ms:first-processStart,peak_mem_mb:null,vsync_off:false,renderer:report.renderer,os:`${platform()} ${release()}`,scene:report.scene,viewport:report.viewport};
  if(!Number.isFinite(result.avg_fps)||result.frames<1||result.load_ms<0||report.viewport[0]!==1280||report.viewport[1]!==720)throw Error('invalid browser benchmark measurements');
  await writeFile(out,JSON.stringify(result,null,2)+'\n');return result;
 }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
}

if(import.meta.url===`file://${process.argv[1]}`)runBenchmark(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
