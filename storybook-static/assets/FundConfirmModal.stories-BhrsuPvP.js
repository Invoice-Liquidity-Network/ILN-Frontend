import{F as c}from"./FundConfirmModal-lKyPo9rh.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./WalletContext-BWEqisDy.js";import"./navigation-Dlf1v1Jp.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";import"./soroban-BjTs-Z_E.js";import"./stellar-sdk.min-CAAo20gi.js";import"./constants-Blzo2VsG.js";import"./horizonClient-kL7zlhwC.js";import"./WalletSelectionModal-RtvXKZeD.js";import"./index-D2Apc_AJ.js";import"./useFocusTrap-CtyJAkei.js";import"./ToastContext-Cfc8Pa2K.js";import"./index-Cgb9ICXJ.js";import"./index-BVZtMyJn.js";import"./index-CNFeyz4D.js";import"./AppToaster-CQpUadPt.js";import"./useTransaction-EapfsLZi.js";import"./QueryClientProvider-vXDPHYUo.js";import"./txEvents-PiNVVoXJ.js";import"./TransactionErrorToast-CEeLy6YM.js";import"./TokenSelector-9qtDLVOv.js";import"./useBalances-CZSjlAZp.js";import"./formatTokenAmount-2i9m6gHE.js";import"./FieldTooltip-vGmOnsFM.js";import"./useApprovedTokens-BnBIyphf.js";import"./format-BWVjbcin.js";import"./governance-B0JV_ZCU.js";const H={title:"Components/FundConfirmModal",component:c,parameters:{layout:"centered"},tags:["autodocs"]},m={id:42n,amount:1000000000n,status:"Pending",payer:"GABC12345678901234567890123456789012345678901234567890123456",freelancer:"GDEF4567890123456789012345678901234567890123456789012345678",discount_rate:300,due_date:BigInt(Math.floor(Date.now()/1e3)+86400*30),token:"USDC"},o={args:{invoice:m,onClose:()=>{},onSuccess:()=>{},payerScore:{score:85,totalFunded:10,totalDefaulted:0,lastActivity:Date.now()}}},t={args:{invoice:m,onClose:()=>{},onSuccess:()=>{}}};var r,e,n;o.parameters={...o.parameters,docs:{...(r=o.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    invoice: mockInvoice,
    onClose: () => {},
    onSuccess: () => {},
    payerScore: {
      score: 85,
      totalFunded: 10,
      totalDefaulted: 0,
      lastActivity: Date.now()
    }
  }
}`,...(n=(e=o.parameters)==null?void 0:e.docs)==null?void 0:n.source}}};var a,i,s;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    invoice: mockInvoice,
    onClose: () => {},
    onSuccess: () => {}
  }
}`,...(s=(i=t.parameters)==null?void 0:i.docs)==null?void 0:s.source}}};const J=["Default","NoPayerScore"];export{o as Default,t as NoPayerScore,J as __namedExportsOrder,H as default};
