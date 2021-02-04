import Model from './Model'

export default class Chat extends Model {
  // Set the resource route of the model
  resource() {
    return 'chats'
  }
}