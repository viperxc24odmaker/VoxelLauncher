import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { app } from 'electron'

export class JavaService {
  private managedRoot = path.join(app.getPath('appData'),'VoxelLauncher','java','21')
  async detect(): Promise<string[]> {
    const found = new Set<string>()
    const candidates = [process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin','java.exe') : '', path.join(this.managedRoot,'bin','java.exe')]
    const where = spawnSync('where.exe',['java'],{encoding:'utf8',windowsHide:true})
    if (!where.error) candidates.push(...where.stdout.split(/\r?\n/).filter(Boolean))
    const roots = ['C:\\Program Files\\Java','C:\\Program Files\\Eclipse Adoptium','C:\\Program Files\\Microsoft\\jdk','C:\\Program Files\\BellSoft']
    for(const root of roots){ try { for(const entry of await fs.readdir(root)){ candidates.push(path.join(root,entry,'bin','java.exe')) } } catch {} }
    for(const item of candidates.filter(Boolean)){ if(existsSync(item)) found.add(item) }
    return [...found]
  }
  async install(){
    const api='https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse'
    const res=await fetch(api); if(!res.ok) throw new Error(`Adoptium request failed: ${res.status}`)
    const data:any[]=await res.json(); const pkg=data?.[0]?.binary?.package?.link; if(!pkg) throw new Error('Adoptium did not return a Java 21 Windows JRE package')
    const tmp=path.join(app.getPath('temp'),'voxel-java.zip'); const out=path.join(app.getPath('temp'),'voxel-java-extract');
    const bytes=Buffer.from(await (await fetch(pkg)).arrayBuffer()); await fs.writeFile(tmp,bytes); await fs.rm(out,{recursive:true,force:true}); mkdirSync(out,{recursive:true})
    const archive = require('node:child_process').spawnSync('tar.exe',['-xf',tmp,'-C',out],{windowsHide:true}); if(archive.status!==0) throw new Error('Windows tar could not extract the Java runtime')
    const dirs=await fs.readdir(out); if(!dirs[0]) throw new Error('Java archive was empty')
    await fs.rm(this.managedRoot,{recursive:true,force:true}); await fs.cp(path.join(out,dirs[0]),this.managedRoot,{recursive:true});
    return path.join(this.managedRoot,'bin','java.exe')
  }
}
