import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('voxel',{
 window:{minimize:()=>ipcRenderer.invoke('window:minimize'),maximize:()=>ipcRenderer.invoke('window:maximize'),close:()=>ipcRenderer.invoke('window:close')},
 settings:{get:()=>ipcRenderer.invoke('settings:get'),set:(k:string,v:unknown)=>ipcRenderer.invoke('settings:set',k,v)},
 minecraft:{versions:()=>ipcRenderer.invoke('minecraft:versions'),install:(p:unknown)=>ipcRenderer.invoke('minecraft:install',p),launch:(p:unknown)=>ipcRenderer.invoke('minecraft:launch',p),onLog:(fn:(line:string)=>void)=>{const h=(_e:Electron.IpcRendererEvent,line:string)=>fn(line);ipcRenderer.on('minecraft:log',h);return()=>ipcRenderer.removeListener('minecraft:log',h)}},
 java:{detect:()=>ipcRenderer.invoke('java:detect'),install:()=>ipcRenderer.invoke('java:install')},
 instances:{list:()=>ipcRenderer.invoke('instances:list'),save:(v:unknown)=>ipcRenderer.invoke('instances:save',v),delete:(id:string)=>ipcRenderer.invoke('instances:delete',id)},
 mods:{search:(q:string,v?:string,l?:string)=>ipcRenderer.invoke('mods:search',q,v,l),install:(p:string,g:string,v:string,l:string)=>ipcRenderer.invoke('mods:install',p,g,v,l)},
 openPath:(p:string)=>ipcRenderer.invoke('open:path',p)
})
