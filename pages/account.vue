<template>
  <v-row justify="center" align="center">
    <v-col cols="12">
        <v-row>
            <v-col cols="12">
                <h1>My Account</h1>

                <p>
                    <strong>{{ user.name }} </strong><br />
                    {{ user.email }}
                </p>
                <hr />
                <h1>My Chats</h1>

                <v-list-item three-line
                    v-for="(chat, i) in chats"
                    :key="i">
                    <v-list-item-content>
                        <v-list-item-title>{{ chat.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                        Created at {{ chat.created_at }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                            <a :href="'/chat/?id=' + chat.id">https://bevy.chat/chat/{{ chat.id }}</a>
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>


            </v-col>

        </v-row>
    </v-col>
  </v-row>
</template>

<style>
    >>>.text-muted {
        color:#333 !important;
    }

    .row.body {
        padding-bottom:20px;
    }
    .bevy-title {
        font-size: 5em;
        color:#000;
            font-family: "Nunito", sans-serif;
    }
    .bevy-type {
        color:#333;
    }
    .phonetic {
        color:#fff !important;
    }
    ol.definition {
        color: #000;
    }
    ol.definition > li > span.text-muted {
        color:#333 !important;
    }

    @media screen and (max-width: 425px) {
        .links > a {
            padding:0 15px;
        }
    }

    @media screen and (min-width: 426px) {
        .links > a {
            padding: 0 25px;
        }
    }

    .links > a {
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: .1rem;
        text-decoration: none;
        text-transform: uppercase;
    }
    .links {
        margin-top:20px;
    }
    ol {
        list-style-type: none;
    }

</style>

<script>
//import Logo from '~/components/Logo.vue'
//import VuetifyLogo from '~/components/VuetifyLogo.vue'
import Chat from '~/models/Chat';
import User from '~/models/User';

export default {
    middleware: 'auth',
    layout (context) {
        return 'default'
    },
    data () {
        return {
            user: {},
            chats: []
        }
    },
    components: {
        //Logo,
        //VuetifyLogo
    },
    methods: {
        async loadChats() {
            //let chats = await this.$axios.$get('/users/' + this.$auth.user.id + '/chats');
            //this.chats = chats.data;

            let chats = await (new User({id:this.$auth.user.id})).chats().get();
            //console.log(chats);
            this.chats = chats;

            //chats[0].name = "My Neat Super Duper Awesome Chat";
            //chats[0].description = "Woot";
            //chats[0].save();
            //chats[0].delete();

            return
        }
    },
    mounted() {
        //console.log(this.$auth.loggedIn);
        //console.log(this.$auth.user);
        //console.log(this.loadChats());
        this.loadChats()
        this.user = this.$auth.user;
    }
}
</script>
