import StaticModel from './StaticModel'

export default class Model extends StaticModel  {

    async save() {
        let data = {};
        data[this.config().dataObject] = this;

        try {
            let response = {};

            //If the id exists, patch otherwise post
            if(!!this.id) {
                response = await StaticModel.$axios.$patch('/' + this.config().route + '/' + this.id, data);
            } else {
                response = await StaticModel.$axios.$post('/' + this.config().route, data);
            }

            console.log("Updated?");
            console.log(response);
        } catch(e) {
            console.log("Failed?");
            console.log(e);
        }
        return this;
    }

    async delete() {
        let response = await StaticModel.$axios.$delete('/' + this.config().route + '/' + this.id);
        return response.success;
    }
}