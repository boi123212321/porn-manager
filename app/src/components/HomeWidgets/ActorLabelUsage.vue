<template>
  <WidgetCard class="mb-3" title="Actor label usage" icon="mdi-label">
    <canvas id="actor-labels"></canvas>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import gql from "graphql-tag";
import Chart from "chart.js";
import Axios from "axios";
import { serverBase } from "@/apollo";

@Component
export default class ActorLabelUsage extends Vue {
  created() {
    this.getStats();
  }

  async getStats() {
    const res = await Axios.get(serverBase + "/label-usage/actors");
    const stats = res.data.slice(0, 10) as {
      label: { _id: string; name: string };
      score: number;
    }[];

    var myPieChart = new Chart("actor-labels", {
      type: "pie",
      data: {
        datasets: [
          {
            data: stats.map(s => s.score),
            backgroundColor: [
              "#1b6ca8",
              "#0a97b0",
              "#ffd3e1",
              "#fce8d5",
              "#303960",
              "#e71414",
              "#12947f",
              "#562349",
              "#b5076b"
            ]
          }
        ],
        labels: stats.map(s => s.label.name)
      },
      options: {
        legend: {
          display: false
        }
      }
    });
  }
}
</script>