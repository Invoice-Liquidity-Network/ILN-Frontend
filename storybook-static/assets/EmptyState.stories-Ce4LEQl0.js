import{E as B}from"./EmptyState-DHyNXfrf.js";import"./jsx-runtime-EKYJJIwR.js";import"./EmptyIllustrations-zEGUsf9s.js";const w={title:"Components/EmptyState",component:B,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["wallet-disconnected","no-invoices","no-funded-positions","empty-marketplace","no-governance-proposals"]}}},e={args:{variant:"wallet-disconnected"}},a={args:{variant:"no-invoices",action:{label:"Create Invoice",onClick:()=>{}}}},n={args:{variant:"no-funded-positions",action:{label:"Browse Marketplace",onClick:()=>{}}}},o={args:{variant:"empty-marketplace",action:{label:"Refresh",onClick:()=>{}}}},r={args:{variant:"no-governance-proposals"}},t={name:"With Action Button (generic)",args:{variant:"no-invoices",action:{label:"Get Started",onClick:()=>alert("Action clicked")}}};var s,c,i;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    variant: 'wallet-disconnected'
  }
}`,...(i=(c=e.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var l,p,d;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    variant: 'no-invoices',
    action: {
      label: 'Create Invoice',
      onClick: () => {}
    }
  }
}`,...(d=(p=a.parameters)==null?void 0:p.docs)==null?void 0:d.source}}};var m,u,v;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    variant: 'no-funded-positions',
    action: {
      label: 'Browse Marketplace',
      onClick: () => {}
    }
  }
}`,...(v=(u=n.parameters)==null?void 0:u.docs)==null?void 0:v.source}}};var g,k,C;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'empty-marketplace',
    action: {
      label: 'Refresh',
      onClick: () => {}
    }
  }
}`,...(C=(k=o.parameters)==null?void 0:k.docs)==null?void 0:C.source}}};var S,y,b;r.parameters={...r.parameters,docs:{...(S=r.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    variant: 'no-governance-proposals'
  }
}`,...(b=(y=r.parameters)==null?void 0:y.docs)==null?void 0:b.source}}};var f,h,A;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  name: 'With Action Button (generic)',
  args: {
    variant: 'no-invoices',
    action: {
      label: 'Get Started',
      onClick: () => alert('Action clicked')
    }
  }
}`,...(A=(h=t.parameters)==null?void 0:h.docs)==null?void 0:A.source}}};const G=["WalletDisconnected","NoInvoices","NoFundedPositions","EmptyMarketplace","NoGovernanceProposals","WithActionButton"];export{o as EmptyMarketplace,n as NoFundedPositions,r as NoGovernanceProposals,a as NoInvoices,e as WalletDisconnected,t as WithActionButton,G as __namedExportsOrder,w as default};
