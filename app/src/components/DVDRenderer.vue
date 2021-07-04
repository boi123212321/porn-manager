<template>
  <div class="dvd-renderer">
    <v-fade-transition>
      <div v-if="showAutoRotate || showDetails || showControls">
        <span
          v-if="showAutoRotate"
          :class="{ 'auto-rotate': true, disabled: disableAutoRotate }"
          id="auto-rotate"
          @click="toggleAutoRotate"
          style="cursor: pointer"
        >
          Toggle auto-rotate
        </span>

        <div class="dvd-details" v-if="showDetails">
          <div style="font-weight: bold; font-size: 24px">
            {{ movieName }}
          </div>
          <div v-if="studioName" id="studio-name" style="opacity: 0.6; font-size: 14px">
            by {{ studioName }}
          </div>
        </div>

        <div class="actions" v-if="showControls">
          <router-link v-if="staticDvdUrl" class="static-link" :to="staticDvdUrl" target="_blank">
            <v-btn class="mr-2" icon dark>
              <v-icon>mdi-link</v-icon>
            </v-btn>
          </router-link>
          <v-tooltip left>
            <template v-slot:activator="{ on }">
              <v-btn class="mr-2" v-on="on" @click="$emit('changeTheme', !light)" icon dark>
                <v-icon>mdi-theme-light-dark</v-icon>
              </v-btn>
            </template>
            Toggle box color
          </v-tooltip>
          <v-btn @click="toggleFullscreen" icon dark>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </v-fade-transition>
  </div>
</template>

<script lang="ts">
import {
  Shape,
  ExtrudeBufferGeometry,
  WebGLRenderer,
  Scene,
  TextureLoader,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  MeshPhongMaterial,
  Texture,
  PointLight,
  AmbientLight,
  PerspectiveCamera,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { Component, Vue, Prop, Watch } from "vue-property-decorator";

const dvdWidth = 13.5; // in cm
const dvdHeight = 19.0; // in cm
const dvdDepth = 1.4; // in cm
const scaleFactor = 0.4;
const coverPadding = 0.2; // distance to edges of box
const coverMargin = 0.01; // to resolve Z fighting
const roundness = 0.125; // Roundness of box
const bumpiness = 0.125;
const shininess = 250; // Shiny

const boxWidth = dvdWidth * scaleFactor;
const boxHeight = dvdHeight * scaleFactor;
const boxDepth = dvdDepth * scaleFactor;

function createBoxWithRoundedEdges(
  width: number,
  height: number,
  depth: number,
  radius0: number,
  smoothness: number
): ExtrudeBufferGeometry {
  let shape = new Shape();
  let eps = 0.00001;
  let radius = radius0 - eps;
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);
  let geometry = new ExtrudeBufferGeometry(shape, {
    depth: depth - radius0 * 2,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius0,
    curveSegments: smoothness,
  });

  geometry.center();

  return geometry;
}

@Component
export default class DVDRenderer extends Vue {
  @Prop() movieName!: string;
  @Prop() studioName!: string;
  @Prop() frontCover!: string;
  @Prop() backCover!: string;
  @Prop() spineCover!: string;
  @Prop() staticDvdUrl!: string;

  @Prop({ default: false }) showDetails!: boolean;
  @Prop({ default: false }) showAutoRotate!: boolean;
  @Prop({ default: false }) showControls!: boolean;
  @Prop({ default: false }) light!: boolean;

  renderer: WebGLRenderer | null = null;
  camera: PerspectiveCamera | null = null;
  scene: Scene | null = null;
  controls: OrbitControls | null = null;
  frontTex: Texture | null = null;
  backTex: Texture | null = null;
  bumpMapTex: Texture | null = null;

  resizeObserver: ResizeObserver | null = null;

  disableAutoRotate = true;
  renderRequested = false;

  get boxColor() {
    return this.light ? "#fbfbfb" : "#040404";
  }
  get spineTextColor() {
    return this.light ? "#040404" : "#fbfbfb";
  }

