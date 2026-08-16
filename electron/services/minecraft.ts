import { app } from 'electron'
import path from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { launch } from '@xmcl/core'
import { getVersionList, install, installDependencies } from '@xmcl/installer'

export type Loader='Vanilla'|'Fabric'|'Forge'|'NeoForge'|'Quilt'
export interface Instance {id:string;name:string;version:string;loader:Loader;memory:number;javaPath?:string;jvmArgs?:string;gameDirectory:string}

export class MinecraftService {
  readonly root=path.join(app.getPath('appData'),'VoxelLauncher'); readonly gameRoot=path.join(this.root,'minecraft'); private file=path.join(this.root,'instances.json')
  constructor(){mkdirSync(this.root,{recursive:true});mkdirSync(this.gameRoot,{recursive:true})}
  async getVersions(){return (await getVersionList()).versions}
  listInstances():Instance[]{if(!existsSync(this.file))return [];try{return JSON.parse(readFileSync(this.file,'utf8'))}catch{return []}}
  saveInstance(v:Instance){const all=this.listInstances().filter(x=>x.id!==v.id);all.push(v);writeFileSync(this.file,JSON.stringify(all,null,2));mkdirSync(v.gameDirectory,{recursive:true});return v}
  deleteInstance(id:string){writeFileSync(this.file,JSON.stringify(this.listInstances().filter(x=>x.id!==id),null,2));return true}
  private async loaderVersion(loader:Loader,mc:string,game:string,java?:string){
    if(loader==='Vanilla')return mc
    const i:any=await import('@xmcl/installer')
    if(loader==='Fabric'){const list=await i.getLoaderArtifactListFor(mc,{});const artifact=list[0];if(!artifact)throw new Error(`Fabric has no loader for ${mc}`);return i.installFabricByLoaderArtifact(artifact,game,{})}
    if(loader==='Forge'){const list=await i.getForgeVersionList({minecraft:mc});const v=list.versions?.[0];if(!v)throw new Error(`Forge has no build for ${mc}`);return i.installForge(v,game,{java})}
    if(loader==='NeoForge'){const list=await i.getNeoForgedVersionList({minecraft:mc});const v=list?.[0];if(!v)throw new Error(`NeoForge has no build for ${mc}`);return i.installNeoForge({version:v.version??v,minecraft:mc},game,{java})}
    if(loader==='Quilt'){const list=await i.getQuiltLoaderVersionsByMinecraft({minecraft:mc});const v=list?.[0];if(!v)throw new Error(`Quilt has no loader for ${mc}`);return i.installQuilt(v,mc,game)}
    throw new Error(`Unsupported loader ${loader}`)
  }
  async install(input:{version:string;loader:Loader;gameDirectory?:string;javaPath?:string}){
    const game=input.gameDirectory||this.gameRoot;mkdirSync(game,{recursive:true});const meta=(await getVersionList()).versions.find(v=>v.id===input.version);if(!meta)throw new Error(`Minecraft ${input.version} is unavailable`)
    await install(meta,game,{side:'client'} as any)
    const id=await this.loaderVersion(input.loader,input.version,game,input.javaPath)
    const { Version }=await import('@xmcl/core');const resolved:any=await Version.parse(game,id||input.version);await installDependencies(resolved)
    return {version:id||input.version,gameDirectory:game}
  }
  async launch(input:{version:string;gameDirectory:string;javaPath:string;username:string;memory:number;jvmArgs?:string}){
    if(!input.javaPath||!existsSync(input.javaPath))throw new Error('Java executable was not found')
    const proc=await launch({gamePath:input.gameDirectory,javaPath:input.javaPath,version:input.version,gameProfile:{name:input.username||'VoxelPlayer',id:randomUUID().replaceAll('-','')},accessToken:'0',userType:'legacy',launcherName:'VoxelLauncher',launcherBrand:'VoxelLauncher',minMemory:1024,maxMemory:input.memory,extraJVMArgs:input.jvmArgs?input.jvmArgs.split(/\s+/).filter(Boolean):undefined,extraExecOption:{windowsHide:true,cwd:input.gameDirectory}})
    return proc
  }
}
