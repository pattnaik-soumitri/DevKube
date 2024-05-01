const path = require('path');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;


let kube = null; // The state
let lastUpdated = null; // The last refresh time

const lastUpdatedSpan = document.getElementById('last-updated'); // The last updated label
const refreshBtn = document.getElementById("refresh"); // The refresh link
const kubeContainer = document.getElementById("kube-container"); // The container that holds all the stats
const contextMenu = document.getElementById("context-menu"); // The context menu
const namespaceMenu = document.getElementById('namespace-menu'); // The namespace menu


const burgerIcon = document.getElementById("burger");
const navbar = document.getElementById("navbar");

// Handle nav burger icon for small window sizes
burgerIcon.addEventListener("click", event => {
    if(burgerIcon.classList.contains("is-active")) {
        burgerIcon.classList.remove("is-active");
        navbar.classList.remove("is-active");
    } else {
        burgerIcon.classList.add("is-active");
        navbar.classList.add("is-active");
    }
});

// Refresh action
refreshBtn.addEventListener("click", event => {
    event.preventDefault();
    ipcRenderer.send("getResources");
});


// populate the context dropdown
ipcRenderer.on("output:get_context", (e, data) => {
    let contextOptions = document.querySelector("#context-options");
    let currentContext = document.querySelector("#context-current");
    contextOptions.innerHTML = '';

    if(data.showLoading) {
        currentContext.innerHTML = 'Context &nbsp; <img src="../assets/animations/loading_small.svg" />';
    } else {

        data.contexts.forEach(context => {
            if(context.current) {
                currentContext.innerHTML = "Context - " + context.name;
            } else {
                let link = document.createElement("a");
                link.className = "navbar-item";
                link.innerHTML = context.name + " <br/> " + context.cluster;
    
                link.addEventListener("click", event => {
                    let newContext = event.target.innerHTML.split('<br>')[0].trim();
                    ipcRenderer.send("switchContext", newContext);
                });
    
                contextOptions.appendChild(link);
            }
        });
    }

});

// populate the namespace dropdown
ipcRenderer.on('output:get_namespace', (e, data) => {

    let namespaceOptions = document.getElementById('namespace-options');
    let currentNamespaceLink = document.getElementById('namespace-current');
    namespaceOptions.innerHTML = '';

    if(data.showLoading) {

        currentNamespaceLink.innerHTML = 'Namespace &nbsp; <img src="../assets/animations/loading_small.svg" />';;
    } else {

        data.namespaces.forEach(namespace => {
            if(namespace.name === data.currentNamespace.name) {
                currentNamespaceLink.innerHTML = 'Namespace - ' + namespace.name;
            } else {
                let link = document.createElement('a');
                link.className = "navbar-item";
                link.innerHTML = namespace.name;
    
                link.addEventListener("click", event => {
                    let newNamespace = event.target.innerHTML.trim();
                    ipcRenderer.send("switchNamespace", newNamespace);
                });
    
                namespaceOptions.appendChild(link);
            }
        });
    }
});

