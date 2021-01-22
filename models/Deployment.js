class Deployment {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");
        
        // The model class
        let deployment =  new Deployment();
        deployment.name = arr[0].split("deployment.apps/")[1]; // NAME
        deployment.desired = arr[1]; // DESIRED
        deployment.current = arr[2]; // CURRENT
        deployment.upToDate = arr[3]; // UP-TO-DATE
        deployment.available = arr[4]; // AVAILABLE
        deployment.age = arr[5]; // AGE
        deployment.containers = arr[6]; // CONTAINERS
        deployment.images = arr[7]; // IMAGES

        return deployment;
    }
}

module.exports = Deployment;