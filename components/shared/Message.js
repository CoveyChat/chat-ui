
export default class Message {
    constructor() {}

    static pack(data, type) {
        var validTypes = [
            'message', 'event', 'file'
        ];
        if(validTypes.includes(type)) {
            return JSON.stringify({type: type, data: data});
        } else {
            throw 'Invalid message type!';
        }
    }

    //Data comes in as a Uint8Array Buffer
    static unpack(data) {
        //Already unpacked
        if(typeof(data) == 'string') {
            return JSON.parse(data);
        }
        //Data comes in as a buffer
        return JSON.parse(data.toString());
    }

    static broadcast(connections, message) {
        if(message == '' || Object.keys(connections).length == 0) {
            return false;
        }

        console.log("Broadcasting to (" + Object.keys(connections).length + ") open connections");

        for(var id in connections) {
            var conn = connections[id].connection;
            if(conn == null || !conn.connected || conn.destroyed) {
                console.log("Tried sending through bad connection id " + id);
                console.log(connections);
                console.log(conn);
                console.log("Connected " + conn.connected);
                console.log("Destroyed " + conn.destroyed);
                delete connections[id];
                continue;
            }

            console.log("Sending to " + id);
            conn.send(message);
        }

        //After deleting any bad connections, if there's any left that we sent to then return true
        return Object.keys(connections).length > 0;


    }
}