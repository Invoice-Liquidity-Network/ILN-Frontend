import{I as c}from"./InvoiceFilterBar-DQfiNZta.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./navigation-Dlf1v1Jp.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";import"./formatTokenAmount-2i9m6gHE.js";const v={title:"Components/InvoiceFilterBar",component:c,parameters:{layout:"centered"},tags:["autodocs"]},l={search:"",statuses:[],minAmount:"",maxAmount:"",startDate:"",endDate:"",token:"",minDiscountBps:"",maxDiscountBps:"",minPayerReputation:""},e={args:{filters:l,onFiltersChange:()=>{},onClearFilters:()=>{},activeFilterCount:0}},t={args:{filters:{...l,statuses:["Pending"],token:"USDC"},onFiltersChange:()=>{},onClearFilters:()=>{},activeFilterCount:2}};var r,s,n;e.parameters={...e.parameters,docs:{...(r=e.parameters)==null?void 0:r.docs,source:{originalSource:`{
  args: {
    filters: defaultFilters,
    onFiltersChange: () => {},
    onClearFilters: () => {},
    activeFilterCount: 0
  }
}`,...(n=(s=e.parameters)==null?void 0:s.docs)==null?void 0:n.source}}};var a,o,i;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:`{
  args: {
    filters: {
      ...defaultFilters,
      statuses: ['Pending'],
      token: 'USDC'
    },
    onFiltersChange: () => {},
    onClearFilters: () => {},
    activeFilterCount: 2
  }
}`,...(i=(o=t.parameters)==null?void 0:o.docs)==null?void 0:i.source}}};const D=["Default","WithActiveFilters"];export{e as Default,t as WithActiveFilters,D as __namedExportsOrder,v as default};
