import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{R as s}from"./RiskBadge-4n0dhmBw.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const E={title:"Components/RiskBadge",component:s,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{risk:{control:{type:"select"},options:["low","medium","high","critical"]},showLabel:{control:{type:"boolean"}}}},r={args:{risk:"low",showLabel:!0}},a={args:{risk:"medium",showLabel:!0}},o={args:{risk:"high",showLabel:!0}},i={args:{risk:"critical",showLabel:!0}},t={args:{risk:"high",showLabel:!1}},c={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(s,{risk:"low",showLabel:!0}),e.jsx(s,{risk:"medium",showLabel:!0}),e.jsx(s,{risk:"high",showLabel:!0}),e.jsx(s,{risk:"critical",showLabel:!0})]})};var l,n,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    risk: 'low',
    showLabel: true
  }
}`,...(m=(n=r.parameters)==null?void 0:n.docs)==null?void 0:m.source}}};var u,d,p;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    risk: 'medium',
    showLabel: true
  }
}`,...(p=(d=a.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var h,g,w;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    risk: 'high',
    showLabel: true
  }
}`,...(w=(g=o.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var k,L,b;i.parameters={...i.parameters,docs:{...(k=i.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    risk: 'critical',
    showLabel: true
  }
}`,...(b=(L=i.parameters)==null?void 0:L.docs)==null?void 0:b.source}}};var x,R,f;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    risk: 'high',
    showLabel: false
  }
}`,...(f=(R=t.parameters)==null?void 0:R.docs)==null?void 0:f.source}}};var j,B,S;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      <RiskBadge risk="low" showLabel />
      <RiskBadge risk="medium" showLabel />
      <RiskBadge risk="high" showLabel />
      <RiskBadge risk="critical" showLabel />
    </div>
}`,...(S=(B=c.parameters)==null?void 0:B.docs)==null?void 0:S.source}}};const H=["Low","Medium","High","Critical","WithoutLabel","AllRiskLevels"];export{c as AllRiskLevels,i as Critical,o as High,r as Low,a as Medium,t as WithoutLabel,H as __namedExportsOrder,E as default};
