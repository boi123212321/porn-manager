<template>
  <WidgetCard v-if="info" title="Remaining library time" icon="mdi-clock">
    <div class="my-3 subtitle-1">
      <div>
        <i>{{ info.numViews }}</i>
        scene views in
        <i>{{ info.currentIntervalDays.toFixed(1) }}</i> days
      </div>
      <div>{{ (info.viewedPercent * 100).toFixed(1) }}% of scenes watched</div>
      <div v-if="info.remainingYears >= 1">
        <i>~{{ info.remainingYears.toFixed(1) }}</i> years of content left
      </div>
      <div v-else-if="info.remainingMonths >= 1">
        <i>~{{ info.remainingMonths.toFixed(1) }}</i> months of content left
      </div>
      <div v-else>
        <i>~{{ info.remainingDays.toFixed(1) }}</i> days of content left
      </div>
      <div>
        Running out on
        <b>{{ new Date(info.remainingTimestamp).toDateString() }}</b>
      </div>
    </div>

    <template v-slot:actions>
      <v-btn text block class="text-none" color="primary" to="/history">Show view history</v-btn>
    </template>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Axios from "axios";


@Component({
  components: {},
})
export default class Stats extends Vue {
  info = null as null | any;

  created() {
    this.getInfo();
  }

  async getInfo() {
    const res = await Axios.get("/api/remaining-time", {
      headers: {
        "X-PASS": localStorage.getItem("password"),
      },
    });
    this.info = res.data;
  }
}
</script>