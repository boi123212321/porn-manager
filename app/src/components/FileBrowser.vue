<template>
  <v-dialog v-model="value" max-width="500px" persistent @click:outside="$emit('input', false)">
    <v-card>
      <v-card-title>
        <slot name="dialogTitle">{{ title }}</slot>
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="browsePath"
          @input="onBrowsePathChange(false)"
          label="Browse"
        ></v-text-field>

        <div class="content-wrapper">
          <v-overlay absolute :value="loading">
            <v-progress-circular color="primary" indeterminate></v-progress-circular>
          </v-overlay>
          <div class="content-scroll">
            <div v-if="error">Error loading folder</div>
            <div v-else-if="!browseDir">No folder</div>
            <template v-else-if="browseDir">
              <v-btn @click="goUp" block text class="text-none">
                <v-icon left>mdi-arrow-up</v-icon>
                <v-list-item-content>Go up</v-list-item-content>
              </v-btn>
              <v-list-item-group dense v-model="listValue" :multiple="multiple" v-if="files.length">
                <v-list-item
                  :value="file.path"
                  v-for="file in files"
                  :key="file.path"
                  dense
                  v-slot:default="{ active }"
                  @click.stop
                >
                  <v-list-item-icon
                    @click="onClickFile(file, $event)"
                    @dblclick="onDblClickFile(file, $event)"
                  >
                    <v-icon>{{ file.dir ? "mdi-folder" : "mdi-file" }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content
                    @click="onClickFile(file, $event)"
                    @dblclick="onDblClickFile(file, $event)"
                  >
                    <v-list-item-title :title="file.name">{{ file.name }}</v-list-item-title>
                    <v-list-item-subtitle :title="subtitle(file)">
                      {{ subtitle(file) }}
                    </v-list-item-subtitle>
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-checkbox
                      :disabled="cannotSelect(file)"
                      :input-value="active"
                      v-if="multiple"
                    ></v-checkbox>
                    <v-radio-group :value="listValue">
                      <v-radio :disabled="cannotSelect(file)" :value="file.path"></v-radio
                    ></v-radio-group>
                  </v-list-item-action>
                </v-list-item>
              </v-list-item-group>
              <div v-else>No contents</div>
            </template>
          </div>
        </div>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text class="text-none" @click="$emit('input', false)">Cancel</v-btn>
        <v-btn
          text
          class="text-none"
          color="primary"
          :disabled="!hasValue"
          @click="confirmSelection"
          >Select</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Axios from "axios";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import moment from "moment";

interface FileDTO {
  name: string;
  path: string;
  size: number;
  createdOn: number;
  dir: boolean;
}

interface FolderDTO {
  name: string;
  path: string;
  size: number;
  createdOn: number;
  files: FileDTO[];
  parentFolder: string;
  hasParentFolder: boolean;
}

@Component({})
export default class FileBrowser extends Vue {
  @Prop({ default: false }) value!: boolean; // Dialog value
  @Prop({ default: false }) multiple!: boolean;
  @Prop({ default: true }) allowFile!: boolean;
  @Prop({ default: false }) allowFolder!: boolean;
  @Prop({ default: [] }) extensions!: string | string[];
  @Prop({ default: "" }) defaultValue!: string | string[] | null;
  @Prop({ default: "" }) defaultBrowsePath!: string | null;

  listValue: string | string[] | null = null;
  browsePath = this.defaultBrowsePath;

  browseDir: FolderDTO | null = null;
  loading = true;
  loadTimeout: number | null = null;
  error = false;

  @Watch("value")
  onValueChange(newVal: boolean): void {
    if (newVal) {
      this.listValue = this.defaultValue;
      this.browsePath = this.defaultBrowsePath;
      this.loadFolderHook(true);
    }
  }

  onBrowsePathChange(immediate = false): void {
    if (this.browsePath) {
      this.loadFolderHook(immediate);
    } else if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
  }

  loadFolderHook(immediate = false): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    this.loading = true;
    if (immediate) {
      this.loadFolder();
    } else {
      this.loadTimeout = window.setTimeout(this.loadFolder, 500);
    }
  }

  async loadFolder(): Promise<void> {
    this.loading = true;
    this.error = false;

    try {
      const res = await Axios.get<FolderDTO>("/api/browse/directory", {
        params: { password: localStorage.getItem("password"), path: this.browsePath },
      });
      this.browseDir = res.data;
      this.browsePath = this.browseDir?.path;
    } catch (err) {
      console.error(err);
      this.error = true;
    }

    this.loading = false;
  }

  subtitle(file: FileDTO): string {
    return [
      file.dir ? "" : `${(file.size / 1024 / 1024).toFixed(2)} MiB`,
      moment(file.createdOn).format("MMM MM HH:mm:ss"),
    ]
      .filter(Boolean)
      .join(" - ");
  }

  goUp(): void {
    if (this.browseDir && this.browseDir.hasParentFolder) {
      this.browsePath = this.browseDir.parentFolder;
      this.onBrowsePathChange(true);
    }
  }

  onClickFile(file: FileDTO, event: MouseEvent): void {
    if (this.cannotSelect(file)) {
      event.stopPropagation();
      return;
    }
  }

  onDblClickFile(file: FileDTO, event: MouseEvent): void {
    if (file.dir) {
      event.stopPropagation();
      this.browsePath = file.path;
      this.onBrowsePathChange(true);
    }

    if (this.cannotSelect(file)) {
      event.stopPropagation();
    }
  }

  cannotSelect(file: FileDTO): boolean {
    if (file.dir) {
      return !this.allowFolder;
    }
    if (!this.allowFile) {
      return true;
    }
    if (this.extensions.length) {
      const exts = Array.isArray(this.extensions) ? this.extensions : [this.extensions];
      return !exts.some((ext) => file.name.endsWith(ext));
    }
    return false;
  }

  confirmSelection() {
    if (this.listValue?.length) {
      this.$emit("select", this.listValue);
    } else if (this.allowFolder && this.browseDir) {
      this.$emit("select", this.browseDir.path);
    }
    this.$emit("input", false);
  }

  get hasValue() {
    return !!this.listValue?.length || (this.allowFolder && this.browseDir);
  }

  get title(): string {
    let types: string[] = [this.allowFile ? "file" : "", this.allowFolder ? "folder" : ""]
      .filter(Boolean)
      .map((t) => (this.multiple ? `${t}s` : t));
    return `Select ${types.join(", ")}`;
  }

  get files(): FileDTO[] {
    if (!this.browseDir?.files) {
      return [];
    }
    if (this.allowFolder) {
      return [
        {
          name: "(current folder)",
          path: this.browseDir.path,
          size: this.browseDir.size,
          createdOn: this.browseDir.createdOn,
          dir: true,
        },
        ...this.browseDir.files,
      ];
    }

    return this.browseDir.files;
  }
}
</script>

<style lang="scss" scoped>
.content-wrapper {
  position: relative;
}
.content-scroll {
  max-height: 50vh;
  overflow: auto;
}
</style>
