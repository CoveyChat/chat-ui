<template>
    <div id="messages" ref="messages" class="overflow-auto d-flex flex-grow-1 flex-column flex-column-reverse "
        v-bind:class="{ 'peer-video-fullscreen': (inFullscreen && showMessagesFullscreen) }">
            <div v-for="(item, $index) in chatLog" :key="item.index">
                <p class="text-muted p-0 mb-0"
                    v-bind:class="{ 'text-right': item.self, 'text-left': !item.self, 'high-contrast': inFullscreen }"
                    v-if="item.index == 0 || (item.index > 0 && (chatLog[$index+1].user.id != item.user.id || chatLog[$index+1].user.name != item.user.name))">
                    {{item.user.name}}
                    <i class="fas fa-lock" v-if="item.user.verified"></i>
                </p>
                <p class="card p-3 m-1"
                    v-bind:class="{ 'text-right alert-info ml-6': item.self, 'mr-6': !item.self }">
                    {{item.message}}
                </p>
            </div>
            <div class="p-3"><!--Empty div so the fade is pushed down a little --></div>
        </div>
    </div>
</template>

<style scoped>
    #messages {
        /*This acts as a "minimum" height for when flexbox wants to collapse down to nothing
        Very important for mobile since videos "stack" and will otherwise collapse the messages
        area down to nothing */
        -webkit-mask-image: linear-gradient(0deg, rgba(2,0,36,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%);
    }

    @media screen and (max-height: 400px) {
        #messages {
            max-height:50vh;
        }
    }

    @media screen and (min-height: 401px) and (max-height: 799px) {
        #messages {
            max-height:40vh;
        }
    }

    @media screen and (min-height: 800px) {
        #messages {
            max-height:30vh;
        }
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