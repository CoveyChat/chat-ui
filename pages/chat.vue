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
//import Logo from '~/components/Logo.vue'
//import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
    layout (context) {
        return 'default'
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
            let chat = await this.$axios.$get('/chats/' + chatId);
            this.chat = chat.data.chat;
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
