import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{I as s}from"./InvoiceStatusBadge-Cku1fN7K.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const E={title:"Components/InvoiceStatusBadge",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{status:{control:{type:"select"},options:["Open","Funded","Paid","Defaulted","Cancelled"]}}},a={args:{status:"Open"}},t={args:{status:"Funded"}},r={args:{status:"Paid"}},n={args:{status:"Defaulted"}},o={args:{status:"Cancelled"}},d={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(s,{status:"Open"}),e.jsx(s,{status:"Funded"}),e.jsx(s,{status:"Paid"}),e.jsx(s,{status:"Defaulted"}),e.jsx(s,{status:"Cancelled"})]})};var c,u,p;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    status: 'Open'
  }
}`,...(p=(u=a.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};var l,m,i;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    status: 'Funded'
  }
}`,...(i=(m=t.parameters)==null?void 0:m.docs)==null?void 0:i.source}}};var g,S,f;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    status: 'Paid'
  }
}`,...(f=(S=r.parameters)==null?void 0:S.docs)==null?void 0:f.source}}};var x,v,j;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    status: 'Defaulted'
  }
}`,...(j=(v=n.parameters)==null?void 0:v.docs)==null?void 0:j.source}}};var C,I,O;o.parameters={...o.parameters,docs:{...(C=o.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    status: 'Cancelled'
  }
}`,...(O=(I=o.parameters)==null?void 0:I.docs)==null?void 0:O.source}}};var B,D,F;d.parameters={...d.parameters,docs:{...(B=d.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      <InvoiceStatusBadge status="Open" />
      <InvoiceStatusBadge status="Funded" />
      <InvoiceStatusBadge status="Paid" />
      <InvoiceStatusBadge status="Defaulted" />
      <InvoiceStatusBadge status="Cancelled" />
    </div>
}`,...(F=(D=d.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};const N=["Open","Funded","Paid","Defaulted","Cancelled","AllStatuses"];export{d as AllStatuses,o as Cancelled,n as Defaulted,t as Funded,a as Open,r as Paid,N as __namedExportsOrder,E as default};
