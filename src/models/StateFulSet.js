class StateFulSet {
 
    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");

        let stateFulSet = new StateFulSet();

        stateFulSet.name = arr[0].split("statefulset.apps/")[1]; // NAME
        stateFulSet.desired = arr[1]; // DESIRED
        stateFulSet.current = arr[2]; // CURRENt
        stateFulSet.age = arr[3]; // AGE
        stateFulSet.containers = arr[4]; // CONTAINERS
        stateFulSet.images = arr[5]; // IMAGES

        return stateFulSet;
    }
}

module.exports = StateFulSet;