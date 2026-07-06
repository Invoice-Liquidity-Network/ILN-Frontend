import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{F as R}from"./FieldTooltip-vGmOnsFM.js";import{g as D,D as N,f as v,a as C}from"./dispute-rate-DkjLrAEo.js";import{R as P,T as S}from"./generateCategoricalChart-Db8sjFvg.js";import{L as T,a as w}from"./LineChart-fNK0UPIo.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./YAxis-DdR1PIu1.js";function y({active:t,payload:r}){var a;if(!t||!(r!=null&&r.length))return null;const s=(a=r[0])==null?void 0:a.payload;return s?e.jsxs("div",{className:"rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-xs shadow-lg",children:[e.jsx("p",{className:"font-bold text-on-surface",children:s.label}),e.jsx("p",{className:"text-on-surface-variant",children:v(s.ratePercent)})]}):null}function b({metrics:t}){const r=D(t.rate30dPercent),s=C(r),a=t.dailyTrend90d.some(c=>c.fundedCount>0||c.disputedCount>0);return e.jsxs("div",{id:"stat-dispute-rate",className:`flex flex-col gap-4 rounded-[24px] border bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${s.border}`,children:[e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("span",{className:"text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant",children:"Dispute Rate"}),e.jsx(R,{content:N})]}),e.jsx("p",{className:`font-headline text-3xl font-bold ${s.value}`,children:v(t.rate30dPercent)}),e.jsx("p",{className:"text-xs text-on-surface-variant",children:"Last 30 days"}),e.jsxs("p",{className:"text-xs text-on-surface-variant/80",children:[t.disputed30d.toLocaleString()," disputed / ",t.funded30d.toLocaleString()," ","funded"]})]}),e.jsx("div",{className:"h-20 w-full sm:h-16 sm:w-56","aria-label":"Dispute rate trend over 90 days",children:a?e.jsx(P,{width:"100%",height:"100%",children:e.jsxs(T,{data:t.dailyTrend90d,margin:{top:4,right:4,left:4,bottom:4},children:[e.jsx(S,{content:e.jsx(y,{})}),e.jsx(w,{type:"monotone",dataKey:"ratePercent",stroke:s.sparkline,strokeWidth:2,dot:!1,isAnimationActive:!1})]})}):e.jsx("div",{className:"flex h-full items-center justify-center rounded-xl border border-dashed border-outline-variant/20 text-xs text-on-surface-variant",children:"No funded events in 90 days"})})]})}b.__docgenInfo={description:"",methods:[],displayName:"StatsDisputeRateCard",props:{metrics:{required:!0,tsType:{name:"DisputeRateMetrics"},description:""}}};const i={rate30dPercent:3.5,disputed30d:35,funded30d:1e3,dailyTrend90d:Array.from({length:90},(t,r)=>({date:new Date(Date.now()-r*864e5).toISOString().slice(0,10),label:`${90-r}d`,fundedCount:Math.floor(Math.random()*20)+5,disputedCount:Math.floor(Math.random()*2),ratePercent:Math.random()*8}))},$={title:"Components/Stats/StatsDisputeRateCard",component:b,parameters:{layout:"centered"},tags:["autodocs"]},n={args:{metrics:i}},o={args:{metrics:{...i,rate30dPercent:0,disputed30d:0}}},d={args:{metrics:{...i,rate30dPercent:12.8,disputed30d:128}}};var l,u,m;n.parameters={...n.parameters,docs:{...(l=n.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    metrics: mockMetrics
  }
}`,...(m=(u=n.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var p,f,x;o.parameters={...o.parameters,docs:{...(p=o.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    metrics: {
      ...mockMetrics,
      rate30dPercent: 0,
      disputed30d: 0
    }
  }
}`,...(x=(f=o.parameters)==null?void 0:f.docs)==null?void 0:x.source}}};var h,g,j;d.parameters={...d.parameters,docs:{...(h=d.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    metrics: {
      ...mockMetrics,
      rate30dPercent: 12.8,
      disputed30d: 128
    }
  }
}`,...(j=(g=d.parameters)==null?void 0:g.docs)==null?void 0:j.source}}};const F=["Default","ZeroRate","HighRate"];export{n as Default,d as HighRate,o as ZeroRate,F as __namedExportsOrder,$ as default};
