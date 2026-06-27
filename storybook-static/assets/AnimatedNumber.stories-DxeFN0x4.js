import{A as d}from"./AnimatedNumber-nN72pkAC.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const A={title:"Components/AnimatedNumber",component:d,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{value:{control:"number"},duration:{control:"number"},reanimateOnChange:{control:"boolean"}}},r={args:{value:1e6}},e={args:{value:1e6,formatter:l=>`$${l.toLocaleString()}`}},a={args:{value:5e3,duration:500}};var t,o,n;r.parameters={...r.parameters,docs:{...(t=r.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    value: 1000000
  }
}`,...(n=(o=r.parameters)==null?void 0:o.docs)==null?void 0:n.source}}};var s,m,c;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    value: 1000000,
    formatter: v => \`$\${v.toLocaleString()}\`
  }
}`,...(c=(m=e.parameters)==null?void 0:m.docs)==null?void 0:c.source}}};var u,i,p;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    value: 5000,
    duration: 500
  }
}`,...(p=(i=a.parameters)==null?void 0:i.docs)==null?void 0:p.source}}};const S=["Default","WithFormatter","FastAnimation"];export{r as Default,a as FastAnimation,e as WithFormatter,S as __namedExportsOrder,A as default};
