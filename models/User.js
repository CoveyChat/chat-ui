import Model from './Model'
import Chat from './Chat'

export default class User extends Model {
  // Set the resource route of the model
  resource() {
    return 'users'
  }

  chats() {
    return this.hasMany(Chat)
  }
}