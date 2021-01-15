
export default class User {
    //Gets the current authenticated user
    constructor() {
        var self = this;
        self.id
        self.name
        self.email
        self.avatar
        self.token
        self.verified
        self.active;
        self.devices = {video: [], audio: [], active: {video: null, audio: null}};
        self.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent));
        self.preferredBandwidth = (self.isMobile ? 'low' : 'high'); //Low quality for mobile, high for desktop

        //this.transport = axios.create({
        //    withCredentials: true
        //});

        //Used to determine if the user object has been instantiated
        self.active = false;
    }

    auth() {
        var self = this;

        //Get this chat database record
        return this.$axios.get('/api/1.0/users/whoami').then(response => {
            //console.log(response.data);
            self.id = response.data.data.id;
            self.name = response.data.data.name;
            self.email = response.data.data.email;
            self.token = response.data.data.token;
            self.verified = true;
            self.active = true;
            return response.data;
        }).catch(error => {
            if (error.response.status === 401) {
                //Prop up an empty user data object
                return {
                    success: false,
                    message: '',
                    data: {
                        id: null,
                        name: self.name,
                        verified: false
                    }
                }
            }
        });
    }

    getVideoDevices() {
        return this.devices.video;
    }

    getAudioDevices() {
        return this.devices.audio;
    }

    discoverDevices(cb) {
        var self = this;

        //If we've already found a video AND audio device, don't bother searching again
        if(self.devices.video.length == 0 || self.devices.audio.length == 0) {
            console.log("Discovering input devices...");
            try {
                navigator.mediaDevices.enumerateDevices().then(function(devices) {
                    for(var i=0; i<devices.length; i++) {
                        if(devices[i].kind == "audioinput") {
                            if(self.devices.audio.length == 0) {
                                //Set this device to be the default
                                self.devices.active.audio = devices[i].deviceId;
                            }
                            self.devices.audio.push(devices[i]);
                        } else if(devices[i].kind == "videoinput") {
                            if(self.devices.video.length == 0) {
                                //Set this device to be the default
                                self.devices.active.video = devices[i].deviceId;
                            }
                            self.devices.video.push(devices[i]);
                        }
                    }

                    cb(self.devices);
                }).catch(function(err) {
                    console.log("Discover devices!");
                    console.log(err.name + ": " + err.message);
                });
            } catch (e) {
                //navigator.mediaDevices does not exist
                console.log("Could not discover user devices")
                console.log(e);
            }
        } else {
            cb(self.devices);
        }
    }

    getDataObject() {
        return {
            id: this.id,
            name: this.name,
            verified: this.verified
        };
    }

    getAuthObject() {
        return {
            name: this.name,
            token: this.token
        };
    }
}