<template>
    <div class="peer-stream-container">
        <div
            class="peer-video-details"
            v-bind:class="{ 'peer-video-fullscreen': ui.inFullscreen }">

            <v-icon color="red darken-2" v-if="peer.user.isMuted">mdi-microphone-off</v-icon>
            <v-icon v-if="!peer.user.isMuted">mdi-microphone</v-icon>
            <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                    <v-icon v-if="peer.user.verified"
                    v-bind="attrs"
                    v-on="on">mdi-lock</v-icon>
                </template>
                <span>Verified Account</span>
            </v-tooltip>
            {{peer.user.name}}

            <!--
            #{{peer.stream == null}}#
            #{{peer.hostid}}#-->
            <!--- Id: #{{peer.id}}# - Hst: {{peer.hostid}}# - Cl: {{peer.clientid}}#-->
        </div>
        <video :srcObject.prop="peer.stream"
            v-on:click="onDoubleClickCheck"
            v-on:play="setDefaultVolume"

            poster = "https://bevy.chat/img/video_poster.png"
            autoplay="autoplay"
            volume="1"
            class="embed-responsive-item remote-stream"
            v-bind:class="{
                'peer-video-fullscreen': ui.inFullscreen,
                'peer-is-speaking': peer.user.isSpeaking && !ui.inFullscreen
            }"
            playsinline
        ></video>

    </div>
</template>

<style scoped>

    .remote-stream {
        background:#000;
    }

    .peer-stream-container > video {
        width: 100%;
    }

    .peer-video-details {
        position: relative;
        z-index: 1;
        display: block;
        top: 25px;
        left: 0px;
        float: left;
        color: #fff;
        background: #000;
        opacity: 0.5;
        padding-right: 5px;
        padding-left: 5px;
    }


    /**
      * Styles for fullscreen mode
      */
    .peer-video-details.peer-video-fullscreen {
        position:fixed;
        z-index:7;
    }

    video.peer-video-fullscreen {
        position:fixed !important;
        top:0;
        left:0;
        background: #000;
        z-index: 6;
        height: 100%;
    }

    .peer-is-speaking {
        border:1px solid #f00;
    }

</style>

<script>
import PeerConnection from '../shared/PeerConnection.js';

export default {
    name: "PeerVideoComponent",
    props: {
        peer: PeerConnection,
        startFullscreen: Boolean
    },
    data: function () {
        return {
            ui: {inFullscreen: false, dblClickTimer: null}
        }
    },
    watch: {
        startFullscreen: {
            immediate: true,
            handler(newVal) {
                let self = this;
                if(newVal) {
                    self.ui.inFullscreen = true;
                }
            }
        }

    },
    methods: {
        onDoubleClickCheck(e) {
            let self = this;

            //Don't pullscreen because there's no stream;
            if(self.peer.stream == null) {
                return;
            }

            //Play the video if you touched it
            //Chrome disables auto-play if you don't interact with the document first
            e.target.play();

            //Clicked again within 1s, trigger fullscreen
            if(self.ui.dblClickTimer != null && Date.now() - 1000 <= self.ui.dblClickTimer) {
                self.ui.dblClickTimer = null;
                self.ui.inFullscreen = !self.ui.inFullscreen;
                if(self.ui.inFullscreen) {
                    self.$emit('openFullscreen', self.peer);
                } else {
                    self.$emit('closeFullscreen', self.peer);
                }
            } else {
                self.ui.dblClickTimer = Date.now();
            }
        },
        setDefaultVolume(e) {
            e.target.volume = 1;
        }
    },
    beforeDestroy() {
        let self = this;
        self.$emit('closeFullscreenOnDestroy', self.peer);
    },
    mounted() {
        console.log('Peer Video Component mounted.');
        let self = this;

        document.addEventListener("speaking", function(e) {
            //Check to see if this this the right video that's speaking
            if(self.peer.hostid == e.peer.hostid) {
                self.peer.user.isSpeaking = true;
                self.$forceUpdate();
            }
        });

        document.addEventListener("stopped_speaking", function(e) {
            //Check to see if this this the right video that's speaking
            if(self.peer.hostid == e.peer.hostid) {
                self.peer.user.isSpeaking = false;
                self.$forceUpdate();
            }
        });

    }
}

</script>