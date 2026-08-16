import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import Store from 'electron-store'
import { MinecraftService } from './services/minecraft.js'
import { JavaService } from './services/java.js'
import { ModService } from './services/mods.js'

const store=new Store({defaults:{theme:'dark',accent:'#8b5cf6',memory:4096,jvmArgs:'',closeOnPlay:false,gameDirectory:path.join(app.getPath('appData'),'VoxelLauncher','minecraft')}})
let win:BrowserWindow|undefined
const minecraft=new MinecraftService(), java=new JavaService(), mods=new ModService()
function createWindow(){win=new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,frame:false,backgroundColor:'#09090b',show:false,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}});if(process.env.VITE_DEV_SERVER_URL)win.loadURL(process.env.VITE_DEV_SERVER_URL);else win.loadFile(path.join(__dirname,'../dist/index.html'));win.once('ready-to-show',()=>win?.show())}
ipcMain.handle('window:minimize',()=>win?.minimize());ipcMain.handle('window:maximize',()=>{if(win?.isMaximized())win.unmaximize();else win?.maximize()});ipcMain.handle('window:close',()=>win?.close())
ipcMain.handle('settings:get',()=>store.store);ipcMain.handle('settings:set',(_e,k:string,v:unknown)=>{store.set(k,v);return store.store});ipcMain.handle('open:path',(_e,p:string)=>shell.openPath(p))
ipcMain.handle('minecraft:versions',()=>minecraft.getVersions());ipcMain.handle('minecraft:install',(_e,p)=>minecraft.install(p));ipcMain.handle('minecraft:launch',async(_e,p)=>{const child=await minecraft.launch({...p,memory:p.memory??store.get('memory'),jvmArgs:p.jvmArgs??store.get('jvmArgs')});child.stdout?.on('data',(b:Buffer)=>win?.webContents.send('minecraft:log',b.toString()));child.stderr?.on('data',(b:Buffer)=>win?.webContents.send('minecraft:log',b.toString()));child.on('exit',(code)=>win?.webContents.send('minecraft:log',`Minecraft exited with code ${code}`));if(store.get('closeOnPlay'))win?.close();return {pid:child.pid}})
ipcMain.handle('java:detect',()=>java.detect());ipcMain.handle('java:install',()=>java.install())
ipcMain.handle('instances:list',()=>minecraft.listInstances());ipcMain.handle('instances:save',(_e,v)=>minecraft.saveInstance(v));ipcMain.handle('instances:delete',(_e,id:string)=>minecraft.deleteInstance(id))
ipcMain.handle('mods:search',(_e,q:string,v?:string,l?:string)=>mods.search(q,v,l));ipcMain.handle('mods:install',(_e,p:string,g:string,v:string,l:string)=>mods.installMod(p,g,v,l))
app.whenReady().then(createWindow);app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()})
