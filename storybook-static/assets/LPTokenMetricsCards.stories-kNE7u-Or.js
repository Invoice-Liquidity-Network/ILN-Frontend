import{L as p}from"./LPTokenMetricsCards-gNNNLfLD.js";import"./jsx-runtime-EKYJJIwR.js";import"./per-token-yield-BX_ZsJbQ.js";import"./format-BWVjbcin.js";import"./formatTokenAmount-2i9m6gHE.js";const w={title:"Components/LPTokenMetricsCards",component:p,parameters:{layout:"centered"},tags:["autodocs"]},u=[{token:{contractId:"usdc",symbol:"USDC",decimals:7,iconLabel:"U",isAllowed:!0},invoiceCount:5,paidCount:3,totalFunded:5000000000n,totalYieldEarned:150000000n,pendingYield:50000000n,yieldPercentage:3}],e={args:{metrics:u,showUSDEquivalent:!1,onToggleUSD:()=>{}}},o={args:{metrics:u,showUSDEquivalent:!0,onToggleUSD:()=>{}}},r={args:{metrics:[],showUSDEquivalent:!1,onToggleUSD:()=>{}}};var s,t,a;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    metrics: mockMetrics,
    showUSDEquivalent: false,
    onToggleUSD: () => {}
  }
}`,...(a=(t=e.parameters)==null?void 0:t.docs)==null?void 0:a.source}}};var n,c,i;o.parameters={...o.parameters,docs:{...(n=o.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    metrics: mockMetrics,
    showUSDEquivalent: true,
    onToggleUSD: () => {}
  }
}`,...(i=(c=o.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var m,l,d;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    metrics: [],
    showUSDEquivalent: false,
    onToggleUSD: () => {}
  }
}`,...(d=(l=r.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};const f=["Default","ShowUSD","Empty"];export{e as Default,r as Empty,o as ShowUSD,f as __namedExportsOrder,w as default};
