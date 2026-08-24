(function(root){"use strict";
  const PRESETS={etsy:{folder:"etsy",suffix:"etsy",width:2000,height:2000,background:"user"},amazon:{folder:"amazon",suffix:"amazon",width:1600,height:1600,background:"#ffffff"},shopify:{folder:"shopify",suffix:"shopify",width:2048,height:2048,background:"user"},instagram:{folder:"instagram",suffix:"instagram",width:1080,height:1350,background:"user"}};
  function slugify(value){return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70)||"product"}
  function fitRect(sw,sh,dw,dh,mode="contain"){
    if(![sw,sh,dw,dh].every(n=>Number.isFinite(n)&&n>0))throw new RangeError("Dimensions must be positive numbers");
    const scale=(mode==="cover"?Math.max:Math.min)(dw/sw,dh/sh),w=sw*scale,h=sh*scale;
    return{x:(dw-w)/2,y:(dh-h)/2,width:w,height:h,scale};
  }
  function outputPath(product,index,preset){const p=typeof preset==="string"?PRESETS[preset]:preset;if(!p)throw new Error("Unknown preset");return`${p.folder}/${slugify(product)}-${String(index+1).padStart(2,"0")}-${p.suffix}.jpg`}
  const table=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
  function zipStore(entries){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    const u16=(v)=>new Uint8Array([v&255,(v>>>8)&255]),u32=(v)=>new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);
    const join=(parts)=>{const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length}return out};
    for(const entry of entries){const name=enc.encode(entry.name),data=entry.data instanceof Uint8Array?entry.data:new Uint8Array(entry.data),crc=crc32(data);const local=join([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);locals.push(local);centrals.push(join([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));offset+=local.length}
    const centralSize=centrals.reduce((n,p)=>n+p.length,0),end=join([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralSize),u32(offset),u16(0)]);return join([...locals,...centrals,end]);
  }
  const api={PRESETS,slugify,fitRect,outputPath,crc32,zipStore};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.MarketPackCore=api;
})(typeof globalThis!=="undefined"?globalThis:this);
