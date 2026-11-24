'use strict';
const { contextBridge, ipcRenderer, webFrame } = require('electron');

const EVENTS = ['reminder', 'navigate', 'flush', 'new-page'];

contextBridge.exposeInMainWorld('api', {
  isDesktop: true,
  load: () => ipcRenderer.invoke('data:load'),
  saveIndex: (index) => ipcRenderer.invoke('index:save', index),
  loadPage: (id) => ipcRenderer.invoke('page:load', id),
  savePage: (id, data) => ipcRenderer.invoke('page:save', id, data),
  deletePage: (id) => ipcRenderer.invoke('page:delete', id),
  allPages: () => ipcRenderer.invoke('pages:all'),
  saveSync: (data) => ipcRenderer.sendSync('sync:save', data),
  saveAsset: (bytes, ext) => ipcRenderer.invoke('asset:save', bytes, ext),
  pickImages: (multi) => ipcRenderer.invoke('asset:pick', multi !== false),
  assetUrl: (name) => 'liser://asset/' + encodeURIComponent(name),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  setTheme: (state) => ipcRenderer.invoke('win:theme', state),
  setZoom: (factor) => webFrame.setZoomFactor(factor),
  saveFile: (file) => ipcRenderer.invoke('file:save', file),
  exportPdf: (name) => ipcRenderer.invoke('file:pdf', name),
  exportAll: (data) => ipcRenderer.invoke('export:all', data),
  backup: () => ipcRenderer.invoke('backup:create'),
  pickBackup: () => ipcRenderer.invoke('backup:pick'),
  restore: (dir) => ipcRenderer.invoke('backup:restore', dir),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  openDataDir: () => ipcRenderer.invoke('open:datadir'),
  on: (channel, fn) => {
    if (EVENTS.includes(channel)) ipcRenderer.on(channel, (_e, ...args) => fn(...args));
  },
});
