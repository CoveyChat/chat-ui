<template src="./ChatComponent/template.htm"></template>
<style scoped src="./ChatComponent/style.css"></style>

<script>

import Draggable from '../directives/Draggable.js';
import SoundEffect from '../models/SoundEffect.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import PeerConnection from '../models/PeerConnection.js';
import Modal from '../models/Modal.js';
import ModalSettingsComponent from './ModalSettingsComponent.vue';

//import ControlsComponent from '~/components/Chat/ControlsComponent.vue';
//import NetworkGraphComponent from '~/components/Chat/NetworkGraphComponent.vue';

import ControlsComponent from '@/components/Chat/ControlsComponent.vue';
import NetworkGraphComponent from '@/components/Chat/NetworkGraphComponent.vue';
import MessageLogComponent from '@/components/Chat/MessageLogComponent.vue';
import PeerVideoComponent from '@/components/Chat/PeerVideoComponent.vue';

export default {
    components: {
        ControlsComponent,
        NetworkGraphComponent,
        MessageLogComponent,
        PeerVideoComponent
    },
    props: {
        chatName: String
    },
    computed: {
        peerStreams: function() {
            let self = this;

            //Only return peer connections that have a stream object
            return Object.keys(self.connections)
                .map(key => self.connections[key]) // turn an array of keys into array of items.
                .filter(peer =>  peer.stream != null); // filter that array,
        },
        currentVolume() {
            let self = this;
            //return 100;
            if(self.stream.volume == 0) {
                return 0;
            }
            //Normalize 0-30 as 0-100
            var vol = Math.round((self.stream.volume / 30) * 100);

            return vol > 100 ? 100 : vol;
        },
        saturatedVolume() {
            let self = this;
            //return 10;
            if(self.stream.volume == 0) {
                return 0;
            }

            //Anything over 30 is "saturated"
            var vol = Math.round((self.stream.volume / 30) * 100);
            var saturated = vol > 100 ? vol-100 : 0;

            if(saturated == 0) {
                return 0;
            }

            //Normalize saturation to 0-30 = 0-100
            saturated = Math.round((saturated / 30) * 100);


            return saturated > 100 ? 100 : saturated;
        }
    },
    data: function () {
        return {
            message: '',
            chatLog: [],
            connections: {},
            chatId: null,
            user: {active: false},
            stream: {videoenabled: false, audioenabled:true, screenshareenabled: false, connection: null, local:null, localsize:'md', volume:0},
            server: {ip:'devbevy.chat', port:1337, signal: null},
            ui: {
                deviceAccess: true,
                anonUsername: '',
                fullscreen: {active: false, target:null, wait:false},
                showMessagesFullscreen: false,
                dblClickTimer: null,
                sound: null
            }
        }
    },
    methods: {
        changeSettings(e) {
            let self = this;
            var options = {
                props: {
                    close: {text: "Save and close"},
                    userPreferredBandwidth: self.user.preferredBandwidth,
                    userDevices: self.user.devices //Use a cloned value so we don't pre-emptively update stuff
                }
            };

            var modal = new Modal(self.$refs.modalcontainer, options, ModalSettingsComponent);

            //Store the old settings to check against because vue binding already applied them
            var oldSettings = {
                video: self.user.devices.active.video,
                audio: self.user.devices.active.audio
            };

            modal.$on('close', function(preferred) {
                //We changed our audio / video device. Restart the stream stuff
                if(oldSettings.video != preferred.video
                || oldSettings.audio != preferred.audio) {

                    self.user.devices.active.video = preferred.video;
                    self.user.devices.active.audio = preferred.audio;
                    self.user.preferredBandwidth = preferred.bandwidth;

                    //If we're currently streaming, turn it off
                    if(self.stream.videoenabled) {
                        self.stopLocalStream();
                        self.stream.videoenabled = false;
                        self.stream.screenshareenabled = false;
                    }
                }

                // Didn't change the bandwidth so just exit
                if(self.user.preferredBandwidth == preferred.bandwidth) {
                    return;
                }

                self.user.preferredBandwidth = preferred.bandwidth;

                //Update the preferred bandwidth on all it's peers
                for(var id in self.connections) {
                    //If we're streaming to them then kill it
                    self.connections[id].setPreferredBandwidth(preferred.bandwidth);

                    //renegotiate the connection for the new quality
                    self.connections[id].connection.negotiate();
                }

            });
        },
        confirmLeave(e) {
            let self = this;

            var options = {
                props: {
                    close: {text: "Go back"},
                    confirm: {
                        text: "Leave",
                        class: "btn btn-danger"
                    }
                },
                header: "<h1>Confirm Leave</h1>",
                body: "Are you sure you want to leave this chat?"
            };

            var modal = new Modal(self.$refs.modalcontainer, options);

            modal.$on('confirm', function(e) {
                //Let everyone know I'm leaving so they don't sit then hanging
                for(var id in self.connections) {
                    //If we're streaming to them then kill it
                    self.connections[id].removeStream(self.stream.connection);
                    self.connections[id].destroy();
                }
                //Go back to the homepage
                window.location.href = '/';
            });
        },
        swapVideoFeed(e) {
            let self = this;

            var activeId = self.user.devices.active.video;

            for(var i=0; i<self.user.devices.video.length; i++) {
                if(self.user.devices.video[i].deviceId == activeId) {
                    //We found the current active one. Get the next
                    if(i < self.user.devices.video.length-1) {
                        self.user.devices.active.video = self.user.devices.video[i+1].deviceId;
                    } else {
                        self.user.devices.active.video = self.user.devices.video[0].deviceId;
                    }
                    break;
                }
            }

            //Re-enable the video now that we've changed the active camera
            self.enableVideo();
        },
        toggleScreenshare(e) {
            let self = this;
            var options = {
                video: {cursor: "always"},
                audio: self.user.devices.audio.length > 0
            };

            if(self.stream.videoenabled && !self.stream.screenshareenabled) {
                //console.log(options);
                //Even with audio:true getDisplayMedia doesn't return audio tracks but since we're replacing
                //The video stream it preserves the audio track
                navigator.mediaDevices.getDisplayMedia(options).then(function(stream) {
                    self.stream.videoenabled = false;
                    self.stream.screenshareenabled = true;
                    self.onLocalStream(stream);


                }).catch((e) => {
                    self.stream.screenshareenabled = false;
                    console.log("Local Screenshare Stream Error!");
                    console.log(e);
                    console.log(e.code);
                    console.log(e.message);
                    console.log(e.name);

                    // Throw a modal if you didn't simply cancel the screenshare
                    if(e.name != "NotAllowedError") {
                        var modal = new Modal(self.$refs.modalcontainer, {
                            header: "<h1>Not supported</h1>",
                            body: "<p>Could not start a screenshare. It seems your device does not support this functionality.</p>"
                        });
                    }
                });
            } else if(self.stream.screenshareenabled) {
                console.log("Turning screenshare off");
                self.stream.screenshareenabled = false;
                self.toggleVideo({'message': "toggling back to local video from screenshare"});
            }
        },
        adjustLocalVideoSize(e) {
            let self = this;
            var position = e.target.getBoundingClientRect();

            if(self.stream.localsize == 'lg') {
                self.stream.localsize = 'md'
            } else if(self.stream.localsize == 'md') {
                self.stream.localsize = 'sm'
                e.target.style.top = (position.y + 10) + "px"
                e.target.style.left = (position.x + 50) + "px"
            } else if(self.stream.localsize == 'sm') {
                self.stream.localsize = 'md'
                e.target.style.top = (position.y - 50) + "px"
                e.target.style.left = (position.x - 50) + "px"
            }

            //Don't lose the element off the top/left screen
            if(e.target.offsetTop < 0) {
                e.target.style.top = "0px";
            }
            if(e.target.offsetLeft < 0) {
                e.target.style.left = "0px";
            }

            //Don't lose the element off the bottom/right screen
            if(e.target.offsetTop > (window.screen.height - 200)) {
                e.target.style.top = (window.screen.height - 200) + "px";
            }
            if(e.target.offsetLeft > (window.screen.width - 100)) {
                e.target.style.left = (window.screen.width - 100) + "px";
            }
        },
        setAnonUser(e) {
            let self = this;
            if(self.ui.anonUsername != '') {
                self.user.name = self.ui.anonUsername;
                self.user.active = true;

                self.init();
            }
        },
        toggleAudio(e) {
            let self = this;
            if((self.stream.videoenabled || self.stream.screenshareenabled) && self.stream.audioenabled) {
                self.stream.audioenabled = false;
                self.setLocalAudio(self.stream.connection, false);

                Message.broadcast(self.connections, Message.pack({muted:true}, 'event'));
            } else if((self.stream.videoenabled || self.stream.screenshareenabled) && !self.stream.audioenabled) {
                self.stream.audioenabled = true;
                self.setLocalAudio(self.stream.connection, true);

                Message.broadcast(self.connections, Message.pack({muted:false}, 'event'));
            }
        },
        setLocalAudio(stream, enabled) {
            let self = this;
            stream.getAudioTracks().forEach(function(track){track.enabled = enabled;});
        },
        enableLocalAudio(stream) {
            let self = this;
        },
        enableVideo() {
            let self = this;
            //Enables the video stream.
            //If one already exists then it gets replaced
            console.log("Setting camera...");
            //Default to video: true, audio: true to just use the defaults
            var options = {
                    video: self.user.devices.video.length > 0,
                    audio: self.user.devices.audio.length > 0
            };

            //If there's a preferred video device, override with that
            if(self.user.devices.active.video != null) {
                console.log("Turning video on with camera id " + self.user.devices.active.video);
                options.video = {deviceId: { ideal: self.user.devices.active.video }};
            }

            //If there's an audio device, set the auto-gain
            if(self.user.devices.audio.length > 0) {
                options.audio = {autoGainControl: {ideal: true}};
            }
            //If there's a preferred audio device, override with that
            if(self.user.devices.active.audio != null) {
                console.log("Turning video on with camera id " + self.user.devices.active.video);
                options.audio = {deviceId: { ideal: self.user.devices.active.audio}, autoGainControl: {ideal: true}};
            }

            try {
                navigator.mediaDevices.getUserMedia(options).then(function(stream) {
                    self.stream.videoenabled = true;
                    self.stream.screenshareenabled = false;

                    self.onLocalStream(stream);
                }).catch((e) => {
                    self.stream.videoenabled = false;
                    self.stream.screenshareenabled = false;
                    //They have devices but are probably blocked
                    var modal = new Modal(self.$refs.modalcontainer, {
                        header: "<h1>Uh oh!</h1>",
                        body: "<p>Could not start your video feed. Did you block the browser permission?</p>" +
                                "<p>Click the <i class='fas fa-lock'></i><span class='sr-only'>lock</span> icon in the URL to check your permissions and reload this page.</p>"
                    });

                    console.log("Local Video Stream Error!");
                    console.log(e);
                });
            } catch (e) {
                console.log("Could not get user media for local stream");
                console.log(e);
            }
        },
        disableVideo() {
            //Disables the local camera stream
            let self = this;
            self.stopLocalStream();
            self.stream.videoenabled = false;
        },
        toggleVideo(e) {
            let self = this;

            if(typeof navigator.mediaDevices == 'undefined') {
                alert("Something went wrong and your device does not support video");
                return;
            }

            if(!self.stream.videoenabled) {
                self.enableVideo();
            } else {
                self.disableVideo();
            }

        },
        sendMessage (e) {
            let self = this;
            console.log('Called message sender');
            if(self.message != '' && Object.keys(self.connections).length > 0) {
                console.log("Sending");
                console.log(self.message);
                if(Message.broadcast(self.connections, Message.pack(self.message, 'message'))) {
                    //Write the message we just sent to ourself
                    self.recieveData(null, self.user.getDataObject(), Message.pack(self.message, 'message'), true);
                    self.message = '';
                } else {
                    alert("Something went wrong!");
                }
            }
        },
        recieveData(id, user, data, writeSelf = false) {
            let self = this;
            data = Message.unpack(data);

            if(data.type == 'message') {
                self.ui.sound.play('message');
                //Add the elements in reverse so that the log trickles from the bottom up
                self.chatLog.unshift({index: self.chatLog.length, message: data.data, user: user, self: writeSelf});
            } else if (data.type == 'event' && id !== null) {
                console.log("Recieved event ");

                if(data.data && typeof data.data.muted != 'undefined') {
                    self.connections[id].user.isMuted = data.data.muted;

                    /*console.log(data);
                    console.log(data.data);
                    console.log(user);
                    console.log(self.connections[id].user);*/
                }

            }
        },
        outputConnections () {
            let self = this;

            //Update for anything that's binding to Object.keys
            self.$forceUpdate();

            var networkChartData = {nodes:[{id: 'me', name: 'Me'}], links:[]};


            for(var id in self.connections) {
                var peer = self.connections[id];
                var name = typeof peer.user != 'undefined' ? peer.user.name : 'X';

                //This is the host connection and it's actually bound to someone
                if(typeof peer != 'undefined' && peer.initiator && peer.clientid != null) {
                    //When you have the host connection
                    networkChartData.nodes.push({id: peer.clientid, name: name, status: 'client'}); //C For client
                    //networkChartData.nodes.push({id: host.clientid, name: host.clientid.substring(0,2)});
                    networkChartData.links.push({source: peer.clientid, target: 'me'});

                    //txtConnections.textContent += peer.id + " <--- " + peer.clientid + "\n";
                } else if(typeof peer != 'undefined' && peer.hostid != null) {

                    //When you're a client of a host
                    networkChartData.nodes.push({id: peer.hostid, name: name, status: 'host'}); //H for host
                    //networkChartData.nodes.push({id: id, name: id.substring(0,2)});
                    networkChartData.links.push({source: 'me', target: peer.hostid});

                    //txtConnections.textContent += peer.id + " ---> " + peer.hostid + "\n";
                }

            }
            //console.log("Sending");
            //console.log(networkChartData);
            //self.$refs.networkGraph.update(networkChartData);

        },
        /**
         * When a peer opens a stream, show the new connection
         */
        onPeerStream(stream, peerid) {
            let self = this;

            /*console.log("On peer stream called @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            console.log(stream);
            console.log(peerid);
            console.log(self.connections);*/

            /*
            Check for duplicates across all peers incase buttons are spammed
            Sometimes a second connection will still be waiting to close and we don't want to
            renegotiate otherwise the connection will be re-established and not close
            */
            for(var id in self.connections) {
                //Duplicate stream! Ignore it
                if(self.connections[id].stream != null && self.connections[id].stream.id == stream.id) {
                    //This stream already existed on this id
                    //Seems we have 2 connections open. Destroy the duplicate!
                    self.connections[id].destroy();
                    self.outputConnections();
                }
            }



            if(self.ui.fullscreen.target == peerid) {
                //console.log("Rebind!");
                //We found our stream so we don't want to rebind anymore
                self.connections[peerid].startFullscreen = true;

            } else {
                //console.log("Don't bind!");
                self.connections[peerid].startFullscreen = false;
            }
            //console.log("--------------------------------------------");
            //console.log("Set stream for peer " + peerid);
            self.connections[peerid].setStream(stream);

            //self.$set(self.connections[peerid], 'stream', stream);

            /**
             * Fires twice. Once when the audio is removed and once when the video is removed
             */
            stream.onremovetrack = function(e) {
                console.log("on remove track");
                self.connections[peerid].clearPeerStream();
                //self.$set(self.connections[peerid], 'stream', null);

                //Make sure we close fullscreen if necessary
                if(self.ui.fullscreen.active) {

                    //The current video was fullscreen. Close it
                    if(self.ui.fullscreen.target == peerid) {
                        self.ui.fullscreen.target = null;
                        self.ui.fullscreen.active = false;

                        //Find the peer connection that removed a track and remove fullscreen
                        for(var i =0;i<self.$refs.peerVideos.length;i++) {
                            if(self.$refs.peerVideos[i].peer.hostid == peerid) {
                                self.$refs.peerVideos[i].ui.inFullscreen = false;
                                break;
                            }
                        }
                        self.$forceUpdate();
                    }
                }
            };
        },
        bindVolume(stream) {
            let self = this;

            /*
            let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            console.log(supportedConstraints);

            var audioTracks = stream.getAudioTracks();
            if(audioTracks.length > 0) {
                audioTracks[0].applyConstraints({autoGainControl: true});
                var constraints = audioTracks[0].getConstraints();
                console.log("Audio Constraints:");
                console.log(audioTracks[0]);
                console.log(audioTracks[0].getConstraints());
                console.log(constraints);
                console.log(constraints.autoGainControl);
            }
            */


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
                //console.log("Volume: " + self.stream.volume);
                self.stream.volume = Math.round(average);

                //Gain from 0.00 - 1 when volume is below 20
                //var newGain = (self.stream.volume < 10 ? Math.abs((self.stream.volume / 10) - 1) : 0);

                //console.log(newGain);
                //gainNode.gain.value = newGain;
            };
        },
        /**
         * Fires when a new local stream object has opened
         * Aka the user clicked the video button
         */
        onLocalStream(stream) {
            let self = this;

            var replace = false;
            self.stream.volume = 0;

            //New stream connection. Just send it
            if(!self.stream.connection) {
                self.stream.connection = stream;

                //Set this new streams audio settings
                self.setLocalAudio(stream, self.stream.audioenabled);
            } else {
                //Pre-existing stream
                replace = true;
            }

            self.bindVolume(self.stream.connection);

            //New Local stream! Send it off  to all the peers
            for(var id in self.connections) {
                if(self.connections[id].connection == null
                    || !self.connections[id].connection.connected
                    || self.connections[id].connection.destroyed) {
                    //console.log("Don't send stream. Skip bad connection " + id);
                    //console.log(self.connections[id]);
                    continue;
                }

                //has old tracks. Replace instead of add
                if(replace) {
                    //Replace the stream in the peer connection
                    self.connections[id].replaceStream(self.stream.connection, stream);
                } else {
                    self.connections[id].addStream(self.stream.connection);
                }
            }

            if(replace) {
                //Also update the stream connection so the local video is correct
                var oldTracks = self.stream.connection.getVideoTracks();
                var newTracks = stream.getVideoTracks();

                self.stream.connection.removeTrack(oldTracks[0]);
                self.stream.connection.addTrack(newTracks[0]);
            }

        },
        //Sends the existing stream to any new peers
        sendStream(id) {
            let self = this;

            if(typeof self.connections[id] == 'undefined'
                || self.connections[id].connection == null
                || !self.connections[id].connection.connected
                || self.connections[id].connection.destroyed) {
                console.log("Cannot send stream! BAD CONNECTION TO " + id);
                console.log(self.connections[id]);
                return false;
            }

            if((self.stream.videoenabled  || self.stream.screenshareenabled) && !self.connections[id].isStreaming) {
                //console.log("+APPLYING STREAM");
                self.connections[id].addStream(self.stream.connection);

                //Let them know the state of the microphone
                self.connections[id].send(Message.pack({muted:!self.stream.audioenabled}, 'event'));
            }

        },
        stopLocalStream() {
            let self = this;

            if(!self.stream.videoenabled && !self.stream.screenshareenabled) {return}

            //Remove this stream to all the peers so they don't need to do the timeout removal
            for(var id in self.connections) {
                if(!self.connections[id].isStreaming) {
                    continue;
                }
                self.connections[id].removeStream(self.stream.connection);
            }

            //Also remove it from the UI / Kill the feed
            var tracks = self.stream.connection.getTracks();

            tracks.forEach(function(track) {
                track.stop();
            });

            self.stream.connection = null;
        },
        handlePeerDisconnect(id) {
            let self = this;
            self.ui.sound.play('disconnect');

            //Set the value to null so vue can compute it before we delete it
            self.connections[id] = null;

            delete self.connections[id];
            self.outputConnections();
        },
        init() {
            let self = this;

            var Peer = require('simple-peer');
            var io = require('socket.io-client');


            self.chatId = location.pathname.replace('/chat/', '');
            self.server.signal = io.connect('https://' + self.server.ip + ':' + self.server.port);

            //var txtLogger = document.getElementById('logger');

            self.server.signal.on('disconnect', function () {
                alert("Uh oh! You disconnected!");
                self.connections = [];
            });

            self.server.signal.on('connect', function () {
                console.log("Connected to signal server. Sending auth...");
                //Pass to the server that we want to join this chat room with this user
                //It will use the user to annouce to other connections who you are
                self.server.signal.emit('join', {chatId: self.chatId, user: self.user.getAuthObject()});
            });

            /**
             * Fires when a new client connects. The new client create a new host peer
             * for every client in the mesh that it needs to connec tto
             */
            self.server.signal.on('inithosts', function (numHosts) {
                console.log("init (" + numHosts + ") hosts");

                for(var i=0;i<numHosts;i++) {

                    var peer = new PeerConnection(self.server.signal, true, self.user.preferredBandwidth);
                    var id = peer.id;
                    console.log("Created host id " + id);
                    //Add this peer to the connections[id] and also reactive for vue
                    self.$set(self.connections, id, peer);

                    self.connections[id].connection.on('connect', function() {
                        console.log("Connection established between host -> client");
                        self.ui.sound.play('connect');

                        self.outputConnections();

                        if(self.stream.videoenabled || self.stream.screenshareenabled) {
                            console.log("Try and send a stream to " + this._id);
                            self.sendStream(this._id);
                        }
                    });

                    self.connections[id].connection.on('close', function() {self.handlePeerDisconnect(this._id);});
                    self.connections[id].connection.on('error', function() {self.handlePeerDisconnect(this._id);});

                    self.connections[id].connection.on('data', function(data) {
                        self.recieveData(this._id, self.connections[this._id].user, data);
                    });

                    self.connections[id].connection.on('stream', function(stream) {
                        //console.log("Recieved peer stream");
                        self.onPeerStream(stream, this._id);
                    });
                }
            });

            /**
             * Fires when the client has generated a WebRTC token and it needs to get back to the host
             */
            self.server.signal.on('sendtohost', function (obj) {
                //Prevent signals to bad hosts that have closed
                if(typeof self.connections[obj.hostid] != 'undefined' && !self.connections[obj.hostid].connection.destroyed) {
                    //console.log("host - binding returned client info");
                    self.connections[obj.hostid].signal(obj.webRtcId);
                    self.connections[obj.hostid].setUser(obj.user);
                    self.connections[obj.hostid].setClientId(obj.clientid);
                } else {
                    console.log("UH OH");
                    delete self.connections[obj.hostid];
                }
            });

            /**
             * Fires when a host is looking for clients to connect to
             * If there's no open client for this match host one will be created
             */
            self.server.signal.on('initclient', function (obj) {
                //console.log("Got request to init a client for host " + obj.hostid);
                var id=obj.hostid;

                //Key to the host id since it can possibly reqest to init a bunch of times during the handshake
                if(typeof self.connections[id] == 'undefined') {
                    //console.log("Init a peer for host " + id);
                    var peer = new PeerConnection(self.server.signal, false, self.user.preferredBandwidth);

                    self.$set(self.connections, id, peer);
                    self.connections[id].setHostId(obj.hostid);
                    self.connections[id].setUser(obj.user);

                    self.connections[id].connection.on('connect', function() {
                        console.log("Connection established between client -> host");
                        //console.log(this);
                        //console.log(self.connections[id].user);
                        self.ui.sound.play('connect');

                        self.outputConnections();
                        if(self.stream.videoenabled || self.stream.screenshareenabled) {
                            console.log("Try and send a client stream to " + id);
                            self.sendStream(id);
                        }
                    });

                    self.connections[id].connection.on('close', function() {self.handlePeerDisconnect(id);});
                    self.connections[id].connection.on('error', function() {self.handlePeerDisconnect(id);});

                    self.connections[id].connection.on('data', function(data) {
                        self.recieveData(id, self.connections[id].user, data);
                    });

                    self.connections[id].connection.on('stream', stream => {self.onPeerStream(stream, id); });
                }
                //Use the remote host id so that the client is overridden if it re-signals


                //console.log("Signal host (" + obj.hostid + ") connection to client");
                self.connections[id].signal(obj.webRtcId);


            });

        }
    },
mounted() {
    console.log('Chat Component mounted.');
    //View model reference for inside scoped functions
    let self = this;
    self.ui.sound = new SoundEffect();
    //Hide the video button since they don't support mediaDevices
    self.ui.deviceAccess = typeof navigator.mediaDevices != 'undefined';

    self.user = new User();

    //Discover and set the devices before we init stuff
    self.user.discoverDevices(function(devices) {
        self.user.auth().then(function(response) {
            //Prompt for a name
            if(response.success) {
                self.init();
            }
        });
    });

}
}








</script>