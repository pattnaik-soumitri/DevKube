const Pod = require("./Pod");
const Service = require("./Service");
const Deployment = require("./Deployment");
const Replicaset = require("./Replicaset");
const StateFulSet = require("./StateFulSet");

class Kube {

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

        this.pods = []; // PODS
        this.services = []; // SERVICES
        this.deployments = []; // DEPLOYMENTS
        this.replicasets = []; // REPLICASETS
        this.stateFulSets = []; // STATEFULSETS

        // Iterate though the output rows
        rows.forEach(row => {
            
            if(row.startsWith("pod/")) { // POD ROW
                this.pods.push(Pod.fromOutputRow(row));
            } else if(row.startsWith("service/")) { // SERVICE ROW
                this.services.push(Service.fromOutputRow(row));
            } else if(row.startsWith("deployment.apps/")) { // DEPLOYMENT ROW
                this.deployments.push(Deployment.fromOutputRow(row));
            } else if(row.startsWith("replicaset.apps/")) { // REPLICASET ROW
                this.replicasets.push(Replicaset.fromOutputRow(row));
            } else if(row.startsWith("statefulset.apps/")) { // STATEFULSET ROW
                this.stateFulSets.push(StateFulSet.fromOutputRow(row));
            }
            
        });
    }

}

module.exports = Kube;