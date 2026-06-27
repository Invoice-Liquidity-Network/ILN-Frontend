import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{M as o}from"./MetricCard-DYBMPjzr.js";import"./FieldTooltip-vGmOnsFM.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";function r(t){return t>=1e6?`$${(t/1e6).toFixed(2)}M`:t>=1e3?`$${(t/1e3).toFixed(1)}K`:`$${t.toLocaleString("en-US",{maximumFractionDigits:2})}`}function p({stats:t}){return e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsx(o,{id:"stat-total-invoices",icon:"receipt_long",label:"Total Invoices",value:t.total_invoices.toLocaleString(),sub:"All invoices on-chain",accent:!1}),e.jsx(o,{id:"stat-total-funded",icon:"account_balance",label:"Total Funded",value:t.total_funded.toLocaleString(),sub:"Invoices funded by LPs",accent:!1}),e.jsx(o,{id:"stat-total-paid",icon:"check_circle",label:"Total Paid",value:t.total_paid.toLocaleString(),sub:"Successfully settled",accent:!1}),e.jsx(o,{id:"stat-total-volume",icon:"paid",label:"Total Volume",value:r(t.total_volume_usd),sub:"USD-equivalent funded",accent:!0}),e.jsx(o,{id:"stat-protocol-fees",icon:"savings",label:"Protocol Fees Collected",value:r(t.total_protocol_fees_usd??0),sub:"Fees collected by protocol",accent:!1,tooltip:"This fee funds ILN protocol development and the treasury",badge:t.feeRateBps===0?e.jsx("span",{className:"bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20",children:"0% FEE"}):null})]})}p.__docgenInfo={description:"",methods:[],displayName:"StatsMetricCards",props:{stats:{required:!0,tsType:{name:"ContractStats"},description:""}}};const m={total_invoices:1247,total_funded:892,total_paid:756,total_volume_usd:24e5,total_protocol_fees_usd:12500,feeRateBps:0},x={title:"Components/Stats/StatsMetricCards",component:p,parameters:{layout:"centered"},tags:["autodocs"]},a={args:{stats:m}},s={args:{stats:{total_invoices:0,total_funded:0,total_paid:0,total_volume_usd:0,total_protocol_fees_usd:0,feeRateBps:0}}};var l,n,c;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    stats: mockStats
  }
}`,...(c=(n=a.parameters)==null?void 0:n.docs)==null?void 0:c.source}}};var i,d,u;s.parameters={...s.parameters,docs:{...(i=s.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    stats: {
      total_invoices: 0,
      total_funded: 0,
      total_paid: 0,
      total_volume_usd: 0,
      total_protocol_fees_usd: 0,
      feeRateBps: 0
    }
  }
}`,...(u=(d=s.parameters)==null?void 0:d.docs)==null?void 0:u.source}}};const S=["Default","ZeroStats"];export{a as Default,s as ZeroStats,S as __namedExportsOrder,x as default};