  createFront() {
    let front = new Mesh(
      new PlaneGeometry(boxWidth - coverPadding, boxHeight - coverPadding),
      new MeshPhongMaterial({
        map: this.frontTex,
        shininess,
        bumpMap: this.bumpMapTex,
        bumpScale: bumpiness,
      })
    );
    front.position.set(0, 0, boxDepth / 2 + coverMargin);
    this.scene?.add(front);
  }

  createBack() {
    let back = new Mesh(
      new PlaneGeometry(boxWidth - coverPadding, boxHeight - coverPadding),
      new MeshPhongMaterial({
        map: this.backTex,
        shininess,
        bumpMap: this.bumpMapTex,
        bumpScale: bumpiness,
      })
    );
    back.rotation.x = Math.PI;
    back.rotation.z = Math.PI;
    back.position.set(0, 0, -(boxDepth / 2 + coverMargin));
    this.scene?.add(back);
  }

  createFakeSpine() {
    const spineText = this.movieName;
    var bitmap = document.createElement("canvas");
    bitmap.style.backgroundColor = this.boxColor;

    var ctx = bitmap.getContext("2d");
    if (!ctx) {
      return;
    }

    bitmap.width = 1000;
    bitmap.height = 50;

    ctx.font = "900 32px Arial";

    ctx.fillStyle = this.boxColor;
    ctx.fillRect(0, 0, bitmap.width, bitmap.height);

    if (this.studioName) {
      ctx.fillStyle = this.spineTextColor;
      ctx.fillText(this.studioName, 10, 40);
      ctx.strokeStyle = this.boxColor;
      ctx.strokeText(this.studioName, 10, 40);
    }

    ctx.textAlign = "right";
    ctx.font = "bold 24px Arial";

    ctx.fillStyle = this.spineTextColor;
    ctx.fillText(spineText, 990, 35);
    ctx.strokeStyle = this.boxColor;
    ctx.strokeText(spineText, 990, 35);

    var spineTex = new Texture(bitmap);
    spineTex.needsUpdate = true;

    let spine = new Mesh(
      new PlaneGeometry(boxHeight - coverPadding, boxDepth - coverPadding),
      new MeshPhongMaterial({
        map: spineTex,
        shininess,
        bumpMap: this.bumpMapTex,
        bumpScale: bumpiness,
      })
    );
    spine.rotation.z = Math.PI / 2;
    spine.rotation.y = Math.PI / 2 + Math.PI;
    spine.position.set(-boxWidth / 2 - coverMargin, 0, 0);
    this.scene?.add(spine);
  }

  createBox() {
    const geometry = createBoxWithRoundedEdges(boxWidth, boxHeight, boxDepth, roundness, 16);

    const mesh = new Mesh(
      geometry,
      new MeshPhongMaterial({
        color: this.boxColor,
        shininess,
      })
    );
    this.scene?.add(mesh);
  }

  toggleAutoRotate() {
    if (this.controls) {
      this.controls.autoRotate = !this.controls.autoRotate;
      this.disableAutoRotate = !this.disableAutoRotate;
      this.animateIfNotRequested();
    }
  }

  /**
   * Sets up the scene
   */
  init() {
    this.renderer = new WebGLRenderer({ antialias: true });

    this.scene = new Scene();
    let WIDTH = this.$el.clientWidth,
      HEIGHT = this.$el.clientHeight;

    const loader = new TextureLoader();

    this.frontTex = loader.load(this.frontCover, () => this.animateIfNotRequested());
    this.backTex = loader.load(this.backCover, () => this.animateIfNotRequested());
    this.bumpMapTex = loader.load('/assets/bump.jpg', () =>
      this.animateIfNotRequested()
    );

    this.frontTex.minFilter = LinearFilter;
    this.backTex.minFilter = LinearFilter;

    this.createFront();
    this.createBack();

    if (!this.spineCover) {
      this.createFakeSpine();
    } else {
      const spineTex = loader.load(this.spineCover);
      let spine = new Mesh(
        new PlaneGeometry(boxDepth - coverPadding / 2, boxHeight - coverPadding),
        new MeshPhongMaterial({
          map: spineTex,
          shininess,
          bumpMap: this.bumpMapTex,
          bumpScale: bumpiness,
        })
      );
      // spine.rotation.z = Math.PI / 2;
      spine.rotation.y = Math.PI / 2 + Math.PI;
      spine.position.set(-boxWidth / 2 - coverMargin, 0, 0);
      this.scene.add(spine);
    }

    this.createBox();

    this.renderer.setSize(WIDTH, HEIGHT);
    this.$el.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
    this.camera.position.set(-6, 3, 12);
    this.scene.add(this.camera);

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.$el);

