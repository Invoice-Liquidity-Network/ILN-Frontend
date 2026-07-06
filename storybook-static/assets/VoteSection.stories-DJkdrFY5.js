import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{Q as I}from"./QuorumProgressBar-CVuXqcSp.js";import{V as R}from"./VoteProgressBar-CtuEkFFt.js";import"./iframe-Dx6cFdWX.js";import"./preload-helper-Dp1pzeXC.js";import"./governance-B0JV_ZCU.js";const B={For:{base:"border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10",active:"bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20",icon:"thumb_up"},Against:{base:"border-red-500/40 text-red-500 hover:bg-red-500/10",active:"bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20",icon:"thumb_down"},Abstain:{base:"border-outline text-on-surface-variant hover:bg-surface-container-high",active:"bg-outline text-white border-outline shadow-lg",icon:"do_not_disturb"}};function Q({choice:t,selected:o,disabled:n,loading:m,onClick:p}){const r=B[t];return e.jsxs("button",{type:"button",onClick:p,disabled:n,className:`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 active:scale-95
        ${o?r.active:r.base}
        ${n&&!o?"opacity-40 cursor-not-allowed":""}
      `,children:[e.jsx("span",{className:"material-symbols-outlined text-[20px]",style:o?{fontVariationSettings:"'FILL' 1"}:void 0,children:r.icon}),m&&!o?"Voting…":t]})}function S({proposal:t,isConnected:o,alreadyVoted:n,userVote:m,onVote:p,voteLoading:r,canVote:T,connect:k,votingPower:F}){const g=t.votesFor+t.votesAgainst+t.votesAbstain,E=g>=t.quorumRequired,_=!T||r;return e.jsxs("div",{className:"rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 mb-3",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Vote"}),e.jsx("p",{className:"text-xs text-on-surface-variant",children:"Cast your vote or review current results."})]}),e.jsx("span",{className:`text-xs font-semibold uppercase tracking-[0.22em] ${t.status==="Active"?"text-emerald-500":"text-on-surface-variant"}`,children:t.status})]}),e.jsx("div",{className:"mb-5",children:e.jsxs("p",{className:"text-sm font-semibold text-on-surface-variant",children:[g.toLocaleString()," ILN total · ",E?"Quorum reached":"Quorum not yet reached"]})}),e.jsx(I,{votesCast:g,quorumRequired:t.quorumRequired,className:"mb-5"}),e.jsx(R,{votesFor:t.votesFor,votesAgainst:t.votesAgainst,votesAbstain:t.votesAbstain,quorumRequired:t.quorumRequired})]}),e.jsx("div",{className:"rounded-2xl border border-outline-variant/20 bg-surface-container p-5 space-y-4",children:o?F===0?e.jsx("p",{className:"text-sm text-on-surface-variant",children:"You need ILN tokens to vote."}):t.status!=="Active"?e.jsx("p",{className:"text-sm text-on-surface-variant",children:"Voting has ended for this proposal."}):e.jsxs("div",{className:"space-y-4",children:[e.jsx("p",{className:"text-sm text-on-surface-variant",children:n?"Your vote has been recorded.":"Select a stance below to vote."}),e.jsx("div",{className:"grid grid-cols-3 gap-2",children:["For","Against","Abstain"].map(a=>e.jsx(Q,{choice:a,selected:n&&m===a,disabled:n||_,loading:r,onClick:()=>p(a)},a))})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-sm text-on-surface-variant",children:"Connect your wallet to cast a vote."}),e.jsx("button",{type:"button",onClick:k,className:"w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors",children:"Connect wallet to vote"})]})})]})}S.__docgenInfo={description:"",methods:[],displayName:"VoteSection",props:{proposal:{required:!0,tsType:{name:"Proposal"},description:""},isConnected:{required:!0,tsType:{name:"boolean"},description:""},alreadyVoted:{required:!0,tsType:{name:"boolean"},description:""},userVote:{required:!1,tsType:{name:"VoteChoice"},description:""},onVote:{required:!0,tsType:{name:"signature",type:"function",raw:"(choice: VoteChoice) => void",signature:{arguments:[{type:{name:"VoteChoice"},name:"choice"}],return:{name:"void"}}},description:""},voteLoading:{required:!0,tsType:{name:"boolean"},description:""},canVote:{required:!0,tsType:{name:"boolean"},description:""},connect:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},votingPower:{required:!0,tsType:{name:"number"},description:""}}};const s={id:"1",title:"Increase ILN Supply Cap",description:"Proposal to increase the maximum supply cap of ILN tokens by 10%.",status:"Active",votesFor:15e5,votesAgainst:5e5,votesAbstain:1e5,quorumRequired:3e6,endTime:BigInt(Math.floor(Date.now()/1e3)+86400*7),proposer:"GABCDEF123..."},z={title:"Components/VoteSection",component:S,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{onVote:{action:"voted"},connect:{action:"connect"}}},i={args:{proposal:s,isConnected:!0,alreadyVoted:!1,onVote:()=>{},voteLoading:!1,canVote:!0,connect:()=>{},votingPower:5e4}},c={args:{proposal:s,isConnected:!0,alreadyVoted:!0,userVote:"For",onVote:()=>{},voteLoading:!1,canVote:!1,connect:()=>{},votingPower:5e4}},d={args:{proposal:s,isConnected:!1,alreadyVoted:!1,onVote:()=>{},voteLoading:!1,canVote:!1,connect:()=>{},votingPower:0}},l={args:{proposal:s,isConnected:!0,alreadyVoted:!1,onVote:()=>{},voteLoading:!1,canVote:!1,connect:()=>{},votingPower:0}},u={args:{proposal:{...s,status:"Executed"},isConnected:!0,alreadyVoted:!0,userVote:"Against",onVote:()=>{},voteLoading:!1,canVote:!1,connect:()=>{},votingPower:5e4}};var v,x,f;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    proposal: mockProposal,
    isConnected: true,
    alreadyVoted: false,
    onVote: () => {},
    voteLoading: false,
    canVote: true,
    connect: () => {},
    votingPower: 50000
  }
}`,...(f=(x=i.parameters)==null?void 0:x.docs)==null?void 0:f.source}}};var V,b,h;c.parameters={...c.parameters,docs:{...(V=c.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    proposal: mockProposal,
    isConnected: true,
    alreadyVoted: true,
    userVote: 'For' as VoteChoice,
    onVote: () => {},
    voteLoading: false,
    canVote: false,
    connect: () => {},
    votingPower: 50000
  }
}`,...(h=(b=c.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var y,w,C;d.parameters={...d.parameters,docs:{...(y=d.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    proposal: mockProposal,
    isConnected: false,
    alreadyVoted: false,
    onVote: () => {},
    voteLoading: false,
    canVote: false,
    connect: () => {},
    votingPower: 0
  }
}`,...(C=(w=d.parameters)==null?void 0:w.docs)==null?void 0:C.source}}};var N,j,P;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    proposal: mockProposal,
    isConnected: true,
    alreadyVoted: false,
    onVote: () => {},
    voteLoading: false,
    canVote: false,
    connect: () => {},
    votingPower: 0
  }
}`,...(P=(j=l.parameters)==null?void 0:j.docs)==null?void 0:P.source}}};var q,A,L;u.parameters={...u.parameters,docs:{...(q=u.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    proposal: {
      ...mockProposal,
      status: 'Executed'
    },
    isConnected: true,
    alreadyVoted: true,
    userVote: 'Against' as VoteChoice,
    onVote: () => {},
    voteLoading: false,
    canVote: false,
    connect: () => {},
    votingPower: 50000
  }
}`,...(L=(A=u.parameters)==null?void 0:A.docs)==null?void 0:L.source}}};const H=["ConnectedCanVote","AlreadyVoted","NotConnected","NoVotingPower","Ended"];export{c as AlreadyVoted,i as ConnectedCanVote,u as Ended,l as NoVotingPower,d as NotConnected,H as __namedExportsOrder,z as default};
