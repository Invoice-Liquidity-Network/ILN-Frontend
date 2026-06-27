import{j as m}from"./jsx-runtime-EKYJJIwR.js";import{M as u}from"./MetricCard-DYBMPjzr.js";import"./FieldTooltip-vGmOnsFM.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const y={title:"Components/Analytics/MetricCard",component:u,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{accent:{control:"boolean"},icon:{control:"text"},label:{control:"text"},sub:{control:"text"},tooltip:{control:"text"}}},e={args:{id:"metric-1",icon:"receipt_long",label:"Total Invoices",value:"1,247",sub:"All invoices on-chain"}},o={args:{id:"metric-2",icon:"paid",label:"Total Volume",value:"$2.4M",sub:"USD-equivalent funded",accent:!0}},t={args:{id:"metric-3",icon:"savings",label:"Protocol Fees",value:"$12,500",tooltip:"Fees collected by the protocol",badge:m.jsx("span",{className:"bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full",children:"0% FEE"})}};var a,r,c;e.parameters={...e.parameters,docs:{...(a=e.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    id: 'metric-1',
    icon: 'receipt_long',
    label: 'Total Invoices',
    value: '1,247',
    sub: 'All invoices on-chain'
  }
}`,...(c=(r=e.parameters)==null?void 0:r.docs)==null?void 0:c.source}}};var n,s,l;o.parameters={...o.parameters,docs:{...(n=o.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    id: 'metric-2',
    icon: 'paid',
    label: 'Total Volume',
    value: '$2.4M',
    sub: 'USD-equivalent funded',
    accent: true
  }
}`,...(l=(s=o.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};var i,p,d;t.parameters={...t.parameters,docs:{...(i=t.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    id: 'metric-3',
    icon: 'savings',
    label: 'Protocol Fees',
    value: '$12,500',
    tooltip: 'Fees collected by the protocol',
    badge: <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">0% FEE</span>
  }
}`,...(d=(p=t.parameters)==null?void 0:p.docs)==null?void 0:d.source}}};const h=["Default","Accent","WithTooltip"];export{o as Accent,e as Default,t as WithTooltip,h as __namedExportsOrder,y as default};
