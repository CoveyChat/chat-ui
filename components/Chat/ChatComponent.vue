<template src="./ChatComponent/template.htm"></template>
<style scoped src="./ChatComponent/style.css"></style>

<script>

import Draggable from '../directives/Draggable.js';
import SoundEffect from '../shared/SoundEffect.js';
import User from '../shared/User.js';
import Message from '../shared/Message.js';
import ConnectionManager from '../shared/ConnectionManager.js';
import PeerConnection from '../shared/PeerConnection.js';
import Modal from '../shared/Modal.js';
import ModalSettingsComponent from './ModalSettingsComponent.vue';

//import NetworkGraphComponent from '~/components/Chat/NetworkGraphComponent.vue';

import ControlsComponent from '@/components/Chat/ControlsComponent.vue';
import NetworkGraphComponent from '@/components/Chat/NetworkGraphComponent.vue';
import MessageLogComponent from '@/components/Chat/MessageLogComponent.vue';
import MessageInputComponent from '@/components/Chat/MessageInputComponent.vue';
import PeerVideoComponent from '@/components/Chat/PeerVideoComponent.vue';
import ChatUserPrompt from '@/components/Chat/ChatUserPrompt.vue';

export default {
    components: {
        ControlsComponent,
        NetworkGraphComponent,
        MessageLogComponent,
        MessageInputComponent,
        PeerVideoComponent,
        ChatUserPrompt
    },
    props: {
        chatName: String
    },
    computed: {
        peerStreams: function() {
            let self = this;

            //Only return peer connections that have a stream object
            return Object.keys(ConnectionManager.getConnections())
                .map(key => ConnectionManager.getConnections()[key]) // turn an array of keys into array of items.
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
            connections: [],
            chatLog: [],
            chatId: null,
            user: {active: false},
            stream: {videoenabled: false, audioenabled:true, screenshareenabled: false, connection: null, local:null, localsize:'md', volume:0},
            ui: {
                chatDrawer: null,
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
            let options = {
                props: {
                    close: {text: "Save and close", color: "primary"},
                    userPreferredBandwidth: self.user.preferredBandwidth,
                    userDevices: self.user.devices //Use a cloned value so we don't pre-emptively update stuff
                }
            };

            let modal = new Modal(self.$refs.modalcontainer, options, ModalSettingsComponent);

            //Store the old settings to check against because vue binding already applied them
            let oldSettings = {
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
                for(let id in ConnectionManager.getConnections()) {
                    //If we're streaming to them then kill it
                    ConnectionManager.getConnections()[id].setPreferredBandwidth(preferred.bandwidth);

                    //renegotiate the connection for the new quality
                    ConnectionManager.getConnections()[id].connection.negotiate();
                }

            });
        },
        confirmLeave(e) {
            let self = this;

            var options = {
                props: {
                    close: {text: "Go back", color: "primary"},
                    confirm: {
                        text: "Leave",
                        color: "error"
                    }
                },
                header: "<h1>Confirm Leave</h1>",
                body: "Are you sure you want to leave this chat?"
            };

            var modal = new Modal(self.$refs.modalcontainer, options);

            modal.$on('confirm', function(e) {
                //Let everyone know I'm leaving so they don't sit then hanging
                for(var id in ConnectionManager.getConnections()) {
                    //If we're streaming to them then kill it
                    ConnectionManager.getConnections()[id].removeStream(self.stream.connection);
                    ConnectionManager.getConnections()[id].destroy();
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
        setAnonUser(username) {
            let self = this;

            if(username != '') {
                self.user.name = username;
                self.user.active = true;

                self.init();
            }
        },
        toggleAudio(e) {
            let self = this;
            if((self.stream.videoenabled || self.stream.screenshareenabled) && self.stream.audioenabled) {
                self.stream.audioenabled = false;
                self.setLocalAudio(self.stream.connection, false);

                Message.broadcast(ConnectionManager.getConnections(), Message.pack({muted:true}, 'event'));
            } else if((self.stream.videoenabled || self.stream.screenshareenabled) && !self.stream.audioenabled) {
                self.stream.audioenabled = true;
                self.setLocalAudio(self.stream.connection, true);

                Message.broadcast(ConnectionManager.getConnections(), Message.pack({muted:false}, 'event'));
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
                                "<p>Click the lock icon in the URL to check your permissions and reload this page.</p>"
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
        sendMessage (message) {
            ConnectionManager.sendMessage(message);
        },
        /**
         * When a peer opens a stream, show the new connection
         */
        onPeerStream(stream, peerid) {
            let self = this;

            /*console.log("On peer stream called @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
            console.log(stream);
            console.log(peerid);
            console.log(ConnectionManager.getConnections());*/

            /*
            Check for duplicates across all peers incase buttons are spammed
            Sometimes a second connection will still be waiting to close and we don't want to
            renegotiate otherwise the connection will be re-established and not close
            */
            for(var id in ConnectionManager.getConnections()) {
                //Duplicate stream! Ignore it
                if(ConnectionManager.getConnections()[id].stream != null && ConnectionManager.getConnections()[id].stream.id == stream.id) {
                    //This stream already existed on this id
                    //Seems we have 2 connections open. Destroy the duplicate!
                    ConnectionManager.getConnections()[id].destroy();
                    //self.outputConnections();
                }
            }



            if(self.ui.fullscreen.target == peerid) {
                //console.log("Rebind!");
                //We found our stream so we don't want to rebind anymore
                ConnectionManager.getConnections()[peerid].startFullscreen = true;

            } else {
                //console.log("Don't bind!");
                ConnectionManager.getConnections()[peerid].startFullscreen = false;
            }
            //console.log("--------------------------------------------");
            //console.log("Set stream for peer " + peerid);
            ConnectionManager.getConnections()[peerid].setStream(stream);

            //self.$set(ConnectionManager.getConnections()[peerid], 'stream', stream);

            /**
             * Fires twice. Once when the audio is removed and once when the video is removed
             */
            stream.onremovetrack = function(e) {
                console.log("on remove track");
                ConnectionManager.getConnections()[peerid].clearPeerStream();
                //self.$set(ConnectionManager.getConnections()[peerid], 'stream', null);

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
            for(var id in ConnectionManager.getConnections()) {
                if(ConnectionManager.getConnections()[id].connection == null
                    || !ConnectionManager.getConnections()[id].connection.connected
                    || ConnectionManager.getConnections()[id].connection.destroyed) {
                    //console.log("Don't send stream. Skip bad connection " + id);
                    //console.log(ConnectionManager.getConnections()[id]);
                    continue;
                }

                //has old tracks. Replace instead of add
                if(replace) {
                    //Replace the stream in the peer connection
                    ConnectionManager.getConnections()[id].replaceStream(self.stream.connection, stream);
                } else {
                    ConnectionManager.getConnections()[id].addStream(self.stream.connection);
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

            if(typeof ConnectionManager.getConnections()[id] == 'undefined'
                || ConnectionManager.getConnections()[id].connection == null
                || !ConnectionManager.getConnections()[id].connection.connected
                || ConnectionManager.getConnections()[id].connection.destroyed) {
                console.log("Cannot send stream! BAD CONNECTION TO " + id);
                console.log(ConnectionManager.getConnections()[id]);
                return false;
            }

            if((self.stream.videoenabled  || self.stream.screenshareenabled) && !ConnectionManager.getConnections()[id].isStreaming) {
                //console.log("+APPLYING STREAM");
                ConnectionManager.getConnections()[id].addStream(self.stream.connection);

                //Let them know the state of the microphone
                ConnectionManager.getConnections()[id].send(Message.pack({muted:!self.stream.audioenabled}, 'event'));
            }

        },
        stopLocalStream() {
            let self = this;

            if(!self.stream.videoenabled && !self.stream.screenshareenabled) {return}

            //Remove this stream to all the peers so they don't need to do the timeout removal
            for(var id in ConnectionManager.getConnections()) {
                if(!ConnectionManager.getConnections()[id].isStreaming) {
                    continue;
                }
                ConnectionManager.getConnections()[id].removeStream(self.stream.connection);
            }

            //Also remove it from the UI / Kill the feed
            var tracks = self.stream.connection.getTracks();

            tracks.forEach(function(track) {
                track.stop();
            });

            self.stream.connection = null;
        },
        init() {
            let self = this;

            self.chatId = location.pathname.replace('/chat/', '');

            ConnectionManager.connect(self.chatId, self.user);

            ConnectionManager.on('message', function(e) {
                //console.log("ON MESSAGE TRIGGERED!?!");
                //console.log(e);
                self.ui.sound.play('message');
                //Add the elements in reverse so that the log trickles from the bottom up
                self.chatLog.push({index: self.chatLog.length, message: e.data.data, user: e.user, self: e.writeSelf});
            });

            ConnectionManager.on('connect', function(e) {
                self.ui.sound.play('connect');
                console.log("NEW CONNECTION!!!!!");
                self.connections = Object.values(ConnectionManager.getConnections());
                self.$forceUpdate();
            });

            ConnectionManager.on('peerStream', function(e) {
                self.onPeerStream(e.stream, e.id);
            })



        }
    },
mounted() {
    console.log('Chat Component mounted.');
    //View model reference for inside scoped functions
    let self = this;
    self.ui.sound = new SoundEffect();
    //Hide the video button since they don't support mediaDevices
    self.ui.deviceAccess = typeof navigator.mediaDevices != 'undefined';

    self.user = new User(this.$auth.user || {});

    //Discover and set the devices before we init stuff
    self.user.discoverDevices(function(devices) {
        //Prompt for a name
        if(self.user.active) {
            self.init();
        }
    });

}
}








</script>