import{j as o}from"./jsx-runtime-EKYJJIwR.js";import{I as S}from"./InvoiceTable-DmoA2816.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./navigation-Dlf1v1Jp.js";import"./get-segment-param-uZ6tT2eb.js";import"./_interop_require_default-Dl4696rw.js";import"./ColumnCustomiser-RhuVmEXJ.js";const M={title:"Components/InvoiceTable",component:S,parameters:{layout:"centered"},tags:["autodocs"]},r=[{id:"id",label:"ID",isMandatory:!0,renderCell:e=>o.jsxs("span",{className:"font-mono",children:["#",e.id]})},{id:"amount",label:"Amount",renderCell:e=>o.jsx("span",{children:e.amount})},{id:"status",label:"Status",renderCell:e=>o.jsx("span",{children:e.status})}],I=[{id:"1",amount:"$1,000",status:"Paid"},{id:"2",amount:"$2,500",status:"Pending"},{id:"3",amount:"$500",status:"Funded"}],t={args:{tableId:"test-table",data:I,columns:r,keyExtractor:e=>e.id}},a={args:{tableId:"test-table-select",data:I,columns:r,keyExtractor:e=>e.id,selectedKeys:new Set(["1"]),onSelectionChange:()=>{}}},s={args:{tableId:"test-table-loading",data:[],columns:r,keyExtractor:e=>e.id,isLoading:!0}},n={args:{tableId:"test-table-empty",data:[],columns:r,keyExtractor:e=>e.id,emptyMessage:"No invoices found."}};var d,i,c;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    tableId: 'test-table',
    data,
    columns,
    keyExtractor: (item: any) => item.id
  }
}`,...(c=(i=t.parameters)==null?void 0:i.docs)==null?void 0:c.source}}};var m,l,u;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    tableId: 'test-table-select',
    data,
    columns,
    keyExtractor: (item: any) => item.id,
    selectedKeys: new Set(['1']),
    onSelectionChange: () => {}
  }
}`,...(u=(l=a.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var p,g,y;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    tableId: 'test-table-loading',
    data: [],
    columns,
    keyExtractor: (item: any) => item.id,
    isLoading: true
  }
}`,...(y=(g=s.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var b,x,E;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    tableId: 'test-table-empty',
    data: [],
    columns,
    keyExtractor: (item: any) => item.id,
    emptyMessage: 'No invoices found.'
  }
}`,...(E=(x=n.parameters)==null?void 0:x.docs)==null?void 0:E.source}}};const N=["Default","WithSelection","Loading","Empty"];export{t as Default,n as Empty,s as Loading,a as WithSelection,N as __namedExportsOrder,M as default};
