const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SpeechProviderFactory } = require('./speech-providers/provider-factory');

class InterviewApp {
  constructor() {
    this.mainWindow = null;
    this.speechProvider = null;
    this.currentConfig = {
      provider: 'local',
      localSettings: { language: 'en-US' }
    };
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      }
    });

    // In development, load from Vite dev server
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
    }
  }

  async initializeSpeechProvider() {
    try {
      this.speechProvider = await SpeechProviderFactory.create(this.currentConfig);
      console.log(`Initialized ${this.speechProvider.type} speech provider`);
    } catch (error) {
      console.error('Failed to initialize speech provider:', error);
    }
  }

  setupIpcHandlers() {
    // Speech provider configuration
    ipcMain.handle('speech:getConfig', () => {
      return this.currentConfig;
    });

    ipcMain.handle('speech:updateConfig', async (event, newConfig) => {
      try {
        this.currentConfig = { ...this.currentConfig, ...newConfig };
        await this.initializeSpeechProvider();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Speech recognition
    ipcMain.handle('speech:recognize', async (event, audioBuffer) => {
      if (!this.speechProvider) {
        return { error: 'Speech provider not initialized' };
      }
      
      try {
        return await this.speechProvider.recognizeSpeech(audioBuffer);
      } catch (error) {
        return { error: error.message };
      }
    });

    // Text-to-speech
    ipcMain.handle('speech:synthesize', async (event, text) => {
      if (!this.speechProvider) {
        throw new Error('Speech provider not initialized');
      }
      
      return await this.speechProvider.synthesizeSpeech(text);
    });

    // Provider status
    ipcMain.handle('speech:getStatus', () => {
      if (!this.speechProvider) {
        return { isReady: false, isListening: false, lastError: 'Not initialized' };
      }
      return this.speechProvider.getStatus();
    });
  }

  async initialize() {
    await app.whenReady();
    
    this.createWindow();
    this.setupIpcHandlers();
    await this.initializeSpeechProvider();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }
}

// Handle app events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize the application
const interviewApp = new InterviewApp();
interviewApp.initialize().catch(console.error);