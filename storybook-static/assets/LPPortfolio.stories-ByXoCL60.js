import{L as d}from"./LPPortfolio-BEX7qqwR.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./format-BWVjbcin.js";import"./formatTokenAmount-2i9m6gHE.js";import"./InvoiceTable-DmoA2816.js";import"./navigation-Dlf1v1Jp.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";import"./ColumnCustomiser-RhuVmEXJ.js";import"./LPTokenMetricsCards-gNNNLfLD.js";import"./per-token-yield-BX_ZsJbQ.js";import"./LPPortfolioAllocationChart-B5dm4QZE.js";import"./generateCategoricalChart-Db8sjFvg.js";import"./PieChart-Bj-NzKRS.js";import"./WeeklyYieldChart-C9ju3Spi.js";import"./BarChart-CLzWD2zk.js";import"./YAxis-DdR1PIu1.js";import"./CartesianGrid-DFVOy2RZ.js";const F={title:"Components/LPPortfolio",component:d,parameters:{layout:"centered"},tags:["autodocs"]},u=[{id:1n,amount:1000000000n,status:"Paid",payer:"GABC12345678901234567890123456789012345678901234567890123456",freelancer:"GDEF4567890123456789012345678901234567890123456789012345678",funder:"GXXX12345678901234567890123456789012345678901234567890123456",discount_rate:300,due_date:BigInt(Math.floor(Date.now()/1e3)+86400*30),token:"USDC"}],o={args:{invoices:u,isLoading:!1,onClaimDefault:async()=>{},claimingInvoiceId:null}},n={args:{invoices:[],isLoading:!0,onClaimDefault:async()=>{},claimingInvoiceId:null}},a={args:{invoices:[],isLoading:!1,onClaimDefault:async()=>{},claimingInvoiceId:null}};var e,i,r;o.parameters={...o.parameters,docs:{...(e=o.parameters)==null?void 0:e.docs,source:{originalSource:`{
  args: {
    invoices: mockInvoices,
    isLoading: false,
    onClaimDefault: async () => {},
    claimingInvoiceId: null
  }
}`,...(r=(i=o.parameters)==null?void 0:i.docs)==null?void 0:r.source}}};var t,s,c;n.parameters={...n.parameters,docs:{...(t=n.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    invoices: [],
    isLoading: true,
    onClaimDefault: async () => {},
    claimingInvoiceId: null
  }
}`,...(c=(s=n.parameters)==null?void 0:s.docs)==null?void 0:c.source}}};var m,l,p;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    invoices: [],
    isLoading: false,
    onClaimDefault: async () => {},
    claimingInvoiceId: null
  }
}`,...(p=(l=a.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};const M=["Default","Loading","Empty"];export{o as Default,a as Empty,n as Loading,M as __namedExportsOrder,F as default};
