(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["field:root"],{"2d2d":function(e,t,i){"use strict";i.r(t);var s=function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{attrs:{id:"field"}},[i("div",{staticClass:"position"},[e.title&&""!==e.title?i("legend",{class:e.schema.description&&""!==e.schema.description?"legend collapsed":"legend",domProps:{innerHTML:e._s(e.title)}}):e._e()]),e.schema.description&&""!==e.schema.description?i("div",{staticClass:"description",domProps:{innerHTML:e._s(e.schema.description)}}):e._e(),e._l(e.items,(function(t,s){return i("div",{key:s,staticClass:"item"},[i("div",{staticClass:"field"},[i("schema",{attrs:{instance:e.instance,identifier:e.identifier,title:e.schema.title,description:e.schema.description,placeholder:e.schema.example,field:s,schema:e.schema.items,value:t},on:{input:function(t){return e.updateValue(t,s)}}})],1),i("div",{staticClass:"action"},[e.items.length>0?i("div",{key:"remove-"+s,staticClass:"icon",on:{click:function(t){return e.removeItem(s)}}},[e._v("delete")]):e._e()])])})),i("div",{staticClass:"icon add",on:{click:function(t){return e.addItem()}}},[e._v("add_circle")])],2)},n=[],c=(i("a434"),i("a9e3"),i("d3b7"),i("089f")),a={name:"root-field",components:{schema:function(){return Promise.resolve().then(i.bind(null,"e0a1"))}},props:{field:[String,Number],schema:Object,value:[Object,String,Number,Boolean,Array],title:String,instance:String,identifier:String},data:function(){return{items:void 0!==this.value?this.value:[]}},methods:{addItem:function(){this.items.push(Object(c["d"])(this.schema)[0])},removeItem:function(e){this.items.splice(e,1),this.$emit("input",this.items),this.$emit("change",this.items)},updateValue:function(e,t){this.items.splice(t,1,e),this.$emit("input",this.items),this.$emit("change",this.items)}}},r=a,o=(i("d9f9"),i("2877")),l=Object(o["a"])(r,s,n,!1,null,"5b712fe0",null);t["default"]=l.exports},a434:function(e,t,i){"use strict";var s=i("23e7"),n=i("23cb"),c=i("a691"),a=i("50c4"),r=i("7b0b"),o=i("65f0"),l=i("8418"),d=i("1dde"),m=i("ae40"),h=d("splice"),u=m("splice",{ACCESSORS:!0,0:0,1:2}),f=Math.max,p=Math.min,v=9007199254740991,g="Maximum allowed length exceeded";s({target:"Array",proto:!0,forced:!h||!u},{splice:function(e,t){var i,s,d,m,h,u,b=r(this),_=a(b.length),C=n(e,_),w=arguments.length;if(0===w?i=s=0:1===w?(i=0,s=_-C):(i=w-2,s=p(f(c(t),0),_-C)),_+i-s>v)throw TypeError(g);for(d=o(b,s),m=0;m<s;m++)h=C+m,h in b&&l(d,m,b[h]);if(d.length=s,i<s){for(m=C;m<_-s;m++)h=m+s,u=m+i,h in b?b[u]=b[h]:delete b[u];for(m=_;m>_-s+i;m--)delete b[m-1]}else if(i>s)for(m=_-s;m>C;m--)h=m+s-1,u=m+i-1,h in b?b[u]=b[h]:delete b[u];for(m=0;m<i;m++)b[m+C]=arguments[m+2];return b.length=_-s+i,d}})},ba9f:function(e,t,i){},d9f9:function(e,t,i){"use strict";i("ba9f")}}]);
//# sourceMappingURL=field:root.449ebca1.js.map