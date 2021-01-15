import hark from 'hark';
import adapter from 'webrtc-adapter';
import sdpTransform from 'sdp-transform';

export default class PeerConnection {

    constructor(server, initiator, preferredBandwidth) {
        var Peer = require('simple-peer');
        var self = this;

        //Bandwidth mods
        self.bandwidth = {
            ultrahigh: {
                video: {bitrate: 1024},
                audio: {bitrate: 128}
            },
            high: {
                video: {bitrate: 512},
                audio: {bitrate: 64}
            },
            medium: {
                video: {bitrate: 256},
                audio: {bitrate: 64}
            },
            low: {
                video: {bitrate: 128},
                audio: {bitrate: 64}
            },
            ultralow: {
                video: {bitrate: 64},
                audio: {bitrate: 32}
            },
            trash: {
                video: {bitrate: 16},
                audio: {bitrate: 8}
            }
        };
        if(typeof preferredBandwidth == 'undefined') {
            self.bandwidthPreferred = 'low';
        } else {
            //Invalid type
            if(typeof self.bandwidth[preferredBandwidth] == 'undefined') {
                self.bandwidthPreferred = 'low';
            } else {
                self.bandwidthPreferred = preferredBandwidth;
            }
        }


        self.events = {
            speaking: new Event('speaking'),
            stopped_speaking: new Event('stopped_speaking')
        };
        self.connection = new Peer({
            initiator: initiator,
            config: {
                iceServers: [
                    {urls: 'stun:bevy.chat'},
                    {urls: 'turn:bevy.chat', username: 'bevychat', credential: 'bevychatturntest'}
                ]
            },
            sdpTransform: function (sdp) {
                var sdpObj = sdpTransform.parse(sdp);

                //Go through the spd settings and if we're dealing with media aka audio/video apply bandwidth settings
                for(var i=0;i<sdpObj.media.length;i++) {
                    var newBitrate;

                    //Make sure it's audio/video and we're changing the bandwidth settings
                    if(sdpObj.media[i].type == 'audio' && self.bandwidth[self.bandwidthPreferred].audio.bitrate) {
                        newBitrate = self.bandwidth[self.bandwidthPreferred].audio.bitrate;
                    } else if(sdpObj.media[i].type == 'video' && self.bandwidth[self.bandwidthPreferred].video.bitrate) {
                        newBitrate = self.bandwidth[self.bandwidthPreferred].video.bitrate;
                    } else {
                        //Not an audio/video media item or not changing settings. Skip
                        continue;
                    }

                    //Apply the bitrate
                    if(typeof sdpObj.media[i].bandwidth == 'undefined') {
                        sdpObj.media[i].bandwidth = [{}];
                    }
                    //AS = Application Specific maximum
                    sdpObj.media[i].bandwidth[0].type="AS";
                    sdpObj.media[i].bandwidth[0].limit=newBitrate;

                    //console.log("Set " + sdpObj.media[i].type + " bitrate to " + newBitrate + "kbps");
                }

                return sdpTransform.write(sdpObj);
            }
        });
        self.server = server;

        self.id = self.connection._id;
        self.user = {name: "anonymous user", verified: false, isSpeaking: false, isMuted: false};

        self.initiator = initiator;
        self.hostid = initiator ? self.id : null;
        self.clientid = initiator ? null : self.id;

        self.isStreaming = false; //Is currently recieving a stream
        self.startFullscreen = false;
        self.isMuted = false;
        self.stream = null;

        self.streamMonitorInterval = null;

        self.boundElement = null;

        self.connection.on('connect', function() {
            console.log("~~~~~Connected!~~~~~");
            //console.log(self.connection);
        });

        self.connection.on('signal', function (webRtcId) {
            //console.log("SIGNAL");

            if(self.connection.initiator) {
                //console.log('Got initiator signal, sending off to client');
                self.server.emit('sendtoclient', {webRtcId: webRtcId, hostid: self.hostid, clientid: self.clientid});
            } else {
                //console.log('Got client signal, sending off to host');

                //Got a response from the initiator
                self.server.emit('sendtohost', {webRtcId:webRtcId, hostid: self.hostid, clientid: self.clientid});
            }
        });

        self.connection.on('close', function() {
            console.log("Connection closed - " + self.id);
            self.destroy();
        });

        self.connection.on('error', function(err) {
            console.log("Connection error - " + self.id);
            console.log(err);
            self.destroy();
        });

        return this;
    }

