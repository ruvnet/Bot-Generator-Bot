import a from '../catalog/group-a.json' with {type:'json'};
import b from '../catalog/group-b.json' with {type:'json'};
import c from '../catalog/group-c.json' with {type:'json'};
export const catalog=Object.freeze([...a,...b,...c].sort((x,y)=>x.id.localeCompare(y.id)));
export const catalogTools=Object.freeze(Object.fromEntries(catalog.map(record=>['build_'+record.id.replaceAll('-','_'),record])));
export const catalogSummary=()=>catalog.map(({id,title,description,source,sourceSha256})=>({id,title,description,source,sourceSha256,skill:'bgb-'+id,tool:'build_'+id.replaceAll('-','_')}));
