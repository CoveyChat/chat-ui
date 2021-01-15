<template>
    <span>
        <button type="button"
            class="btn btn-link m-0 p-0"
            v-on:click="onClick">
            <span class="sr-only">Copy chat url</span>
            <i class="far fa-clipboard"></i>
        </button>
        <transition appear name="slide-fade">
            <span class="copy-badge badge badge-secondary" v-if="showCopiedBadge" aria-hidden="true">Copied</span>
        </transition>
    </span>
</template>

<style scoped>
    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s;
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        opacity: 0;
    }
    .slide-fade-enter-active {
        transition: all .3s ease;
    }
    .slide-fade-leave-active {
        transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
    }
    .slide-fade-enter, .slide-fade-leave-to
        /* .slide-fade-leave-active below version 2.1.8 */ {
        transform: translateX(10px);
        opacity: 0;
    }
</style>

<script>

export default {
    props: {
        text: String
    },
    data: function () {
        return {
            showCopiedBadge: false
        }
    },
    methods: {
        onClick(e) {
            let self = this;
            navigator.clipboard.writeText(self.text);
            self.showCopiedBadge = true;

            setTimeout(function() {
                self.showCopiedBadge = false
            }, 300);
        }
    },
mounted() {
    console.log('Copy Component mounted.');
    //View model reference for inside scoped functions
    let self = this;

}
}

</script>