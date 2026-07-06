import{T as D}from"./TokenSelector-9qtDLVOv.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./useBalances-CZSjlAZp.js";import"./WalletContext-BWEqisDy.js";import"./navigation-Dlf1v1Jp.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";import"./soroban-BjTs-Z_E.js";import"./stellar-sdk.min-CAAo20gi.js";import"./constants-Blzo2VsG.js";import"./horizonClient-kL7zlhwC.js";import"./WalletSelectionModal-RtvXKZeD.js";import"./index-D2Apc_AJ.js";import"./useFocusTrap-CtyJAkei.js";import"./ToastContext-Cfc8Pa2K.js";import"./index-Cgb9ICXJ.js";import"./index-BVZtMyJn.js";import"./index-CNFeyz4D.js";import"./AppToaster-CQpUadPt.js";import"./txEvents-PiNVVoXJ.js";import"./formatTokenAmount-2i9m6gHE.js";import"./FieldTooltip-vGmOnsFM.js";const K={title:"Components/TokenSelector",component:D,parameters:{layout:"centered"},tags:["autodocs"]},o=[{symbol:"USDC",address:"CUSDC123",decimals:6},{symbol:"EURC",address:"CEURC456",decimals:6},{symbol:"XLM",address:"native",decimals:7}],n={args:{tokens:o,selectedToken:o[0],onTokenChange:e=>console.log("Selected token:",e)}},t={args:{tokens:o,selectedToken:o[0],amount:"1000",onTokenChange:e=>console.log("Selected token:",e),onAmountChange:e=>console.log("Amount:",e)}},r={args:{tokens:o,selectedToken:o[0],disabled:!0}},s={args:{tokens:o,selectedToken:o[0],amount:"invalid",error:"Please enter a valid amount",onTokenChange:e=>console.log("Selected token:",e),onAmountChange:e=>console.log("Amount:",e)}},a={args:{tokens:[],loading:!0}};var m,c,l;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    tokens: mockTokens,
    selectedToken: mockTokens[0],
    onTokenChange: token => console.log('Selected token:', token)
  }
}`,...(l=(c=n.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var d,i,k;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    tokens: mockTokens,
    selectedToken: mockTokens[0],
    amount: '1000',
    onTokenChange: token => console.log('Selected token:', token),
    onAmountChange: amount => console.log('Amount:', amount)
  }
}`,...(k=(i=t.parameters)==null?void 0:i.docs)==null?void 0:k.source}}};var p,u,g;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    tokens: mockTokens,
    selectedToken: mockTokens[0],
    disabled: true
  }
}`,...(g=(u=r.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var T,C,S;s.parameters={...s.parameters,docs:{...(T=s.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    tokens: mockTokens,
    selectedToken: mockTokens[0],
    amount: 'invalid',
    error: 'Please enter a valid amount',
    onTokenChange: token => console.log('Selected token:', token),
    onAmountChange: amount => console.log('Amount:', amount)
  }
}`,...(S=(C=s.parameters)==null?void 0:C.docs)==null?void 0:S.source}}};var h,A,b;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    tokens: [],
    loading: true
  }
}`,...(b=(A=a.parameters)==null?void 0:A.docs)==null?void 0:b.source}}};const N=["Default","WithAmount","Disabled","WithError","Loading"];export{n as Default,r as Disabled,a as Loading,t as WithAmount,s as WithError,N as __namedExportsOrder,K as default};