    this.renderer.setClearColor(0x302530, 1);

    {
      let light = new PointLight(0x666666);
      light.position.set(-9, 0, 9);
      this.scene.add(light);
    }

    {
      let light = new PointLight(0x666666);
      light.position.set(9, 0, -9);
      this.scene.add(light);
    }

    {
      let light = new PointLight(0x444444);
      light.position.set(9, 0, 9);
      this.scene.add(light);
    }

    {
      let light = new PointLight(0x444444);
      light.position.set(-9, 0, -9);
      this.scene.add(light);
    }

    let ambience = new AmbientLight(0x777777); // soft white light
    this.scene.add(ambience);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.maxDistance = 50;
    this.controls.autoRotateSpeed = 3;
    this.controls.addEventListener("change", () => this.animateIfNotRequested());
  }

  animateIfNotRequested() {
    // Only call 'requestAnimationFrame' once at a time
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(this.animate);
    }
  }

  /**
   * Renders the scene and updates the render as needed.
   */
  animate() {
    // Toggle the flag so a following request can be rendered
    this.renderRequested = false;
    if (this.scene && this.camera) {
      this.controls?.update();
      this.renderer?.render(this.scene, this.camera);
    }
  }

  onResize() {
    let WIDTH = this.$el.clientWidth,
      HEIGHT = this.$el.clientHeight;
    this.renderer?.setSize(WIDTH, HEIGHT);
    if (this.camera) {
      this.camera.aspect = WIDTH / HEIGHT;
      this.camera.updateProjectionMatrix();
    }
    this.animateIfNotRequested();
  }

  toggleFullscreen() {
    if (document.fullscreenElement && document.fullscreenElement === this.$el) {
      document.exitFullscreen();
      this.$emit("isFullscreen", false);
    } else {
      this.$el.requestFullscreen().then(() => {
        this.$emit("isFullscreen", true);
      });
    }
  }

  onFullscreenChange() {
    this.$emit(
      "fullscreenChange",
      document.fullscreenElement && document.fullscreenElement === this.$el
    );
  }

  dispose() {
    this.renderer?.domElement.parentElement?.removeChild(this.renderer.domElement);

    this.renderer?.dispose();
    this.controls?.dispose();
    this.frontTex?.dispose();
    this.backTex?.dispose();
    this.bumpMapTex?.dispose();
  }

  @Watch("light")
  toggleTheme() {
    this.dispose();
    this.init();
  }

  mounted() {
    this.init();
    this.animateIfNotRequested();
    window.addEventListener("fullscreenchange", this.onFullscreenChange);
  }

  beforeDestroy() {
    this.dispose();
    window.removeEventListener("fullscreenchange", this.onFullscreenChange);
    this.resizeObserver?.disconnect();
  }
}
</script>

<style lang="scss" scoped>
* {
  overflow: hidden;
  font-family: sans-serif;
}

.dvd-renderer {
  margin: 0;
  cursor: grab;
  height: 100%;
  width: 100%;
}

.dvd-details {
  position: fixed;
  top: 0;

  pointer-events: none;
  padding-top: 10px;
  color: white;
  width: 100%;
  text-align: center;
}

.auto-rotate {
  position: fixed;
  bottom: 0px;

  padding: 10px;
  color: white;
  width: 100%;

  &.disabled {
    opacity: 0.6;
  }
}

.actions {
  position: fixed;
  top: 5px;
  right: 5px;

  .static-link {
    text-decoration: none;
  }
}
</style>
