class Node {

    constructor() {}
 
//     NAME                 STATUS   ROLES           AGE   VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION                       CONTAINER-RUNTIME
// cluster2-control-plane   Ready    control-plane   21h   v1.29.2   172.19.0.3    <none>        Debian GNU/Linux 12 (bookworm)   5.15.146.1-microsoft-standard-WSL2   containerd://1.7.13
    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");
        
        // The model class
        const node =  new Node();
        node.name = arr[0]; // NAME
        node.status = arr[1]; // STATUS
        node.roles = arr[2]; // ROLES
        node.age = arr[3]; // AGE
        node.version = arr[4]; // VERSION
        node.internalIP = arr[5]; // INTERNAL-IP
        node.externalIP = arr[6]; // EXTERNAL-IP
        node.osImage = arr[7]; // OS-IMAGE
        node.kernelVersion = arr[8]; // KERNEL-VERSION
        node.containerRuntime = arr[9]; // CONTAINER-RUNTIME
        
        return node;
    }
}

module.exports = Node;