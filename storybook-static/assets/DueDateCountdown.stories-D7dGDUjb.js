import{D as h}from"./DueDateCountdown-DyQS1siH.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const I={title:"Components/DueDateCountdown",component:h,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{showClaimButton:{control:"boolean"}}},e={args:{dueDate:BigInt(Math.floor(Date.now()/1e3)+86400*30)}},a={args:{dueDate:BigInt(Math.floor(Date.now()/1e3)+86400*3)}},t={args:{dueDate:BigInt(Math.floor(Date.now()/1e3)+3600*6)}},o={args:{dueDate:BigInt(Math.floor(Date.now()/1e3)-86400),showClaimButton:!0,onClaimDefault:()=>{}}};var r,n,s;e.parameters={...e.parameters,docs:{...(r=e.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    dueDate: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30)
  }
}`,...(s=(n=e.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};var u,c,i;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    dueDate: BigInt(Math.floor(Date.now() / 1000) + 86400 * 3)
  }
}`,...(i=(c=a.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var m,d,p;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    dueDate: BigInt(Math.floor(Date.now() / 1000) + 3600 * 6)
  }
}`,...(p=(d=t.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var D,l,g;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    dueDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
    showClaimButton: true,
    onClaimDefault: () => {}
  }
}`,...(g=(l=o.parameters)==null?void 0:l.docs)==null?void 0:g.source}}};const M=["FarOut","WithinWeek","WithinDay","Overdue"];export{e as FarOut,o as Overdue,t as WithinDay,a as WithinWeek,M as __namedExportsOrder,I as default};
