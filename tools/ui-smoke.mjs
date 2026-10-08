import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {server} from './serve.mjs';
import {makeFixture} from './audio-fixture.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const browser=await chromium.launch({executablePath:process.env.V32_BROWSER||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={environment:'Headless Chromium '+await browser.version()+'; software SwiftShader',errors};
try{
 await page.goto('http://localhost:4173/visualizer.html?dev=1');await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);
 await page.locator('#controls').click();await page.locator('[data-setting="mode"]').selectOption('discovery');
 await page.locator('#palette').selectOption('blackwhite');await page.locator('#depth').selectOption('16');await page.waitForTimeout(150);await page.waitForFunction(()=>window.__V32.renderer.paletteReady);
 await page.locator('#fresh').click();const original=await page.evaluate(()=>window.__V32.getState().current);
 await page.locator('#favorite').click();await page.reload();await page.waitForFunction(()=>window.__V32?.renderer.paletteReady);
 const restored=await page.evaluate(()=>({state:window.__V32.getState(),favorites:JSON.parse(localStorage.getItem('v32-favorites')),saved:JSON.parse(localStorage.getItem('v32-saved'))}));
 assert.equal(restored.state.current.kind,'discovery');assert.equal(restored.state.settings.palette,'blackwhite');assert.equal(restored.state.settings.depth,16);assert(restored.favorites.includes(original.id));assert.equal(restored.saved[0].scene.id,original.id);report.persistedDiscoveryModeAndPalette=true;report.savedFavoriteRetained=true;
 await page.locator('#controls').click();await page.getByText('Saved scenes',{exact:true}).click();await page.locator('#saved button').first().click();assert.equal(await page.evaluate(()=>window.__V32.getState().current.id),original.id);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const data=JSON.parse(Buffer.concat(chunks));assert.equal(data.scene.id,original.id);assert.equal(data.format,'VIDEO32-SCENE');
 await page.locator('#fresh').click();await page.locator('#importFile').setInputFiles({name:'scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForFunction(id=>window.__V32.getState().current.id===id,original.id);report.exportImportRecoveredWorld=true;
 await page.locator('#importFile').setInputFiles({name:'bad-scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...data,schemaVersion:999}))});await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Unsupported'));assert.equal(await page.evaluate(()=>window.__V32.getState().current.id),original.id);report.invalidImportPreservedWorld=true;
 await page.locator('#file').setInputFiles(await makeFixture());await page.waitForTimeout(200);await page.locator('#pause').click();const before=await page.evaluate(()=>({state:window.__V32.getState(),audio:document.getElementById('audio').currentTime}));await page.waitForTimeout(650);const after=await page.evaluate(()=>({state:window.__V32.getState(),audio:document.getElementById('audio').currentTime}));assert.equal(before.state.paused,true);assert.equal(after.state.clock,before.state.clock);assert(after.audio>before.audio+.4);report.pauseFreezesVisualsWhileFileContinues=true;
 await page.locator('#pause').click();await page.locator('#hold').click();const beforeHold=await page.evaluate(()=>window.__V32.getState());await page.waitForTimeout(350);const afterHold=await page.evaluate(()=>window.__V32.getState());assert.equal(afterHold.held,true);assert.equal(afterHold.current.id,beforeHold.current.id);assert(afterHold.clock>beforeHold.clock);report.holdFlagPreservesAnimation=true;
 await page.evaluate(()=>{const a=window.__V32;for(let i=0;i<45;i++)a.display(a.generateDiscovery('history-'+i).scene,true);});assert.equal(await page.evaluate(()=>window.__V32.metrics().history),40);report.historyBound=40;
 await page.locator('#stopAudio').click();assert.equal(await page.evaluate(()=>window.__V32.getState().source),'idle');assert.equal(errors.length,0);
 console.log('UI persistence, retention, import/export and audio/pause checks passed');
}catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}
await writeFile('docs/ui-report.json',JSON.stringify(report,null,2));await browser.close();server.close();