// kubectl get all -o wide
ipcRenderer.on("output:get_all", (e, kube) => {
    console.log('output:get_all called on index.js');
    kube = kube;
    console.log("Kube", kube);
    lastUpdated = new Date();
    lastUpdatedSpan.innerHTML = `Refreshed : <b>${lastUpdated.toLocaleTimeString()}</b>`;

    // POD //
    const podsTable = document.querySelector("#podList");

    // First delete the POD tbody if any
    let oldTbodyPod = podsTable.querySelector("tbody");
    if(null !== oldTbodyPod) {
        console.log("Removing tbody of pod list.");
        oldTbodyPod.parentNode.removeChild(oldTbodyPod);
        oldTbodyPod = null;
    }

    // Set the pod count
    document.querySelector("#pod-count").innerHTML = kube.pods.length;

    let tbodyPod = document.createElement("tbody");
    kube.pods.forEach(pod => {
                        
                        let tr = document.createElement("tr");
                        
                        // The links
                        let tdAction = document.createElement("td");
                        tdAction.setAttribute("align", "center");

                        if(pod.status === "Running") {
                            // The LOG icon
                            let iconLog = document.createElement("i");
                            iconLog.setAttribute("class", "fas fa-file-alt");
                            iconLog.setAttribute("title", "log");
                            // The LOG link
                            let linkLog = document.createElement("a");
                            linkLog.href = "#";
                            linkLog.addEventListener("click", (event) => {
                                event.preventDefault();
                                ipcRenderer.send('execute:command:ext', `kubectl logs -f ${pod.name} --all-containers=true`);
                            });
                            linkLog.appendChild(iconLog);
                            tdAction.appendChild(linkLog);
                            // padding
                            linkLog.insertAdjacentHTML('afterend', "&nbsp;&nbsp;&nbsp;&nbsp;");


                            // The EXEC icon
                            let iconExec = document.createElement("i");
                            iconExec.setAttribute("class", "fas fa-terminal");
                            iconExec.setAttribute("title", "exec");
                            // The EXEC link
                            let linkExec = document.createElement("a");
                            linkExec.href = "#";
                            linkExec.addEventListener("click", (event) => {
                                event.preventDefault();
                                ipcRenderer.send("execute:command:ext", "kubectl exec -it " + pod.name + " /bin/sh");
                            });
                            linkExec.appendChild(iconExec);
                            tdAction.appendChild(linkExec);
                            // padding
                            linkExec.insertAdjacentHTML('afterend', "&nbsp;&nbsp;&nbsp;&nbsp;");

                        }


                        // The YAML icon
                        let iconYaml = document.createElement("i");
                        iconYaml.setAttribute("class", "fab fa-yahoo");
                        iconYaml.setAttribute("title", "YAML file");
                        if(isFailedStatus(pod.status)) {
                            iconYaml.style.color = "RED";
                        }
                        // The YAML link
                        let linkYaml = document.createElement("a");
                        linkYaml.href = "#";
                        linkYaml.addEventListener("click", (event) => {
                            event.preventDefault();
                            ipcRenderer.send("execute:command:ext", "kubectl get pod " + pod.name + " -o yaml")
                        });
                        linkYaml.appendChild(iconYaml);
                        tdAction.appendChild(linkYaml);
                        // padding
                        linkYaml.insertAdjacentHTML('afterend', "&nbsp;&nbsp;&nbsp;&nbsp;");

                        // The DESCRIBE icon
                        let iconDesc = document.createElement("i");
                        iconDesc.setAttribute("class", "fas fa-question-circle");
                        iconDesc.setAttribute("title", "Describe POD");
                        if(isFailedStatus(pod.status)) {
                            iconDesc.style.color = "RED";
                        }
                        // The DESCRIBE link
                        let linkDesc = document.createElement("a");
                        linkDesc.href = "#";
                        linkDesc.addEventListener("click", (event) => {
                            event.preventDefault();
                            ipcRenderer.send("execute:command:ext", "kubectl describe pod " + pod.name);
                        });
                        linkDesc.appendChild(iconDesc);
                        tdAction.appendChild(linkDesc);
                
                        tr.appendChild(tdAction);

                        // NAME
                        let tdName = document.createElement("td");
                        let nameTxt = document.createElement("span");
                        nameTxt.innerHTML = pod.name;
                        nameTxt.id = pod.name + "-pod";
                        tdName.appendChild(nameTxt);

                        // Copy to clipboard link
                        let copyToClipboardLink = document.createElement("a");
                        copyToClipboardLink.href = "#";
                        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
                        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
                        tdName.appendChild(copyToClipboardLink);

                        tr.appendChild(tdName);

                         // IP
                         let tdIP = document.createElement("td");
                         let IPTxt = document.createElement("span");
                         IPTxt.innerHTML = pod.ip;
                         tdIP.appendChild(IPTxt);
                         tr.appendChild(tdIP);
 

                        // READY
                        let tdReady = document.createElement("td");
                        let ReadyTxt = document.createTextNode(pod.ready);
                        tdReady.appendChild(ReadyTxt);
                        tr.appendChild(tdReady);

                        // STATUS
                        let tdStatus = document.createElement("td");
                        let StatusTxt = document.createTextNode(pod.status);
                        tdStatus.appendChild(StatusTxt);
                        tr.appendChild(tdStatus);

                        // Set the color depending on the status
                        if(isFailedStatus(pod.status)) {
                            tr.setAttribute("style", "color: red;");
                        }

                        // RESTARTS
                        let tdRestart = document.createElement("td");
                        let RestartTxt = document.createTextNode(pod.restarts);
                        tdRestart.appendChild(RestartTxt);
                        tr.appendChild(tdRestart);

                        // AGE
                        let tdAge = document.createElement("td");
                        let AgeTxt = document.createTextNode(pod.age);
                        tdAge.appendChild(AgeTxt);
                        tr.appendChild(tdAge);

                        // NODE
                        let tdNode = document.createElement("td");
                        let nodeSpan = document.createElement('span');
                        nodeSpan.innerHTML = shorten(pod.node);
                        // nodeSpan.style.title = pod.name;
                        nodeSpan.setAttribute('data-tooltip', pod.node);
                        tdNode.appendChild(nodeSpan);
                        tr.appendChild(tdNode);

                        let tdDelete = document.createElement("td");
                        tdDelete.setAttribute("align", "center");
                        // The DELETE icon
                        let iconDelete = document.createElement("i");
                        iconDelete.setAttribute("class", "fas fa-trash-alt");
                        iconDelete.style.color = "RED";
                        iconDelete.setAttribute("title", "Delete POD");
                        // The DELETE link
                        let linkDelete = document.createElement("a");
                        linkDelete.href = "#";
                        linkDelete.addEventListener("click", (event) => {
                            event.preventDefault();
                            const dialogOptions = {
                                title: "Delete POD", 
                                type: 'question', 
                                buttons: ['OK', 'Cancel'], 
                                message: 'Do it?', 
                                detail : "Are you sure you want to delete this POD : " + pod.name + "?",
                                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
                            dialog.showMessageBox(dialogOptions, i => {
                                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete pod " + pod.name);
                            });
                        });
                        linkDelete.appendChild(iconDelete);
                        tdDelete.appendChild(linkDelete);
                        tr.appendChild(tdDelete);

                        tbodyPod.appendChild(tr);
    });
    podsTable.appendChild(tbodyPod);



    // SERVICE //
    const serviceTable = document.querySelector("#serviceList");

    // First delete the SERVICE tbody if any
    let oldTbodyService = serviceTable.querySelector("tbody");
    if(null !== oldTbodyService) {
        console.log("Removing tbody of service list.");
        oldTbodyService.remove();
    }

    // Set the service count
    document.querySelector("#service-count").innerHTML = kube.services.length;

    let tbodyService = document.createElement("tbody");
    kube.services.forEach(service => {

                        let tr = document.createElement("tr");

                        // The ACTION links
                        let tdAction = document.createElement("td");
                        tdAction.setAttribute("align", "center");

                        // The PORT FORWARD icon
                        let iconPortForward = document.createElement("i");
                        iconPortForward.setAttribute("class", "fas fa-arrow-right");
                        iconPortForward.setAttribute("title", "port-forward");
                        // The PORT FORWARD link
                        let linkPortForward = document.createElement("a");
                        linkPortForward.href = "#";
                        linkPortForward.addEventListener("click", (event) => {
                            event.preventDefault();
                            ipcRenderer.send("open:portforward-form", service.name);
                        });
                        linkPortForward.appendChild(iconPortForward);
                        tdAction.appendChild(linkPortForward);
                        // Padding
                        linkPortForward.insertAdjacentHTML('afterend', "&nbsp;&nbsp;&nbsp;&nbsp;");

                        // The DESCRIBE icon
                        let iconDesc = document.createElement("i");
                        iconDesc.setAttribute("class", "fas fa-question-circle");
                        iconDesc.setAttribute("title", "Describe SERVICE");
                        // The DESCRIBE link
                        let linkDesc = document.createElement("a");
                        linkDesc.href = "#";
                        linkDesc.addEventListener("click", (event) => {
                            event.preventDefault();
                            ipcRenderer.send("execute:command:ext", "kubectl describe service " + service.name);
                        });
                        linkDesc.appendChild(iconDesc);
                        tdAction.appendChild(linkDesc);

                        tr.appendChild(tdAction);

                        
                        // NAME
                        let tdName = document.createElement("td");
                        let nameTxt = document.createElement("span");
                        nameTxt.id = service.name + "-service";
                        nameTxt.innerHTML = service.name;
                        tdName.appendChild(nameTxt);

                        // Copy to clipboard link
                        let copyToClipboardLink = document.createElement("a");
                        copyToClipboardLink.href = "#";
                        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
                        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
                        tdName.appendChild(copyToClipboardLink);

                        tr.appendChild(tdName);

                        // TYPE
                        let tdType = document.createElement("td");
                        let TypeTxt = document.createTextNode(service.type);
                        tdType.appendChild(TypeTxt);
                        tr.appendChild(tdType);
    

                        // CLUSTER-IP
                        let tdClusterIp = document.createElement("td");
                        let clusterIpTxt = document.createTextNode(service.clusterIp);
                        tdClusterIp.appendChild(clusterIpTxt);
                        tr.appendChild(tdClusterIp);

                        // EXTERNAL-IP
                        let tdExternalIp = document.createElement("td");
                        let externalIpTxt = document.createTextNode(service.externalIp);
                        tdExternalIp.appendChild(externalIpTxt);
                        tr.appendChild(tdExternalIp);

                        // PORTS
                        let tdPorts = document.createElement("td");
                        let portsTxt = document.createTextNode(service.ports);
                        tdPorts.appendChild(portsTxt);
                        tr.appendChild(tdPorts);

                        // AGE
                        let tdAge = document.createElement("td");
                        let AgeTxt = document.createTextNode(service.age);
                        tdAge.appendChild(AgeTxt);
                        tr.appendChild(tdAge);

                        // SELECTOR
                        let tdSelector = document.createElement("td");
                        let selectorTxt = document.createTextNode(service.selector);
                        tdSelector.appendChild(selectorTxt);
                        tr.appendChild(tdSelector);

                        // DELETE
                        let tdDelete = document.createElement("td");
                        tdDelete.setAttribute("align", "center");
                        // The DELETE icon
                        let iconDelete = document.createElement("i");
                        iconDelete.setAttribute("class", "fas fa-trash-alt");
                        iconDelete.style.color = "RED";
                        iconDelete.setAttribute("title", "Delete Service");
                        // The DELETE link
                        let linkDelete = document.createElement("a");
                        linkDelete.href = "#";
                        linkDelete.addEventListener("click", (event) => {
                            event.preventDefault();

                            const dialogOptions = {
                                title: "Delete Service", 
                                type: 'question', 
                                buttons: ['OK', 'Cancel'], 
                                message: 'Do it?', 
                                detail : "Are you sure you want to delete this service : " + service.name + "?",
                                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
                            dialog.showMessageBox(dialogOptions, i => {
                                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete service " + service.name);
                            });

                        });
                        linkDelete.appendChild(iconDelete);
                        tdDelete.appendChild(linkDelete);
                        tr.appendChild(tdDelete);

                        tbodyService.appendChild(tr);

    });
    serviceTable.appendChild(tbodyService);




    // DEPLOYMENT //
    const deploymentTable = document.querySelector("#deploymentList");

    // First delete the DEPLOYMENT tbody if any
    let oldTbodyDeployment = deploymentTable.querySelector("tbody");
    if(null !== oldTbodyDeployment) {
        console.log("Removing tbody of deployment list.");
        oldTbodyDeployment.remove();
    }

    // Set the deployment count
    document.querySelector("#deployment-count").innerHTML = kube.deployments.length;

    let tbodyDeployment = document.createElement("tbody");
    kube.deployments.forEach(deployment => {

                        let tr = document.createElement("tr");
                        
                        // The ACTION links
                        let tdAction = document.createElement("td");
                        tdAction.setAttribute("align", "center");

                        // The DESCRIBE icon
                        let iconDesc = document.createElement("i");
                        iconDesc.setAttribute("class", "fas fa-question-circle");
                        iconDesc.setAttribute("title", "Describe DEPLOYMENT");
                        // The DESCRIBE link
                        let linkDesc = document.createElement("a");
                        linkDesc.href = "#";
                        linkDesc.addEventListener("click", (event) => {
                            event.preventDefault();
                            ipcRenderer.send("execute:command:ext", "kubectl describe deployment " + deployment.name);
                        });
                        linkDesc.appendChild(iconDesc);
                        tdAction.appendChild(linkDesc);

                        tr.appendChild(tdAction);

                        // NAME
                        let tdName = document.createElement("td");
                        let nameTxt = document.createElement("span");
                        nameTxt.id = deployment.name + "-deployment";
                        nameTxt.innerHTML = deployment.name;
                        tdName.appendChild(nameTxt);

                        // Copy to clipboard link
                        let copyToClipboardLink = document.createElement("a");
                        copyToClipboardLink.href = "#";
                        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
                        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
                        tdName.appendChild(copyToClipboardLink);

                        tr.appendChild(tdName);

                        // READY
                        let tdReady = document.createElement("td");
                        let ReadyTxt = document.createTextNode(deployment.ready);
                        tdReady.appendChild(ReadyTxt);
                        tr.appendChild(tdReady);
    

                        // UP-TO-DATE
                        let tdUpToDate = document.createElement("td");
                        let UpToDateTxt = document.createTextNode(deployment.upToDate);
                        tdUpToDate.appendChild(UpToDateTxt);
                        tr.appendChild(tdUpToDate);


                        // AVAILABLE
                        let tdAvailable = document.createElement("td");
                        let AvailableTxt = document.createTextNode(deployment.available);
                        tdAvailable.appendChild(AvailableTxt);
                        tr.appendChild(tdAvailable);


                        // AGE
                        let tdAge = document.createElement("td");
                        let AgeTxt = document.createTextNode(deployment.age);
                        tdAge.appendChild(AgeTxt);
                        tr.appendChild(tdAge);

                        // CONTAINERS
                        let tdContainers = document.createElement("td");
                        let ContainersTxt = document.createTextNode(deployment.containers);
                        tdContainers.appendChild(ContainersTxt);
                        tr.appendChild(tdContainers);


                        // IMAGES
                        let tdImages = document.createElement("td");
                        let ImagesTxt = document.createTextNode(deployment.images);
                        tdImages.appendChild(ImagesTxt);
                        tr.appendChild(tdImages);


                        // SELECTOR
                        let tdSelector = document.createElement("td");
                        let SelectorTxt = document.createTextNode(deployment.selector);
                        tdSelector.appendChild(SelectorTxt);
                        tr.appendChild(tdSelector);

                        // DELETE
                        let tdDelete = document.createElement("td");
                        tdDelete.setAttribute("align", "center");
                        // The DELETE icon
                        let iconDelete = document.createElement("i");
                        iconDelete.setAttribute("class", "fas fa-trash-alt");
                        iconDelete.style.color = "RED";
                        iconDelete.setAttribute("title", "Delete Deployment");
                        // The DELETE link
                        let linkDelete = document.createElement("a");
                        linkDelete.href = "#";
                        linkDelete.addEventListener("click", (event) => {
                            event.preventDefault();

                            const dialogOptions = {
                                title: "Delete Deployment", 
                                type: 'question', 
                                buttons: ['OK', 'Cancel'], 
                                message: 'Do it?', 
                                detail : "Are you sure you want to delete this deployment : " + deployment.name + "?",
                                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
                            dialog.showMessageBox(dialogOptions, i => {
                                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete deployment " + deployment.name);
                            });
                        });
                        linkDelete.appendChild(iconDelete);
                        tdDelete.appendChild(linkDelete);
                        tr.appendChild(tdDelete);

                        tbodyDeployment.appendChild(tr);

    });
    deploymentTable.appendChild(tbodyDeployment);
    
 
 
 
    // REPLICASET //
    const replicasetTable = document.querySelector("#replicasetList");

    // First delete the replicaset tbody if any
    let oldTbodyReplicaset = replicasetTable.querySelector("tbody");
    if(null !== oldTbodyReplicaset) {
        console.log("Removing tbody of replicaset list.");
        oldTbodyReplicaset.remove();
    }

    // Set the replicaset count
    document.querySelector("#replicaset-count").innerHTML = kube.deployments.length;

    let tbodyReplicaset = document.createElement("tbody");
    kube.replicasets.forEach(replicaset => {

                        let tr = document.createElement("tr");
                        
                         // The ACTION links
                         let tdAction = document.createElement("td");
                         tdAction.setAttribute("align", "center");
 
                         // The DESCRIBE icon
                         let iconDesc = document.createElement("i");
                         iconDesc.setAttribute("class", "fas fa-question-circle");
                         iconDesc.setAttribute("title", "Describe REPLICASET");
                         // The DESCRIBE link
                         let linkDesc = document.createElement("a");
                         linkDesc.href = "#";
                         linkDesc.addEventListener("click", (event) => {
                             event.preventDefault();
                             ipcRenderer.send("execute:command:ext", "kubectl describe replicaset " + replicaset.name);
                         });
                         linkDesc.appendChild(iconDesc);
                         tdAction.appendChild(linkDesc);
 
                         tr.appendChild(tdAction);
 

                        // NAME
                        let tdName = document.createElement("td");
                        let nameTxt = document.createElement("span");
                        nameTxt.id = replicaset.name + "-replicaset";
                        nameTxt.innerHTML = replicaset.name;
                        tdName.appendChild(nameTxt);

                        // Copy to clipboard link
                        let copyToClipboardLink = document.createElement("a");
                        copyToClipboardLink.href = "#";
                        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
                        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
                        tdName.appendChild(copyToClipboardLink);

                        tr.appendChild(tdName);

                        // DESIRED
                        let tdDesired = document.createElement("td");
                        let DesiredTxt = document.createTextNode(replicaset.desired);
                        tdDesired.appendChild(DesiredTxt);
                        tr.appendChild(tdDesired);
    

                        // CURRENT
                        let tdCurrent = document.createElement("td");
                        let CurrentTxt = document.createTextNode(replicaset.current);
                        tdCurrent.appendChild(CurrentTxt);
                        tr.appendChild(tdCurrent);

                        // READY
                        let tdReady = document.createElement("td");
                        let ReadyTxt = document.createTextNode(replicaset.ready);
                        tdReady.appendChild(ReadyTxt);
                        tr.appendChild(tdReady);

                        // AGE
                        let tdAge = document.createElement("td");
                        let AgeTxt = document.createTextNode(replicaset.age);
                        tdAge.appendChild(AgeTxt);
                        tr.appendChild(tdAge);

                        // CONTAINERS
                        let tdContainers = document.createElement("td");
                        let ContainersTxt = document.createTextNode(replicaset.containers);
                        tdContainers.appendChild(ContainersTxt);
                        tr.appendChild(tdContainers);

                        // IMAGES
                        let tdImages = document.createElement("td");
                        let ImagesTxt = document.createTextNode(replicaset.images);
                        tdImages.appendChild(ImagesTxt);
                        tr.appendChild(tdImages);

                        tbodyReplicaset.appendChild(tr);

    });
    replicasetTable.appendChild(tbodyReplicaset);

    


    // STATEFULSETS //
    const statefulSetTable = document.querySelector("#statefulsetList");

    // First delete the statefulset tbody if any
    let oldTbodyStateFulSet = statefulSetTable.querySelector("tbody");
    if(null !== oldTbodyStateFulSet) {
        console.log("Removing tbody of statefulset list.");
        oldTbodyStateFulSet.remove();
    }

    // Set the statefulset count
    document.querySelector("#statefulset-count").innerHTML = kube.stateFulSets.length;

    let tbodyStatefulset = document.createElement("tbody");
    kube.stateFulSets.forEach(statefulset => {

                        let tr = document.createElement("tr");
                        
                         // The ACTION links
                         let tdAction = document.createElement("td");
                         tdAction.setAttribute("align", "center");
 
                         // The DESCRIBE icon
                         let iconDesc = document.createElement("i");
                         iconDesc.setAttribute("class", "fas fa-question-circle");
                         iconDesc.setAttribute("title", "Describe STATEFULSET");
                         // The DESCRIBE link
                         let linkDesc = document.createElement("a");
                         linkDesc.href = "#";
                         linkDesc.addEventListener("click", (event) => {
                             event.preventDefault();
                             ipcRenderer.send("execute:command:ext", "kubectl describe statefulset " + statefulset.name);
                         });
                         linkDesc.appendChild(iconDesc);
                         tdAction.appendChild(linkDesc);
 
                         tr.appendChild(tdAction);
 

                        // NAME
                        let tdName = document.createElement("td");
                        let nameTxt = document.createElement("span");
                        nameTxt.id = statefulset.name + "-statefulset";
                        nameTxt.innerHTML = statefulset.name;
                        tdName.appendChild(nameTxt);

                        // Copy to clipboard link
                        let copyToClipboardLink = document.createElement("a");
                        copyToClipboardLink.href = "#";
                        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
                        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
                        tdName.appendChild(copyToClipboardLink);

                        tr.appendChild(tdName);

                        // READY
                        let tdReady = document.createElement("td");
                        let ReadyTxt = document.createTextNode(statefulset.ready);
                        tdReady.appendChild(ReadyTxt);
                        tr.appendChild(tdReady);
    
                        // AGE
                        let tdAge = document.createElement("td");
                        let AgeTxt = document.createTextNode(statefulset.age);
                        tdAge.appendChild(AgeTxt);
                        tr.appendChild(tdAge);

                        // CONTAINERS
                        let tdContainers = document.createElement("td");
                        let ContainersTxt = document.createTextNode(statefulset.containers);
                        tdContainers.appendChild(ContainersTxt);
                        tr.appendChild(tdContainers);

                        // IMAGES
                        let tdImages = document.createElement("td");
                        let ImagesTxt = document.createTextNode(statefulset.images);
                        tdImages.appendChild(ImagesTxt);
                        tr.appendChild(tdImages);

                        // DELETE
                        let tdDelete = document.createElement("td");
                        tdDelete.setAttribute("align", "center");
                        // The DELETE icon
                        let iconDelete = document.createElement("i");
                        iconDelete.setAttribute("class", "fas fa-trash-alt");
                        iconDelete.style.color = "RED";
                        iconDelete.setAttribute("title", "Delete Deployment");
                        // The DELETE link
                        let linkDelete = document.createElement("a");
                        linkDelete.href = "#";
                        linkDelete.addEventListener("click", (event) => {
                            event.preventDefault();

                            const dialogOptions = {
                                title: "Delete Statefulset", 
                                type: 'question', 
                                buttons: ['OK', 'Cancel'], 
                                message: 'Do it?', 
                                detail : "Are you sure you want to delete this statefulset : " + statefulset.name + "?",
                                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
                            dialog.showMessageBox(dialogOptions, i => {
                                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete statefulset " + statefulset.name);
                            });
                        });
                        linkDelete.appendChild(iconDelete);
                        tdDelete.appendChild(linkDelete);
                        tr.appendChild(tdDelete);

                        tbodyStatefulset.appendChild(tr);

    });
    statefulSetTable.appendChild(tbodyStatefulset);



    // DAEMONSETS //
    const daemonSetTable = document.querySelector("#daemonsetList");

    // First delete the daemonset tbody if any
    let oldTbodyDaemonSet = daemonSetTable.querySelector("tbody");
    if(null !== oldTbodyDaemonSet) {
        console.log("Removing tbody of daemonset list.");
        oldTbodyDaemonSet.remove();
    }

    // Set the daemonset count
    document.querySelector("#daemonset-count").innerHTML = kube.daemonSets.length;

    let tbodyDaemonset = document.createElement("tbody");
    kube.daemonSets.forEach(daemonset => {

        let tr = document.createElement("tr");
        
            // The ACTION links
            let tdAction = document.createElement("td");
            tdAction.setAttribute("align", "center");

            // The DESCRIBE icon
            let iconDesc = document.createElement("i");
            iconDesc.setAttribute("class", "fas fa-question-circle");
            iconDesc.setAttribute("title", "Describe DAEMONSET");
            // The DESCRIBE link
            let linkDesc = document.createElement("a");
            linkDesc.href = "#";
            linkDesc.addEventListener("click", (event) => {
                event.preventDefault();
                ipcRenderer.send("execute:command:ext", "kubectl describe daemonset " + daemonset.name);
            });
            linkDesc.appendChild(iconDesc);
            tdAction.appendChild(linkDesc);

            tr.appendChild(tdAction);


        // NAME
        let tdName = document.createElement("td");
        let nameTxt = document.createElement("span");
        nameTxt.id = daemonset.name + "-daemonset";
        nameTxt.innerHTML = daemonset.name;
        tdName.appendChild(nameTxt);

        // Copy to clipboard link
        let copyToClipboardLink = document.createElement("a");
        copyToClipboardLink.href = "#";
        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
        tdName.appendChild(copyToClipboardLink);

        tr.appendChild(tdName);

        // REFERENCE
        let tdReference = document.createElement("td");
        let referenceTxt = document.createTextNode(daemonset.reference);
        tdReference.appendChild(referenceTxt);
        tr.appendChild(tdReference);

        // TARGETS
        let tdTargets = document.createElement("td");
        let targetsTxt = document.createTextNode(daemonset.targets);
        tdTargets.appendChild(targetsTxt);
        tr.appendChild(tdTargets);

        // MINPODS
        let tdMinpods = document.createElement("td");
        let minpodsTxt = document.createTextNode(daemonset.minpods);
        tdMinpods.appendChild(minpodsTxt);
        tr.appendChild(tdMinpods);

        // MAXPODS
        let tdMaxpods = document.createElement("td");
        let maxpodsTxt = document.createTextNode(daemonset.maxpods);
        tdMaxpods.appendChild(maxpodsTxt);
        tr.appendChild(tdMaxpods);
        
        // REPLICAS
        let tdReplicas = document.createElement("td");
        let replicasTxt = document.createTextNode(daemonset.replicas);
        tdReplicas.appendChild(replicasTxt);
        tr.appendChild(tdReplicas);
        
        // AGE
        let tdAge = document.createElement("td");
        let ageTxt = document.createTextNode(daemonset.age);
        tdAge.appendChild(ageTxt);
        tr.appendChild(tdAge);

        // DELETE
        let tdDelete = document.createElement("td");
        tdDelete.setAttribute("align", "center");
        // The DELETE icon
        let iconDelete = document.createElement("i");
        iconDelete.setAttribute("class", "fas fa-trash-alt");
        iconDelete.style.color = "RED";
        iconDelete.setAttribute("title", "Delete Deployment");
        // The DELETE link
        let linkDelete = document.createElement("a");
        linkDelete.href = "#";
        linkDelete.addEventListener("click", (event) => {
            event.preventDefault();

            const dialogOptions = {
                title: "Delete Daemonset", 
                type: 'question', 
                buttons: ['OK', 'Cancel'], 
                message: 'Do it?', 
                detail : "Are you sure you want to delete this daemonset : " + daemonset.name + "?",
                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
            dialog.showMessageBox(dialogOptions, i => {
                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete daemonset " + daemonset.name);
            });
        });
        linkDelete.appendChild(iconDelete);
        tdDelete.appendChild(linkDelete);
        tr.appendChild(tdDelete);

        tbodyDaemonset.appendChild(tr);

    });
    daemonSetTable.appendChild(tbodyDaemonset);



    // JOBS //
    const jobTable = document.querySelector("#jobList");

    // First delete the job tbody if any
    let oldTbodyJob = jobTable.querySelector("tbody");
    if(null !== oldTbodyJob) {
        console.log("Removing tbody of job list.");
        oldTbodyJob.remove();
    }

    // Set the job count
    document.querySelector("#job-count").innerHTML = kube.jobs.length;

    let tbodyJob = document.createElement("tbody");
    kube.jobs.forEach(job => {

        let tr = document.createElement("tr");
        
            // The ACTION links
            let tdAction = document.createElement("td");
            tdAction.setAttribute("align", "center");

            // The DESCRIBE icon
            let iconDesc = document.createElement("i");
            iconDesc.setAttribute("class", "fas fa-question-circle");
            iconDesc.setAttribute("title", "Describe JOB");
            // The DESCRIBE link
            let linkDesc = document.createElement("a");
            linkDesc.href = "#";
            linkDesc.addEventListener("click", (event) => {
                event.preventDefault();
                ipcRenderer.send("execute:command:ext", "kubectl describe job " + job.name);
            });
            linkDesc.appendChild(iconDesc);
            tdAction.appendChild(linkDesc);

            tr.appendChild(tdAction);


        // NAME
        let tdName = document.createElement("td");
        let nameTxt = document.createElement("span");
        nameTxt.id = job.name + "-job";
        nameTxt.innerHTML = job.name;
        tdName.appendChild(nameTxt);

        // Copy to clipboard link
        let copyToClipboardLink = document.createElement("a");
        copyToClipboardLink.href = "#";
        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
        tdName.appendChild(copyToClipboardLink);

        tr.appendChild(tdName);

        // COMPLETIONS
        let tdCompletion = document.createElement("td");
        let completionTxt = document.createTextNode(job.completions);
        tdCompletion.appendChild(completionTxt);
        tr.appendChild(tdCompletion);

        // DURATION
        let tdDuration = document.createElement("td");
        let durationTxt = document.createTextNode(job.duration);
        tdDuration.appendChild(durationTxt);
        tr.appendChild(tdDuration);

        // AGE
        let tdAge = document.createElement("td");
        let ageTxt = document.createTextNode(job.age);
        tdAge.appendChild(ageTxt);
        tr.appendChild(tdAge);

        // CONTAINERS
        let tdContainers = document.createElement("td");
        let containersTxt = document.createTextNode(job.containers);
        tdContainers.appendChild(containersTxt);
        tr.appendChild(tdContainers);

        // IMAGES
        let tdImages = document.createElement("td");
        let imagesTxt = document.createTextNode(job.images);
        tdImages.appendChild(imagesTxt);
        tr.appendChild(tdImages);
        
        // SELECTOR
        let tdSelector = document.createElement("td");
        let selectorTxt = document.createTextNode(job.selector);
        tdSelector.appendChild(selectorTxt);
        tr.appendChild(tdSelector);
    

        // DELETE
        let tdDelete = document.createElement("td");
        tdDelete.setAttribute("align", "center");
        // The DELETE icon
        let iconDelete = document.createElement("i");
        iconDelete.setAttribute("class", "fas fa-trash-alt");
        iconDelete.style.color = "RED";
        iconDelete.setAttribute("title", "Delete Deployment");
        // The DELETE link
        let linkDelete = document.createElement("a");
        linkDelete.href = "#";
        linkDelete.addEventListener("click", (event) => {
            event.preventDefault();

            const dialogOptions = {
                title: "Delete Job", 
                type: 'question', 
                buttons: ['OK', 'Cancel'], 
                message: 'Do it?', 
                detail : "Are you sure you want to delete this job : " + job.name + "?",
                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
            dialog.showMessageBox(dialogOptions, i => {
                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete job " + job.name);
            });
        });
        linkDelete.appendChild(iconDelete);
        tdDelete.appendChild(linkDelete);
        tr.appendChild(tdDelete);

        tbodyJob.appendChild(tr);

    });
    jobTable.appendChild(tbodyJob);

    

    // CRONJOBS //
    const cronjobTable = document.querySelector("#cronjobList");

    // First delete the cronjob tbody if any
    let oldTbodyCronjob = cronjobTable.querySelector("tbody");
    if(null !== oldTbodyCronjob) {
        console.log("Removing tbody of cronjob list.");
        oldTbodyCronjob.remove();
    }

    // Set the cronjob count
    document.querySelector("#cronjob-count").innerHTML = kube.cronjobs.length;

    let tbodyCronjob = document.createElement("tbody");
    kube.cronjobs.forEach(cronjob => {

        let tr = document.createElement("tr");
        
        // The ACTION links
        let tdAction = document.createElement("td");
        tdAction.setAttribute("align", "center");

        // The DESCRIBE icon
        let iconDesc = document.createElement("i");
        iconDesc.setAttribute("class", "fas fa-question-circle");
        iconDesc.setAttribute("title", "Describe CRONJOB");
        // The DESCRIBE link
        let linkDesc = document.createElement("a");
        linkDesc.href = "#";
        linkDesc.addEventListener("click", (event) => {
            event.preventDefault();
            ipcRenderer.send("execute:command:ext", "kubectl describe cronjob " + cronjob.name);
        });
        linkDesc.appendChild(iconDesc);
        tdAction.appendChild(linkDesc);

        tr.appendChild(tdAction);


        // NAME
        let tdName = document.createElement("td");
        let nameTxt = document.createElement("span");
        nameTxt.id = cronjob.name + "-cronjob";
        nameTxt.innerHTML = cronjob.name;
        tdName.appendChild(nameTxt);

        // Copy to clipboard link
        let copyToClipboardLink = document.createElement("a");
        copyToClipboardLink.href = "#";
        copyToClipboardLink.innerHTML = '&nbsp;&nbsp;<i class="fas fa-copy"></i>';
        copyToClipboardLink.addEventListener("click", e => copyText(nameTxt));
        tdName.appendChild(copyToClipboardLink);

        tr.appendChild(tdName);

        // SCHEDULE
        let tdSchedule = document.createElement("td");
        let scheduleTxt = document.createTextNode(cronjob.schedule);
        tdSchedule.appendChild(scheduleTxt);
        tr.appendChild(tdSchedule);

        // SUSPEND
        let tdSuspend = document.createElement("td");
        let durationTxt = document.createTextNode(cronjob.suspend);
        tdSuspend.appendChild(durationTxt);
        tr.appendChild(tdSuspend);

        // ACTIVE
        let tdActive = document.createElement("td");
        let activeTxt = document.createTextNode(cronjob.active);
        tdActive.appendChild(activeTxt);
        tr.appendChild(tdActive);

        // LAST SCHEDULE
        let tdLastSchedule = document.createElement("td");
        let lastScheduleTxt = document.createTextNode(cronjob.lastschedule);
        tdLastSchedule.appendChild(lastScheduleTxt);
        tr.appendChild(tdLastSchedule);

        // AGE
        let tdAge = document.createElement("td");
        let ageTxt = document.createTextNode(cronjob.age);
        tdAge.appendChild(ageTxt);
        tr.appendChild(tdAge);

        // CONTAINERS
        let tdContainers = document.createElement("td");
        let containersTxt = document.createTextNode(cronjob.containers);
        tdContainers.appendChild(containersTxt);
        tr.appendChild(tdContainers);

        // IMAGES
        let tdImages = document.createElement("td");
        let imagesTxt = document.createTextNode(cronjob.images);
        tdImages.appendChild(imagesTxt);
        tr.appendChild(tdImages);
        
        // SELECTOR
        let tdSelector = document.createElement("td");
        let selectorTxt = document.createTextNode(cronjob.selector);
        tdSelector.appendChild(selectorTxt);
        tr.appendChild(tdSelector);
    

        // DELETE
        let tdDelete = document.createElement("td");
        tdDelete.setAttribute("align", "center");
        // The DELETE icon
        let iconDelete = document.createElement("i");
        iconDelete.setAttribute("class", "fas fa-trash-alt");
        iconDelete.style.color = "RED";
        iconDelete.setAttribute("title", "Delete Cronjob");
        // The DELETE link
        let linkDelete = document.createElement("a");
        linkDelete.href = "#";
        linkDelete.addEventListener("click", (event) => {
            event.preventDefault();

            const dialogOptions = {
                title: "Delete Cronjob", 
                type: 'question', 
                buttons: ['OK', 'Cancel'], 
                message: 'Do it?', 
                detail : "Are you sure you want to delete this cronjob : " + cronjob.name + "?",
                icon: path.join(__dirname, 'assets', 'icons', 'icon_delete.png')}
            dialog.showMessageBox(dialogOptions, i => {
                if(i == 0) ipcRenderer.send("execute:command:ext", "kubectl delete cronjob " + cronjob.name);
            });
        });
        linkDelete.appendChild(iconDelete);
        tdDelete.appendChild(linkDelete);
        tr.appendChild(tdDelete);

        tbodyCronjob.appendChild(tr);

    });
    cronjobTable.appendChild(tbodyCronjob);
    

    console.log('The loading screen should go away now...');
    // Hide the progress bar
    document.querySelector("#progress").style.display ="none";
    // Show the tables
    kubeContainer.style.display = "block";
    // Show the refresh button
    refreshBtn.style.display = 'block';
    // Show the context menu
    // contextMenu.style.display = "flex";
    // Show the namespace menue
    // namespaceMenu.style.display = 'flex';
});

ipcRenderer.on("showLoading", e => {
    // Show the progress bar
    document.querySelector("#progress").style.display ="block";
    // Hide the data tables and the refresh button
    kubeContainer.style.display = "none";
    refreshBtn.style.display = "none";
    // contextMenu.style.display = "none";
    // namespaceMenu.style.display = 'none';
});


const podContainer = document.getElementById('pod-container');
const serviceContainer = document.getElementById('service-container');
const deploymentContainer = document.getElementById('deployment-container');
const replicasetContainer = document.getElementById('replicaset-container');
const stateFulSetContainer = document.getElementById('statefulset-container');
const daemonSetContainer = document.getElementById('daemonset-container');
const jobContainer = document.getElementById('job-container');
const cronjobContainer = document.getElementById('cronjob-container');


const links = document.querySelectorAll('a.navbar-item');

links.forEach(a => a.addEventListener("click", e => {

    switch(e.target.innerHTML) {
        case 'POD' : showOneHideOthers(podContainer); break;
        case 'SERVICE' : showOneHideOthers(serviceContainer); break;
        case 'DEPLOYMENT' : showOneHideOthers(deploymentContainer); break;
        case 'REPLICASET' : showOneHideOthers(replicasetContainer); break;
        case 'STATEFULSET' : showOneHideOthers(stateFulSetContainer); break;
        case 'DAEMONSET' : showOneHideOthers(daemonSetContainer); break;
        case 'JOB' : showOneHideOthers(jobContainer); break;
        case 'CRONJOB' : showOneHideOthers(cronjobContainer); break;
    }
})
);

document.querySelector("#workloads-link")
        .querySelectorAll("a.navbar-item")
        .forEach(element => {
            element.addEventListener("click", e => {
                switch(e.target.innerHTML) {
                    case 'POD' : showOneHideOthers(podContainer); break;
                    case 'SERVICE' : showOneHideOthers(serviceContainer); break;
                    case 'DEPLOYMENT' : showOneHideOthers(deploymentContainer); break;
                    case 'REPLICASET' : showOneHideOthers(replicasetContainer); break;
                    case 'STATEFULSET' : showOneHideOthers(stateFulSetContainer); break;
                    case 'DAEMONSET' : showOneHideOthers(daemonSetContainer); break;
                    case 'JOB' : showOneHideOthers(jobContainer); break;
                    case 'CRONJOB' : showOneHideOthers(cronjobContainer); break;
                }
            });
        }
);

const showOneHideOthers = (container) => {
    podContainer.style.display = 'none';
    serviceContainer.style.display = 'none';
    deploymentContainer.style.display = 'none';
    replicasetContainer.style.display = 'none';
    stateFulSetContainer.style.display = 'none';
    daemonSetContainer.style.display = 'none';
    jobContainer.style.display = 'none';
    cronjobContainer.style.display = 'none';
    container.style.display = 'block';
}

// Copy text to clipboard
const copyText = (el) => {
    if (document.selection) { 
        var range = document.body.createTextRange();
        range.moveToElementText(el);
        range.select().createTextRange();
        document.execCommand("copy"); 
    
    } else if (window.getSelection) {
        var range = document.createRange();
         range.selectNode(el);
         window.getSelection().addRange(range);
         document.execCommand("copy");
    }

    if (window.getSelection) {window.getSelection().removeAllRanges();}
    else if (document.selection) {document.selection.empty();}
}

// String shortening
const shorten = (input) => {
    if(input.length > 24) {
        return `${input.substring(0,10)}  ...  ${input.substring(input.length - 10, input.length)}`;
    } else {
        return input;
    }
}

const isFailedStatus = status => {
    return (status == "CrashLoopBackOff" || status == "Evicted" || status == "Failed");
}