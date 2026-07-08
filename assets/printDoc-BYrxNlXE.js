var F=Object.defineProperty;var G=(t,o,n)=>o in t?F(t,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[o]=n;var P=(t,o,n)=>G(t,typeof o!="symbol"?o+"":o,n);import{v as E,q as M}from"./index-CJSW9xHQ.js";const B=new Uint8Array(512),C=new Uint8Array(256);(()=>{let t=1;for(let o=0;o<255;o++)B[o]=t,C[t]=o,t<<=1,t&256&&(t^=285);for(let o=255;o<512;o++)B[o]=B[o-255]})();function T(t,o){return t===0||o===0?0:B[C[t]+C[o]]}function I(t){let o=new Uint8Array([1]);for(let n=0;n<t;n++){const i=new Uint8Array(o.length+1);for(let s=0;s<o.length;s++)i[s]^=T(o[s],B[n]),i[s+1]^=o[s];o=i}return o.reverse()}function N(t,o){const n=I(o),i=new Uint8Array(t.length+o);i.set(t);for(let s=0;s<t.length;s++){const a=i[s];if(a!==0)for(let r=1;r<n.length;r++)i[s+r]^=T(n[r],a)}return Array.from(i.slice(t.length))}const O={1:[10,1,16,0,0],2:[16,1,28,0,0],3:[26,1,44,0,0],4:[18,2,32,0,0],5:[24,2,43,0,0],6:[16,4,27,0,0],7:[18,4,31,0,0],8:[22,2,38,2,39],9:[22,3,36,2,37],10:[26,4,43,1,44],11:[30,1,50,4,51],12:[22,6,36,2,37],13:[22,8,37,1,38]},D={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,52],11:[6,30,54],12:[6,32,58],13:[6,34,62]};function R(t){const[o,n,i,s,a]=O[t],r=n*i+s*a,f=t<=9?8:16;return Math.floor((r*8-4-f-4)/8)+0}function H(t){for(let o=1;o<=13;o++)if(R(o)>=t)return o;throw new Error(`QR payload too long (${t} bytes; max ${R(13)})`)}class Q{constructor(){P(this,"bits",[])}push(o,n){for(let i=n-1;i>=0;i--)this.bits.push(o>>i&1)}}function W(t){const o=[];for(const x of unescape(encodeURIComponent(t)))o.push(x.charCodeAt(0));const n=H(o.length),[i,s,a,r,f]=O[n],u=s*a+r*f,c=new Q;c.push(4,4),c.push(o.length,n<=9?8:16);for(const x of o)c.push(x,8);const g=u*8;for(c.push(0,Math.min(4,g-c.bits.length));c.bits.length%8!==0;)c.bits.push(0);const m=[];for(let x=0;x<c.bits.length;x+=8){let e=0;for(let l=0;l<8;l++)e=e<<1|c.bits[x+l];m.push(e)}const h=[236,17];let y=0;for(;m.length<u;)m.push(h[y++%2]);const w=[];let b=0;for(let x=0;x<s;x++)w.push(m.slice(b,b+a)),b+=a;for(let x=0;x<r;x++)w.push(m.slice(b,b+f)),b+=f;const $=w.map(x=>N(x,i)),z=[],A=Math.max(a,f);for(let x=0;x<A;x++)for(const e of w)x<e.length&&z.push(e[x]);for(let x=0;x<i;x++)for(const e of $)z.push(e[x]);return{version:n,codewords:z}}function Y(t,o,n){const i=17+t*4,s=Array.from({length:i},()=>Array(i).fill(null)),a=Array.from({length:i},()=>Array(i).fill(!1)),r=(e,l,p)=>{s[e][l]=p,a[e][l]=!0},f=(e,l)=>{for(let p=-1;p<=7;p++)for(let v=-1;v<=7;v++){const k=e+p,j=l+v;if(k<0||k>=i||j<0||j>=i)continue;const _=p>=0&&p<=6&&v>=0&&v<=6&&(p===0||p===6||v===0||v===6),q=p>=2&&p<=4&&v>=2&&v<=4;r(k,j,_||q?1:0)}};f(0,0),f(0,i-7),f(i-7,0);const u=D[t];for(const e of u)for(const l of u)if(!(e<=8&&l<=8||e<=8&&l>=i-9||e>=i-9&&l<=8))for(let p=-2;p<=2;p++)for(let v=-2;v<=2;v++){const k=Math.max(Math.abs(p),Math.abs(v))!==1;r(e+p,l+v,k?1:0)}for(let e=8;e<i-8;e++)a[6][e]||r(6,e,e%2===0?1:0),a[e][6]||r(e,6,e%2===0?1:0);r(i-8,8,1);for(let e=0;e<=8;e++)a[8][e]||(a[8][e]=!0,s[8][e]=0),a[e][8]||(a[e][8]=!0,s[e][8]=0),!a[8][i-1-e]&&e<=7&&(a[8][i-1-e]=!0,s[8][i-1-e]=0),!a[i-1-e][8]&&e<=6&&(a[i-1-e][8]=!0,s[i-1-e][8]=0);if(t>=7){let e=t<<12,l=t<<12;for(let p=17;p>=12;p--)l&1<<p&&(l^=7973<<p-12);e|=l;for(let p=0;p<18;p++){const v=e>>p&1,k=Math.floor(p/3),j=i-11+p%3;r(k,j,v),r(j,k,v)}}const g=[(e,l)=>(e+l)%2===0,e=>e%2===0,(e,l)=>l%3===0,(e,l)=>(e+l)%3===0,(e,l)=>(Math.floor(e/2)+Math.floor(l/3))%2===0,(e,l)=>e*l%2+e*l%3===0,(e,l)=>(e*l%2+e*l%3)%2===0,(e,l)=>((e+l)%2+e*l%3)%2===0][n];let m=0;const h=o.length*8;let y=i-1,w=!0;for(;y>0;){y===6&&y--;for(let e=0;e<i;e++){const l=w?i-1-e:e;for(const p of[y,y-1]){if(a[l][p])continue;let v=0;m<h&&(v=o[m>>3]>>7-(m&7)&1),m++,g(l,p)&&(v^=1),s[l][p]=v}}w=!w,y-=2}let b=0|n,$=b<<10;for(let e=14;e>=10;e--)$&1<<e&&($^=1335<<e-10);const z=(b<<10|$)^21522,A=e=>z>>e&1,x=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];for(let e=0;e<15;e++){const[l,p]=x[e];s[l][p]=A(14-e)}for(let e=0;e<7;e++)s[i-1-e][8]=A(14-e);for(let e=7;e<15;e++)s[8][i-15+e]=A(14-e);return s}function K(t){var f,u;const o=t.length;let n=0;for(let c=0;c<2;c++)for(let g=0;g<o;g++){let m=1;for(let h=1;h<o;h++){const y=c===0?t[g][h]:t[h][g],w=c===0?t[g][h-1]:t[h-1][g];y===w?(m++,m===5?n+=3:m>5&&(n+=1)):m=1}}for(let c=0;c<o-1;c++)for(let g=0;g<o-1;g++){const m=t[c][g];t[c][g+1]===m&&t[c+1][g]===m&&t[c+1][g+1]===m&&(n+=3)}const i=[1,0,1,1,1,0,1,0,0,0,0],s=[0,0,0,0,1,0,1,1,1,0,1];for(let c=0;c<o;c++)for(let g=0;g<=o-11;g++){let m=!0,h=!0,y=!0,w=!0;for(let b=0;b<11;b++)t[c][g+b]!==i[b]&&(m=!1),t[c][g+b]!==s[b]&&(h=!1),((f=t[g+b])==null?void 0:f[c])!==i[b]&&(y=!1),((u=t[g+b])==null?void 0:u[c])!==s[b]&&(w=!1);m&&(n+=40),h&&(n+=40),y&&(n+=40),w&&(n+=40)}let a=0;for(const c of t)for(const g of c)a+=g;const r=a*100/(o*o);return n+=Math.floor(Math.abs(r-50)/5)*10,n}function V(t){const{version:o,codewords:n}=W(t);let i=null,s=1/0;for(let a=0;a<8;a++){const r=Y(o,n,a),f=K(r);f<s&&(s=f,i=r)}return i.map(a=>a.map(r=>r===1))}function S(t,o={}){const{size:n=96,margin:i=2,dark:s="#000000",light:a="#ffffff"}=o,r=V(t),f=r.length+i*2;let u="";return r.forEach((c,g)=>{c.forEach((m,h)=>{m&&(u+=`M${h+i} ${g+i}h1v1h-1z`)})}),`<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 ${f} ${f}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${f}" height="${f}" fill="${a}"/><path d="${u}" fill="${s}"/></svg>`}const X={"A4-portrait":30,"A4-landscape":20,"A3-portrait":52,"A3-landscape":34};function d(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function J(t,o){const n=[];for(let i=0;i<t.length;i+=o)n.push(t.slice(i,i+o));return n.length?n:[[]]}async function Z(t){const o=await E(),n=o.company_name||"Safetech Precast Building Manufacturing LLC",i=o.company_address||"",s=o.company_phone||"",a=o.company_email||"",r=o.report_footer||"System-generated document.",f=t.landscape?"landscape":"portrait",u=X[`${t.paper}-${f}`]||28,c=J(t.rows,u),g=M(),m=t.docNo||`DOC-${g.replace(/[^0-9]/g,"").slice(0,12)}`,h=S(t.qrPayload||`${m} | ${t.title} | ${g}`,{size:72,margin:1}),y=t.columns.map(b=>`<th>${d(b.label)}</th>`).join(""),w=c.map((b,$)=>{const z=b.map((x,e)=>{const l=t.columns.map(p=>`<td>${d(x[p.key])}</td>`).join("");return`<tr><td class="idx">${$*u+e+1}</td>${l}</tr>`}).join(""),A=$===c.length-1;return`
    <section class="sheet">
      <header class="doc-head">
        <div class="brand">
          <div class="brand-mark">ST</div>
          <div>
            <div class="co-name">${d(n)}</div>
            <div class="co-sub">${d(i)}</div>
            <div class="co-sub">${d(s)}${s&&a?" • ":""}${d(a)}</div>
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${d(t.title)}</div>
          ${t.subtitle?`<div class="doc-sub">${d(t.subtitle)}</div>`:""}
          ${(t.meta||[]).map(x=>`<div class="doc-meta">${d(x)}</div>`).join("")}
        </div>
        <div class="doc-qr">
          ${h}
          <div class="doc-no">${d(m)}</div>
          <div class="barcode">${d(m)}</div>
        </div>
      </header>

      <table class="grid">
        <thead><tr><th class="idx">#</th>${y}</tr></thead>
        <tbody>${z}</tbody>
      </table>

      ${A?`
      <div class="subtotal-line">TOTAL RECORDS: ${t.rows.length}</div>
      <div class="sig-row">
        <div class="sig"><div class="sig-line"></div>Prepared By</div>
        <div class="sig"><div class="sig-line"></div>Checked By</div>
        <div class="sig"><div class="sig-line"></div>Approved By</div>
      </div>
      <div class="rev-line">Revision: ${d(t.revision||"R0 — Initial issue")} &nbsp;•&nbsp; Generated: ${g} (GMT+4)</div>
      `:`<div class="subtotal-line">PAGE SUBTOTAL (Carried Forward): ${($+1)*u} records</div>`}

      <footer class="doc-foot">
        <span>${d(r)}</span>
        <span>Page ${$+1} of ${c.length}</span>
      </footer>
    </section>`}).join("");return`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${d(t.title)} — ${d(m)}</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
<style>
  @page { size: ${t.paper} ${f}; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f1f5f9; }
  .sheet {
    background: white; margin: 12px auto; padding: 10mm;
    width: ${t.paper==="A3"?t.landscape?"420mm":"297mm":t.landscape?"297mm":"210mm"};
    min-height: ${t.paper==="A3"?t.landscape?"297mm":"420mm":t.landscape?"210mm":"297mm"};
    box-shadow: 0 2px 12px rgba(0,0,0,.18); position: relative; display: flex; flex-direction: column;
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: avoid; }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #b91c1c; padding-bottom: 8px; margin-bottom: 10px; gap: 12px; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .brand-mark { width: 46px; height: 46px; background: #0a0a0a; color: #ef4444; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 8px; letter-spacing: 1px; }
  .co-name { font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: .4px; }
  .co-sub { font-size: 8.5px; color: #555; }
  .doc-title-block { text-align: center; flex: 1; }
  .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
  .doc-sub { font-size: 9.5px; color: #444; margin-top: 2px; }
  .doc-meta { font-size: 8.5px; color: #666; margin-top: 1px; }
  .doc-qr { text-align: center; }
  .doc-no { font-size: 8px; font-weight: 700; margin-top: 2px; font-family: monospace; }
  .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 26px; line-height: 1; margin-top: 1px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 8.8px; }
  table.grid th { background: #111; color: #fff; text-transform: uppercase; font-size: 7.6px; letter-spacing: .4px; padding: 4px 5px; text-align: left; border: 1px solid #333; }
  table.grid td { border: 1px solid #cbd5e1; padding: 3.5px 5px; height: 18px; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  td.idx, th.idx { width: 26px; text-align: center; color: #777; }
  .subtotal-line { margin-top: 8px; font-size: 9px; font-weight: 800; text-align: right; text-transform: uppercase; letter-spacing: .5px; }
  .sig-row { display: flex; gap: 24px; margin-top: 26px; }
  .sig { flex: 1; text-align: center; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #444; }
  .sig-line { border-bottom: 1.2px solid #111; height: 32px; margin-bottom: 4px; }
  .rev-line { margin-top: 10px; font-size: 8px; color: #666; border-top: 1px dashed #cbd5e1; padding-top: 5px; }
  .doc-foot { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #888; border-top: 1px solid #e2e8f0; }
  @media print {
    body { background: white; }
    .sheet { box-shadow: none; margin: 0; width: auto; min-height: auto; }
  }
</style>
</head>
<body>${w}</body>
</html>`}function L(t,o){const n=window.open("","_blank","width=1080,height=800");if(!n){alert("Popup blocked — allow popups for this site to print documents.");return}n.document.open(),n.document.write(t),n.document.close(),o&&(n.onload=()=>setTimeout(()=>n.print(),250))}async function it(t){const o=await Z(t);L(o,!t.previewOnly)}async function nt(t){const o=await E(),n=o.company_name||"Safetech Precast Building Manufacturing LLC",i=o.company_address||"",s=o.report_footer||"System-generated document.",a=M(),r=`RPT-${a.replace(/[^0-9]/g,"").slice(0,12)}`,f=S(`${r} | ${t.title} | ${a}`,{size:68,margin:1}),u=t.landscape?"landscape":"portrait",c=t.kpis&&t.kpis.length?`
    <div class="kpis">${t.kpis.map(h=>`<div class="kpi"><div class="kv">${d(h.value)}</div><div class="kl">${d(h.label)}</div></div>`).join("")}</div>`:"",g=t.sections.map(h=>`
    <div class="section">
      <div class="sec-head">${d(h.heading)} <span class="sec-count">${h.rows.length} record(s)</span></div>
      <table class="grid">
        <thead><tr><th class="idx">#</th>${h.columns.map(y=>`<th>${d(y.label)}</th>`).join("")}</tr></thead>
        <tbody>
          ${h.rows.length===0?`<tr><td colspan="${h.columns.length+1}" class="empty">No records for this period</td></tr>`:h.rows.map((y,w)=>`<tr><td class="idx">${w+1}</td>${h.columns.map(b=>`<td>${d(y[b.key])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>`).join(""),m=`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${d(t.title)} — ${d(r)}</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
<style>
  @page { size: ${t.paper||"A4"} ${u}; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f1f5f9; padding: 12px; }
  .doc { background: white; max-width: ${t.paper==="A3"?t.landscape?"420mm":"297mm":t.landscape?"297mm":"210mm"}; margin: 0 auto; padding: 10mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #b91c1c; padding-bottom: 8px; margin-bottom: 10px; gap: 12px; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .brand-mark { width: 46px; height: 46px; background: #0a0a0a; color: #ef4444; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
  .co-name { font-weight: 900; font-size: 13px; text-transform: uppercase; }
  .co-sub { font-size: 8.5px; color: #555; }
  .doc-title-block { text-align: center; flex: 1; }
  .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
  .doc-sub { font-size: 9.5px; color: #444; margin-top: 2px; }
  .doc-meta { font-size: 8.5px; color: #666; margin-top: 1px; }
  .doc-qr { text-align: center; }
  .doc-no { font-size: 8px; font-weight: 700; margin-top: 2px; font-family: monospace; }
  .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 24px; line-height: 1; }
  .kpis { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .kpi { flex: 1; min-width: 90px; border: 1.4px solid #111; border-radius: 8px; padding: 6px 10px; text-align: center; }
  .kv { font-size: 16px; font-weight: 900; color: #b91c1c; }
  .kl { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #555; letter-spacing: .5px; }
  .section { margin-bottom: 14px; page-break-inside: avoid; }
  .sec-head { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .8px; background: #111; color: white; padding: 4px 8px; border-radius: 5px 5px 0 0; display: flex; justify-content: space-between; }
  .sec-count { color: #fca5a5; font-size: 8px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 8.4px; }
  table.grid th { background: #f1f5f9; color: #333; text-transform: uppercase; font-size: 7.2px; padding: 3.5px 5px; text-align: left; border: 1px solid #cbd5e1; }
  table.grid td { border: 1px solid #d7dee8; padding: 3px 5px; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  td.idx, th.idx { width: 24px; text-align: center; color: #777; }
  td.empty { text-align: center; color: #999; font-style: italic; padding: 8px; }
  .sig-row { display: flex; gap: 24px; margin-top: 22px; }
  .sig { flex: 1; text-align: center; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #444; }
  .sig-line { border-bottom: 1.2px solid #111; height: 30px; margin-bottom: 4px; }
  .doc-foot { margin-top: 12px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #888; border-top: 1px solid #e2e8f0; }
  @media print { body { background: white; padding: 0 } .doc { box-shadow: none; max-width: none } }
</style></head>
<body>
  <div class="doc">
    <div class="doc-head">
      <div class="brand">
        <div class="brand-mark">ST</div>
        <div><div class="co-name">${d(n)}</div><div class="co-sub">${d(i)}</div></div>
      </div>
      <div class="doc-title-block">
        <div class="doc-title">${d(t.title)}</div>
        ${t.subtitle?`<div class="doc-sub">${d(t.subtitle)}</div>`:""}
        ${(t.meta||[]).map(h=>`<div class="doc-meta">${d(h)}</div>`).join("")}
      </div>
      <div class="doc-qr">${f}<div class="doc-no">${d(r)}</div><div class="barcode">${d(r)}</div></div>
    </div>
    ${c}
    ${g}
    <div class="sig-row">
      <div class="sig"><div class="sig-line"></div>Prepared By</div>
      <div class="sig"><div class="sig-line"></div>Checked By</div>
      <div class="sig"><div class="sig-line"></div>Approved By</div>
    </div>
    <div class="doc-foot"><span>${d(s)}</span><span>Generated ${a} (GMT+4) • Reporting day 06:00–06:00 GMT+4</span></div>
  </div>
</body></html>`;L(m,!t.previewOnly)}async function at(t,o=!1){const i=(await E()).company_name||"Safetech Precast Building Manufacturing LLC",s=M(),r=`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>QR Element Labels</title>
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; }
  .sheet-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; padding: 6mm; max-width: 210mm; margin: 0 auto; background: white; }
  .label { border: 1.6px solid #111; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .l-head { display: flex; justify-content: space-between; align-items: center; background: #0a0a0a; color: white; padding: 4px 8px; }
  .l-brand { font-weight: 900; font-size: 11px; letter-spacing: 1px; color: #ef4444; }
  .l-tag { font-size: 7px; font-weight: 700; letter-spacing: 1px; color: #cbd5e1; }
  .l-body { display: flex; gap: 8px; padding: 8px; }
  .l-info { flex: 1; min-width: 0; }
  .l-code { font-family: monospace; font-weight: 900; font-size: 12.5px; border-bottom: 1.4px solid #111; padding-bottom: 3px; margin-bottom: 4px; }
  .l-row { display: flex; justify-content: space-between; font-size: 8px; padding: 1.5px 0; border-bottom: 1px dotted #cbd5e1; }
  .l-row span { color: #555; text-transform: uppercase; font-weight: 700; font-size: 7px; }
  .l-row b { font-weight: 800; text-align: right; margin-left: 6px; }
  .l-foot { font-size: 6.5px; color: #666; text-align: center; padding: 3px; border-top: 1px solid #e2e8f0; }
  @media print { body { background: white } .sheet-wrap { padding: 0 } }
</style></head>
<body><div class="sheet-wrap">${t.map(f=>`
    <div class="label">
      <div class="l-head">
        <span class="l-brand">SAFETECH</span>
        <span class="l-tag">PRECAST ELEMENT</span>
      </div>
      <div class="l-body">
        <div class="l-qr">${S(f.payload,{size:92,margin:1})}</div>
        <div class="l-info">
          <div class="l-code">${d(f.code)}</div>
          ${f.lines.map(([u,c])=>`<div class="l-row"><span>${d(u)}</span><b>${d(c)}</b></div>`).join("")}
        </div>
      </div>
      <div class="l-foot">${d(i)} • ${s}</div>
    </div>`).join("")}</div></body></html>`;L(r,!o)}function U(t,o){const n=URL.createObjectURL(t),i=document.createElement("a");i.href=n,i.download=o,i.click(),setTimeout(()=>URL.revokeObjectURL(n),2e3)}function st(t,o,n){const i=a=>{const r=String(a??"");return/[",\n]/.test(r)?`"${r.replace(/"/g,'""')}"`:r},s=[o.map(a=>i(a.label)).join(","),...n.map(a=>o.map(r=>i(a[r.key])).join(","))];U(new Blob(["\uFEFF"+s.join(`
`)],{type:"text/csv;charset=utf-8"}),t)}function rt(t,o,n,i){const s=n.map(f=>`<th style="background:#111;color:#fff">${d(f.label)}</th>`).join(""),a=i.map(f=>`<tr>${n.map(u=>`<td>${d(f[u.key])}</td>`).join("")}</tr>`).join(""),r=`<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><title>${d(o)}</title></head>
  <body><table border="1"><thead><tr>${s}</tr></thead><tbody>${a}</tbody></table></body></html>`;U(new Blob([r],{type:"application/vnd.ms-excel"}),t)}export{rt as a,at as b,nt as c,st as e,L as o,it as p,S as q};
