import{A as d}from"./AuctionRateTicker-CSMikBUC.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const g={title:"Components/AuctionRateTicker",component:d,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{startRate:{control:"number"},minRate:{control:"number"},auctionStartTime:{control:"number"},auctionDurationSeconds:{control:"number"}}},t={args:{startRate:500,minRate:100,auctionStartTime:Math.floor(Date.now()/1e3)-3600,auctionDurationSeconds:86400}},a={args:{startRate:500,minRate:100,auctionStartTime:Math.floor(Date.now()/1e3)-86400*2,auctionDurationSeconds:86400}},e={args:{startRate:300,minRate:300,auctionStartTime:Math.floor(Date.now()/1e3),auctionDurationSeconds:86400}};var o,r,n;t.parameters={...t.parameters,docs:{...(o=t.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    startRate: 500,
    minRate: 100,
    auctionStartTime: Math.floor(Date.now() / 1000) - 3600,
    auctionDurationSeconds: 86400
  }
}`,...(n=(r=t.parameters)==null?void 0:r.docs)==null?void 0:n.source}}};var s,c,i;a.parameters={...a.parameters,docs:{...(s=a.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    startRate: 500,
    minRate: 100,
    auctionStartTime: Math.floor(Date.now() / 1000) - 86400 * 2,
    auctionDurationSeconds: 86400
  }
}`,...(i=(c=a.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var m,u,p;e.parameters={...e.parameters,docs:{...(m=e.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    startRate: 300,
    minRate: 300,
    auctionStartTime: Math.floor(Date.now() / 1000),
    auctionDurationSeconds: 86400
  }
}`,...(p=(u=e.parameters)==null?void 0:u.docs)==null?void 0:p.source}}};const T=["Active","Expired","FlatRate"];export{t as Active,a as Expired,e as FlatRate,T as __namedExportsOrder,g as default};
