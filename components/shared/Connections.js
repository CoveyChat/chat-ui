import PeerConnection from '../shared/PeerConnection.js';
import Message from '../shared/Message.js';

export default class Connections {
    static connections = [];
    static io = require('socket.io-client');
    static server = {ip:'devbevy.chat', port:1337, signal: null};
    static user = {};
    static events = [];

    constructor() {}

    static on(name, callback) {
        if(!Connections.events[name]) {
            Connections.events[name] = [];
        }

        // Push the callback to an events list
        Connections.events[name].push(callback);
    }

    static trigger(name, data = null) {
        if(!Connections.events[name]) {
            return;
        }
        ([...Connections.events[name]]).forEach(cb => {
            cb(data);
        })
    }

    static getConnections() {return Connections.connections;}
    static connect(chatId, user) {
        Connections.user = user;

        Connections.server.signal = Connections.io.connect('https://' + Connections.server.ip + ':' + Connections.server.port);

        Connections.server.signal.on('disconnect', function () {
            alert("Uh oh! You disconnected!");
            Connections.connections = [];
        });

        Connections.server.signal.on('connect', function () {
            console.log("Connected to signal server. Sending auth...");
            //Pass to the server that we want to join this chat room with this user
            //It will use the user to annouce to other connections who you are
            Connections.server.signal.emit('join', {chatId: chatId, user: Connections.user.getAuthObject()});
        });

        /**
         * Fires when a new client connects. The new client create a new host peer
         * for every client in the mesh that it needs to connec tto
         */
        Connections.server.signal.on('inithosts', function (numHosts) {
            console.log("init (" + numHosts + ") hosts");

            for(var i=0;i<numHosts;i++) {

                var peer = new PeerConnection(Connections.server.signal, true, Connections.user.preferredBandwidth);
                var id = peer.id;
                console.log("Created host id " + id);

                //Add this peer to the connections[id] and also reactive for vue
                //Vue.$set(Connections.connections, id, peer);
                Connections.connections[id] = peer;

                Connections.connections[id].connection.on('connect', function() {
                    console.log("Connection established between host -> client");

                    //self.ui.sound.play('connect');

                    //self.outputConnections();

                    //if(self.stream.videoenabled || self.stream.screenshareenabled) {
                    //    console.log("Try and send a stream to " + this._id);
                    //    self.sendStream(this._id);
                    //}
                });

                Connections.connections[id].connection.on('close', function() {self.handlePeerDisconnect(this._id);});
                Connections.connections[id].connection.on('error', function() {self.handlePeerDisconnect(this._id);});

                Connections.connections[id].connection.on('data', function(data) {
                    Connections.recieveData(this._id, Connections.connections[this._id].user, data);
                });

                Connections.connections[id].connection.on('stream', function(stream) {
                    //console.log("Recieved peer stream");
                    self.onPeerStream(stream, this._id);
                });
            }
        });

        /**
         * Fires when the client has generated a WebRTC token and it needs to get back to the host
         */
        Connections.server.signal.on('sendtohost', function (obj) {
            //Prevent signals to bad hosts that have closed
            if(typeof Connections.connections[obj.hostid] != 'undefined' && !Connections.connections[obj.hostid].connection.destroyed) {
                //console.log("host - binding returned client info");
                Connections.connections[obj.hostid].signal(obj.webRtcId);
                Connections.connections[obj.hostid].setUser(obj.user);
                Connections.connections[obj.hostid].setClientId(obj.clientid);
            } else {
                console.log("UH OH");
                delete Connections.connections[obj.hostid];
            }
        });

        /**
         * Fires when a host is looking for clients to connect to
         * If there's no open client for this match host one will be created
         */
        Connections.server.signal.on('initclient', function (obj) {
            //console.log("Got request to init a client for host " + obj.hostid);
            var id=obj.hostid;

            //Key to the host id since it can possibly reqest to init a bunch of times during the handshake
            if(typeof Connections.connections[id] == 'undefined') {
                //console.log("Init a peer for host " + id);
                var peer = new PeerConnection(Connections.server.signal, false, Connections.user.preferredBandwidth);

                //self.$set(Connections.connections, id, peer);
                Connections.connections[id] = peer;

                Connections.connections[id].setHostId(obj.hostid);
                Connections.connections[id].setUser(obj.user);

                Connections.connections[id].connection.on('connect', function() {
                    console.log("Connection established between client -> host");
                    //console.log(this);
                    //console.log(Connections.connections[id].user);

                    //self.ui.sound.play('connect');

                    // self.outputConnections();
                    //if(self.stream.videoenabled || self.stream.screenshareenabled) {
                    //    console.log("Try and send a client stream to " + id);
                    //    self.sendStream(id);
                    //}
                });

                Connections.connections[id].connection.on('close', function() {self.handlePeerDisconnect(id);});
                Connections.connections[id].connection.on('error', function() {self.handlePeerDisconnect(id);});

                Connections.connections[id].connection.on('data', function(data) {
                    Connections.recieveData(id, Connections.connections[id].user, data);
                });

                Connections.connections[id].connection.on('stream', stream => {self.onPeerStream(stream, id); });
            }
            //Use the remote host id so that the client is overridden if it re-signals


            //console.log("Signal host (" + obj.hostid + ") connection to client");
            Connections.connections[id].signal(obj.webRtcId);


        });
    }

    static handlePeerDisconnect(id) {
        //let self = this;
        //self.ui.sound.play('disconnect');

        //Set the value to null so vue can compute it before we delete it
        Connections.connections[id] = null;

        delete Connections.connections[id];
        // Used to update the network chart stuff
        // self.outputConnections();
    }

    static sendMessage(message) {
        //console.log('Called message sender');
        if(message != '' && Object.keys(Connections.connections).length > 0) {
            //console.log("Sending");
            //console.log(message);
            if(Message.broadcast(Connections.connections, Message.pack(message, 'message'))) {
                //Write the message we just sent to ourself
                Connections.recieveData(null, Connections.user.getDataObject(), Message.pack(message, 'message'), true);

            } else {
                alert("Something went wrong with sendMessage!");
            }
        }
    }

    static recieveData(id, user, data, writeSelf = false) {
        data = Message.unpack(data);

        if(data.type == 'message') {
            Connections.trigger('message', {id: id, user:user, data:data, writeSelf: writeSelf});

        } else if (data.type == 'event' && id !== null) {
            //console.log("Recieved event ");

            if(data.data && typeof data.data.muted != 'undefined') {
                Connections.connections[id].user.isMuted = data.data.muted;

                /*console.log(data);
                console.log(data.data);
                console.log(user);
                console.log(Connections.connections[id].user);*/
            }

        }
    }

}