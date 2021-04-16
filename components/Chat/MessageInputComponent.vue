<template>
    <div class="flex-column message-box"
        v-bind:class="{
            'peer-video-fullscreen': (inFullscreen && showMessagesFullscreen),
            'chat-disabled': !isActive}">
        <div class="input-group">

            <v-textarea type="text"
                v-model="message"
                id="message-box"
                class="pl-2"
                :placeholder="(!isActive ? 'Nobody is here' : 'Type a message')"
                :disabled="!isActive"
                rows="1"
                row-height="5"
                auto-grow
                v-on:keyup.enter.exact="$emit('send', message);message='';">
                    <template v-slot:append>
                        <v-btn color="primary" type="button"
                            :disabled="!isActive || message.length == 0"
                            v-on:click="$emit('send', message);message='';">
                            <span class="sr-only">Send Message</span>
                            <v-icon>mdi-send</v-icon>
                        </v-btn>
                    </template>
                </v-textarea>

        </div>
    </div>
</template>

<style scope>
    #message-box {
        max-height: 12vh;
        overflow: auto;
    }
</style>


<script>

export default {
    props: {
        inFullscreen: Boolean,
        showMessagesFullscreen: Boolean,
        isActive: Boolean
    },
    data: function () {
        return {
            message: ''
        }
    },
    methods: {

    },
mounted() {
    console.log('Message input Component mounted.');
    //View model reference for inside scoped functions
    let self = this;

}
}

</script>