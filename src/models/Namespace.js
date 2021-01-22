class Namespace {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");
        
        // The model class
        let namespace =  new Namespace();
        namespace.name = arr[0]; // NAME
        namespace.status = arr[1]; // STATUS
        namespace.age = arr[2]; // AGE
        
        return namespace;
    }
}

module.exports = Namespace;