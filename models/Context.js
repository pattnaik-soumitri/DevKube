class Context {

    constructor() {}

    static fromOutputRow(outputRow) {
        let arr = outputRow.split(" ").filter(e => e !== " " && e !== "");
        
        console.log(arr);

        // The model class
        let context =  new Context();
        let i = 0;
        if(arr[0] == '*') {
            i = 1;
            context.current = true; // CURRENT
        } else {
            context.current = false;
        }
        
        context.name = arr[i + 0]; // NAME
        context.cluster = arr[i + 1]; // CLUSTER
        context.authorInfo = arr[i + 2]; // AUTHOR-INFO
        context.namespace = arr[i + 3]; // NAMESPACE

        return context;
    }
}

module.exports = Context;