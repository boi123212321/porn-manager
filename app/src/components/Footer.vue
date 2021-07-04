<template>
  <v-footer padless>
    <v-card flat tile class="text-center" style="width: 100%">
      <v-card-text>
        <v-btn
          v-for="item in links"
          :key="item.icon"
          :href="item.href"
          target="_blank"
          class="mx-3"
          icon
        >
          <v-icon style="font-size: 24px">{{ item.icon }}</v-icon>
        </v-btn>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-text class="subtitle-1 white--text">
        <strong
          >Porn Vault <span class="med--text"> {{ version }}</span></strong
        >
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Axios from "axios";


@Component({})
export default class Footer extends Vue {
  version = "";
  // TODO: check for updates (only stable) and display notice

  links = [
    {
      icon: "mdi-github",
      href: "https://github.com/porn-vault/porn-vault",
    },
    {
      icon: "mdi-discord",
      href: "https://discord.gg/t499hxK",
    },
    {
      icon: "mdi-patreon",
      href: "https://www.patreon.com/pornvault",
    },
    {
      icon: "mdi-currency-btc",
      href: "https://github.com/porn-vault/porn-vault#support",
    },
  ];

  mounted() {
    Axios.get(`/api/version?password=${localStorage.getItem("password")}`)
      .then(({ data }) => {
        this.version = data.result;
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
</script>
