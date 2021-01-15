<template>
  <v-app dark>
    <navigation />

    <v-main>
      <v-container>
        <nuxt />
      </v-container>
    </v-main>

    <v-footer
      :absolute="false"
      app
      class="teal lighten-1"
    >
        <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
import Navigation from '~/components/Navigation.vue';

export default {
  data () {
    return {

    }
  }
}
</script>
