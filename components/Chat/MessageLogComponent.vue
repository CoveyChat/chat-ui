<template>
    <div id="messages" ref="messages" class="overflow-y-auto pl-2 pr-2"
        :class="{ 'peer-video-fullscreen': (inFullscreen && showMessagesFullscreen) }">
            <div v-for="(item, $index) in chatLog" :key="item.index">
                <p class="text-muted p-0 mb-0"
                    :class="{ 'text-right': item.self, 'text-left': !item.self, 'high-contrast': inFullscreen }"
                    v-if="item.index == 0 || (item.index > 0 && (chatLog[$index-1].user.id != item.user.id || chatLog[$index-1].user.name != item.user.name))">
                    {{item.user.name}}
                    <v-icon v-if="item.user.verified">mdi-lock</v-icon>
                </p>
                <v-alert :color="(item.self ? 'teal darken-2' : 'teal darken-4')" :border="(item.self ? 'right' : 'left')">
                    <p class="card p-3 m-1"
                        :class="{ 'text-right alert-info ml-6': item.self, 'mr-6 text-left': !item.self }">
                        {{item.message}}
                    </p>
                </v-alert>
            </div>
            <div class="p-3"><!--Empty div so the fade is pushed down a little --></div>
        </div>
    </div>
</template>

<style scoped>
    #messages {
        margin-top:50px;
        /*This acts as a "minimum" height for when flexbox wants to collapse down to nothing
        Very important for mobile since videos "stack" and will otherwise collapse the messages
        area down to nothing */
        -webkit-mask-image: linear-gradient(0deg, rgba(2,0,36,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%);
        max-height:78vh;
        overflow-x: hidden;
    }
    #messages::-webkit-scrollbar {
        width: 10px;
        background:#333;
    }
    #messages::-webkit-scrollbar-thumb {
        width: 50px;
        background:#ccc;
    }


    #messages.peer-video-fullscreen {
        z-index:2147483622;
    }
    .btn-show-messages {
        border-radius:0px;
    }
    .high-contrast {
        color:#fff !important;
        font-weight: bold;
    }
</style>

<script>
import Message from '../shared/Message.js';

export default {
    props: {
        chatLog: Array,
        inFullscreen: Boolean,
        showMessagesFullscreen: Boolean
    },
    data: function () {
        return {

        }
    },
    methods: {
        animateScroll(duration) {
            let self = this;
            var messages = this.$refs['messages'];

            var start = messages.scrollTop;
            var end = messages.scrollHeight;
            var change = end - start;
            var increment = 20;
            function easeInOut(currentTime, start, change, duration) {
                // by Robert Penner
                currentTime /= duration / 2;
                if (currentTime < 1) {
                return change / 2 * currentTime * currentTime + start;
                }
                currentTime -= 1;
                return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
            }
            function animate(elapsedTime) {
                elapsedTime += increment;
                var position = easeInOut(elapsedTime, start, change, duration);
                messages.scrollTop = position;
                if (elapsedTime < duration) {
                setTimeout(function() {
                    animate(elapsedTime);
                }, increment)
                }
            }
            animate(0);
        }
    },
mounted() {
    console.log('Messages Component mounted.');
    //View model reference for inside scoped functions
    let self = this;

},
updated() {
    let self = this;
    self.animateScroll(300);
}
}

</script>