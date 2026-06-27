import{I as b}from"./Input-BwmsOhtV.js";import"./jsx-runtime-EKYJJIwR.js";const S={title:"Components/Input",component:b,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number"]},disabled:{control:"boolean"},placeholder:{control:"text"}}},e={args:{placeholder:"Enter value..."}},a={args:{value:"Sample input value",onChange:()=>{}}},r={args:{value:"Disabled input",disabled:!0}},s={args:{value:"Invalid value",className:"border-red-500"}};var o,t,n;e.parameters={...e.parameters,docs:{...(o=e.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter value...'
  }
}`,...(n=(t=e.parameters)==null?void 0:t.docs)==null?void 0:n.source}}};var l,c,u;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    value: 'Sample input value',
    onChange: () => {}
  }
}`,...(u=(c=a.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var p,d,i;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    value: 'Disabled input',
    disabled: true
  }
}`,...(i=(d=r.parameters)==null?void 0:d.docs)==null?void 0:i.source}}};var m,g,v;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    value: 'Invalid value',
    className: 'border-red-500'
  }
}`,...(v=(g=s.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};const E=["Default","WithValue","Disabled","WithError"];export{e as Default,r as Disabled,s as WithError,a as WithValue,E as __namedExportsOrder,S as default};