    /**
     * Apply bandwidth modes
     * @param {String} type The bandwidth mode to set. video|screenshare
     */
    setPreferredBandwidth(type) {
        var self = this;
        self.bandwidthPreferred = type;

        console.log("Updated bandwidth preferred to " + self.bandwidthPreferred);
    }

    //Passthrough for WebRTC.send()
    send(data) {
        this.connection.send(data);
    }

    //This peers stream
    setStream(stream) {
        var self = this;
        self.stream = stream;
        var videoTracks = self.stream.getVideoTracks();

        var videoTrack = videoTracks.length > 0 ? videoTracks[0] : null;
        console.log("tracking track");
        console.log(videoTrack);

        /*self.streamMonitorInterval = setInterval(function() {
            if(videoTrack != null) {
                self.connection._pc.getStats(videoTrack).then(stats => {
                    //console.log("_pc stream stats:");
                    //console.log(stats);
                    var output = "";
                    stats.forEach(report => {
                        if(report.type == 'track') {
                            output += " - Frames dropped: " + report.framesDropped;
                        }
                        if(report.type == 'inbound-rtp') {
                            output += " - Packets Lost: " + report.packetsLost;
                        }
                    });
                    console.log("Output: " + output);
                });
            }
        }, 2000);*/

        //Make sure there's audio tracks to bind to
        if(stream.getAudioTracks().length > 0) {
            var speechEvents = hark(stream);

            speechEvents.on('speaking', function() {
                self.user.isSpeaking = true;
                self.events.speaking.peer = self;
                document.dispatchEvent(self.events.speaking);
            });

            speechEvents.on('stopped_speaking', function() {
                self.user.isSpeaking = false;
                self.events.stopped_speaking.peer = self;
                document.dispatchEvent(self.events.stopped_speaking);
            });
        }
    }

    clearPeerStream() {
        var self = this;
        console.log("Clear tracking!");
        self.stream = null;
        //clearInterval(self.streamMonitorInterval);


    }

    //Sends a local stream to this peer
    addStream(stream) {
        if(this.isStreaming) {
            //console.log("ALREADY STREAMING");
        } else {
            //console.log(this.connection);
            this.connection.addStream(stream);
            this.isStreaming = true;
        }
    }

    //Changes the video stream to this peer
    replaceStream(oldStream, newStream) {
        //console.log("REPLACE STREAM: " + this.isStreaming);
        if(this.isStreaming) {
            var oldTracks = oldStream.getVideoTracks();
            var newTracks = newStream.getVideoTracks();

            if(oldTracks[0].id == newTracks[0].id) {
                console.log("Tried replacing with the same track. Skip");
                return;
            }

            this.connection.replaceTrack(oldTracks[0], newTracks[0], oldStream);
            oldTracks[0].stop();
        }
    }

    //Removes a local stream from this peer
    removeStream(stream) {
        if(!this.isStreaming) {
            //console.log("NOT STREAMING");
        } else {
            this.connection.removeStream(stream);
            this.isStreaming = false;
        }

    }

    setHostId(id) {
        this.hostid = id;
        this.connection.hostid = id;
    }
    setClientId(id) {
        this.clientid = id;
        this.connection.clientid = id;
    }
    setUser(user) {
        this.user.name = user.name;
        this.user.verified = user.verified;
    }

    signal(webRtcId) {
        this.connection.signal(webRtcId);
    }

    destroy() {
        this.connection.destroy();
        return null;
    }
}