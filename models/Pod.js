class Pod {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");

        // The model class
        let pod = new Pod();
        pod.name = arr[0].split("pod/")[1]; // name
        pod.ready = arr[1]; //ready
        pod.status = arr[2]; // status
        pod.restarts = arr[3]; // restarts
        pod.age = arr[4]; // age
        pod.ip = arr[5]; // ip
        pod.node = arr[6]; // node
        
        return pod;
    }

    print() {
        console.log("name: ${this.name}")
    }
}

module.exports = Pod;