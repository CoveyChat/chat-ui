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
                    v-for="(item, i) in chats"
                    :key="i">
                    <v-list-item-content>
                        <v-list-item-title>{{ item.chat.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                        Created at {{ item.chat.created_at }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                            <a :href="'/chat/?id=' + item.chat.id">https://bevy.chat/chat/{{ item.chat.id }}</a>
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
            let chats = await this.$axios.$get('/users/' + this.$auth.user.id + '/chats');
            this.chats = chats.data;
            return
        }
    },
    mounted() {
        console.log(this.$auth.loggedIn);
        console.log(this.$auth.user);
        console.log(this.loadChats());
        this.user = this.$auth.user;
    }
}
</script>
