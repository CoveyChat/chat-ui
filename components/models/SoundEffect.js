export default class SoundEffect {
    constructor() {
        this.sound = {};

        this.sound.connect = new Audio("/media/join.mp3");
        this.sound.connect.waitUntil = Date.now();

        this.sound.disconnect = new Audio("/media/leave.mp3");
        this.sound.disconnect.waitUntil = Date.now();

        this.sound.message = new Audio("/media/message.mp3");
        this.sound.message.waitUntil = Date.now();
    }

    play(key) {
        if(typeof this.sound[key] == 'undefined') {
            console.log("Sound '" + key + "' does not exist");
        }
        if(this.sound[key].waitUntil <= Date.now()) {
            this.sound[key].play();
            this.sound[key].waitUntil = Date.now() + 5000; //Wait 5 seconds before playing again
        }
    }
}
