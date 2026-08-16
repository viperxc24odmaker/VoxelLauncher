import fs from 'node:fs/promises'
import path from 'node:path'

export interface ModResult { id:string; title:string; description:string; icon?:string; downloads:number; projectUrl:string; versions:string[]; loaders:string[]; file?: {url:string; filename:string} }

export class ModService {
  async search(query:string, version?:string, loader?:string): Promise<ModResult[]> {
    const params=new URLSearchParams({query,index:'relevance',limit:'30'})
    if(version) params.set('versions',JSON.stringify([version]))
    if(loader && loader!=='Vanilla') params.set('loaders',JSON.stringify([loader.toLowerCase()]))
    const res=await fetch(`https://api.modrinth.com/v2/search?${params}`); if(!res.ok) throw new Error(`Modrinth search failed: ${res.status}`)
    const body:any=await res.json()
    return (body.hits??[]).map((x:any)=>({id:x.project_id,title:x.title,description:x.description??'',icon:x.icon_url,downloads:x.downloads??0,projectUrl:`https://modrinth.com/mod/${x.slug}`,versions:x.versions??[],loaders:[],file:undefined}))
  }
  async installMod(projectId:string, gameDirectory:string, version:string, loader:string){
    const params=new URLSearchParams({game_versions:JSON.stringify([version]),loaders:JSON.stringify([loader.toLowerCase()]),project_id:projectId,limit:'1'})
    const res=await fetch(`https://api.modrinth.com/v2/project/${projectId}/version?${params}`); if(!res.ok) throw new Error(`Modrinth version lookup failed: ${res.status}`)
    const versions:any[]=await res.json(); const chosen=versions[0]; const file=chosen?.files?.find((f:any)=>f.primary)||chosen?.files?.[0]
    if(!file?.url) throw new Error('No compatible mod file was found')
    const mods=path.join(gameDirectory,'mods'); await fs.mkdir(mods,{recursive:true}); const data=Buffer.from(await (await fetch(file.url)).arrayBuffer()); await fs.writeFile(path.join(mods,file.filename),data)
    return {filename:file.filename,path:path.join(mods,file.filename)}
  }
}
