<template>
  <div>
      <v-navigation-drawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :clipped="clipped"
      class="teal darken-3"
      fixed
      app
    >
      <v-list>
        <v-list-item
            v-for="(item, i) in computedItems"
            :key="i"
            :to="item.to"
            @click="item.click"
            router
            exact
        >
            <v-list-item-action>
                <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>

            <v-list-item-content>
                <v-list-item-title v-text="item.title" />
            </v-list-item-content>

        </v-list-item>

      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="clipped"
      fixed
      app
      class="teal darken-4"
    >

        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
        <v-toolbar-title v-text="title" />
        <v-spacer />
    </v-app-bar>
  </div>
</template>

<style>
</style>

<script>

export default {

    props: {
        auth: Boolean
    },
    computed: {
        computedItems() {
            let self = this;
            let items = [];

            console.log("Computed Items");
            console.log(self.$auth.loggedIn);
            ([...self.items]).forEach(item => {
                if(self.$auth.loggedIn && item.view.auth) {
                    items.push(item);
                } else if(!self.$auth.loggedIn && item.view.default) {
                    items.push(item);
                }
            });
            return items;
        }
    },
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'Home',
          to: '/',
          view: {auth: true, default: true},
          click: () => {}
        },
        {
          icon: 'mdi-login-variant',
          title: 'Login / Register',
          to: '/login',
          view: {auth: false, default: true},
          click: () => {}
        },
        {
          icon: 'mdi-account-circle-outline',
          title: 'Account',
          to: '/account',
          view: {auth: true, default: false},
          click: () => {}
        },
        {
          icon: 'mdi-logout-variant',
          title: 'Logout',
          to: null,
          view: {auth: true, default: false},
          click: this.logout
        }
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'BevyChat'
    }
  },
  methods: {
        async logout() {
            try {
                let response = await this.$auth.logout();

                //Push / pop on the computed data to force an update
                this.items.push([]);
                this.items.pop();

                this.$router.push({
                    path: '/'
                });

            } catch (err) {
                console.log(err)
            }
        }
    },
  mounted() {
      console.log("NAV");
      console.log(this.auth);
  }
}
</script>
