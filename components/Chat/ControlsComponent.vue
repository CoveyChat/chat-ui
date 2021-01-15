<template src="~/components/Chat/ControlsComponent/template.htm"></template>
<style scoped src="./ControlsComponent/style.css"></style>


<script>

export default {
    props: {
        inFullscreen: Boolean,
        deviceAccess: Boolean,
        isMobile: Boolean,
        videoEnabled: Boolean,
        audioEnabled: Boolean,
        screenshareEnabled: Boolean,
        videoDevices: Array
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
    console.log('Controls Component mounted.');
    //View model reference for inside scoped functions
    let self = this;

}
}

</script>