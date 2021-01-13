<template>
  <v-row justify="center" align="center">
    <v-col cols="12">
      <div class="text-center">
        <img
        class="logo"
        alt="Bevy Chat Logo"
        src="/logo_color.png" />
      </div>
    </v-col>

    <v-col cols="12">
        <v-row>
            <v-col cols="6" class="text-right">
                <button type="button" class="btn btn-md btn-primary" @click="login">Login</button>
                <button type="button" class="btn btn-md btn-primary" @click="logout">Logout</button>

                <h1 class='text-h1 bevy-title mb-2'>Bevy</h1>
                <h2><span class="text-muted pr-2 phonetic font-weight-light">/ˈbevē/</span></h2>
                <blockquote class='mr-4'>
                    <p>
                        <h3 class="bevy-type"><em>noun</em></h3>
                    </p>
                    <p>
                        <ol class='pr-3 definition'>
                            <li>
                                <span class="text-muted">1.</span> large group or collection
                            </li>
                            <li>
                                <span class="text-muted">2.</span> a group of animals and especially quail
                            </li>
                        </ol>
                    </p>
                </blockquote>
            </v-col>

            <v-col cols="6">
                <h1 class='text-h1 bevy-title mb-2'>Chat</h1>
                <h2><span class="text-muted pl-2 phonetic font-weight-light">/CHat/</span></h2>
                <blockquote class='ml-4'>
                    <p>
                        <h3 class="bevy-type"><em>verb</em></h3>
                    </p>
                    <p>
                        <ol class='pl-3 definition'>
                            <li>
                                <span class="text-muted">1.</span> talk in a friendly and informal way.
                            </li>
                            <li>
                                <span class="text-muted">2.</span> to take part in an online discussion in a chat room
                            </li>
                        </ol>
                    </p>
                </blockquote>
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
    methods: {
        test() {
            //console.log(this.$auth);
            //this.$auth.loginWith('customStrategy', { /* ... */ })
            //this.$auth.loginWith('local', { data: {auth: {email: "me@jacobrogaishio.com", password: "potatoes"}} });
            //alert("Hello World");
            //this.$auth.loginWith('laravelPassport')

        },
        async login() {
            try {
                let response = await this.$auth.login({ data: {auth: {email: "me@jacobrogaishio.com", password: "potatoes"}} });
                console.log(response)
                //this.$auth.setUser(response.data);
                //console.log(this.$auth);
                //console.log(this.$auth.loggedIn);
                console.log(this.$auth.user);
                //console.log(this.$store);
                //this.$toast.success('Logged In!');
                console.log(this.$store);

                this.$router.push({
                    path: '/account'
                });

            } catch (err) {
                console.log(err)
            }
        },
        async logout() {
            try {
                let response = await this.$auth.logout();
                console.log(response)
                //this.$auth.setUser(response.data);
                //console.log(this.$auth);
                //console.log(this.$auth.loggedIn);
                console.log(this.$auth.user);
                //console.log(this.$store);
                //this.$toast.success('Logged Out!');
            } catch (err) {
                console.log(err)
            }
        }
    },
    layout (context) {
        console.log(this);
        console.log("Context");
        console.log(context);
        console.log(context.$auth.user);

        return 'default';


    },
    components: {
        //Logo,
        //VuetifyLogo
    }
}
</script>
