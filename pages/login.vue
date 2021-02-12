<template>
  <v-row>
    <v-col class="text-center">


      <v-form
        ref="form"
        v-model="valid"
        lazy-validation
        >

        <v-text-field
        v-model="email"
        label="Email"
        :rules="emailRules"
        required
        ></v-text-field>

        <v-text-field
        v-model="password"
        label="Password"
        :rules="passwordRules"
        :type="'password'"
        required
        ></v-text-field>

        <v-btn
        :disabled="!valid"
        color="success"
        class="mr-4"
        @click="validate"
        >
        Login
        </v-btn>
    </v-form>


    </v-col>
  </v-row>
</template>


<script>
//import Logo from '~/components/Logo.vue'
//import VuetifyLogo from '~/components/VuetifyLogo.vue'

export default {
    methods: {
        validate () {
            let result = this.$refs.form.validate();

            if(result) {
                this.login(this.email, this.password);
            }
        },
        async login(email, password) {
            try {
                let response = await this.$auth.login({ data: {auth: {email: email, password: password}} });

                //console.log("TEST");
                //console.log(response);
                //console.log(response)
                //this.$auth.setUser(response.data);
                //console.log(this.$auth);
                //console.log(this.$auth.loggedIn);
                //console.log(this.$auth.user);
                //console.log(this.$store);
                //this.$toast.success('Logged In!');
                //console.log(this.$store);

                this.$router.push({
                    path: '/account'
                });

            } catch (err) {
                this.password = '';
                this.$toast.error('Invalid username or password!');
                console.log(err)
            }
        },
        async logout() {
            try {
                let response = await this.$auth.logout();
                console.log(response)
            } catch (err) {
                console.log(err)
            }
        }
    },
    data() {
        return {
            valid: true,
            email: null,
            emailRules: [
                v => !!v || 'Email is required',
                v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
            ],
            password: null,
            passwordRules: [
                v => !!v || 'Password is required'
            ],
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