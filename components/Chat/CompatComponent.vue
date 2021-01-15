<template>
    <div>
        <modal-component v-if="showModal" @close="showModal = false">

            <template v-slot:header>
                <h1>Compatibility Issues :(</h1>
            </template>
            <template v-slot:body>
                <p>Your browser does not support video chatting. Although you cannot stream yourself, you can still see other peoples streams.</p>
                <p>To get the most out of BevyChat, please try another browser</p>
            </template>
        </modal-component>

    </div>

</template>

<style scoped>

</style>

<script>

export default {
    props: {
        text: String
    },
    data: function () {
        return {
            showModal: false
        }
    },
    methods: {

    },
    mounted() {
        let self = this;
        self.showModal = typeof navigator.mediaDevices == 'undefined';

    }
}

</script>