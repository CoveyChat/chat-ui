import PeerConnection from './PeerConnection.js';
import Message from './Message.js';

export default class ConnectionManager {
    // PeerConnection instances
    static connections = [];

    static io = require('socket.io-client');
    static server = {ip:'devbevy.chat', port:1337, signal: null};
    static user = {};
    static events = [];

    // The users stream
    static stream = {videoenabled: false, audioenabled:true, screenshareenabled: false, connection: null, local:null, localsize:'md', volume:0};

    static getConnections() {return ConnectionManager.connections;}
    static getStream() {return ConnectionManager.stream;}
    static setStream(stream) {ConnectionManager.stream = stream;}
    static setStreamProp(key, value) {
        ConnectionManager.stream[key] = value;
        ConnectionManager.trigger('streamUpdate');
    }

    constructor() {}

    static on(name, callback) {
        if(!ConnectionManager.events[name]) {
            ConnectionManager.events[name] = [];
        }

        // Push the callback to an events list
        ConnectionManager.events[name].push(callback);
    }

    static trigger(name, data = null) {
        if(!ConnectionManager.events[name]) {
            return;
        }
        ([...ConnectionManager.events[name]]).forEach(cb => {
            cb(data);
        })
    }



    static connect(chatId, user) {
        ConnectionManager.user = user;

        ConnectionManager.server.signal = ConnectionManager.io.connect('https://' + ConnectionManager.server.ip + ':' + ConnectionManager.server.port);

        ConnectionManager.server.signal.on('disconnect', function () {
            alert("Uh oh! You disconnected!");
            ConnectionManager.connections = [];
        });

        ConnectionManager.server.signal.on('connect', function () {
            console.log("Connected to signal server. Sending auth...");
            //Pass to the server that we want to join this chat room with this user
            //It will use the user to annouce to other connections who you are
            ConnectionManager.server.signal.emit('join', {chatId: chatId, user: ConnectionManager.user.getAuthObject()});
        });

        /**
         * Fires when a new client connects. The new client create a new host peer
         * for every client in the mesh that it needs to connec tto
         */
        ConnectionManager.server.signal.on('inithosts', function (numHosts) {
            console.log("init (" + numHosts + ") hosts");

            for(var i=0;i<numHosts;i++) {

                var peer = new PeerConnection(ConnectionManager.server.signal, true, ConnectionManager.user.preferredBandwidth);
                var id = peer.id;
                console.log("Created host id " + id);

                //Add this peer to the connections[id] and also reactive for vue
                //Vue.$set(ConnectionManager.connections, id, peer);
                ConnectionManager.connections[id] = peer;

                ConnectionManager.connections[id].connection.on('connect', function() {
                    console.log("Connection established between host -> client");
                    ConnectionManager.trigger('connect', {event: this});
                    ConnectionManager.sendStream(this._id);
                    //self.ui.sound.play('connect');

                    //self.outputConnections();

                    if(ConnectionManager.stream.videoenabled || ConnectionManager.stream.screenshareenabled) {
                        console.log("Try and send a stream to " + this._id);
                        ConnectionManager.sendStream(this._id);
                    }
                });

                ConnectionManager.connections[id].connection.on('close', function() {ConnectionManager.handlePeerDisconnect(this._id);});
                ConnectionManager.connections[id].connection.on('error', function() {ConnectionManager.handlePeerDisconnect(this._id);});

                ConnectionManager.connections[id].connection.on('data', function(data) {
                    ConnectionManager.recieveData(this._id, ConnectionManager.connections[this._id].user, data);
                });

                ConnectionManager.connections[id].connection.on('stream', function(stream) {
                    ConnectionManager.trigger('peerStream', {id: this._id, stream: stream});
                });
            }
        });

        /**
         * Fires when the client has generated a WebRTC token and it needs to get back to the host
         */
        ConnectionManager.server.signal.on('sendtohost', function (obj) {
            //Prevent signals to bad hosts that have closed
            if(typeof ConnectionManager.connections[obj.hostid] != 'undefined' && !ConnectionManager.connections[obj.hostid].connection.destroyed) {
                //console.log("host - binding returned client info");
                ConnectionManager.connections[obj.hostid].signal(obj.webRtcId);
                ConnectionManager.connections[obj.hostid].setUser(obj.user);
                ConnectionManager.connections[obj.hostid].setClientId(obj.clientid);
            } else {
                console.log("UH OH");
                delete ConnectionManager.connections[obj.hostid];
            }
        });

        /**
         * Fires when a host is looking for clients to connect to
         * If there's no open client for this match host one will be created
         */
        ConnectionManager.server.signal.on('initclient', function (obj) {
            //console.log("Got request to init a client for host " + obj.hostid);
            var id=obj.hostid;

            //Key to the host id since it can possibly reqest to init a bunch of times during the handshake
            if(typeof ConnectionManager.connections[id] == 'undefined') {
                //console.log("Init a peer for host " + id);
                var peer = new PeerConnection(ConnectionManager.server.signal, false, ConnectionManager.user.preferredBandwidth);

                //self.$set(ConnectionManager.connections, id, peer);
                ConnectionManager.connections[id] = peer;

                ConnectionManager.connections[id].setHostId(obj.hostid);
                ConnectionManager.connections[id].setUser(obj.user);

                ConnectionManager.connections[id].connection.on('connect', function() {
                    console.log("Connection established between client -> host");
                    ConnectionManager.trigger('connect', {event: this});
                    ConnectionManager.sendStream(id);
                    //console.log(this);
                    //console.log(ConnectionManager.connections[id].user);

                    //self.ui.sound.play('connect');

                    // self.outputConnections();
                    if(ConnectionManager.stream.videoenabled || ConnectionManager.stream.screenshareenabled) {
                        console.log("Try and send a client stream to " + id);
                        ConnectionManager.sendStream(id);
                    }
                });

                ConnectionManager.connections[id].connection.on('close', function() {ConnectionManager.handlePeerDisconnect(id);});
                ConnectionManager.connections[id].connection.on('error', function() {ConnectionManager.handlePeerDisconnect(id);});

                ConnectionManager.connections[id].connection.on('data', function(data) {
                    ConnectionManager.recieveData(id, ConnectionManager.connections[id].user, data);
                });

                ConnectionManager.connections[id].connection.on('stream', stream => {
                    ConnectionManager.trigger('peerStream', {id: id, stream: stream});
                });
            }
            //Use the remote host id so that the client is overridden if it re-signals


            //console.log("Signal host (" + obj.hostid + ") connection to client");
            ConnectionManager.connections[id].signal(obj.webRtcId);


        });
    }

