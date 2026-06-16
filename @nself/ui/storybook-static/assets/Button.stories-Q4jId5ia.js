import{j as d}from"./jsx-runtime-BjG_zV1W.js";import{R as G}from"./index-NGyRR_en.js";import"./_commonjsHelpers-Cpj98o6Y.js";const L={primary:{background:"#2563eb",color:"#ffffff",border:"1px solid transparent"},secondary:{background:"#f1f5f9",color:"#0f172a",border:"1px solid #e2e8f0"},ghost:{background:"transparent",color:"#374151",border:"1px solid transparent"},destructive:{background:"#dc2626",color:"#ffffff",border:"1px solid transparent"}},N={sm:{padding:"0.25rem 0.75rem",fontSize:"0.875rem",borderRadius:"0.375rem"},md:{padding:"0.5rem 1.25rem",fontSize:"1rem",borderRadius:"0.5rem"},lg:{padding:"0.75rem 1.75rem",fontSize:"1.125rem",borderRadius:"0.5rem"}};function A(){return d.jsx("span",{"aria-hidden":"true",style:{display:"inline-block",width:"1em",height:"1em",border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",marginInlineEnd:"0.4em",verticalAlign:"text-bottom"}})}const j=G.forwardRef(function({variant:k="primary",size:q="md",loading:i=!1,disabled:E=!1,type:V="button",style:_,children:I,...P},z){const e=E||i;return d.jsxs("button",{ref:z,type:V,disabled:e,"aria-busy":i||void 0,"aria-disabled":e||void 0,style:{display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:500,cursor:e?"not-allowed":"pointer",opacity:e?.6:1,transition:"opacity 0.15s ease, background 0.15s ease",userSelect:"none",...L[k],...N[q],..._},...P,children:[i&&d.jsx(A,{}),I]})});j.__docgenInfo={description:"",methods:[],displayName:"Button",props:{variant:{required:!1,tsType:{name:"union",raw:"'primary' | 'secondary' | 'ghost' | 'destructive'",elements:[{name:"literal",value:"'primary'"},{name:"literal",value:"'secondary'"},{name:"literal",value:"'ghost'"},{name:"literal",value:"'destructive'"}]},description:"",defaultValue:{value:"'primary'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'sm' | 'md' | 'lg'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"}]},description:"",defaultValue:{value:"'md'",computed:!1}},loading:{required:!1,tsType:{name:"boolean"},description:"When true: shows spinner, prevents interaction, sets aria-busy.",defaultValue:{value:"false",computed:!1}},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},disabled:{defaultValue:{value:"false",computed:!1},required:!1},type:{defaultValue:{value:"'button'",computed:!1},required:!1}}};const Z={title:"Primitives/Button",component:j,tags:["autodocs"],parameters:{layout:"centered"}},r={args:{variant:"primary",children:"Primary Button"}},a={args:{variant:"secondary",children:"Secondary Button"}},t={args:{variant:"ghost",children:"Ghost Button"}},n={args:{variant:"destructive",children:"Delete"}},s={args:{variant:"primary",loading:!0,children:"Saving…"}},o={args:{variant:"primary",disabled:!0,children:"Disabled"}};var l,c,u;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}`,...(u=(c=r.parameters)==null?void 0:c.docs)==null?void 0:u.source}}};var m,p,f;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}`,...(f=(p=a.parameters)==null?void 0:p.docs)==null?void 0:f.source}}};var g,y,v;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
}`,...(v=(y=t.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var b,h,S;n.parameters={...n.parameters,docs:{...(b=n.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Delete'
  }
}`,...(S=(h=n.parameters)==null?void 0:h.docs)==null?void 0:S.source}}};var x,R,B;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    loading: true,
    children: 'Saving…'
  }
}`,...(B=(R=s.parameters)==null?void 0:R.docs)==null?void 0:B.source}}};var D,T,w;o.parameters={...o.parameters,docs:{...(D=o.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled'
  }
}`,...(w=(T=o.parameters)==null?void 0:T.docs)==null?void 0:w.source}}};const F=["Primary","Secondary","Ghost","Destructive","Loading","Disabled"];export{n as Destructive,o as Disabled,t as Ghost,s as Loading,r as Primary,a as Secondary,F as __namedExportsOrder,Z as default};
