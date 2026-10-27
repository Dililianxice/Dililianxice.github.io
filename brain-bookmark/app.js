'use strict';
// GitHub Pages plays frozen Python outputs; it does not infer a visitor's EEG.
const $=id=>document.getElementById(id);
const KEYS={draft:'brain-bookmark-public-draft-v1',snapshot:'brain-bookmark-public-snapshot-v1'};
let data=null,run=null,time=0,playing=false,lastClock=0,nextOutput=0,snapshot=null,round=0,cursor=0;
const fields=['goal','document','plan'];
function warn(message){$('runtime-error').textContent=message;}
function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){warn('浏览器未允许本地存储。本次页面仍可体验，请下载书签；关闭页面后内容可能丢失。');return false;}}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(e){warn('本地存储不可用或内容损坏。本次可以继续体验。');return null;}}
function draft(){return {goal:$('goal').value,text:$('document').value,next_step:$('plan').value,cursor:Math.min(cursor,$('document').value.length)};}
function remember(){const saved=persist(KEYS.draft,draft());$('draft-state').textContent=saved?'草稿已存于本浏览器':'草稿仅保留在当前页面';}
function restoreDraft(){const saved=read(KEYS.draft);if(!saved)return;if(typeof saved.goal==='string')$('goal').value=saved.goal;if(typeof saved.text==='string')$('document').value=saved.text;if(typeof saved.next_step==='string')$('plan').value=saved.next_step;cursor=Number.isFinite(saved.cursor)?Math.min(Math.max(0,saved.cursor),$('document').value.length):$('document').value.length;}
function showBookmark(){if(!snapshot)return;
  $('saved-content').hidden=false;$('bookmark-title').textContent='已自动留下工作书签';
  $('bookmark-status').textContent='触发来源：公开 EEG 任务模型候选变化。此事件不代表已验证分心。';
  $('anchor-label').textContent=`已保存的编辑位置 · 第 ${snapshot.cursor.line} 行`;
  $('anchor').textContent=snapshot.anchor_text;$('next-step').textContent=snapshot.next_step;
  $('snapshot-source').textContent=`${new Date(snapshot.saved_at).toLocaleString()} · 片段 ${snapshot.trigger.record} · ${snapshot.trigger.time_s} 秒 · ${snapshot.id}`;
  $('acknowledge').textContent='知道了，继续写';
}
function capture(event){const doc=draft(),before=doc.text.slice(0,doc.cursor),lines=before.split('\n');let anchor=lines[lines.length-1];let line=lines.length;
  if(!anchor.trim()){let j=lines.length-2;while(j>=0&&!lines[j].trim())j--;if(j>=0){anchor=lines[j];line=j+1;}}
  if(!anchor.trim())anchor='当前编辑位置还没有文字。';
  snapshot={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),saved_at:new Date().toISOString(),reason:'eeg_candidate_auto',document:{goal:doc.goal,text:doc.text,next_step:doc.next_step},cursor:{offset:doc.cursor,line},anchor_text:anchor,
    next_step:doc.next_step.trim()||`先回到第 ${line} 行，接着这里继续：${anchor.slice(0,180)}`,
    trigger:{...event,source:'precomputed_public_eeg_model',record:run.record,round},
    warning:'Experimental task-model change, not validated distraction detection. Browser text and historical EEG are not synchronized human recordings.'};
  persist(KEYS.snapshot,snapshot);showBookmark();
}
fields.forEach(id=>$(id).addEventListener('input',()=>{if(id==='document')cursor=$('document').selectionStart;remember();}));
['select','keyup','click','blur'].forEach(name=>$('document').addEventListener(name,()=>{cursor=$('document').selectionStart;remember();}));
$('clear-draft').addEventListener('click',()=>{if(!confirm('清除本浏览器中保存的这份草稿和书签？'))return;try{Object.values(KEYS).forEach(k=>localStorage.removeItem(k));}catch(e){warn('本地存储不可用。');}fields.forEach(id=>$(id).value='');cursor=0;snapshot=null;$('saved-content').hidden=true;$('bookmark-title').textContent='等待一个持续变化。';$('bookmark-status').textContent='本地草稿和书签已清除；可以重新编辑。';$('draft-state').textContent='本地内容已清除';});
$('acknowledge').addEventListener('click',()=>{$('acknowledge').textContent='已确认 · 新输入继续保留';});
$('download').addEventListener('click',()=>{if(!snapshot)return;const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='brain-bookmark.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('copy-intro').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share-copy').textContent);$('copy-status').textContent=' 已复制，可以直接分享。';}catch(e){$('copy-status').textContent=' 请选中上面的介绍文字手动复制。';}});
cursor=$('document').value.length;restoreDraft();const previous=read(KEYS.snapshot);if(previous&&previous.cursor&&previous.trigger&&typeof previous.anchor_text==='string'){snapshot=previous;showBookmark();}
function selectRun(label){playing=false;time=0;nextOutput=0;round++;run=data.runs.find(r=>r.label===label);
  document.querySelectorAll('[data-condition]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.condition)===label)));
  $('record-info').textContent=`真实标签：${run.title} · 测试 ID ${run.subject} · ${run.duration} 秒 · ${run.record}。切换片段不触发书签。`;
  $('fixture-note').textContent=label===2?'默认片段一直标注为“困难心算”，约第 20 秒模型估计发生变化。它只用来检查“模型事件 → 自动存档”是否连通，不证明真实分心。':'本片段没有触发冻结模型的持续变化事件，因此可能不会生成书签。切换回“困难心算”可体验已知的自动存档样例。';
  $('progress').max=run.duration;update();
}
function update(){if(!run)return;$('play').textContent=playing?'Ⅱ 暂停':'▶ 开始回放';$('play-state').textContent=playing?'● 真实数据回放中':time>=run.duration?'本轮回放结束':'已暂停 · 预计算模型结果';$('time').textContent=`${time.toFixed(1)} / ${run.duration} 秒`;$('progress').value=time;
  const out=nextOutput?run.outputs[nextOutput-1]:null;let state='等待首个 4 秒窗口';if(out)state=out.good?'任务条件估计 · 非分心概率':'信号质量不佳 · 暂停判定';$('model-state').textContent=state;
  document.querySelectorAll('#scores>div').forEach((el,i)=>{const value=out&&out.good&&out.scores?out.scores[i]:null;el.querySelector('progress').value=value===null?0:value;el.querySelector('b').textContent=value===null?'—':`${Math.round(value*100)}%`;});drawCharts();
}
document.querySelectorAll('[data-condition]').forEach(b=>b.addEventListener('click',()=>{if(data)selectRun(Number(b.dataset.condition));}));
$('play').addEventListener('click',()=>{if(!run)return;if(time>=run.duration)selectRun(run.label);playing=!playing;lastClock=performance.now();update();});
$('restart').addEventListener('click',()=>{if(run)selectRun(run.label);});
$('speed').addEventListener('change',()=>{lastClock=performance.now();});
function tick(){const now=performance.now();if(playing&&run){time=Math.min(run.duration,time+(now-lastClock)/1000*Number($('speed').value));while(nextOutput<run.outputs.length&&run.outputs[nextOutput].time_s<=time){const out=run.outputs[nextOutput++];if(out.good&&out.event)capture(out.event);}if(time>=run.duration)playing=false;update();}lastClock=now;}
setInterval(tick,80);
function context(id){const c=$(id),w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);const ctx=c.getContext('2d');ctx.scale(dpr,dpr);ctx.font='10px system-ui';ctx.lineWidth=1;return {ctx,w,h};}
function axes(ctx,w,h,x0,x1,y0,y1){const left=40,top=8,right=w-10,bottom=h-27;ctx.fillStyle='#8191ac';ctx.strokeStyle='#28334a';for(let j=0;j<=4;j++){const y=top+(bottom-top)*j/4;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(String(Math.round(y1-(y1-y0)*j/4)),left-8,y+3);}ctx.textAlign='center';for(let j=0;j<=4;j++){const x=left+(right-left)*j/4;ctx.fillText((x0+(x1-x0)*j/4).toFixed(1)+'s',x,bottom+19);}return {left,top,right,bottom};}
const palette=[[11,17,37],[34,40,92],[101,82,175],[33,184,202],[159,232,199],[255,228,161]];
function color(db){const p=Math.max(0,Math.min(1,db/40))*(palette.length-1),i=Math.min(palette.length-2,Math.floor(p)),f=p-i;return `rgb(${palette[i].map((v,k)=>Math.round(v+(palette[i+1][k]-v)*f)).join(',')})`;}
function drawCharts(){if(!run)return;
  {const {ctx,w,h}=context('wave');const end=Math.min(run.wave.length,Math.floor(time*run.wave_fs)),start=Math.max(0,end-6*run.wave_fs),view=run.wave.slice(start,end);const amp=Math.max(100,...view.map(v=>Math.abs(v)))*1.1;const x0=Math.max(0,time-6),x1=Math.max(6,time),a=axes(ctx,w,h,x0,x1,-amp,amp);ctx.save();ctx.beginPath();ctx.rect(a.left,a.top,a.right-a.left,a.bottom-a.top);ctx.clip();ctx.beginPath();view.forEach((v,j)=>{const x=a.left+((start+j)/run.wave_fs-x0)/(x1-x0)*(a.right-a.left),y=(a.top+a.bottom)/2-v/(amp*2)*(a.bottom-a.top);if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle='#77ead4';ctx.lineWidth=1.2;ctx.shadowColor='#77ead4';ctx.shadowBlur=7;ctx.stroke();ctx.restore();}
  {const {ctx,w,h}=context('heat');const a=axes(ctx,w,h,0,run.duration,1,40),cols=run.heat_times.length,rows=run.heat_freqs.length;for(let j=0;j<cols;j++){// Only display complete one-second PSD windows already reached by replay.
    if(run.heat_times[j]+.5>time)break;const x=a.left+(run.heat_times[j]-.125)/run.duration*(a.right-a.left),cw=.25/run.duration*(a.right-a.left)+.5;for(let i=0;i<rows;i++){ctx.fillStyle=color(run.heat_db[i][j]);const ch=(a.bottom-a.top)/rows;ctx.fillRect(x,a.bottom-(i+1)*ch,cw,ch+.3);}}
  }
}
window.addEventListener('resize',drawCharts);
fetch('demo-data.json').then(r=>{if(!r.ok)throw Error('数据文件加载失败');return r.json();}).then(value=>{if(value.mode!=='precomputed_public_eeg_replay'||value.runs.length!==3)throw Error('回放数据格式不匹配');data=value;selectRun(2);$('play').disabled=false;$('restart').disabled=false;}).catch(error=>{warn('真实示例未能加载，请刷新重试。'+error.message);$('play-state').textContent='数据加载失败';});
