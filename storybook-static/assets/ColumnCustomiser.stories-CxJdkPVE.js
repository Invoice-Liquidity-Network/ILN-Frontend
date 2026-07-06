import{C as m}from"./ColumnCustomiser-RhuVmEXJ.js";import"./jsx-runtime-EKYJJIwR.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";const b={title:"Components/ColumnCustomiser",component:m,parameters:{layout:"centered"},tags:["autodocs"]},u=[{id:"id",label:"ID",isMandatory:!0},{id:"payer",label:"Payer"},{id:"amount",label:"Amount"},{id:"status",label:"Status"},{id:"dueDate",label:"Due Date"}],o={args:{allColumns:u,visibleColumns:["id","payer","amount","status","dueDate"],columnOrder:["id","payer","amount","status","dueDate"],onVisibilityChange:(e,n)=>console.log(e,n),onOrderChange:e=>console.log(e),onReset:()=>{}}},a={args:{allColumns:u,visibleColumns:["id","payer","amount"],columnOrder:["id","payer","amount","status","dueDate"],onVisibilityChange:(e,n)=>console.log(e,n),onOrderChange:e=>console.log(e),onReset:()=>{}}};var s,r,t;o.parameters={...o.parameters,docs:{...(s=o.parameters)==null?void 0:s.docs,source:{originalSource:`{
  args: {
    allColumns,
    visibleColumns: ['id', 'payer', 'amount', 'status', 'dueDate'],
    columnOrder: ['id', 'payer', 'amount', 'status', 'dueDate'],
    onVisibilityChange: (id, visible) => console.log(id, visible),
    onOrderChange: order => console.log(order),
    onReset: () => {}
  }
}`,...(t=(r=o.parameters)==null?void 0:r.docs)==null?void 0:t.source}}};var i,l,d;a.parameters={...a.parameters,docs:{...(i=a.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    allColumns,
    visibleColumns: ['id', 'payer', 'amount'],
    columnOrder: ['id', 'payer', 'amount', 'status', 'dueDate'],
    onVisibilityChange: (id, visible) => console.log(id, visible),
    onOrderChange: order => console.log(order),
    onReset: () => {}
  }
}`,...(d=(l=a.parameters)==null?void 0:l.docs)==null?void 0:d.source}}};const y=["Default","SomeHidden"];export{o as Default,a as SomeHidden,y as __namedExportsOrder,b as default};
