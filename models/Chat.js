import Model from './Model'

export default class Chat extends Model {
    config() {
        return {
            route: "chats",
            dataObject: "chat"
        }
    }

    get testName() {
        return `${this.name} Hello World`;
    }


}