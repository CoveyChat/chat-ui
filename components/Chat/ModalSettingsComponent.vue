<template>
    <div>
        <modal-component
            v-on:confirm="$emit('confirm', emitData())"
            v-on:close="$emit('close', emitData())"
            v-bind:confirm="confirm"
            v-bind:close="close">

            <template v-slot:header>
                <h1>Settings</h1>
            </template>
            <template v-slot:body>
                <div class="form-group">
                    <label for="videoQuality">Video Quality</label>
                    <select id="videoQuality" class="form-control" v-model="userPreferredBandwidth">
                        <option value="ultrahigh">Very High</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="ultralow">Very Low</option>
                        <option value="trash">My Internet is Trash</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="videoDevices">Preferred Video Device</label>
                    <select id="videoDevices" class="form-control" v-model="userDevices.active.video">
                        <option v-for="device in userDevices.video"
                            v-bind:value="device.deviceId"
                            :key="device.deviceId">
                            {{device.label}}
                        </option>
                        <option value="" v-if="userDevices.active.video == null" selected="selected">Using system default</option>
                        <option value="" v-if="userDevices.video.length == 0" selected="selected">No video device found</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="audioDevices">Preferred Audio Device</label>
                    <select id="audioDevices" class="form-control" v-model="userDevices.active.audio">
                        <option v-for="device in userDevices.audio"
                            v-bind:value="device.deviceId"
                            :key="device.deviceId">
                            {{device.label}}
                        </option>
                        <option value="" v-if="userDevices.active.audio == null" selected="selected">Using system default</option>
                        <option value="" v-if="userDevices.audio.length == 0" selected="selected">No audio device found</option>
                    </select>
                </div>
            </template>
        </modal-component>

    </div>

</template>

<style scoped>

</style>

<script>

export default {
    name: "ModalSettingsComponent",
    props: {
        close: Object,
        confirm: Object,
        userPreferredBandwidth: String,
        userDevices: Object
    },
    data: function () {
        return {

        }
    },
    methods: {
        emitData() {
            let self = this;
            return {
                bandwidth: self.userPreferredBandwidth,
                video: self.userDevices.active.video,
                audio: self.userDevices.active.audio
            };
        }
    },
    mounted() {
        console.log("Modal Settings Mounted");
    }
}

</script>