<template>
  <v-row justify="center" align="center">
    <v-col cols="12">
        <v-row>
            <v-col cols="12">
                <h1>My Account</h1>
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
        console.log("Context");
        console.log(context);
        return 'authenticated'
    },
    components: {
        //Logo,
        //VuetifyLogo
    },
    mounted() {
        console.log(this.$auth.loggedIn);
        console.log(this.$auth.user);
    }
}
</script>
