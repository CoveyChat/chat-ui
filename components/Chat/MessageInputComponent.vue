<template>
    <div class="flex-column message-box"
        v-bind:class="{
            'peer-video-fullscreen': (inFullscreen && showMessagesFullscreen),
            'chat-disabled': isActive}">
        <div class="input-group">
            <v-text-field type="text"
                v-model="message"
                id="message-box"
                :placeholder="(isActive ? 'Nobody is here' : 'Type a message')"
                :disabled="!isActive"
                v-on:keyup.enter="$emit('send', message);message='';"></v-text-field>
            <div class="input-group-btn">
                <v-btn color="primary" type="button"
                    v-on:click="$emit('send', message);message='';">
                    <span class="sr-only">Send Message</span>
                    <v-icon>mdi-send</v-icon>
                </v-btn>
            </div>
        </div>
    </div>
</template>

<style scope>

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