(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["field:list"],{"6d23":function(e,t,i){},9054:function(e,t,i){"use strict";i.r(t);var s=function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{attrs:{id:"field"}},[i("div",{staticClass:"position"},[e.label&&""!==e.label?i("legend",{class:e.schema.description&&""!==e.schema.description?"legend collapsed":"legend",domProps:{innerHTML:e._s(e.label)}}):e._e()]),e.schema.description&&""!==e.schema.description?i("div",{staticClass:"description",domProps:{innerHTML:e._s(e.schema.description)}}):e._e(),e._l(e.items,(function(t,s){return i("div",{key:s,staticClass:"item"},[i("div",{staticClass:"field"},[i("schema",{attrs:{instance:e.instance,identifier:e.identifier,title:e.schema.title,description:e.schema.description,placeholder:e.schema.example,schema:e.schema.items,value:t},on:{input:function(t){return e.updateValue(t,s)}}})],1),i("div",{staticClass:"action"},[e.items.length>0?i("div",{key:"remove-"+s,staticClass:"icon",on:{click:function(t){return e.removeItem(s)}}},[e._v("delete")]):e._e()])])})),!e.schema.maxItems||e.items.length<e.schema.maxItems?i("div",{staticClass:"icon add",on:{click:function(t){return e.addItem()}}},[e._v("add_circle")]):e._e()],2)},n=[],a=(i("a434"),i("a9e3"),i("d3b7"),i("089f")),c={name:"list-field",components:{schema:function(){return Promise.resolve().then(i.bind(null,"e0a1"))}},props:{field:String,schema:Object,value:[Object,String,Number,Boolean,Array],title:String,instance:String,identifier:String},data:function(){return{items:void 0!==this.value?this.value:[],label:""}},mounted:function(){this.label=this.title||Object(a["a"])(this.field)},methods:{addItem:function(){this.items.push(Object(a["d"])(this.schema)[0])},removeItem:function(e){this.items.splice(e,1),this.$emit("input",this.items),this.$emit("change",this.items)},updateValue:function(e,t){this.items.splice(t,1,e),this.$emit("input",this.items),this.$emit("change",this.items)}}},l=c,r=(i("d713"),i("2877")),d=Object(r["a"])(l,s,n,!1,null,"52e12dbc",null);t["default"]=d.exports},a434:function(e,t,i){"use strict";var s=i("23e7"),n=i("23cb"),a=i("a691"),c=i("50c4"),l=i("7b0b"),r=i("65f0"),d=i("8418"),o=i("1dde"),m=i("ae40"),h=o("splice"),u=m("splice",{ACCESSORS:!0,0:0,1:2}),f=Math.max,p=Math.min,v=9007199254740991,b="Maximum allowed length exceeded";s({target:"Array",proto:!0,forced:!h||!u},{splice:function(e,t){var i,s,o,m,h,u,g=l(this),_=c(g.length),C=n(e,_),w=arguments.length;if(0===w?i=s=0:1===w?(i=0,s=_-C):(i=w-2,s=p(f(a(t),0),_-C)),_+i-s>v)throw TypeError(b);for(o=r(g,s),m=0;m<s;m++)h=C+m,h in g&&d(o,m,g[h]);if(o.length=s,i<s){for(m=C;m<_-s;m++)h=m+s,u=m+i,h in g?g[u]=g[h]:delete g[u];for(m=_;m>_-s+i;m--)delete g[m-1]}else if(i>s)for(m=_-s;m>C;m--)h=m+s-1,u=m+i-1,h in g?g[u]=g[h]:delete g[u];for(m=0;m<i;m++)g[m+C]=arguments[m+2];return g.length=_-s+i,o}})},d713:function(e,t,i){"use strict";i("6d23")}}]);
//# sourceMappingURL=field:list.f5f4ede8.js.map