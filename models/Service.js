class Service {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");

        let service = new Service();
        service.name = arr[0].split("service/")[1]; // NAME
        service.type = arr[1]; // TYPE
        service.clusterIp = arr[2]; // CLUSTER-IP
        service.externalIp = arr[3]; // EXTERNAL-IP
        service.ports = arr[4].split(/[:/]+/); // PORT(S)
        service.age = arr[5]; // AGE
        service.selector = arr[6]; // SELECTOR

        return service;
    }
}

module.exports = Service;