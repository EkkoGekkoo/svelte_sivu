<script lang="ts">
    import { onMount } from "svelte";
    import ListPerson from "./ListPerson.svelte";
    import { dragState } from "$lib/stores/dragItemState.svelte";
    import { invalidate } from "$app/navigation";

    const props = $props();

    let sidebarShown = $state(true);
    const toggleSidebar = () => sidebarShown = !sidebarShown;
    let target: HTMLElement;

    onMount(() => {
        target.ondragover = (e) => e.preventDefault();
        target.ondrop = async (e) => {
            const sourceData = dragState.dragData;
            const id = sourceData?.vuoro?.id ?? -1;
            const req = await fetch("/api/shifts",
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(id)
                }
            );
            invalidate("data:shifts");
        }
    });
</script>

<div>
    {#if sidebarShown}
    <aside bind:this={target}>
        <ul>
        {#each props.people as person}
            <li>
                <ListPerson data={person}/>
            </li>
        {/each}
        </ul>
    </aside>
    {/if}
    <button onclick={toggleSidebar}>{sidebarShown ? "Hide tha shi" : "Show tha shi"}</button>
</div>


<style>
    div {
        display: flex;
        width: fit-content;
        position: sticky;
        top: 1rem;   
    }

    button {
        writing-mode: vertical-lr;
        transform: rotate(180deg);
        align-self: center;
        padding: 10em 0;
        box-shadow: -5px 1px 10px;
        cursor: pointer;
    }

    aside {
        width: fit-content;
        border: 1px solid black;
        background-color: whitesmoke;
        border-radius: 10px 0 0 10px;
        box-shadow: 3px 0 6px var(--inkBlack);
    }

    ul {
        display: flex;
        flex-direction: column;

        margin: 0;
        padding: .2rem;
        overflow-y: scroll;
        height: 40rem;

        scrollbar-color: var(--ashGrey) var(--darkKhaki);
    }

    li {
        list-style: none;
    }
    li:nth-child(even) {
        background-color: var(--ashGrey);
    }
</style>