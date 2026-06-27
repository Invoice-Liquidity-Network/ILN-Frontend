import{T as u}from"./TransactionErrorToast-CEeLy6YM.js";import"./jsx-runtime-EKYJJIwR.js";const T={title:"Components/Transaction/TransactionErrorToast",component:u,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{message:{control:"text"},remediation:{control:"text"},technicalDetails:{control:"text"}}},e={args:{message:"The transaction could not be completed."}},a={args:{message:"Insufficient balance.",remediation:"Please add more funds to your wallet and try again."}},t={args:{message:"Transaction failed due to network congestion.",remediation:"Please wait a few minutes and try again.",technicalDetails:`Error: tx_too_late
Code: -32000
Details: The transaction deadline has passed.`}};var s,n,o;e.parameters={...e.parameters,docs:{...(s=e.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    message: 'The transaction could not be completed.'
  }
}`,...(o=(n=e.parameters)==null?void 0:n.docs)==null?void 0:o.source}}};var r,i,c;a.parameters={...a.parameters,docs:{...(r=a.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    message: 'Insufficient balance.',
    remediation: 'Please add more funds to your wallet and try again.'
  }
}`,...(c=(i=a.parameters)==null?void 0:i.docs)==null?void 0:c.source}}};var d,l,m;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    message: 'Transaction failed due to network congestion.',
    remediation: 'Please wait a few minutes and try again.',
    technicalDetails: 'Error: tx_too_late\\nCode: -32000\\nDetails: The transaction deadline has passed.'
  }
}`,...(m=(l=t.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};const f=["Basic","WithRemediation","Full"];export{e as Basic,t as Full,a as WithRemediation,f as __namedExportsOrder,T as default};
