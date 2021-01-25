class Kube {

    pods = []; // PODS
    services = []; // SERVICES
    deployments = []; // DEPLOYMENTS
    replicasets = []; // REPLICASETS
    stateFulSets = []; // STATEFULSETS

    /**
     * This constructor takes the output of the following command as a whole :
     * - kubectl get all -o wide
     * 
     * Returns the Kube model object with the following:
     * - pods
     * - services
     * - deployments
     * - replicasets
     * 
     * @param {*} Kube
     */
    constructor(wholeOutput) {
        let rows = wholeOutput.split("\n"); // Break the output by lines

        // This will store in the following format
        /*
        {
        pod: [
            'name',
            'ready',
            'status',
            'restarts',
            'age',
            'ip',
            'node',
            'nominatednode',
            'readinessgates'
        ],
        service: [
            'name',
            'type',
            'clusterIp',
            'externalIp',
            'ports',
            'age',
            'selector'
        ],
        deployment: [
            'name',
            'ready',
            'upToDate',
            'available',
            'age',
            'containers',
            'images',
            'selector'
        ],
        replicaset: [
            'name',
            'desired',
            'current',
            'ready',
            'age',
            'containers',
            'images',
            'selector'
        ],
        statefulset: [ 'name', 'ready', 'age', 'containers', 'images' ]
        */
        let headerMap = {}; 

        for(let i=0; i < rows.length; i++) {
            const row = rows[i];

            if(row.startsWith('NAME')) {
                // ['name', 'age', 'ready', 'node' ...]
                const headerValues = row.split("  ")
                                    .filter(e => e !== " " && e !== "")
                                    .map(e => camelize(e));

                // Getting the resource type from the next row first field which will like follows:
                // pod/xxx | service/xxx | deployment/xxx ...
                if(i < rows.length) {
                    const resourceType = rows[i+1].split("/")[0].split('.')[0];
                    headerMap[resourceType] = headerValues;
                }
            } else {
                // This row here is a non-header / resource row
                const fieldsValues = row.split(" ").filter(e => e !== " " && e !== "");
                if(fieldsValues.length > 0) {
                    // parsing resource type from `pods/xxx` | resourceType = 'pod'
                    const resourceType = fieldsValues[0].split('/')[0].split('.')[0];
                    const headers = headerMap[resourceType];
                    
                    const resource = {}; // The resource (pod/service/deployment ...)
                    // Building the resource
                    for(let j=0; j < headers.length; j++) {
                        
                        // This is for removing the prefix from the name
                        // pod/xxx -> xxx
                        if(j === 0) {
                            resource[headers[j]] = fieldsValues[j].split('/')[1];
                        } else {
                            resource[headers[j]] = fieldsValues[j];
                        }
                    }

                    // Pushing the resource to the right array
                    switch(resourceType) {
                        case 'pod': this.pods.push(resource); break;
                        case 'service': this.services.push(resource); break;
                        case 'deployment': this.deployments.push(resource); break;
                        case 'replicaset': this.replicasets.push(resource); break;
                        case 'statefulset': this.stateFulSets.push(resource); break;
                    }
                }
            }
        }
    }

}

function camelize(str){
    let arr = str.split('-');
    let capital = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase());
    return cleanup(capital.join(""));
}

function cleanup(input) {
    // This will convert `ports)` to `ports`
    return input.replace(/[^A-Za-z0-9]/g, '');
}

module.exports = Kube;