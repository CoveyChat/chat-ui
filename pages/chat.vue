<template>
  <v-row justify="center" align="center">
    <v-col cols="12">
      <div class="text-center">
        <ChatComponent :chat-name="chat.name"></ChatComponent>
      </div>
    </v-col>
  </v-row>
</template>

<style>

</style>

<script>
import Chat from '~/models/Chat';

export default {
    layout (context) {
        return 'chat'
    },
    data() {
        return {
            id: null,
            chat: {}
        }
    },
    components: {
        //Logo,
        //VuetifyLogo
    },
    methods: {
        async loadChat(chatId) {
            let chat = await Chat.find(chatId);
            this.chat = chat;
            return
        }
    },
    mounted() {
        this.id = this.$route.query.id || null;

        if(this.id != null) {
            this.loadChat(this.id);
        }
    }
}
</script>
