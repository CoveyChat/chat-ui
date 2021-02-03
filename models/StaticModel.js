export default class StaticModel {
    static $axios = null;

    constructor(...attributes) {
        Object.assign(this, ...attributes)
    }

    static instance() {
        return new this();
    }

    static get() {
        let self = this.instance();
        return self.get();
    }

    static async find(id) {
        let instance = this.instance();
        let data = {};

        try {
            let response = await this.$axios.$get('/' + instance.config().route + '/' + id);
            //console.log(response);

            if(response.success) {
                data = response.data[instance.config().dataObject];
            }
        } catch(e) {

        }
        return new this(data);
    }
}