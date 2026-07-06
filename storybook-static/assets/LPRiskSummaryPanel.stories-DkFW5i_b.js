import{L as m}from"./LPRiskSummaryPanel-CI52Tn6_.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./formatTokenAmount-2i9m6gHE.js";const F={title:"Components/LPRiskSummaryPanel",component:m,parameters:{layout:"centered"},tags:["autodocs"]},d=[{id:1n,amount:1000000000n,status:"Funded",due_date:BigInt(Math.floor(Date.now()/1e3)+3600),token:"USDC"},{id:2n,amount:5000000000n,status:"Disputed",due_date:BigInt(Math.floor(Date.now()/1e3)+86400*30),token:"USDC"},{id:3n,amount:2000000000n,status:"Funded",due_date:BigInt(Math.floor(Date.now()/1e3)+86400*60),token:"USDC"}],o={args:{invoices:d,onFilterByRisk:c=>console.log("Filter:",c)}},e={args:{invoices:[],onFilterByRisk:()=>{}}};var t,s,n;o.parameters={...o.parameters,docs:{...(t=o.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    invoices: mockInvoices,
    onFilterByRisk: filter => console.log('Filter:', filter)
  }
}`,...(n=(s=o.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};var r,a,i;e.parameters={...e.parameters,docs:{...(r=e.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    invoices: [],
    onFilterByRisk: () => {}
  }
}`,...(i=(a=e.parameters)==null?void 0:a.docs)==null?void 0:i.source}}};const R=["WithRisk","NoPositions"];export{e as NoPositions,o as WithRisk,R as __namedExportsOrder,F as default};
