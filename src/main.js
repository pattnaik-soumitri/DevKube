const {app, ipcMain, BrowserWindow, shell} = require('electron');
const url = require('url');
const path = require('path');
app.setAppUserModelId(process.execPath);
const exec = require('child_process').exec;

const Kube = require('./models/Kube');
const Context = require('./models/Context');
const Namespace = require('./models/Namespace');

let mainWindow = null;
let portForwardWindow = null;

let kube = null;
let contexts = [];
let currentContext = null;
let namespaces = [];
let currentNamespace = null;
let currentNamespaceName = 'default';

const sendDataToWindow = (win, msg, ...dataArr) => {
    if(dataArr && dataArr.length > 0) {
        win.webContents.send(msg, ...dataArr);
        win.webContents.on('did-finish-load', () => {
            win.webContents.send(msg, ...dataArr);
        });
    } else {
        win.webContents.send(msg);
        win.webContents.on('did-finish-load', () => {
            win.webContents.send(msg);
        });
    }
}

const getAllResources = () => {
    console.log('getAllResources() called ...');
    sendDataToWindow(mainWindow, 'showLoading');

    exec('kubectl get all -o wide', (err, stdout, stderr) => {
        console.log(stdout);
        kube = new Kube(stdout);
        sendDataToWindow(mainWindow, 'output:get_all', kube);
    });
}

// This will get the current context info
// Populate the context drop down
// Then finally call the getNamespaces() method
const getContexts = () => {

    exec('kubectl config get-contexts', (err, stdout, stderr) => {
        // console.log(stdout);

        let rows = stdout.split('\n'); // Break the output by lines  
        rows.shift(); // Remove the header row
        rows.pop(); // Remove last blank row
        
        // Empty contexts[]
        while(contexts.length > 0) {
            contexts.pop();
        }
        rows.forEach(row => contexts.push(Context.fromOutputRow(row)));
        // console.log('contexts : ', contexts);

        contexts.filter(context => context.current)
                .forEach(context => currentContext = context);
        console.log('Current context : ', currentContext);

        // Change the current namespace name if the current context has a namespace set
        if(currentContext.namespace) {
            currentNamespaceName = currentContext.namespace;
        }

        sendDataToWindow(mainWindow, 'output:get_context', contexts);

        // Call the get namespace
        getNamespace();
        
    });
}

// This will get the all available namespace info
// Get populate the namespace drop down
// This wil be called from with in the getContexts() method, 
// because we can only know the current namespace after getting the current context
const getNamespace = () => {
    console.log('getNamespace() called ...');

    exec('kubectl get namespace', (err, stdout, stderr) => {
        // console.log(stdout);

        let rows = stdout.split('\n'); // Break the output by lines  
        rows.shift(); // Remove the header row
        rows.pop(); // Remove last blank row
        
        // Empty namespaces[]
        while(namespaces.length > 0) {
            namespaces.pop();
        }
        rows.forEach(row => namespaces.push(Namespace.fromOutputRow(row)));
        // console.log('namespaces : ', namespaces);

        // Get the current namespace
        currentNamespace = namespaces.filter(namespace => namespace.name === currentNamespaceName)[0];
        console.log('Current namespace : ', currentNamespace);

        sendDataToWindow(mainWindow, 'output:get_namespace', namespaces, currentNamespace);
    });
}

// This is the main browser window
const createWindow = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        icon: './assets/icons/icon_tiny.png'
    });
    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/index.html'), // important
        protocol: 'file:',
        slashes: true,
        // baseUrl: 'src'
    }));

    // Close handler
    mainWindow.on('close', () => {
        console.log("Quitting app now ...")
        mainWindow = null;
        app.quit();
    });

    getAllResources(); // Get data from kubectl
    getContexts(); // Get contexts from kubectl
};

// Execute command in external cmd
ipcMain.on("execute:command:ext", (event, command) => {
    console.log(process.platform);
    console.log(command);

    switch(process.platform) {
        case 'darwin':
            exec(`osascript -e 'tell application "Terminal" to do script "${command}"'`);
            break;
            
        case 'win32':
            exec("start cmd /k " + command);
            break;

        case 'linux': 
            // TODO - Implement the execute command in new terminal window for Linux
            break;
    }
});


ipcMain.on("open:portforward-form", (event, serviceName) => {
    portForwardWindow = new BrowserWindow({
        width: 220,
        height: 80,
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        darkTheme: true
    });

    portForwardWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/input-port.html'), // important
        protocol: 'file:',
        slashes: true,
        // baseUrl: 'src'
    }));
    
    // Comment it out
    // portForwardWindow.webContents.openDevTools();
    
    sendDataToWindow(portForwardWindow, 'output:get_all', {kube, serviceName});
});

ipcMain.on("close:portforward-form", event => {
    portForwardWindow.close();
});


ipcMain.on("getPods", event => {
    getAllResources();
});

// Switch context
ipcMain.on('switchContext', (event, newContext) => {
    sendDataToWindow(mainWindow, 'showLoading');

    exec(`kubectl config use-context ${newContext}`, (err, stdout, stderr) => {
        console.log(stdout);
        if(!stderr && stdout.startsWith(`Switched to context "${newContext}".`)) {

            getAllResources();
            getContexts();

        } else {
            // TODO: Implement error handling when switchContext command fails.
            
        }
    });
});


// Switch namespace
ipcMain.on('switchNamespace', (event, newNamespace) => {
    console.log(`Switching to namespace=${newNamespace}`);
    sendDataToWindow(mainWindow, 'showLoading');

    exec(`kubectl config set-context --current --namespace=${newNamespace}`, (err, stdout, stderr) => {
        console.log(stdout);
        if(!stderr && stdout.startsWith(`Context "${currentContext.name}" modified.`)) {

            getAllResources();
            getContexts();

        } else {
            // TODO: Implement error handling when switch namespace command fails.
            
        }
    });
});


// Open link
ipcMain.on("open-link", (event, url) => {
    shell.openExternal(url);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});
  
app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});