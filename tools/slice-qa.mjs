import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning'&&warnings.length<12)warnings.push(m.text());});
await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForTimeout(1500);
await mkdir('previews',{recursive:true});await page.screenshot({path:'previews/vertical-slice.png'});
console.log({errors,warnings,failure:await page.locator('#failureText').textContent(),ready:await page.evaluate(()=>Boolean(window.__V32?.renderer.paletteReady))});
if(!errors.length){console.log(await page.evaluate(()=>window.__V32.metrics()));await page.waitForTimeout(1200);await page.screenshot({path:'previews/vertical-slice-later.png'});}
await writeFile('previews/slice-errors.json',JSON.stringify(errors));await browser.close();server.close();if(errors.length)process.exitCode=1;
