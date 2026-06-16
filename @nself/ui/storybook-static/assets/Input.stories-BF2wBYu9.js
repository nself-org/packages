import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{R as W}from"./index-NGyRR_en.js";import"./_commonjsHelpers-Cpj98o6Y.js";const l=W.forwardRef(function({label:n,error:r,hint:d,id:D,name:c,type:R="text",style:q,...z},E){const t=D??c??n.toLowerCase().replace(/\s+/g,"-"),p=r!==void 0?`${t}-error`:void 0,u=d!==void 0?`${t}-hint`:void 0,T=[p,u].filter(Boolean).join(" ")||void 0;return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.25rem"},children:[e.jsx("label",{htmlFor:t,style:{fontSize:"0.875rem",fontWeight:500,color:"#374151"},children:n}),e.jsx("input",{ref:E,id:t,name:c,type:R,"aria-invalid":r!==void 0||void 0,"aria-describedby":T,style:{padding:"0.5rem 0.75rem",fontSize:"1rem",border:`1px solid ${r!==void 0?"#dc2626":"#d1d5db"}`,borderRadius:"0.375rem",outline:"none",background:"#ffffff",color:"#111827",width:"100%",boxSizing:"border-box",...q},...z}),r!==void 0&&e.jsx("span",{id:p,role:"alert",style:{fontSize:"0.8125rem",color:"#dc2626"},children:r}),d!==void 0&&e.jsx("span",{id:u,style:{fontSize:"0.8125rem",color:"#6b7280"},children:d})]})});l.__docgenInfo={description:"",methods:[],displayName:"Input",props:{label:{required:!0,tsType:{name:"string"},description:"Visible label text. Required."},error:{required:!1,tsType:{name:"string"},description:"Validation error message. Sets aria-invalid when present."},hint:{required:!1,tsType:{name:"string"},description:"Helper text shown below the input."},type:{defaultValue:{value:"'text'",computed:!1},required:!1}}};const V={title:"Primitives/Input",component:l,tags:["autodocs"],parameters:{layout:"centered"}},a={args:{placeholder:"Enter a value"}},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",width:"20rem"},children:[e.jsx("label",{htmlFor:"demo-input",style:{fontSize:"0.875rem",fontWeight:500},children:"Task title"}),e.jsx(l,{id:"demo-input",placeholder:"Review pull request…"})]})},o={args:{placeholder:"Disabled input",disabled:!0}},s={args:{placeholder:"Invalid value","aria-invalid":!0}};var m,f,h;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter a value'
  }
}`,...(h=(f=a.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var v,b,g;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '20rem'
  }}>
      <label htmlFor="demo-input" style={{
      fontSize: '0.875rem',
      fontWeight: 500
    }}>
        Task title
      </label>
      <Input id="demo-input" placeholder="Review pull request…" />
    </div>
}`,...(g=(b=i.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var x,y,S;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    placeholder: 'Disabled input',
    disabled: true
  }
}`,...(S=(y=o.parameters)==null?void 0:y.docs)==null?void 0:S.source}}};var j,I,w;s.parameters={...s.parameters,docs:{...(j=s.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    placeholder: 'Invalid value',
    'aria-invalid': true
  }
}`,...(w=(I=s.parameters)==null?void 0:I.docs)==null?void 0:w.source}}};const $=["Default","WithLabel","Disabled","ErrorState"];export{a as Default,o as Disabled,s as ErrorState,i as WithLabel,$ as __namedExportsOrder,V as default};
