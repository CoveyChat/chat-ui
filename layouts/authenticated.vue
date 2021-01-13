<template>
  <v-app dark>
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
          :to="'/account'"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>mdi-chart-bubble</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Account</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          @click="logout"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>mdi-chart-bubble</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
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
    <v-main>
      <v-container>
        <nuxt />
      </v-container>
    </v-main>
    <v-footer
      :absolute="!fixed"
      app
      class="teal lighten-1"
    >
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
    methods: {
        async logout() {
            try {
                let response = await this.$auth.logout();
                console.log(response)
                //this.$auth.setUser(response.data);
                //console.log(this.$auth);
                //console.log(this.$auth.loggedIn);
                console.log(this.$auth.user);
                //console.log(this.$store);
                //this.$toast.success('Logged Out!');
                this.$router.push({
                    path: '/'
                });
            } catch (err) {
                console.log(err)
            }
        }
    },
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-chart-bubble',
          title: 'Account',
          to: '/account'
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Logout',
          to: '/'
        }
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'BevyChat'
    }
  }
}
</script>
