<template>
    <div  name="fade" class="flex-row flex-grow-1">
        <div class="row">
            <div class="col-sm-12 offset-md-3 col-md-6 offset-lg-4 col-lg-4 ">
                <div class="card card-body p-5 text-center">
                    <h1>{{chatName}}</h1>
                    <br />
                    <p>
                        <input type="text"
                        class="form-control form-control-xl text-center"
                        placeholder="Enter your name"
                        v-model="username"
                        v-on:keyup.enter="setUser" />
                        <transition name="fade">
                        <v-btn color="primary" class="btn-block mt-3" v-on:click="setUser" v-if="username.length >= 1">
                            Start Chatting
                        </v-btn>
                        </transition>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>


<style scope>

</style>


<script>

export default {
    props: {
        chatName: String
    },
    data: function () {
        return {
            username: ''
        }
    },
    methods: {
        setUser() {
            if(this.username.length > 0) {
                this.$emit('submit', this.username);
            }
        }
    },
mounted() {
    console.log('Message input Component mounted.');
    //View model reference for inside scoped functions
    let self = this;

}
}

</script>