    static handlePeerDisconnect(id) {
        //let self = this;
        //self.ui.sound.play('disconnect');

        //Set the value to null so vue can compute it before we delete it
        ConnectionManager.connections[id] = null;

        delete ConnectionManager.connections[id];
        // Used to update the network chart stuff
        // self.outputConnections();
    }

    static sendMessage(message) {
        //console.log('Called message sender');
        if(message != '' && Object.keys(ConnectionManager.connections).length > 0) {
            //console.log("Sending");
            //console.log(message);
            if(Message.broadcast(ConnectionManager.connections, Message.pack(message, 'message'))) {
                //Write the message we just sent to ourself
                ConnectionManager.recieveData(null, ConnectionManager.user.getDataObject(), Message.pack(message, 'message'), true);

            } else {
                alert("Something went wrong with sendMessage!");
            }
        }
    }

    //Sends the existing stream to any new peers
    static sendStream(id) {
        let self = this;

        if(typeof ConnectionManager.getConnections()[id] == 'undefined'
            || ConnectionManager.getConnections()[id].connection == null
            || !ConnectionManager.getConnections()[id].connection.connected
            || ConnectionManager.getConnections()[id].connection.destroyed) {
            console.log("Cannot send stream! BAD CONNECTION TO " + id);
            console.log(ConnectionManager.getConnections()[id]);
            return false;
        }

        if((ConnectionManager.stream.videoenabled  || ConnectionManager.stream.screenshareenabled) && !ConnectionManager.getConnections()[id].isStreaming) {
            //console.log("+APPLYING STREAM");
            ConnectionManager.getConnections()[id].addStream(ConnectionManager.stream.connection);
            ConnectionManager.trigger('streamUpdate');

            //Let them know the state of the microphone
            ConnectionManager.getConnections()[id].send(Message.pack({muted: !ConnectionManager.stream.audioenabled}, 'event'));
        }

    }

    static recieveData(id, user, data, writeSelf = false) {
        data = Message.unpack(data);

        if(data.type == 'message') {
            ConnectionManager.trigger('message', {id: id, user:user, data:data, writeSelf: writeSelf});

        } else if (data.type == 'event' && id !== null) {
            //console.log("Recieved event ");

            if(data.data && typeof data.data.muted != 'undefined') {
                ConnectionManager.connections[id].user.isMuted = data.data.muted;

                /*console.log(data);
                console.log(data.data);
                console.log(user);
                console.log(ConnectionManager.connections[id].user);*/
            }

        }
    }

}