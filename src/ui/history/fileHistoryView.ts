import type { HoverParent, HoverPopover, WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import { FILE_HISTORY_VIEW_CONFIG } from "src/constants";
import type ObsidianGit from "src/main";
import FileHistoryViewComponent from "./fileHistoryView.svelte";
import { mount, unmount } from "svelte";

export default class FileHistoryView extends ItemView implements HoverParent {
    plugin: ObsidianGit;
    private _view: Record<string, unknown> | undefined;
    hoverPopover: HoverPopover | null;
    filePath: string;

    constructor(leaf: WorkspaceLeaf, plugin: ObsidianGit, filePath: string) {
        super(leaf);
        this.plugin = plugin;
        this.hoverPopover = null;
        this.filePath = filePath;
    }

    getViewType(): string {
        return FILE_HISTORY_VIEW_CONFIG.type;
    }

    getDisplayText(): string {
        const fileName = this.filePath.split("/").pop() ?? this.filePath;
        return `File History: ${fileName}`;
    }

    getIcon(): string {
        return FILE_HISTORY_VIEW_CONFIG.icon;
    }

    async setState(
        state: { filePath?: string },
        result: unknown
    ): Promise<void> {
        if (state.filePath) {
            this.filePath = state.filePath;
            this.reload();
        }
        await super.setState(state, result);
    }

    getState(): Record<string, unknown> {
        return { filePath: this.filePath };
    }

    onClose(): Promise<void> {
        if (this._view) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            unmount(this._view);
        }
        return super.onClose();
    }

    reload(): void {
        if (this._view) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            unmount(this._view);
        }
        this._view = mount(FileHistoryViewComponent, {
            target: this.contentEl,
            props: {
                plugin: this.plugin,
                view: this,
                filePath: this.filePath,
            },
        });
    }

    onOpen(): Promise<void> {
        this.reload();
        return super.onOpen();
    }
}
