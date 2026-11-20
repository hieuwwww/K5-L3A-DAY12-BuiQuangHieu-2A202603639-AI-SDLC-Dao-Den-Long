import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from '../scripts/serve.js';

test('browser settings can rebind, reject duplicates, persist and restore at 1280×720',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button',{name:'Bắt đầu Đêm 1'}).click();
  await page.getByRole('button',{name:'Vào đêm'}).click();
  await page.waitForFunction(()=>document.querySelector('#stats')?.textContent.includes('Bình minh'));
  assert.ok(Number.parseFloat(await page.locator('.controls').evaluate(node=>getComputedStyle(node).fontSize))>=18);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Cài đặt'}).click();
  await page.locator('.panel label button').filter({hasText:'KeyF'}).click();await page.keyboard.press('Space');
  assert.match(await page.locator('[role=alert]').innerText(),/trùng|duplicate/i);
  await page.locator('.panel label button').filter({hasText:'KeyF'}).click();await page.keyboard.press('KeyJ');
  await page.getByLabel(/Chữ lớn/).check();await page.getByRole('button',{name:'Lưu'}).click();
  assert.ok(Number.parseFloat(await page.locator('.controls').evaluate(node=>getComputedStyle(node).fontSize))>=22.5);
  await page.reload();
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('dao-settings')).keymap.pulse)),'KeyJ');
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});
