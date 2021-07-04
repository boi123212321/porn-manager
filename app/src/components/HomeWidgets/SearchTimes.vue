<template>
  <v-card style="border-radius: 10px">
    <v-card-text>
      <canvas ref="canvas"></canvas>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import Axios from "axios";
import Chart from "chart.js";

@Component({
  components: {},
})
export default class SearchTimes extends Vue {
  sceneQueryTimes = [] as { x: number; y: number }[];
  imageQueryTimes = [] as { x: number; y: number }[];

  fetchLoader = false;

  chart: Chart | null = null;

  get chartData() {
    return {
      labels: this.sceneQueryTimes.map((i) => new Date(i.x).toLocaleTimeString()),
      datasets: [
        {
          fill: false,
          label: "Scene Query times",
          backgroundColor: "#79ffa0",
          data: this.sceneQueryTimes,
        },
        {
          fill: false,
          label: "Image Query times",
          backgroundColor: "#ffa079",
          data: this.imageQueryTimes,
        },
      ],
    };
  }

  initChart() {
    const canvas = this.$refs.canvas as HTMLCanvasElement | null;
    if (!canvas) {
      console.error("Could not initialize search times chart: canvas not found");
      return;
    }

    this.chart = new Chart(canvas, {
      type: "line",
      data: this.chartData,
      options: {
        showLines: false,
        responsive: true,
        scales: {
          yAxes: [
            {
              display: true,
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
  }

  destroyChart() {
    this.chart?.destroy();
  }

  async getTimes() {
    this.fetchLoader = true;

    try {
      this.sceneQueryTimes = (await Axios.get("/api/search/timings/scenes")).data
        .slice(-1000)
        .map((i) => ({
          x: i[0],
          y: i[1] / 1000 / 1000,
        }));

      this.imageQueryTimes = (await Axios.get("/api/search/timings/images")).data
        .slice(-1000)
        .map((i) => ({
          x: i[0],
          y: i[1] / 1000 / 1000,
        }));

      this.initChart();
    } catch (err) {
      console.error("Could not retrieve search times: ", err.message);
    }

    this.fetchLoader = false;
  }

  mounted() {
    this.getTimes();
  }

  beforeDestroy() {
    this.destroyChart();
  }
}
</script>
