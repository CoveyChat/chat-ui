import PeerConnection from './PeerConnection.js';
import Message from './Message.js';

export default class ConnectionManager {
    // PeerConnection instances
    static connections = [];

    static io = require('socket.io-client');
    static server = {ip: process.env.SERVER_IP, port: process.env.PORT, signal: null};
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
                    ConnectionManager.setPeerStream(this._id, stream);
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

        if(typeof ConnectionManager.connections[id] == 'undefined'
            || ConnectionManager.connections[id].connection == null
            || !ConnectionManager.connections[id].connection.connected
            || ConnectionManager.connections[id].connection.destroyed) {
            console.log("Cannot send stream! BAD CONNECTION TO " + id);
            console.log(ConnectionManager.connections[id]);
            return false;
        }

        if((ConnectionManager.stream.videoenabled  || ConnectionManager.stream.screenshareenabled) && !ConnectionManager.connections[id].isStreaming) {
            //console.log("+APPLYING STREAM");
            ConnectionManager.connections[id].addStream(ConnectionManager.stream.connection);
            ConnectionManager.trigger('streamUpdate');

            //Let them know the state of the microphone
            ConnectionManager.connections[id].send(Message.pack({muted: !ConnectionManager.stream.audioenabled}, 'event'));
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

    static setLocalStream(stream) {
        var replace = false;
        ConnectionManager.setStreamProp('volume', 0);

        //New stream connection. Just send it
        if(!ConnectionManager.getStream().connection) {
            ConnectionManager.setStreamProp('connection', stream);

            //Set this new streams audio settings
            ConnectionManager.trigger('localAudio', {stream: stream, audioenabled: ConnectionManager.getStream().audioenabled});
        } else {
            //Pre-existing stream
            replace = true;
        }

        ConnectionManager.bindVolume(ConnectionManager.getStream().connection);

        //New Local stream! Send it off  to all the peers
        for(var id in ConnectionManager.connections) {
            if(ConnectionManager.connections[id].connection == null
                || !ConnectionManager.connections[id].connection.connected
                || ConnectionManager.connections[id].connection.destroyed) {
                //console.log("Don't send stream. Skip bad connection " + id);
                //console.log(ConnectionManager.connections[id]);
                continue;
            }

            //has old tracks. Replace instead of add
            if(replace) {
                //Replace the stream in the peer connection
                ConnectionManager.connections[id].replaceStream(ConnectionManager.getStream().connection, stream);
            } else {
                ConnectionManager.connections[id].addStream(ConnectionManager.getStream().connection);
            }
        }

        if(replace) {
            //Also update the stream connection so the local video is correct
            var oldTracks = ConnectionManager.getStream().connection.getVideoTracks();
            var newTracks = stream.getVideoTracks();

            ConnectionManager.getStream().connection.removeTrack(oldTracks[0]);
            ConnectionManager.getStream().connection.addTrack(newTracks[0]);
        }
    }

    static setPeerStream(peerid, stream) {
        /*
        Check for duplicates across all peers incase buttons are spammed
        Sometimes a second connection will still be waiting to close and we don't want to
        renegotiate otherwise the connection will be re-established and not close
        */
        for(var id in ConnectionManager.connections) {
            //Duplicate stream! Ignore it
            if(ConnectionManager.connections[id].stream != null && ConnectionManager.connections[id].stream.id == stream.id) {
                //This stream already existed on this id
                //Seems we have 2 connections open. Destroy the duplicate!
                ConnectionManager.connections[id].destroy();
                //self.outputConnections();
            }
        }

        ConnectionManager.connections[peerid].setStream(stream);

        /**
         * Fires twice. Once when the audio is removed and once when the video is removed
         */
        stream.onremovetrack = function(e) {
            console.log("on remove track");
            ConnectionManager.connections[peerid].clearPeerStream();

        };

        ConnectionManager.trigger('peerStream', {id: peerid, stream: stream});
    }

    static bindVolume(stream) {
        var audioContext = new AudioContext();
        var analyser = audioContext.createAnalyser();
        var microphone = audioContext.createMediaStreamSource(stream);
        var javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        //var gainNode = audioContext.createGain();

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        //console.log(microphone);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
                values += (array[i]);
            }

            var average = values / length;
            //console.log("Volume: " + ConnectionManager.getStream().volume);
            ConnectionManager.getStream().volume = Math.round(average);

            //Gain from 0.00 - 1 when volume is below 20
            //var newGain = (ConnectionManager.getStream().volume < 10 ? Math.abs((ConnectionManager.getStream().volume / 10) - 1) : 0);

            //console.log(newGain);
            //gainNode.gain.value = newGain;
        };
    }

}