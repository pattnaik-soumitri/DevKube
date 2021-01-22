class Replicaset {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");

        let replicaset = new Replicaset();

        replicaset.name = arr[0].split("replicaset.apps/")[1]; // NAME
        replicaset.desired = arr[1]; // DESIRED
        replicaset.current = arr[2]; // CURRENT
        replicaset.ready = arr[3]; // READY
        replicaset.age = arr[4]; // AGE
        replicaset.containers = arr[5]; // CONTAINERS
        replicaset.images = arr[6]; // IMAGES

        return replicaset;
    }
}

module.exports = Replicaset;