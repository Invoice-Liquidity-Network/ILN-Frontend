import{j as e}from"./jsx-runtime-EKYJJIwR.js";function T({toast:S,onClose:_}){const{type:o,title:E,message:c,txHash:l,action:i}=S,W=o==="pending",d=o==="success",m=o==="error";return e.jsxs("div",{className:`min-w-[300px] p-4 rounded-lg shadow-lg border flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${d?"bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32] dark:bg-[#1b5e20]/20 dark:border-[#2e7d32]/30 dark:text-[#81c784]":m?"bg-[#ffebee] border-[#ffcdd2] text-[#c62828] dark:bg-[#b71c1c]/20 dark:border-[#c62828]/30 dark:text-[#e57373]":"bg-surface-container-highest border-outline-variant/30 text-on-surface"}`,children:[e.jsxs("div",{className:"mt-0.5 min-w-[24px]",children:[W&&e.jsx("span",{className:"material-symbols-outlined animate-spin text-primary",children:"sync"}),d&&e.jsx("span",{className:"material-symbols-outlined text-[#2e7d32] dark:text-[#81c784]",children:"check_circle"}),m&&e.jsx("span",{className:"material-symbols-outlined text-[#c62828] dark:text-[#e57373]",children:"error"})]}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h4",{className:"font-bold text-sm tracking-wide",children:E}),c&&e.jsx("p",{className:"text-xs mt-1 opacity-90",children:c}),l&&e.jsx("a",{href:`https://stellar.expert/explorer/testnet/tx/${l}`,target:"_blank",rel:"noopener noreferrer",className:"text-[10px] underline mt-2 block opacity-80 hover:opacity-100 uppercase tracking-widest",children:e.jsxs("span",{className:"flex items-center gap-1",children:["View on Stellar Expert",e.jsx("span",{className:"material-symbols-outlined text-[10px]",children:"open_in_new"})]})}),i&&e.jsx("button",{onClick:i.onClick,className:"mt-3 rounded-full border border-outline-variant/50 bg-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface transition-colors hover:bg-surface-variant",children:i.label})]}),e.jsx("button",{onClick:_,className:"opacity-50 hover:opacity-100 transition-opacity ml-2","aria-label":"Close toast",children:e.jsx("span",{className:"material-symbols-outlined text-sm",children:"close"})})]})}T.__docgenInfo={description:"",methods:[],displayName:"Toast",props:{toast:{required:!0,tsType:{name:"ToastMessage"},description:""},onClose:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const P={title:"Components/Toast",component:T,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{onClose:{action:"closed"}}},s={args:{toast:{type:"success",title:"Transaction confirmed",message:"Your invoice has been submitted successfully."},onClose:()=>{}}},t={args:{toast:{type:"pending",title:"Processing",message:"Waiting for wallet signature..."},onClose:()=>{}}},a={args:{toast:{type:"error",title:"Transaction failed",message:"Insufficient balance for this transaction."},onClose:()=>{}}},n={args:{toast:{type:"success",title:"Invoice submitted",message:"Invoice is now live on testnet.",txHash:"a1b2c3d4e5f6..."},onClose:()=>{}}},r={args:{toast:{type:"success",title:"Invoice submitted",message:"Invoice is now live.",action:{label:"View Invoice",onClick:()=>{}}},onClose:()=>{}}};var p,u,g;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    toast: {
      type: 'success',
      title: 'Transaction confirmed',
      message: 'Your invoice has been submitted successfully.'
    },
    onClose: () => {}
  }
}`,...(g=(u=s.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var x,b,f;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    toast: {
      type: 'pending',
      title: 'Processing',
      message: 'Waiting for wallet signature...'
    },
    onClose: () => {}
  }
}`,...(f=(b=t.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var h,y,v;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    toast: {
      type: 'error',
      title: 'Transaction failed',
      message: 'Insufficient balance for this transaction.'
    },
    onClose: () => {}
  }
}`,...(v=(y=a.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var k,C,j;n.parameters={...n.parameters,docs:{...(k=n.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    toast: {
      type: 'success',
      title: 'Invoice submitted',
      message: 'Invoice is now live on testnet.',
      txHash: 'a1b2c3d4e5f6...'
    },
    onClose: () => {}
  }
}`,...(j=(C=n.parameters)==null?void 0:C.docs)==null?void 0:j.source}}};var w,N,I;r.parameters={...r.parameters,docs:{...(w=r.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    toast: {
      type: 'success',
      title: 'Invoice submitted',
      message: 'Invoice is now live.',
      action: {
        label: 'View Invoice',
        onClick: () => {}
      }
    },
    onClose: () => {}
  }
}`,...(I=(N=r.parameters)==null?void 0:N.docs)==null?void 0:I.source}}};const V=["Success","Pending","Error","WithTxHash","WithAction"];export{a as Error,t as Pending,s as Success,r as WithAction,n as WithTxHash,V as __namedExportsOrder,P as default};
