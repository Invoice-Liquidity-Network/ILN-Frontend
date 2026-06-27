import{S as l}from"./Spotlight-DZ1aOaHR.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const b={title:"Components/Onboarding/Spotlight",component:l,parameters:{layout:"fullscreen"},tags:["autodocs"],argTypes:{onNext:{action:"next"},onSkip:{action:"skip"}}},t={args:{title:"Welcome to ILN",content:"This is the invoice submission form. Enter the payer address, amount, and due date.",currentStep:0,totalSteps:3,onNext:()=>{},onSkip:()=>{}}},e={args:{title:"You're all set!",content:"You have completed the onboarding tour. Start using the platform.",currentStep:2,totalSteps:3,onNext:()=>{},onSkip:()=>{}}},o={args:{targetId:"submit-invoice-form",title:"Submit Invoice Form",content:"Fill in the details and submit your invoice.",currentStep:1,totalSteps:3,onNext:()=>{},onSkip:()=>{}}};var n,r,a;t.parameters={...t.parameters,docs:{...(n=t.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    title: 'Welcome to ILN',
    content: 'This is the invoice submission form. Enter the payer address, amount, and due date.',
    currentStep: 0,
    totalSteps: 3,
    onNext: () => {},
    onSkip: () => {}
  }
}`,...(a=(r=t.parameters)==null?void 0:r.docs)==null?void 0:a.source}}};var s,i,c;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    title: 'You\\'re all set!',
    content: 'You have completed the onboarding tour. Start using the platform.',
    currentStep: 2,
    totalSteps: 3,
    onNext: () => {},
    onSkip: () => {}
  }
}`,...(c=(i=e.parameters)==null?void 0:i.docs)==null?void 0:c.source}}};var p,m,u;o.parameters={...o.parameters,docs:{...(p=o.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    targetId: 'submit-invoice-form',
    title: 'Submit Invoice Form',
    content: 'Fill in the details and submit your invoice.',
    currentStep: 1,
    totalSteps: 3,
    onNext: () => {},
    onSkip: () => {}
  }
}`,...(u=(m=o.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};const f=["Default","LastStep","WithTarget"];export{t as Default,e as LastStep,o as WithTarget,f as __namedExportsOrder,b as default};
