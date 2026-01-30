// Preload script for secure API exposure to the renderer process
// This file runs in a separate context and can expose limited APIs to the renderer

import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example API methods - add your specific methods here
  // sendMessage: (channel: string, data: any) => {
  //   // Whitelist channels to send messages to
  //   const validChannels = ['toMain'];
  //   if (validChannels.includes(channel)) {
  //     ipcRenderer.send(channel, data);
  //   }
  // },
  //
  // receiveMessage: (channel: string, func: Function) => {
  //   // Whitelist channels to receive messages from
  //   const validChannels = ['fromMain'];
  //   if (validChannels.includes(channel)) {
  //     // Deliberately strip event as it includes `sender`
  //     ipcRenderer.on(channel, (event, ...args) => func(...args));
  //   }
  // }
});

// You can expose other APIs as needed, following the principle of least privilege
// Only expose what the renderer process absolutely needs
