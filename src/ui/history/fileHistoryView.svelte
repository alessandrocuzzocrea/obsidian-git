<script lang="ts">
    import { setIcon } from "obsidian";
    import { SimpleGit } from "src/gitManager/simpleGit";
    import type ObsidianGit from "src/main";
    import type { LogEntry } from "src/types";
    import { onMount } from "svelte";
    import LogComponent from "./components/logComponent.svelte";
    import type FileHistoryView from "./fileHistoryView";

    interface Props {
        plugin: ObsidianGit;
        view: FileHistoryView;
        filePath: string;
    }

    let { plugin = $bindable(), view, filePath }: Props = $props();
    let loading: boolean = $state(false);
    let buttons: HTMLElement[] = $state([]);
    let logs: LogEntry[] | undefined = $state();
    let showTree: boolean = $state(plugin.settings.treeStructure);

    let layoutBtn: HTMLElement | undefined = $state();

    $effect(() => {
        if (layoutBtn) {
            layoutBtn.empty();
        }
    });

    onMount(() => {
        view.registerEvent(
            view.app.workspace.on(
                "obsidian-git:head-change",
                () => void refresh().catch(console.error)
            )
        );
    });

    $effect(() => {
        buttons.forEach((btn) => setIcon(btn, btn.getAttr("data-icon")!));
    });

    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) {
                appendLogs().catch(console.error);
            }
        });
        const sentinel = activeDocument.querySelector(
            "#file-history-sentinel"
        );
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            observer.disconnect();
        };
    });

    refresh().catch(console.error);

    function triggerRefresh() {
        refresh().catch(console.error);
    }

    async function refresh() {
        if (!plugin.gitReady) {
            logs = undefined;
            return;
        }
        loading = true;
        const isSimpleGit = plugin.gitManager instanceof SimpleGit;
        let limit;
        if ((logs?.length ?? 0) == 0) {
            limit = isSimpleGit ? 50 : 10;
        } else {
            limit = logs!.length;
        }
        logs = await plugin.gitManager.log(filePath, true, limit);
        loading = false;
    }

    async function appendLogs() {
        if (!plugin.gitReady || logs === undefined) {
            return;
        }
        loading = true;
        const isSimpleGit = plugin.gitManager instanceof SimpleGit;
        const limit = isSimpleGit ? 50 : 10;
        const newLogs = await plugin.gitManager.log(
            filePath,
            true,
            limit,
            logs.last()?.hash
        );
        logs.push(...newLogs.slice(1));
        loading = false;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<main class="git-view">
    <div class="nav-header">
        <div class="nav-buttons-container">
            <div
                id="layoutChange"
                class="clickable-icon nav-action-button"
                data-icon={showTree ? "list" : "folder"}
                aria-label="Change Layout"
                bind:this={buttons[0]}
                onclick={() => {
                    showTree = !showTree;
                    setIcon(buttons[0], showTree ? "list" : "folder");
                    plugin.settings.treeStructure = showTree;
                    void plugin.saveSettings();
                }}
            ></div>
            <div
                id="refresh"
                class="clickable-icon nav-action-button"
                class:loading
                data-icon="refresh-cw"
                aria-label="Refresh"
                bind:this={buttons[1]}
                onclick={triggerRefresh}
            ></div>
        </div>
    </div>

    <div class="nav-header-title" style="padding: 4px 10px; font-size: var(--font-ui-small); color: var(--text-muted); word-break: break-all;">
        {filePath}
    </div>

    <div class="nav-files-container" style="position: relative;">
        {#if logs}
            <div class="tree-item nav-folder mod-root">
                {#each logs as log}
                    <LogComponent {view} {showTree} {log} {plugin} />
                {/each}
            </div>
        {/if}
        <div id="file-history-sentinel"></div>
        <div style="margin-bottom:40px"></div>
    </div>
</main>

<style lang="scss">
</style>
