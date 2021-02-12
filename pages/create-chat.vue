<template>
  <v-row>
    <v-col class="text-center">
        <h1>Create Chat</h1>

      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        >

        <v-text-field
        v-model="name"
        label="Chat Name"
        :rules="nameRules"
        required
        ></v-text-field>

        <v-text-field
        v-model="password"
        label="Password (Optional)"
        :type="'password'"
        ></v-text-field>

        <v-btn
        :disabled="!valid"
        color="success"
        class="mr-4"
        @click="validate"
        >
        Create
        </v-btn>
    </v-form>


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
import User from '~/models/User';
import Chat from '~/models/Chat';

export default {
    layout (context) {
        console.log("Context");
        console.log(context);
        return 'default'
    },
    data() {
        return {
            valid: true,
            name: null,
            password: null,
            nameRules: [
                v => !!v || 'Name is required',
                v => /[A-Za-z]+/.test(v) || 'Name must be valid',
            ],
        }
    },
    methods: {
        validate () {
            let result = this.$refs.form.validate();

            if(result) {
                this.create(this.name, this.password);
            }
        },
        async create(name, password) {
            let user = null;
            let chat = null;

            if(this.$auth.user) {
                user = (new User({id:this.$auth.user.id}));
                chat = new Chat().for(user);
            } else {
                chat = new Chat();

            }

            chat.name = name;
            chat.password = password;
            chat = await chat.save();

            console.log(chat);


            if(chat) {
                this.$toast.success('Successfully Created!');
            } else {
                this.$toast.error('Could not create!');
            }

            if(this.$auth.user) {
                this.$router.push({
                    path: '/account'
                });
            } else {
                this.$router.push({
                    path: '/chat/?id=' + chat.id
                });
            }
        }
    },
    components: {

    }
}
</script>
