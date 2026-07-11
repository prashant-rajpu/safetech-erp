import{D as c}from"./index-B9gbUCKe.js";/**
 * @license lucide-react v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],_=c("qr-code",k);/**
 * @license lucide-react v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]],g=c("square",l),M={"WL/PC":"IW",WL:"IW",HCS:"HC",BW:"BW",CL:"CL",BM:"BM"};function x(e,r,n,s){const y=M[e==null?void 0:e.element_type]||"EL",h=new Date,p=`${String(h.getFullYear()).slice(2)}${String(h.getMonth()+1).padStart(2,"0")}`,d=s.filter(t=>t.project_no===e.project_no&&t.element_type===e.element_type),i=String(Math.max(1,d.findIndex(t=>t.drawing_no===e.drawing_no)+1)).padStart(2,"0"),o=[];let a=n.size+1;for(;o.length<r;){const t=`00-${y}${i}-${p}M-${String(a).padStart(3,"0")}`;n.has(t)||o.push(t),a++}return o}export{_ as Q,g as S,x as g};
