<template>
  <WidgetCard v-if="show" title="Actor label usage" icon="mdi-label">
    <canvas ref="canvas"></canvas>
  </WidgetCard>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Chart from "chart.js";
import Axios from "axios";


@Component
export default class ActorLabelUsage extends Vue {
  stats: {
    label: { _id: string; name: string };
    score: number;
  }[] = [];
  chart: Chart | null = null;

  get show() {
    return !!this.stats.length;
  }

  @Watch("show")
  async onShowChange(show: boolean) {
    // Always destroy: we don't need to show, or recreating the chart
    this.destroyChart();

    if (show) {
      // Wait for canvas to render since 'show' just changed value
      await this.$nextTick();
      this.initChart();
    }
  }

  initChart() {
    const canvas = this.$refs.canvas as HTMLCanvasElement | null;
    if (!canvas) {
      console.error("Could not initialize actor label usage chart: canvas not found");
      return;
    }

    this.chart = new Chart(canvas, {
      type: "pie",
      data: {
        datasets: [
          {
            data: this.stats.map((s) => s.score),
            backgroundColor: [
              "#1b6ca8",
              "#0a97b0",
              "#ffd3e1",
              "#fce8d5",
              "#303960",
              "#e71414",
              "#12947f",
              "#562349",
              "#b5076b",
            ],
          },
        ],
        labels: this.stats.map((s) => s.label.name),
      },
      options: {
        legend: {
          display: false,
        },
      },
    });
  }

  destroyChart() {
    this.chart?.destroy();
  }

  async getStats() {
    try {
      const res = await Axios.get("/api/label-usage/actors");
      this.stats = res.data.slice(0, 10) as {
        label: { _id: string; name: string };
        score: number;
      }[];
    } catch (err) {
      console.error("Could not retrieve actor label usage: ", err.message);
    }
  }

  created() {
    this.getStats();
  }

  beforeDestroy() {
    this.destroyChart();
  }
}
</script>
